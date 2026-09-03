import {
  classifyDeadlineTransition,
  evaluateDeadline,
  type DeadlineInput,
  type DeadlinePrecision,
  type DeadlineTransition,
} from "./deadline-intelligence";

export const ALERT_EVENT_RETENTION_DAYS = 180;
export const DEADLINE_CHANGE_LOOKBACK_DAYS = 30;

export type DeadlineAlertEventType =
  | "deadline_approaching"
  | "deadline_became_known"
  | "deadline_extended"
  | "deadline_shortened"
  | "deadline_changed"
  | "deadline_became_rolling";

export interface AlertEligibilityInput {
  authenticated: boolean;
  saved: boolean;
  alertsEnabled: boolean;
  publicationStatus: string;
  deadline: DeadlineInput;
}

export type AlertIneligibilityReason =
  | "anonymous"
  | "not_saved"
  | "disabled"
  | "not_published"
  | "unknown"
  | "invalid"
  | "rolling"
  | "closed"
  | "not_due";

export type AlertEligibility =
  | { eligible: true }
  | { eligible: false; reason: AlertIneligibilityReason };

/** Eligibility for the initial 14-day approaching-deadline policy. */
export function evaluateAlertEligibility(
  input: AlertEligibilityInput,
  now: Date = new Date()
): AlertEligibility {
  if (!input.authenticated) return { eligible: false, reason: "anonymous" };
  if (!input.saved) return { eligible: false, reason: "not_saved" };
  if (!input.alertsEnabled) return { eligible: false, reason: "disabled" };
  if (input.publicationStatus !== "published") {
    return { eligible: false, reason: "not_published" };
  }
  const status = evaluateDeadline(input.deadline, now).status;
  if (status === "unknown") return { eligible: false, reason: "unknown" };
  if (status === "invalid") return { eligible: false, reason: "invalid" };
  if (status === "rolling") return { eligible: false, reason: "rolling" };
  if (status === "closed") return { eligible: false, reason: "closed" };
  if (status !== "closing_soon") return { eligible: false, reason: "not_due" };
  return { eligible: true };
}

export interface AlertableSavedOpportunity {
  userId: string;
  opportunityId: string;
  publicationStatus: string;
  deadline: string | null;
  deadlinePrecision: DeadlinePrecision;
  deadlineTimezone: string | null;
}

export interface DeadlineChangeRecord {
  id: string;
  opportunityId: string;
  changedAt: string;
  previousDeadline: string | null;
  previousPrecision: DeadlinePrecision;
  previousTimezone: string | null;
  nextDeadline: string | null;
  nextPrecision: DeadlinePrecision;
  nextTimezone: string | null;
}

export interface PlannedDeadlineAlert {
  user_id: string;
  opportunity_id: string;
  deadline_change_id: string | null;
  event_type: DeadlineAlertEventType;
  event_fingerprint: string;
  previous_deadline: string | null;
  deadline: string | null;
  deadline_precision: DeadlinePrecision;
  state: "generated";
}

function currentInput(saved: AlertableSavedOpportunity): DeadlineInput {
  return {
    deadline: saved.deadline,
    precision: saved.deadlinePrecision,
    timezone: saved.deadlineTimezone,
  };
}

function changeNextInput(change: DeadlineChangeRecord): DeadlineInput {
  return {
    deadline: change.nextDeadline,
    precision: change.nextPrecision,
    timezone: change.nextTimezone,
  };
}

function eventTypeForTransition(
  transition: DeadlineTransition
): DeadlineAlertEventType | null {
  if (transition === "became_known") return "deadline_became_known";
  if (transition === "extended") return "deadline_extended";
  if (transition === "shortened") return "deadline_shortened";
  if (transition === "became_rolling") return "deadline_became_rolling";
  if (transition === "changed") return "deadline_changed";
  return null;
}

function exactCurrentMatch(
  saved: AlertableSavedOpportunity,
  change: DeadlineChangeRecord
): boolean {
  return (
    saved.deadline === change.nextDeadline &&
    saved.deadlinePrecision === change.nextPrecision &&
    saved.deadlineTimezone === change.nextTimezone
  );
}

/**
 * Produces deterministic database rows. Repeated saves/runs collapse in-memory;
 * the migration's unique constraint is the final concurrency-safe guarantee.
 * Only the newest change that still matches current truth is eligible, so an
 * older deadline can never produce a stale alert after a later correction.
 */
export function planDeadlineAlerts(
  savedOpportunities: AlertableSavedOpportunity[],
  changes: DeadlineChangeRecord[],
  now: Date = new Date()
): PlannedDeadlineAlert[] {
  const latestChange = new Map<string, DeadlineChangeRecord>();
  for (const change of changes) {
    const current = latestChange.get(change.opportunityId);
    if (
      !current ||
      change.changedAt > current.changedAt ||
      (change.changedAt === current.changedAt && change.id > current.id)
    ) {
      latestChange.set(change.opportunityId, change);
    }
  }

  const planned = new Map<string, PlannedDeadlineAlert>();
  for (const saved of savedOpportunities) {
    const deadline = currentInput(saved);
    const eligibility = evaluateAlertEligibility(
      {
        authenticated: true,
        saved: true,
        alertsEnabled: true,
        publicationStatus: saved.publicationStatus,
        deadline,
      },
      now
    );
    if (eligibility.eligible) {
      const effectiveAt = evaluateDeadline(deadline, now).effectiveAt as string;
      const row: PlannedDeadlineAlert = {
        user_id: saved.userId,
        opportunity_id: saved.opportunityId,
        deadline_change_id: null,
        event_type: "deadline_approaching",
        event_fingerprint: effectiveAt,
        previous_deadline: null,
        deadline: saved.deadline,
        deadline_precision: saved.deadlinePrecision,
        state: "generated",
      };
      planned.set(
        [row.user_id, row.opportunity_id, row.event_type, row.event_fingerprint].join("|"),
        row
      );
    }

    const change = latestChange.get(saved.opportunityId);
    if (!change || !exactCurrentMatch(saved, change)) continue;
    if (saved.publicationStatus !== "published") continue;
    const transition = classifyDeadlineTransition(
      {
        deadline: change.previousDeadline,
        precision: change.previousPrecision,
        timezone: change.previousTimezone,
      },
      changeNextInput(change)
    );
    const eventType = eventTypeForTransition(transition);
    if (!eventType) continue;
    const currentStatus = evaluateDeadline(deadline, now).status;
    if (currentStatus === "invalid" || currentStatus === "closed") continue;

    const row: PlannedDeadlineAlert = {
      user_id: saved.userId,
      opportunity_id: saved.opportunityId,
      deadline_change_id: change.id,
      event_type: eventType,
      event_fingerprint: change.id,
      previous_deadline: change.previousDeadline,
      deadline: change.nextDeadline,
      deadline_precision: change.nextPrecision,
      state: "generated",
    };
    planned.set(
      [row.user_id, row.opportunity_id, row.event_type, row.event_fingerprint].join("|"),
      row
    );
  }
  return [...planned.values()];
}
