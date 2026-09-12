"use server";

import { revalidatePath } from "next/cache";
import {
  getModerationAccess,
  getPendingOpportunityById,
  isValidOpportunityId,
  type StaffContext,
} from "./moderation";
import {
  evaluateUnpublishPermission,
  evaluateUnpublishTarget,
  getPublishedOpportunityById,
  parseUnpublishRequest,
  unpublishDenialMessage,
  unpublishUpdatePayload,
} from "./published-management";
import {
  parseReviewInput,
  reviewAuditRows,
  reviewedOpportunityUpdate,
  satisfiesPublishedReviewContract,
  type ReviewInput,
} from "./moderation-review";
import type { DecisionState, UnpublishState } from "../staff-form-state";
import { trustSchemaEnabled } from "./opportunities";
import type { Opportunity } from "../types";

interface DecidedRow {
  slug: string;
  title: string;
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

  const nextStatus = rawDecision === "approve" ? "published" : "rejected";

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

  const decisionTime = new Date().toISOString();
  if (rawDecision === "approve" && review !== null) {
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

  const update: Record<string, unknown> = { status: nextStatus };
  if (trustSchemaEnabled()) {
    update.decided_by = access.staff.userId;
    update.decided_at = decisionTime;
  }

  const { data, error } = await access.staff.client
    .from("opportunities")
    .update(update)
    .eq("id", rawId)
    .eq("status", "pending")
    .select("slug,title");

  if (error) {
    console.error("[lib/data] Failed to decide opportunity:", error.message);
    return {
      ...initial,
      status: "error",
      message: "The decision could not be saved. Please try again.",
    };
  }

  const rows = (data ?? []) as unknown as DecidedRow[];
  if (rows.length === 0) {
    return {
      ...initial,
      status: "error",
      message:
        "This submission is no longer pending — it may already have been reviewed.",
    };
  }

  const { slug, title } = rows[0];

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
 * Mirrors the defensive sequence of `decideOpportunityAction` exactly: staff
 * authorization → explicit confirmation token → exact UUID target → a
 * status-scoped pre-read → a conditional UPDATE that only lands while the row
 * is still published. It writes `status` and NOTHING else, never deletes, and
 * touches no provenance field. No audit row is attempted: migration 0003
 * constrains `field` to location/deadline names, so a status entry would
 * violate the CHECK — adding one would be a schema change (owner gate).
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

  // Pre-write guard: the row must still be published right now.
  const current = await getPublishedOpportunityById(rawId);
  const target = evaluateUnpublishTarget(current);
  if (!target.ok) {
    return {
      ...initialUnpublish,
      status: "error",
      message: unpublishDenialMessage(target.denial),
    };
  }

  const { data, error } = await permission.staff.client
    .from("opportunities")
    .update(unpublishUpdatePayload())
    .eq("id", rawId)
    .eq("status", "published")
    .select("id,title");

  if (error) {
    console.error("[lib/data] Failed to unpublish opportunity:", error.message);
    return {
      ...initialUnpublish,
      status: "error",
      message: "The record could not be unpublished. Please try again.",
    };
  }

  const rows = (data ?? []) as unknown as Array<{ id: string; title: string }>;
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
  revalidatePath(`/opportunities/${target.record.slug}`);

  return {
    status: "success",
    message: `Unpublished “${rows[0].title}” — hidden from the public site, record and provenance retained.`,
    unpublishedId: rawId,
  };
}
