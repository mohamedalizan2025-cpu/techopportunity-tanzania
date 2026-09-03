import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ALERT_EVENT_RETENTION_DAYS,
  DEADLINE_CHANGE_LOOKBACK_DAYS,
  planDeadlineAlerts,
  type AlertableSavedOpportunity,
  type DeadlineChangeRecord,
} from "../../lib/deadline-alerts";
import type { DeadlinePrecision } from "../../lib/deadline-intelligence";

interface PreferenceRow {
  user_id: string;
}

interface SavedRow {
  user_id: string;
  opportunity_id: string;
  opportunity:
    | {
        status: string;
        deadline: string | null;
        deadline_precision: DeadlinePrecision;
        deadline_timezone: string | null;
      }
    | Array<{
        status: string;
        deadline: string | null;
        deadline_precision: DeadlinePrecision;
        deadline_timezone: string | null;
      }>
    | null;
}

interface ChangeRow {
  id: string;
  opportunity_id: string;
  changed_at: string;
  previous_deadline: string | null;
  previous_precision: DeadlinePrecision;
  previous_timezone: string | null;
  deadline: string | null;
  deadline_precision: DeadlinePrecision;
  deadline_timezone: string | null;
}

export interface DeadlineAlertRunReport {
  schemaVersion: 1;
  status: "completed" | "disabled" | "failed";
  startedAt: string;
  completedAt: string;
  enabledUsers: number;
  evaluatedSaves: number;
  recentChanges: number;
  candidates: number;
  created: number;
  duplicatesSuppressed: number;
  pruned: number;
  deliveryAttempted: false;
}

function oneOpportunity(row: SavedRow): Exclude<SavedRow["opportunity"], Array<unknown> | null> | null {
  return Array.isArray(row.opportunity) ? (row.opportunity[0] ?? null) : row.opportunity;
}

function mapSavedRows(rows: SavedRow[]): AlertableSavedOpportunity[] {
  return rows.flatMap((row) => {
    const opportunity = oneOpportunity(row);
    if (!opportunity) return [];
    return [{
      userId: row.user_id,
      opportunityId: row.opportunity_id,
      publicationStatus: opportunity.status,
      deadline: opportunity.deadline,
      deadlinePrecision: opportunity.deadline_precision,
      deadlineTimezone: opportunity.deadline_timezone,
    }];
  });
}

function mapChangeRows(rows: ChangeRow[]): DeadlineChangeRecord[] {
  return rows.map((row) => ({
    id: row.id,
    opportunityId: row.opportunity_id,
    changedAt: row.changed_at,
    previousDeadline: row.previous_deadline,
    previousPrecision: row.previous_precision,
    previousTimezone: row.previous_timezone,
    nextDeadline: row.deadline,
    nextPrecision: row.deadline_precision,
    nextTimezone: row.deadline_timezone,
  }));
}

function failure(message: string): never {
  throw new Error(`[deadline-alerts] ${message}`);
}

/** Service-role-only evaluator. The caller owns credential loading and gating. */
export async function runDeadlineAlertEvaluation(
  client: SupabaseClient,
  now: Date = new Date()
): Promise<DeadlineAlertRunReport> {
  const startedAt = now.toISOString();
  const { data: preferenceData, error: preferenceError } = await client
    .from("user_alert_preferences")
    .select("user_id")
    .eq("deadline_alerts_enabled", true)
    .limit(10_000);
  if (preferenceError) failure(`preference query failed: ${preferenceError.message}`);
  const preferences = (preferenceData ?? []) as unknown as PreferenceRow[];

  let saves: AlertableSavedOpportunity[] = [];
  let changes: DeadlineChangeRecord[] = [];
  if (preferences.length > 0) {
    const userIds = preferences.map((row) => row.user_id);
    const lookback = new Date(
      now.getTime() - DEADLINE_CHANGE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();
    const savedResult = await client
      .from("saved_opportunities")
      .select("user_id,opportunity_id,opportunity:opportunities(status,deadline,deadline_precision,deadline_timezone)")
      .in("user_id", userIds)
      .eq("opportunity.status", "published")
      .limit(10_000);
    if (savedResult.error) failure(`saved-opportunity query failed: ${savedResult.error.message}`);
    saves = mapSavedRows((savedResult.data ?? []) as unknown as SavedRow[]);
    const opportunityIds = [...new Set(saves.map((saved) => saved.opportunityId))];
    if (opportunityIds.length > 0) {
      const changeResult = await client
        .from("opportunity_deadline_changes")
        .select("id,opportunity_id,changed_at,previous_deadline,previous_precision,previous_timezone,deadline,deadline_precision,deadline_timezone")
        .in("opportunity_id", opportunityIds)
        .gte("changed_at", lookback)
        .order("changed_at", { ascending: false })
        .limit(5_000);
      if (changeResult.error) failure(`deadline-change query failed: ${changeResult.error.message}`);
      changes = mapChangeRows((changeResult.data ?? []) as unknown as ChangeRow[]);
    }
  }

  const candidates = planDeadlineAlerts(saves, changes, now);
  let created = 0;
  if (candidates.length > 0) {
    const { data, error } = await client
      .from("deadline_alert_events")
      .upsert(candidates, {
        onConflict: "user_id,opportunity_id,event_type,event_fingerprint",
        ignoreDuplicates: true,
      })
      .select("id");
    if (error) failure(`event generation failed: ${error.message}`);
    created = (data ?? []).length;
  }

  const retentionBoundary = new Date(
    now.getTime() - ALERT_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  const { count: pruned, error: retentionError } = await client
    .from("deadline_alert_events")
    .delete({ count: "exact" })
    .lt("generated_at", retentionBoundary);
  if (retentionError) failure(`retention prune failed: ${retentionError.message}`);

  return {
    schemaVersion: 1,
    status: "completed",
    startedAt,
    completedAt: new Date().toISOString(),
    enabledUsers: preferences.length,
    evaluatedSaves: saves.length,
    recentChanges: changes.length,
    candidates: candidates.length,
    created,
    duplicatesSuppressed: candidates.length - created,
    pruned: pruned ?? 0,
    deliveryAttempted: false,
  };
}
