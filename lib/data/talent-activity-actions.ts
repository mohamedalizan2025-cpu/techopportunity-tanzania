"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  parseActivityMutation,
  type ActivityMutationState,
} from "../talent-activity-state";
import { missingActivitySchema } from "./talent-activities";
import { sanitizeNextPath } from "../staff-form-state";
import { getAuthenticatedUser } from "./supabase-auth";

function refreshActivityViews(): void {
  revalidatePath("/");
  revalidatePath("/activity");
  revalidatePath("/saved");
  revalidatePath("/for-you");
  revalidatePath("/opportunities/[slug]", "page");
}

/**
 * Owner-scoped activity tracking. Identity comes only from authenticated
 * claims — the client never supplies a user id — and RLS additionally
 * confines every write to the caller's own row. Only published
 * opportunities can be tracked; anything else fails closed.
 */
export async function changeTalentActivityAction(
  _previousState: ActivityMutationState,
  formData: FormData
): Promise<ActivityMutationState> {
  const mutation = parseActivityMutation(formData);
  if (!mutation) {
    return {
      status: "error",
      message: "That activity request is invalid.",
      activity: null,
    };
  }

  const returnTo = sanitizeNextPath(formData.get("returnTo")) ?? "/activity";
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }

  if (mutation.intent === "remove") {
    const { error } = await user.client
      .from("talent_opportunity_activity")
      .delete()
      .eq("user_id", user.userId)
      .eq("opportunity_id", mutation.opportunityId);
    if (error) {
      if (missingActivitySchema(error)) {
        return {
          status: "error",
          message:
            "Application tracking is not available yet. Your saved list is unaffected.",
          activity: null,
        };
      }
      return {
        status: "error",
        message: "This activity could not be removed. Please try again.",
        activity: null,
      };
    }
    refreshActivityViews();
    return {
      status: "success",
      message: "Removed from your application tracking.",
      activity: null,
    };
  }

  const { data: opportunity, error: opportunityError } = await user.client
    .from("opportunities")
    .select("id")
    .eq("id", mutation.opportunityId)
    .eq("status", "published")
    .maybeSingle();
  if (opportunityError || !opportunity) {
    if (opportunityError && missingActivitySchema(opportunityError)) {
      return {
        status: "error",
        message:
          "Application tracking is not available yet. Your saved list is unaffected.",
        activity: null,
      };
    }
    return {
      status: "error",
      message: "This opportunity is not available to track.",
      activity: null,
    };
  }

  const { error } = await user.client.from("talent_opportunity_activity").upsert(
    {
      user_id: user.userId,
      opportunity_id: mutation.opportunityId,
      status: mutation.intent,
    },
    { onConflict: "user_id,opportunity_id" }
  );
  if (error) {
    if (missingActivitySchema(error)) {
      return {
        status: "error",
        message:
          "Application tracking is not available yet. Your saved list is unaffected.",
        activity: null,
      };
    }
    return {
      status: "error",
      message: "This activity could not be saved. Please try again.",
      activity: null,
    };
  }

  refreshActivityViews();
  return {
    status: "success",
    message: `Marked as ${mutation.intent}.`,
    activity: mutation.intent,
  };
}
