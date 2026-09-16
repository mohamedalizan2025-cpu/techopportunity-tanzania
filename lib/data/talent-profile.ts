import type { AuthenticatedUserContext } from "./supabase-auth";
import {
  EMPTY_TALENT_PROFILE,
  normalizeTalentProfile,
  type TalentProfile,
} from "../personalization";

/**
 * Owner-only read of the talent profile. RLS already constrains this to the
 * authenticated user's own row; the explicit `user_id` predicate is defence in
 * depth. Personal profiles are never read for staff, moderation, or any
 * organization-facing surface (docs/PLATFORM_ARCHITECTURE.md).
 */

const TALENT_PROFILE_SELECT = `
  user_id,
  career_level,
  field_discipline,
  sectors,
  preferred_types,
  skills,
  region,
  experience_level,
  goals
`;

export interface TalentProfileRow {
  user_id: string;
  career_level: string | null;
  field_discipline: string | null;
  sectors: string[] | null;
  preferred_types: string[] | null;
  skills: string[] | null;
  region: string | null;
  experience_level: string | null;
  goals: string | null;
}

export interface TalentProfileResult {
  /** False only when the owner-gated 0018 schema is not yet applied. */
  available: boolean;
  profile: TalentProfile;
}

export function missingProfileSchema(error: {
  code?: string;
  message?: string;
}): boolean {
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("talent_profiles") === true
  );
}

export function mapTalentProfileRow(row: TalentProfileRow): TalentProfile {
  return normalizeTalentProfile({
    careerLevel: row.career_level,
    fieldDiscipline: row.field_discipline,
    sectors: row.sectors ?? [],
    preferredTypes: row.preferred_types ?? [],
    skills: row.skills ?? [],
    region: row.region,
    experienceLevel: row.experience_level,
    goals: row.goals,
  });
}

export async function getTalentProfile(
  user: AuthenticatedUserContext
): Promise<TalentProfileResult> {
  const { data, error } = await user.client
    .from("talent_profiles")
    .select(TALENT_PROFILE_SELECT)
    .eq("user_id", user.userId)
    .maybeSingle();

  if (error) {
    if (!missingProfileSchema(error)) {
      console.error("[lib/data] Failed to read talent profile:", error.message);
    }
    return { available: false, profile: EMPTY_TALENT_PROFILE };
  }

  const row = data as unknown as TalentProfileRow | null;
  if (!row) return { available: true, profile: EMPTY_TALENT_PROFILE };
  return { available: true, profile: mapTalentProfileRow(row) };
}
