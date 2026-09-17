import type { Opportunity, OpportunityStatus } from "./types";

/**
 * Unified talent activity (talent side, docs/PLATFORM_ARCHITECTURE.md).
 *
 * ONE canonical application-level contract over two proven stores:
 *
 *   saved      → `saved_opportunities` (private bookmark, untouched)
 *   interested → `talent_opportunity_activity` (migration 0019)
 *   applying   → `talent_opportunity_activity` (migration 0019)
 *   applied    → `talent_opportunity_activity` (migration 0019)
 *
 * Saved is a bookmark; interested/applying/applied track progress. A user
 * may hold both a save and a funnel row for the same opportunity — they
 * answer different questions ("revisit later?" vs "where am I?"). Explore,
 * For You, My Activity, and staff campaign aggregates all interpret these
 * four states through the `UnifiedActivity` shape below, so the product
 * never disagrees with itself about what a state means.
 */

export const UNIFIED_ACTIVITY_STATES = [
  "saved",
  "interested",
  "applying",
  "applied",
] as const;
export type UnifiedActivityState = (typeof UNIFIED_ACTIVITY_STATES)[number];

export const UNIFIED_ACTIVITY_LABELS: Record<UnifiedActivityState, string> = {
  saved: "Saved",
  interested: "Interested",
  applying: "Applying",
  applied: "Applied",
};

export function isUnifiedActivityState(
  value: unknown
): value is UnifiedActivityState {
  return (
    typeof value === "string" &&
    (UNIFIED_ACTIVITY_STATES as readonly string[]).includes(value)
  );
}

/**
 * One opportunity's activity for one talent user. `saved` and `funnel`
 * are independent signals from independent stores; both may be set.
 */
export interface UnifiedActivity {
  opportunityId: string;
  saved: boolean;
  funnel: ActivityStatus | null;
}

/** Merge the two stores into one coherent per-opportunity view. */
export function mergeUnifiedActivity(
  opportunityId: string,
  saved: boolean,
  funnel: ActivityStatus | null
): UnifiedActivity {
  return { opportunityId, saved, funnel };
}

/** True when the talent has any activity signal for the opportunity. */
export function hasAnyActivity(activity: UnifiedActivity): boolean {
  return activity.saved || activity.funnel !== null;
}

export const ACTIVITY_STATUSES = ["interested", "applying", "applied"] as const;
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  interested: "Interested",
  applying: "Applying",
  applied: "Applied",
};

export const ACTIVITY_STATUS_DESCRIPTIONS: Record<ActivityStatus, string> = {
  interested: "Worth a closer look.",
  applying: "In progress — preparing or submitted via the source.",
  applied: "Done on the source — waiting to hear back.",
};

export type ActivityMutationIntent = ActivityStatus | "remove";

export interface ActivityMutationState {
  status: "idle" | "success" | "error";
  message: string | null;
  activity: ActivityStatus | null;
}

export const initialActivityMutationState: ActivityMutationState = {
  status: "idle",
  message: null,
  activity: null,
};

export interface TalentActivityEntry {
  activityId: string;
  opportunityId: string;
  activityStatus: ActivityStatus;
  updatedAt: string;
  opportunity: Opportunity | null;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isActivityOpportunityId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function parseActivityStatus(value: unknown): ActivityStatus | null {
  return typeof value === "string" &&
    (ACTIVITY_STATUSES as readonly string[]).includes(value)
    ? (value as ActivityStatus)
    : null;
}

export function parseActivityMutation(formData: FormData): {
  opportunityId: string;
  intent: ActivityMutationIntent;
} | null {
  const opportunityId = formData.get("opportunityId");
  const intent = formData.get("intent");
  if (!isActivityOpportunityId(opportunityId)) return null;
  if (intent === "remove") return { opportunityId, intent: "remove" };
  const status = parseActivityStatus(intent);
  if (!status) return null;
  return { opportunityId, intent: status };
}

/** Only published opportunities can be tracked — same rule as saving. */
export function canTrackOpportunity(status: OpportunityStatus | null): boolean {
  return status === "published";
}

export function ownsActivityRecord(
  authenticatedUserId: string | null,
  rowUserId: string
): boolean {
  return authenticatedUserId !== null && authenticatedUserId === rowUserId;
}

export function formatActivityDate(value: string): string | null {
  if (!Number.isFinite(Date.parse(value))) return null;
  return `Updated ${new Intl.DateTimeFormat("en-TZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Dar_es_Salaam",
  }).format(new Date(value))}`;
}
