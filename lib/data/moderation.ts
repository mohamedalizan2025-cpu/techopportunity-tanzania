import type { Opportunity, OpportunityCategory } from "../types";
import { OPPORTUNITY_CATEGORIES } from "../types";
import { triageBucketOf, type TriageBucket } from "../triage-bucket";
import { createSupabaseAuthServerClient } from "./supabase-auth";
import {
  OPPORTUNITY_SELECT,
  mapOpportunityRow,
  type OpportunityRow,
} from "./opportunities";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidOpportunityId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export interface StaffContext {
  client: Awaited<ReturnType<typeof createSupabaseAuthServerClient>>;
  userId: string;
  displayName: string | null;
  email: string | null;
}

export type ModerationAccessResult =
  | { ok: true; staff: StaffContext }
  | { ok: false; reason: "unauthenticated" | "forbidden" };

async function readStaffProfile(
  client: StaffContext["client"],
  userId: string
): Promise<{ role: string; display_name: string | null } | null> {
  const { data, error } = await client
    .from("profiles")
    .select("role, display_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) return null;
  return (data as unknown as { role: string; display_name: string | null }) ?? null;
}

export async function getModerationAccess(): Promise<ModerationAccessResult> {
  let client;
  try {
    client = await createSupabaseAuthServerClient();
  } catch {
    return { ok: false, reason: "unauthenticated" };
  }

  const { data: claimsData, error: claimsError } =
    await client.auth.getClaims();
  const claims = claimsError ? null : (claimsData?.claims ?? null);
  const userId = (claims?.sub as string | undefined) ?? null;

  if (!userId) {
    return { ok: false, reason: "unauthenticated" };
  }

  const profile = await readStaffProfile(client, userId);
  if (!profile || !["moderator", "admin"].includes(profile.role)) {
    return { ok: false, reason: "forbidden" };
  }

  return {
    ok: true,
    staff: {
      client,
      userId,
      displayName: profile.display_name,
      email: (claims?.email as string | undefined) ?? null,
    },
  };
}

export interface EnrichmentAuditStatus {
  active: boolean;
  reason: string | null;
}

/**
 * Probes whether the enrichment audit trail (migration 0003) is live, so the
 * moderation UI can tell operators the truth instead of silently dropping
 * audit rows. Read-only; safe to call on every review render.
 */
export async function getEnrichmentAuditStatus(): Promise<EnrichmentAuditStatus> {
  const access = await getModerationAccess();
  if (!access.ok) return { active: false, reason: "unauthenticated" };

  const { error } = await access.staff.client
    .from("opportunity_enrichments")
    .select("id")
    .limit(1);

  if (!error) return { active: true, reason: null };
  if (error.code === "PGRST205" || error.message.includes("does not exist")) {
    return { active: false, reason: "migration 0003 not applied" };
  }
  return { active: false, reason: error.message };
}

function toOpportunityRows(data: unknown): OpportunityRow[] {
  return (data ?? []) as unknown as OpportunityRow[];
}

/**
 * Pure selector: the id that follows `currentId` in the rendered queue
 * order. Exported for unit testing; used by getNextPendingId.
 */
export function nextPendingAfter(
  pendingIds: string[],
  currentId: string
): string | null {
  const index = pendingIds.indexOf(currentId);
  if (index === -1) return null;
  return pendingIds[index + 1] ?? null;
}

/**
 * The pending row that follows `currentId` in the SAME order the queue
 * renders (created_at ascending, then id as a deterministic tie-break).
 * Powers "review next" navigation after a decision so moderators do not
 * pay a full queue round-trip per item. Read-only, staff-only (same RLS
 * path as the queue); returns null at the end of the queue or on error.
 */
export async function getNextPendingId(currentId: string): Promise<string | null> {
  if (!isValidOpportunityId(currentId)) return null;
  const pending = await listPendingOpportunities();
  return nextPendingAfter(pending.map((o) => o.id), currentId);
}

/**
 * Queue filter (Milestone 11): a server-side VIEW filter over the same
 * deterministic pending list. It never changes what is pending, never
 * hides records from other views, and never affects decision logic —
 * the moderator can always clear it. Triage buckets remain prioritization
 * hints; filtering by a hint is batch navigation, not automated judgment.
 */
export interface QueueFilter {
  bucket: TriageBucket | null;
  sourceName: string | null;
}

export const EMPTY_QUEUE_FILTER: QueueFilter = { bucket: null, sourceName: null };

const MAX_SOURCE_PARAM_LENGTH = 120;

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/** Pure, hostile-input-safe parser for queue filter search params. */
export function parseQueueFilter(
  raw: Record<string, string | string[] | undefined>
): QueueFilter {
  let bucket: TriageBucket | null = null;
  const bucketRaw = firstParam(raw.bucket);
  if (bucketRaw !== null && /^[1-8]$/.test(bucketRaw)) {
    bucket = Number(bucketRaw) as TriageBucket;
  }
  let sourceName: string | null = null;
  const sourceRaw = firstParam(raw.source);
  if (sourceRaw !== null) {
    const trimmed = sourceRaw.trim();
    if (trimmed !== "" && trimmed.length <= MAX_SOURCE_PARAM_LENGTH) {
      sourceName = trimmed;
    }
  }
  return { bucket, sourceName };
}

export function isQueueFilterEmpty(filter: QueueFilter): boolean {
  return filter.bucket === null && filter.sourceName === null;
}

/** Pure predicate: both active conditions must match (AND). */
export function matchesQueueFilter(
  opportunity: Pick<Opportunity, "category" | "title" | "sourceName">,
  filter: QueueFilter
): boolean {
  if (
    filter.bucket !== null &&
    triageBucketOf(opportunity.category, opportunity.title) !== filter.bucket
  ) {
    return false;
  }
  if (filter.sourceName !== null && (opportunity.sourceName ?? null) !== filter.sourceName) {
    return false;
  }
  return true;
}

/** Deterministic order preserved — filtering only removes rows. */
export function filterPendingQueue(
  items: Opportunity[],
  filter: QueueFilter
): Opportunity[] {
  if (isQueueFilterEmpty(filter)) return items;
  return items.filter((item) => matchesQueueFilter(item, filter));
}

/** Query suffix ("" or "?a=b&c=d") to carry a filter across navigation. */
export function queueFilterQuery(filter: QueueFilter): string {
  const params = new URLSearchParams();
  if (filter.bucket !== null) params.set("bucket", String(filter.bucket));
  if (filter.sourceName !== null) params.set("source", filter.sourceName);
  const query = params.toString();
  return query === "" ? "" : `?${query}`;
}

export interface QueueNavigation {
  /** 1-based position in the rendered queue order; null when the record
   *  is not in the rendered window (e.g. beyond the explicit cap). */
  position: number | null;
  total: number;
  nextId: string | null;
}

/** Pure core of getQueueNavigation, over an already-ordered id list. */
export function queueNavigationFromIds(
  pendingIds: string[],
  currentId: string
): QueueNavigation {
  const index = pendingIds.indexOf(currentId);
  return {
    position: index === -1 ? null : index + 1,
    total: pendingIds.length,
    nextId: nextPendingAfter(pendingIds, currentId),
  };
}

/**
 * One queue read serving both the position indicator and the next-in-queue
 * link (same deterministic order as the rendered queue). When a filter is
 * active, position and next are computed WITHIN the filtered view so the
 * moderator can finish a batch without leaving it. Read-only, staff-only;
 * a non-pending or unknown id yields position null.
 */
export async function getQueueNavigation(
  currentId: string,
  filter: QueueFilter = EMPTY_QUEUE_FILTER
): Promise<QueueNavigation> {
  if (!isValidOpportunityId(currentId)) {
    return { position: null, total: 0, nextId: null };
  }
  const pending = await listPendingOpportunities();
  return queueNavigationFromIds(
    filterPendingQueue(pending, filter).map((o) => o.id),
    currentId
  );
}

export async function listPendingOpportunities(): Promise<Opportunity[]> {
  const access = await getModerationAccess();
  if (!access.ok) return [];

  // Explicit cap, never the implicit PostgREST 1,000-row limit: a queue
  // this deep is itself the signal to build queue pagination (§12.1).
  const QUEUE_LIMIT = 500;

  const { data, error } = await access.staff.client
    .from("opportunities")
    .select(OPPORTUNITY_SELECT)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(QUEUE_LIMIT);

  if (error) {
    console.error("[lib/data] Failed to list pending opportunities:", error.message);
    return [];
  }

  const rows = toOpportunityRows(data);
  if (rows.length >= QUEUE_LIMIT) {
    console.warn(
      `[lib/data] Pending queue reached the ${QUEUE_LIMIT}-row explicit cap — older rows are hidden until queue pagination ships (§12.1)`
    );
  }

  return rows.map((row) => mapOpportunityRow(row, "pending"));
}

export async function getPendingOpportunityById(
  id: string
): Promise<Opportunity | null> {
  if (!isValidOpportunityId(id)) return null;

  const access = await getModerationAccess();
  if (!access.ok) return null;

  const { data, error } = await access.staff.client
    .from("opportunities")
    .select(OPPORTUNITY_SELECT)
    .eq("id", id)
    .eq("status", "pending")
    .maybeSingle();

  if (error) {
    console.error("[lib/data] Failed to fetch pending opportunity:", error.message);
    return null;
  }

  return data
    ? mapOpportunityRow(toOpportunityRows([data])[0], "pending")
    : null;
}

export interface ModerationCategoryOption {
  slug: OpportunityCategory;
  label: string;
}

/**
 * Pure selector: the category options a moderator may choose for a record.
 *
 * Options come from the LIVE categories table (same honesty contract as the
 * homepage hub and submit form — unseeded slugs are never offered). The
 * record's own category is always kept even if it is missing from the live
 * list: the moderator must be able to keep or correct the discovered value,
 * and approving must never fail because the select lost its current value.
 * When the live table is unreadable (empty rows), fall back to the record's
 * own category only — never to a fabricated full taxonomy.
 */
export function reviewCategoryOptions(
  liveRows: Array<{ slug: string; label: string | null }>,
  recordCategory: OpportunityCategory,
  fallbackLabel: (slug: OpportunityCategory) => string
): ModerationCategoryOption[] {
  const options: ModerationCategoryOption[] = [];
  const seen = new Set<OpportunityCategory>();
  for (const row of liveRows) {
    // Same contract as mapLiveCategories: slugs outside the application
    // taxonomy are never surfaced.
    if (!(OPPORTUNITY_CATEGORIES as readonly string[]).includes(row.slug)) continue;
    const slug = row.slug as OpportunityCategory;
    if (seen.has(slug)) continue;
    seen.add(slug);
    const trimmed = row.label?.trim() ?? "";
    options.push({ slug, label: trimmed !== "" ? trimmed : fallbackLabel(slug) });
  }
  if (!seen.has(recordCategory)) {
    options.push({
      slug: recordCategory,
      label: `${fallbackLabel(recordCategory)} (current)`,
    });
  }
  return options;
}

/**
 * Live category options for the review form, read through the SAME staff
 * client as the rest of moderation (no new access path). Read-only.
 */
export async function listReviewCategoryOptions(
  recordCategory: OpportunityCategory,
  fallbackLabel: (slug: OpportunityCategory) => string
): Promise<ModerationCategoryOption[]> {
  const access = await getModerationAccess();
  if (!access.ok) {
    return reviewCategoryOptions([], recordCategory, fallbackLabel);
  }

  const { data, error } = await access.staff.client
    .from("categories")
    .select("slug,label")
    .order("id", { ascending: true });

  if (error) {
    console.error("[lib/data] Failed to list categories for review:", error.message);
    return reviewCategoryOptions([], recordCategory, fallbackLabel);
  }

  const rows = (data ?? []) as unknown as Array<{ slug: string; label: string | null }>;
  return reviewCategoryOptions(rows, recordCategory, fallbackLabel);
}
