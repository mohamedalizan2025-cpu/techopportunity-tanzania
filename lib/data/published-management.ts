/**
 * Published-record management (Milestone 14) — the staff-only control surface
 * for records that are ALREADY live on the public site.
 *
 * Why this exists: the moderation queue only ever walks `pending` rows, so a
 * wrongly-published record had no safe path back to hidden. This module adds
 * that path using ONLY the existing authorization boundary
 * (`getModerationAccess`) and the existing status enum — no new status or
 * deletion.
 *
 * Unpublish semantics (deliberate, conservative):
 *   published → rejected
 * `rejected` is the app's established "stays hidden from the public site"
 * state. The row is never deleted, so discovery provenance (source_id,
 * source_url, discovered_at, discovery_method), the title and every evidence
 * field survive untouched. The atomic database path writes only `status` and
 * records the target, actor, transition, reason and decision time in the
 * existing moderation audit architecture.
 */
import type { Opportunity, OpportunityStatus } from "../types";
import {
  getModerationAccess,
  isValidOpportunityId,
  type ModerationAccessResult,
  type StaffContext,
} from "./moderation";
import { opportunitySelect, mapOpportunityRow, type OpportunityRow } from "./opportunities";
import {
  UNPUBLISH_CONFIRM_TOKEN,
  UNPUBLISH_REASON_MAX_LENGTH,
  UNPUBLISH_REASON_MIN_LENGTH,
  normalizeModerationReason,
} from "../staff-form-state";

/**
 * The existing status that represents "no longer publicly visible".
 * Rejected rows are unreadable to anonymous visitors (RLS: published only)
 * and the public detail page 404s, which is exactly the desired outcome.
 */
export const UNPUBLISH_TARGET_STATUS = "rejected" as const satisfies OpportunityStatus;

/**
 * The confirmation token itself is declared in lib/staff-form-state (the
 * client-safe module) so the browser control can import it without pulling
 * this server-only module — and `next/headers` — into the client bundle.
 */

/** Pure guard: only a live published record may be unpublished. */
export function canUnpublish(status: OpportunityStatus): boolean {
  return status === "published";
}

export type UnpublishDenial =
  | "invalid-id"
  | "unconfirmed"
  | "invalid-reason"
  | "unauthenticated"
  | "forbidden"
  | "not-published";

/**
 * Pure authorization state machine, evaluated BEFORE any query: a request
 * must carry a valid UUID target, the explicit confirmation token, a reason,
 * and a staff role. Ordered so the cheapest refusal wins and a malformed request
 * never reaches the database at all. On success it hands back the verified
 * target id and staff context, so the caller cannot write without having
 * passed the gate.
 */
export function evaluateUnpublishPermission(
  request: UnpublishRequest,
  access: ModerationAccessResult
):
  | { ok: true; id: string; reason: string; staff: StaffContext }
  | { ok: false; denial: UnpublishDenial } {
  if (!request.ok) return { ok: false, denial: request.reason };
  if (!access.ok) return { ok: false, denial: access.reason };
  return { ok: true, id: request.id, reason: request.reason, staff: access.staff };
}

/**
 * Pure target guard: `null` means the status-scoped read found no published
 * row (missing, never published, or already changed by someone else). Only a
 * still-published record may be unpublished.
 */
export function evaluateUnpublishTarget<T extends { status: OpportunityStatus }>(
  record: T | null
): { ok: true; record: T } | { ok: false; denial: "not-published" } {
  if (record === null || !canUnpublish(record.status)) {
    return { ok: false, denial: "not-published" };
  }
  return { ok: true, record };
}

/** Staff-facing wording for each refusal. Kept pure so it can be asserted. */
export function unpublishDenialMessage(denial: UnpublishDenial): string {
  switch (denial) {
    case "invalid-id":
      return "Invalid submission reference.";
    case "unconfirmed":
      return "Unpublishing needs an explicit confirmation.";
    case "invalid-reason":
      return `Give a specific reason (${UNPUBLISH_REASON_MIN_LENGTH}-${UNPUBLISH_REASON_MAX_LENGTH} characters).`;
    case "unauthenticated":
      return "Your session has expired. Please sign in again.";
    case "forbidden":
      return "You do not have permission to moderate submissions.";
    case "not-published":
      return "This opportunity is no longer published — it may already have been updated.";
  }
}

/**
 * Pure list honesty: the management view shows published records only. A
 * pending/rejected/expired row must never appear as if it were public.
 * Deterministic input order is preserved.
 */
export function filterPublishedRecords(items: Opportunity[]): Opportunity[] {
  return items.filter((item) => item.status === "published");
}

export type UnpublishRequest =
  | { ok: true; id: string; reason: string }
  | { ok: false; reason: "invalid-id" | "unconfirmed" | "invalid-reason" };

/**
 * Pure, hostile-input-safe request parser. Requires an exact UUID target, the
 * deliberate confirmation token and a bounded reason, so a stray or crafted
 * submission can never mutate a record.
 */
export function parseUnpublishRequest(formData: FormData): UnpublishRequest {
  const rawId = formData.get("opportunityId");
  if (typeof rawId !== "string" || !isValidOpportunityId(rawId)) {
    return { ok: false, reason: "invalid-id" };
  }
  if (formData.get("confirm") !== UNPUBLISH_CONFIRM_TOKEN) {
    return { ok: false, reason: "unconfirmed" };
  }
  const reason = normalizeModerationReason(formData.get("reason"));
  if (reason === null) {
    return { ok: false, reason: "invalid-reason" };
  }
  return { ok: true, id: rawId, reason };
}

/** Exact RPC shape: there is no field or record collection to over-post. */
export function unpublishRpcArguments(id: string, reason: string) {
  return {
    target_opportunity_id: id,
    decision_reason: reason,
  };
}

function toOpportunityRows(data: unknown): OpportunityRow[] {
  return (data ?? []) as unknown as OpportunityRow[];
}

/** Same explicit cap discipline as the pending queue. */
const PUBLISHED_MANAGEMENT_LIMIT = 500;

/**
 * Staff-only read of the live published set — same authorization boundary as
 * the moderation queue (`getModerationAccess`), same select/mapper, same
 * deterministic order (created_at ascending, id tie-break) so the oldest
 * publications (where the known test artifacts sit) come first.
 */
export async function listManagedPublishedOpportunities(): Promise<Opportunity[]> {
  const access = await getModerationAccess();
  if (!access.ok) return [];

  const { data, error } = await access.staff.client
    .from("opportunities")
    .select(opportunitySelect())
    .eq("status", "published")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(PUBLISHED_MANAGEMENT_LIMIT);

  if (error) {
    console.error("[lib/data] Failed to list published opportunities for management:", error.message);
    return [];
  }

  const rows = toOpportunityRows(data);
  if (rows.length >= PUBLISHED_MANAGEMENT_LIMIT) {
    console.warn(
      `[lib/data] Published management reached the ${PUBLISHED_MANAGEMENT_LIMIT}-row explicit cap`
    );
  }
  return rows.map((row) => mapOpportunityRow(row, "published"));
}

/**
 * Status-scoped fetch used as the action's pre-write guard: returns the row
 * only while it is still published. A record that changed meanwhile reads
 * back as null, so the caller refuses instead of clobbering.
 */
export async function getPublishedOpportunityById(id: string): Promise<Opportunity | null> {
  if (!isValidOpportunityId(id)) return null;

  const access = await getModerationAccess();
  if (!access.ok) return null;

  const { data, error } = await access.staff.client
    .from("opportunities")
    .select(opportunitySelect())
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[lib/data] Failed to fetch published opportunity:", error.message);
    return null;
  }

  return data
    ? mapOpportunityRow(toOpportunityRows([data])[0], "published")
    : null;
}
