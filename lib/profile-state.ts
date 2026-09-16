import {
  normalizeTalentProfile,
  type TalentProfile,
} from "./personalization";

/**
 * Progressive-profile form state and hostile-input-safe parsing. Mirrors the
 * existing saved/alert state modules: the server action never trusts a client
 * identity, and every field is normalized through the shared personalization
 * bounds/whitelists before it can reach the database.
 */

export interface ProfileMutationState {
  status: "idle" | "success" | "error";
  message: string | null;
}

export const initialProfileMutationState: ProfileMutationState = {
  status: "idle",
  message: null,
};

function entryOrNull(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" ? value : null;
}

/** Multi-select controls submit repeated keys; a missing control yields []. */
function allEntries(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .filter((value): value is string => typeof value === "string");
}

/** Skills are entered as one comma/newline separated field. */
function splitSkills(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

/**
 * Parse the progressive-profile form into a normalized TalentProfile. Every
 * field is optional: an empty or out-of-vocabulary submission normalizes to an
 * absent value rather than an error, so a user can save a partial profile or
 * clear it entirely.
 */
export function parseProfileForm(formData: FormData): TalentProfile {
  return normalizeTalentProfile({
    careerLevel: entryOrNull(formData.get("careerLevel")),
    fieldDiscipline: entryOrNull(formData.get("fieldDiscipline")),
    sectors: allEntries(formData, "sectors"),
    preferredTypes: allEntries(formData, "preferredTypes"),
    skills: splitSkills(entryOrNull(formData.get("skills"))),
    region: entryOrNull(formData.get("region")),
    experienceLevel: entryOrNull(formData.get("experienceLevel")),
    goals: entryOrNull(formData.get("goals")),
  });
}

/** Ownership is always derived from authenticated claims, never from input. */
export function ownsTalentProfile(
  authenticatedUserId: string | null,
  recordUserId: string
): boolean {
  return authenticatedUserId !== null && authenticatedUserId === recordUserId;
}
