import type { Opportunity, OpportunityStatus } from "./types";

export type SavedMutationIntent = "save" | "remove";

export interface SavedMutationState {
  status: "idle" | "success" | "error";
  message: string | null;
  saved: boolean | null;
}

export const initialSavedMutationState: SavedMutationState = {
  status: "idle",
  message: null,
  saved: null,
};

export interface SavedOpportunityEntry {
  savedId: string;
  opportunityId: string;
  savedAt: string;
  opportunity: Opportunity | null;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isSavedOpportunityId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function parseSavedMutation(formData: FormData): {
  opportunityId: string;
  intent: SavedMutationIntent;
} | null {
  const opportunityId = formData.get("opportunityId");
  const intent = formData.get("intent");
  if (!isSavedOpportunityId(opportunityId)) return null;
  if (intent !== "save" && intent !== "remove") return null;
  return { opportunityId, intent };
}

export function canSaveOpportunity(status: OpportunityStatus | null): boolean {
  return status === "published";
}

export function ownsSavedRelationship(
  authenticatedUserId: string | null,
  rowUserId: string
): boolean {
  return authenticatedUserId !== null && authenticatedUserId === rowUserId;
}

export function formatSavedDate(value: string): string | null {
  if (!Number.isFinite(Date.parse(value))) return null;
  return `Saved ${new Intl.DateTimeFormat("en-TZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Dar_es_Salaam",
  }).format(new Date(value))}`;
}
