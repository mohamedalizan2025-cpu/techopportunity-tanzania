"use server";

import { revalidatePath } from "next/cache";
import {
  parseProfileForm,
  type ProfileMutationState,
} from "../profile-state";
import { getAuthenticatedUser } from "./supabase-auth";
import { missingProfileSchema } from "./talent-profile";

/**
 * Owner-scoped progressive-profile save. Identity comes only from authenticated
 * claims — the client never supplies a user id — and every field is normalized
 * through the shared bounds/whitelists before the upsert. RLS additionally
 * confines the write to the caller's own row.
 */
export async function saveTalentProfileAction(
  _previousState: ProfileMutationState,
  formData: FormData
): Promise<ProfileMutationState> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return {
      status: "error",
      message: "Your session expired. Please sign in again.",
    };
  }

  const profile = parseProfileForm(formData);

  const { error } = await user.client.from("talent_profiles").upsert(
    {
      user_id: user.userId,
      career_level: profile.careerLevel,
      field_discipline: profile.fieldDiscipline,
      sectors: profile.sectors,
      preferred_types: profile.preferredTypes,
      skills: profile.skills,
      region: profile.region,
      experience_level: profile.experienceLevel,
      goals: profile.goals,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    if (missingProfileSchema(error)) {
      return {
        status: "error",
        message:
          "Personalized profiles are not available yet. Explore is unaffected.",
      };
    }
    console.error("[lib/data] Failed to save talent profile:", error.message);
    return {
      status: "error",
      message: "Your profile could not be saved. Please try again.",
    };
  }

  revalidatePath("/for-you");
  revalidatePath("/profile");
  return {
    status: "success",
    message: "Profile saved. Your For You feed is updated.",
  };
}
