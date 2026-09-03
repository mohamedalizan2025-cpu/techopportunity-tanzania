"use server";

import { revalidatePath } from "next/cache";
import {
  parseAlertPreferenceIntent,
  type AlertPreferenceMutationState,
} from "../alert-preference-state";
import { getAuthenticatedUser } from "./supabase-auth";

export async function changeDeadlineAlertPreferenceAction(
  _previousState: AlertPreferenceMutationState,
  formData: FormData
): Promise<AlertPreferenceMutationState> {
  const enabled = parseAlertPreferenceIntent(formData.get("intent"));
  if (enabled === null) {
    return { status: "error", message: "That alert setting is invalid.", enabled: null };
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return { status: "error", message: "Your session expired. Please sign in again.", enabled: null };
  }

  const { error } = await user.client.from("user_alert_preferences").upsert(
    {
      user_id: user.userId,
      deadline_alerts_enabled: enabled,
    },
    { onConflict: "user_id" }
  );
  if (error) {
    console.error("[lib/data] Failed to change deadline alert preference:", error.message);
    return {
      status: "error",
      message: "Your deadline alert setting could not be changed. Please try again.",
      enabled: null,
    };
  }

  revalidatePath("/saved");
  return {
    status: "success",
    message: enabled
      ? "Deadline alerts enabled for your saved opportunities."
      : "Deadline alerts disabled.",
    enabled,
  };
}
