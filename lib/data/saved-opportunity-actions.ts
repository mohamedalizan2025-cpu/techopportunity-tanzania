"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  parseSavedMutation,
  type SavedMutationState,
} from "../saved-opportunity-state";
import { sanitizeNextPath } from "../staff-form-state";
import { getAuthenticatedUser } from "./supabase-auth";

function refreshSavedViews(): void {
  revalidatePath("/");
  revalidatePath("/saved");
  revalidatePath("/opportunities/[slug]", "page");
}

export async function changeSavedOpportunityAction(
  _previousState: SavedMutationState,
  formData: FormData
): Promise<SavedMutationState> {
  const mutation = parseSavedMutation(formData);
  if (!mutation) {
    return {
      status: "error",
      message: "That saved-opportunity request is invalid.",
      saved: null,
    };
  }

  const returnTo = sanitizeNextPath(formData.get("returnTo")) ?? "/saved";
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }

  if (mutation.intent === "remove") {
    const { error } = await user.client
      .from("saved_opportunities")
      .delete()
      .eq("user_id", user.userId)
      .eq("opportunity_id", mutation.opportunityId);
    if (error) {
      return {
        status: "error",
        message: "This opportunity could not be removed. Please try again.",
        saved: true,
      };
    }
    refreshSavedViews();
    return {
      status: "success",
      message: "Opportunity removed from your saved list.",
      saved: false,
    };
  }

  const { data: opportunity, error: opportunityError } = await user.client
    .from("opportunities")
    .select("id")
    .eq("id", mutation.opportunityId)
    .eq("status", "published")
    .maybeSingle();
  if (opportunityError || !opportunity) {
    return {
      status: "error",
      message: "This opportunity is not available to save.",
      saved: false,
    };
  }

  const { error } = await user.client.from("saved_opportunities").insert({
    user_id: user.userId,
    opportunity_id: mutation.opportunityId,
  });
  if (error && error.code !== "23505") {
    return {
      status: "error",
      message: "This opportunity could not be saved. Please try again.",
      saved: false,
    };
  }

  refreshSavedViews();
  return {
    status: "success",
    message: error?.code === "23505" ? "Opportunity is already saved." : "Opportunity saved.",
    saved: true,
  };
}
