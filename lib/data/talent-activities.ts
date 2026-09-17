import type { AuthenticatedUserContext } from "./supabase-auth";
import {
  OPPORTUNITY_SELECT,
  mapOpportunityRow,
  type OpportunityRow,
} from "./opportunities";
import type { OpportunityStatus } from "../types";
import type {
  ActivityStatus,
  TalentActivityEntry,
} from "../talent-activity-state";
import { isTestOrPlaceholderOpportunity } from "../opportunity-trust";

/**
 * Owner-only reads for unified talent activity (migration 0019).
 * Mirrors the saved-opportunities layer: every query is scoped to the
 * caller's own user_id, only published opportunities surface, and a missing
 * schema degrades gracefully to `available: false` (the Activity UI then
 * shows an honest "temporarily unavailable" state instead of inventing
 * tracking data).
 */

interface TalentActivityRow {
  id: string;
  opportunity_id: string;
  status: string;
  updated_at: string;
  opportunity:
    | (OpportunityRow & { status: OpportunityStatus })
    | Array<OpportunityRow & { status: OpportunityStatus }>
    | null;
}

const TALENT_ACTIVITY_SELECT = `
  id,
  opportunity_id,
  status,
  updated_at,
  opportunity:opportunities (
    status,
    ${OPPORTUNITY_SELECT}
  )
`;

export interface TalentActivityListResult {
  available: boolean;
  entries: TalentActivityEntry[];
}

function oneOpportunity(
  value: TalentActivityRow["opportunity"]
): (OpportunityRow & { status: OpportunityStatus }) | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function asActivityStatus(value: string): ActivityStatus | null {
  return value === "interested" || value === "applying" || value === "applied"
    ? value
    : null;
}

/** Defence in depth: even a staff session never maps non-published content. */
export function mapTalentActivityRows(
  rows: TalentActivityRow[]
): TalentActivityEntry[] {
  const entries: TalentActivityEntry[] = [];
  for (const row of rows) {
    const status = asActivityStatus(row.status);
    if (!status) continue;
    const related = oneOpportunity(row.opportunity);
    entries.push({
      activityId: row.id,
      opportunityId: row.opportunity_id,
      activityStatus: status,
      updatedAt: row.updated_at,
      opportunity:
        related?.status === "published"
          ? (() => {
              const opportunity = mapOpportunityRow(related, "published");
              return isTestOrPlaceholderOpportunity(opportunity)
                ? null
                : opportunity;
            })()
          : null,
    });
  }
  return entries;
}

export function missingActivitySchema(error: {
  code?: string;
  message?: string;
}): boolean {
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("talent_opportunity_activity") === true
  );
}

/** One authenticated query supplies detail-page tracking state. */
export async function listTalentActivityStatuses(
  user: AuthenticatedUserContext
): Promise<Map<string, ActivityStatus>> {
  const { data, error } = await user.client
    .from("talent_opportunity_activity")
    .select("opportunity_id, status")
    .eq("user_id", user.userId)
    .limit(500);
  if (error) {
    if (!missingActivitySchema(error)) {
      console.error("[lib/data] Failed to list talent activity:", error.message);
    }
    return new Map();
  }
  const statuses = new Map<string, ActivityStatus>();
  for (const row of (data ?? []) as unknown as Array<{
    opportunity_id: string;
    status: string;
  }>) {
    const status = asActivityStatus(row.status);
    if (status) statuses.set(row.opportunity_id, status);
  }
  return statuses;
}

export async function listTalentActivities(
  user: AuthenticatedUserContext
): Promise<TalentActivityListResult> {
  const { data, error } = await user.client
    .from("talent_opportunity_activity")
    .select(TALENT_ACTIVITY_SELECT)
    .eq("user_id", user.userId)
    .eq("opportunity.status", "published")
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) {
    if (!missingActivitySchema(error)) {
      console.error("[lib/data] Failed to list talent activities:", error.message);
    }
    return { available: false, entries: [] };
  }

  return {
    available: true,
    entries: mapTalentActivityRows(
      (data ?? []) as unknown as TalentActivityRow[]
    ),
  };
}
