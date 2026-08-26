"use server";

import { revalidatePath } from "next/cache";
import { getModerationAccess, isValidOpportunityId } from "./moderation";
import type { DecisionState } from "../staff-form-state";

interface DecidedRow {
  slug: string;
  title: string;
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

  const { data, error } = await access.staff.client
    .from("opportunities")
    .update({ status: nextStatus })
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
    message:
      rawDecision === "approve"
        ? "Approved — the opportunity is now publicly visible."
        : "Rejected — the submission stays hidden from the public site.",
    decision: rawDecision,
    decidedTitle: title,
    decidedSlug: slug,
  };
}
