"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  isCampaignId,
  parseCampaignForm,
  parseCampaignStatus,
} from "../provider-campaign-state";
import { sanitizeNextPath } from "../staff-form-state";
import { getModerationAccess } from "./moderation";
import { missingCampaignSchema } from "./provider-campaigns";

export interface CampaignMutationState {
  status: "idle" | "success" | "error";
  message: string | null;
}

export const initialCampaignMutationState: CampaignMutationState = {
  status: "idle",
  message: null,
};

/**
 * Staff-only campaign creation. The creator comes from the staff session —
 * the client never supplies an actor — and the linked opportunity must be
 * currently published. Ordinary users never reach this action (the page
 * itself requires `getModerationAccess()`), and RLS confines the write to
 * staff regardless.
 */
export async function createProviderCampaignAction(
  _previousState: CampaignMutationState,
  formData: FormData
): Promise<CampaignMutationState> {
  const access = await getModerationAccess();
  if (!access.ok) {
    redirect("/login?next=%2Fcampaigns");
  }

  const parsed = parseCampaignForm(formData);
  if (!parsed) {
    return {
      status: "error",
      message: "That campaign request is invalid. Check the name, opportunity, and targeting.",
    };
  }

  const { data: opportunity, error: opportunityError } = await access.staff.client
    .from("opportunities")
    .select("id")
    .eq("id", parsed.opportunityId)
    .eq("status", "published")
    .maybeSingle();
  if (opportunityError || !opportunity) {
    if (opportunityError && missingCampaignSchema(opportunityError)) {
      return {
        status: "error",
        message: "Campaigns are not available yet (schema pending).",
      };
    }
    return {
      status: "error",
      message: "Campaigns can only link a currently published opportunity.",
    };
  }

  const { error } = await access.staff.client.from("provider_campaigns").insert({
    name: parsed.name,
    opportunity_id: parsed.opportunityId,
    status: "draft",
    geography: parsed.geography,
    sector: parsed.sector,
    opportunity_type: parsed.opportunityType,
    goal_text: parsed.goalText,
    created_by: access.staff.userId,
  });
  if (error) {
    if (missingCampaignSchema(error)) {
      return {
        status: "error",
        message: "Campaigns are not available yet (schema pending).",
      };
    }
    return {
      status: "error",
      message: "This campaign could not be created. Please try again.",
    };
  }

  revalidatePath("/campaigns");
  redirect("/campaigns");
}

export async function changeCampaignStatusAction(
  _previousState: CampaignMutationState,
  formData: FormData
): Promise<CampaignMutationState> {
  const access = await getModerationAccess();
  if (!access.ok) {
    redirect("/login?next=%2Fcampaigns");
  }

  const campaignId = formData.get("campaignId");
  const status = parseCampaignStatus(formData.get("intent"));
  const returnTo = sanitizeNextPath(formData.get("returnTo")) ?? "/campaigns";
  if (!isCampaignId(campaignId) || !status) {
    return { status: "error", message: "That campaign update is invalid." };
  }

  const { error } = await access.staff.client
    .from("provider_campaigns")
    .update({ status })
    .eq("id", campaignId);
  if (error) {
    if (missingCampaignSchema(error)) {
      return {
        status: "error",
        message: "Campaigns are not available yet (schema pending).",
      };
    }
    return {
      status: "error",
      message: "This campaign could not be updated. Please try again.",
    };
  }

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
  redirect(returnTo);
}
