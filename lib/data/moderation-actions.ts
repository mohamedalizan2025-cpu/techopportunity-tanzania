"use server";

import { revalidatePath } from "next/cache";
import {
  getModerationAccess,
  getPendingOpportunityById,
  isValidOpportunityId,
  parseBulkRejectIds,
  type StaffContext,
} from "./moderation";
import {
  evaluateUnpublishPermission,
  getPublishedOpportunityById,
  parseUnpublishRequest,
  unpublishDenialMessage,
  unpublishRpcArguments,
} from "./published-management";
import {
  parseReviewInput,
  reviewAuditRows,
  reviewedOpportunityUpdate,
  satisfiesPublishedReviewContract,
  type ReviewInput,
} from "./moderation-review";
import {
  BULK_REJECT_CONFIRM_TOKEN,
  BULK_REJECT_MAX_ITEMS,
  MODERATION_REASON_MAX_LENGTH,
  MODERATION_REASON_MIN_LENGTH,
  normalizeModerationReason,
  type BulkRejectItemResult,
  type BulkRejectState,
  type DecisionState,
  type UnpublishState,
} from "../staff-form-state";
import { trustSchemaEnabled } from "./opportunities";
import type { Opportunity } from "../types";

interface DecidedRow {
  slug: string;
  title: string;
}

interface RejectedRow {
  opportunity_id: string;
  opportunity_slug: string;
  opportunity_title: string;
}

type ReviewSaveResult =
  | { ok: true; row: DecidedRow }
  | { ok: false; reason: "organization" | "category" | "write" | "stale" };

async function saveApprovedReview({
  staff,
  current,
  review,
  expectedStatus,
  expectedDecisionAt,
  decisionTime,
}: {
  staff: StaffContext;
  current: Opportunity;
  review: ReviewInput;
  expectedStatus: "pending" | "published";
  /** Undefined preserves the existing pending-approval query contract. */
  expectedDecisionAt?: string | null;
  decisionTime: string;
}): Promise<ReviewSaveResult> {
  if (review.organizationId !== null) {
    const { data: org, error: orgError } = await staff.client
      .from("organizations")
      .select("id")
      .eq("id", review.organizationId)
      .maybeSingle();
    if (orgError || !org) {
      console.error(
        "[lib/data] Organization attachment lookup failed:",
        orgError?.message ?? "not found"
      );
      return { ok: false, reason: "organization" };
    }
  }

  const { data: categoryRow, error: categoryError } = await staff.client
    .from("categories")
    .select("id")
    .eq("slug", review.category)
    .maybeSingle();
  if (categoryError || !categoryRow) {
    console.error(
      "[lib/data] Category lookup failed:",
      categoryError?.message ?? "not found"
    );
    return { ok: false, reason: "category" };
  }

  const update = reviewedOpportunityUpdate(
    review,
    staff.userId,
    decisionTime,
    (categoryRow as unknown as { id: number }).id
  );
  let request = staff.client
    .from("opportunities")
    .update(update)
    .eq("id", current.id)
    .eq("status", expectedStatus);
  if (expectedDecisionAt !== undefined) {
    request = expectedDecisionAt === null
      ? request.is("decided_at", null)
      : request.eq("decided_at", expectedDecisionAt);
  }
  const { data, error } = await request.select("slug,title");

  if (error) {
    console.error("[lib/data] Failed to save opportunity review:", error.message);
    return { ok: false, reason: "write" };
  }
  const rows = (data ?? []) as unknown as DecidedRow[];
  if (rows.length === 0) return { ok: false, reason: "stale" };

  const auditRows = reviewAuditRows(current, review);
  if (auditRows.length > 0) {
    const { error: auditError } = await staff.client
      .from("opportunity_enrichments")
      .insert(auditRows);
    if (auditError) {
      console.info("[lib/data] Enrichment audit not recorded:", auditError.message);
    }
  }

  return { ok: true, row: rows[0] };
}

function reviewSaveError(reason: Exclude<ReviewSaveResult, { ok: true }>["reason"]): string {
  if (reason === "organization") return "Selected organization could not be verified.";
  if (reason === "category") return "Selected category could not be verified.";
  if (reason === "stale") return "This record changed during review. Reload it before trying again.";
  return "The decision could not be saved. Please try again.";
}

export async function decideOpportunityAction(
  _previousState: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  const initial: DecisionState = {
    status: "idle",
    message: null,
    decision: null,
    decidedTitle: null,
    decidedSlug: null,
  };

  const rawId =
    typeof formData.get("opportunityId") === "string"
      ? (formData.get("opportunityId") as string)
      : "";
  const rawDecision =
    formData.get("decision") === "approve" || formData.get("decision") === "reject"
      ? (formData.get("decision") as "approve" | "reject")
      : null;

  if (!isValidOpportunityId(rawId)) {
    return { ...initial, status: "error", message: "Invalid submission reference." };
  }
  if (rawDecision === null) {
    return { ...initial, status: "error", message: "Choose approve or reject." };
  }
  const rejectionReason = rawDecision === "reject"
    ? normalizeModerationReason(formData.get("rejectionReason"))
    : null;
  if (rawDecision === "reject" && rejectionReason === null) {
    return {
      ...initial,
      status: "error",
      message: `Give a specific rejection reason (${MODERATION_REASON_MIN_LENGTH}-${MODERATION_REASON_MAX_LENGTH} characters).`,
    };
  }
  if (rawDecision === "approve" && !trustSchemaEnabled()) {
    return {
      ...initial,
      status: "error",
      message: "Approval is paused until the owner activates the M31 trust schema.",
    };
  }

  const access = await getModerationAccess();
  if (!access.ok) {
    return {
      ...initial,
      status: "error",
      message:
        access.reason === "unauthenticated"
          ? "Your session has expired. Please sign in again."
          : "You do not have permission to moderate submissions.",
    };
  }

  // Explicit double-decision protection: fetch the pending row first.
  const current = await getPendingOpportunityById(rawId);
  if (!current) {
    return {
      ...initial,
      status: "error",
      message:
        "This submission is no longer pending — it may already have been reviewed.",
    };
  }

  // Review corrections apply ONLY on approval. A rejection keeps the record
  // exactly as discovered (no organizer/location/deadline wipes).
  let review: ReviewInput | null = null;
  if (rawDecision === "approve") {
    const parsed = parseReviewInput(formData);
    if (!parsed.ok) {
      return { ...initial, status: "error", message: parsed.message };
    }
    review = parsed.review;
  }

  if (rawDecision === "approve" && review !== null) {
    const decisionTime = new Date().toISOString();
    const saved = await saveApprovedReview({
      staff: access.staff,
      current,
      review,
      expectedStatus: "pending",
      decisionTime,
    });
    if (!saved.ok) {
      return { ...initial, status: "error", message: reviewSaveError(saved.reason) };
    }

    revalidatePath("/moderation");
    revalidatePath("/");
    revalidatePath(`/opportunities/${saved.row.slug}`);
    return {
      status: "success",
      message: "Approved — the opportunity is now publicly visible.",
      decision: "approve",
      decidedTitle: saved.row.title,
      decidedSlug: saved.row.slug,
    };
  }

  const { data, error } = await access.staff.client
    .rpc("reject_pending_opportunity", {
      target_opportunity_id: rawId,
      decision_reason: rejectionReason,
    });

  if (error) {
    console.error("[lib/data] Failed to decide opportunity:", error.message);
    return {
      ...initial,
      status: "error",
      message: "The decision could not be saved. Please try again.",
    };
  }

  const rows = (data ?? []) as unknown as RejectedRow[];
  if (rows.length === 0) {
    return {
      ...initial,
      status: "error",
      message:
        "This submission is no longer pending — it may already have been reviewed.",
    };
  }

  const { opportunity_slug: slug, opportunity_title: title } = rows[0];

  revalidatePath("/moderation");
  revalidatePath("/");
  revalidatePath(`/opportunities/${slug}`);

  return {
    status: "success",
    message: "Rejected — the submission stays hidden from the public site.",
    decision: "reject",
    decidedTitle: title,
    decidedSlug: slug,
  };
}

function bulkRejectInputError(error: "empty" | "too-many" | "invalid"): string {
  if (error === "empty") return "Select at least one pending record first.";
  if (error === "too-many") {
    return `Select at most ${BULK_REJECT_MAX_ITEMS} records per batch — run the remainder as another batch.`;
  }
  return "Invalid submission reference.";
}

/**
 * Reject MANY pending records with ONE confirmed reason (Bulk Moderator
 * Actions milestone).
 *
 * Deliberately NOT a set-based database call: every record travels the exact
 * single-record `reject_pending_opportunity` path, so each keeps its own
 * authenticated Moderator attribution, decision timestamp, reason, and audit
 * row. Records are processed sequentially and each commits independently — a
 * stale or failing row is reported per-record and never rolls back the
 * independent successes. There is intentionally no bulk approve: approval
 * demands per-record M31 evidence the batch form cannot supply.
 */
export async function bulkRejectPendingAction(
  _previousState: BulkRejectState,
  formData: FormData
): Promise<BulkRejectState> {
  const idle: BulkRejectState = { status: "idle", message: null, results: [] };

  if (
    formData.get("confirm") !== BULK_REJECT_CONFIRM_TOKEN ||
    formData.get("acknowledge") !== "yes"
  ) {
    return {
      ...idle,
      status: "error",
      message: "Confirm the bulk rejection before submitting.",
    };
  }
  const rejectionReason = normalizeModerationReason(formData.get("rejectionReason"));
  if (rejectionReason === null) {
    return {
      ...idle,
      status: "error",
      message: `Give a specific rejection reason (${MODERATION_REASON_MIN_LENGTH}-${MODERATION_REASON_MAX_LENGTH} characters).`,
    };
  }
  const parsed = parseBulkRejectIds(formData.getAll("opportunityId"));
  if (!parsed.ok) {
    return { ...idle, status: "error", message: bulkRejectInputError(parsed.error) };
  }

  const access = await getModerationAccess();
  if (!access.ok) {
    return {
      ...idle,
      status: "error",
      message:
        access.reason === "unauthenticated"
          ? "Your session has expired. Please sign in again."
          : "You do not have permission to moderate submissions.",
    };
  }

  const results: BulkRejectItemResult[] = [];
  for (const id of parsed.ids) {
    // Same double-decision protection as the single-record path, per row.
    const current = await getPendingOpportunityById(id);
    if (!current) {
      results.push({
        id,
        ok: false,
        error: "This submission is no longer pending — it may already have been reviewed.",
      });
      continue;
    }
    const { data, error } = await access.staff.client.rpc("reject_pending_opportunity", {
      target_opportunity_id: id,
      decision_reason: rejectionReason,
    });
    if (error) {
      console.error("[lib/data] Failed to bulk-reject opportunity:", id, error.message);
      results.push({
        id,
        ok: false,
        error: "The decision could not be saved. Please try again.",
      });
      continue;
    }
    const rows = (data ?? []) as unknown as RejectedRow[];
    if (rows.length === 0) {
      results.push({
        id,
        ok: false,
        error: "This submission is no longer pending — it may already have been reviewed.",
      });
      continue;
    }
    results.push({ id, ok: true, title: rows[0].opportunity_title, slug: rows[0].opportunity_slug });
  }

  const succeeded = results.filter((result) => result.ok);
  if (succeeded.length > 0) {
    revalidatePath("/moderation");
    revalidatePath("/");
    for (const item of succeeded) {
      if (item.slug) revalidatePath(`/opportunities/${item.slug}`);
    }
  }

  if (succeeded.length === results.length) {
    return {
      status: "success",
      message:
        results.length === 1
          ? `Rejected 1 record — the submission stays hidden from the public site.`
          : `Rejected ${results.length} records — every submission stays hidden from the public site.`,
      results,
    };
  }
  if (succeeded.length === 0) {
    return {
      status: "error",
      message: "No record was rejected — every selected submission had already been reviewed or could not be saved.",
      results,
    };
  }
  return {
    status: "partial",
    message: `Rejected ${succeeded.length} of ${results.length} — the rest were already reviewed or could not be saved. Succeeded records stay rejected; retry only the listed failures.`,
    results,
  };
}

/**
 * Refresh the evidence and attribution of one already-published opportunity.
 * Authentication, parsing, payload construction and audit semantics are shared
 * with initial approval; the published status and prior decision timestamp are
 * both guarded so this path cannot publish another record or clobber a newer
 * staff review.
 */
export async function rereviewPublishedOpportunityAction(
  _previousState: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  const initial: DecisionState = {
    status: "idle",
    message: null,
    decision: null,
    decidedTitle: null,
    decidedSlug: null,
  };
  const rawId =
    typeof formData.get("opportunityId") === "string"
      ? (formData.get("opportunityId") as string)
      : "";

  if (!isValidOpportunityId(rawId)) {
    return { ...initial, status: "error", message: "Invalid submission reference." };
  }
  if (!trustSchemaEnabled()) {
    return {
      ...initial,
      status: "error",
      message: "Re-review is paused until the owner activates the M31 trust schema.",
    };
  }

  const access = await getModerationAccess();
  if (!access.ok) {
    return {
      ...initial,
      status: "error",
      message:
        access.reason === "unauthenticated"
          ? "Your session has expired. Please sign in again."
          : "You do not have permission to moderate submissions.",
    };
  }

  const current = await getPublishedOpportunityById(rawId);
  if (!current) {
    return {
      ...initial,
      status: "error",
      message: "This opportunity is no longer published — reload before reviewing it.",
    };
  }
  const parsed = parseReviewInput(formData);
  if (!parsed.ok) return { ...initial, status: "error", message: parsed.message };

  const now = new Date();
  const decisionTime = now.toISOString();
  if (
    !satisfiesPublishedReviewContract(
      current,
      parsed.review,
      access.staff.userId,
      decisionTime,
      now
    )
  ) {
    return {
      ...initial,
      status: "error",
      message:
        "This review does not satisfy the current publication contract. Verify every required field and confirm the opportunity is still open.",
    };
  }

  const saved = await saveApprovedReview({
    staff: access.staff,
    current,
    review: parsed.review,
    expectedStatus: "published",
    expectedDecisionAt: current.trust?.decidedAt ?? null,
    decisionTime,
  });
  if (!saved.ok) {
    return { ...initial, status: "error", message: reviewSaveError(saved.reason) };
  }

  revalidatePath("/published-management");
  revalidatePath(`/moderation/${rawId}`);
  revalidatePath("/");
  revalidatePath(`/opportunities/${saved.row.slug}`);
  return {
    status: "success",
    message: "Re-review saved — this opportunity still satisfies the publication contract.",
    decision: "approve",
    decidedTitle: saved.row.title,
    decidedSlug: saved.row.slug,
  };
}

const initialUnpublish: UnpublishState = {
  status: "idle",
  message: null,
  unpublishedId: null,
};

/**
 * Unpublish ONE already-published record (Milestone 14 public-trust cleanup).
 *
 * Staff authorization, explicit confirmation and a reason precede one
 * authenticated RPC. Its exact-id published → rejected transition and audit
 * insert share a transaction, so neither can succeed alone. No service-role
 * credential participates in this application path.
 */
export async function unpublishOpportunityAction(
  _previousState: UnpublishState,
  formData: FormData
): Promise<UnpublishState> {
  const request = parseUnpublishRequest(formData);
  const access = await getModerationAccess();

  const permission = evaluateUnpublishPermission(request, access);
  if (!permission.ok) {
    return {
      ...initialUnpublish,
      status: "error",
      message: unpublishDenialMessage(permission.denial),
    };
  }
  const rawId = permission.id;

  const { data, error } = await permission.staff.client
    .rpc("unpublish_published_opportunity", unpublishRpcArguments(rawId, permission.reason));

  if (error) {
    console.error("[lib/data] Failed to unpublish opportunity:", error.message);
    return {
      ...initialUnpublish,
      status: "error",
      message: "The record could not be unpublished. Please try again.",
    };
  }

  const rows = (data ?? []) as unknown as Array<{
    opportunity_id: string;
    opportunity_title: string;
    opportunity_slug: string;
  }>;
  if (rows.length === 0) {
    // Lost a race with another staff member — refuse instead of clobbering.
    return {
      ...initialUnpublish,
      status: "error",
      message: unpublishDenialMessage("not-published"),
    };
  }

  revalidatePath("/published-management");
  revalidatePath("/");
  revalidatePath(`/opportunities/${rows[0].opportunity_slug}`);

  return {
    status: "success",
    message: `Unpublished “${rows[0].opportunity_title}” — hidden from the public site, record, provenance and attributed decision retained.`,
    unpublishedId: rows[0].opportunity_id,
  };
}
