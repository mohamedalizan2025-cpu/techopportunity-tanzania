"use server";

import { revalidatePath } from "next/cache";
import { getModerationAccess, getPendingOpportunityById, isValidOpportunityId } from "./moderation";
import { parseReviewInput, type ReviewInput } from "./moderation-review";
import type { DecisionState } from "../staff-form-state";

interface DecidedRow {
  slug: string;
  title: string;
}

const AUDITABLE_FIELDS: Array<{ field: string; previous: keyof ReviewInput; next: keyof ReviewInput }> = [
  { field: "venue_name", previous: "venueName", next: "venueName" },
  { field: "address", previous: "address", next: "address" },
  { field: "city", previous: "city", next: "city" },
  { field: "region", previous: "region", next: "region" },
  { field: "deadline", previous: "deadline", next: "deadline" },
];

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

  const organizationId = review?.organizationId ?? null;

  if (organizationId !== null) {
    const { data: org, error: orgError } = await access.staff.client
      .from("organizations")
      .select("id")
      .eq("id", organizationId)
      .maybeSingle();
    if (orgError || !org) {
      console.error(
        "[lib/data] Organization attachment lookup failed:",
        orgError?.message ?? "not found"
      );
      return { ...initial, status: "error", message: "Selected organization could not be verified." };
    }
  }

  const update: Record<string, unknown> = { status: nextStatus };
  if (rawDecision === "approve" && review !== null) {
    update.title = review.title;
    update.description = review.description;
    update.url = review.url;
    update.venue_name = review.venueName;
    update.address = review.address;
    update.city = review.city;
    update.region = review.region;
    update.deadline = review.deadline;
    update.organization_id = review.organizationId;

    const { data: categoryRow, error: categoryError } = await access.staff.client
      .from("categories")
      .select("id")
      .eq("slug", review.category)
      .maybeSingle();
    if (categoryError || !categoryRow) {
      console.error("[lib/data] Category lookup failed:", categoryError?.message ?? "not found");
      return { ...initial, status: "error", message: "Selected category could not be verified." };
    }
    update.category_id = (categoryRow as unknown as { id: number }).id;
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

  // Field-level audit for moderator enrichment (best-effort; the audit table
  // exists only after migration 0003 — its absence never blocks moderation).
  if (rawDecision === "approve" && review !== null) {
    const auditRows = AUDITABLE_FIELDS.map(({ field, previous, next }) => {
      const before = (current as unknown as Record<string, unknown>)[previous];
      const after = review[next];
      if ((before ?? null) === (after ?? null)) return null;
      return {
        opportunity_id: rawId,
        field,
        previous_value: before ?? null,
        new_value: after ?? "",
        evidence_url: current.url,
        method: "moderator-review",
      };
    }).filter((row): row is NonNullable<typeof row> => row !== null);
    if (auditRows.length > 0) {
      const { error: auditError } = await access.staff.client
        .from("opportunity_enrichments")
        .insert(auditRows);
      if (auditError) {
        console.info(
          "[lib/data] Enrichment audit not recorded:",
          auditError.message
        );
      }
    }
  }

  revalidatePath("/moderation");
  revalidatePath("/");
  revalidatePath(`/opportunities/${slug}`);

  return {
    status: "success",
    message:
      rawDecision === "approve"
        ? "Approved — the opportunity is now publicly visible."
        : "Rejected — the submission stays hidden from the public site.",
    decision: rawDecision,
    decidedTitle: title,
    decidedSlug: slug,
  };
}
