import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  DEFAULT_EXPECTED_INTERVAL_HOURS,
  DEFAULT_SCHEDULE_MINUTE,
  MIN_BASELINE_OBSERVATIONS,
  TWO_HOUR_TARGET_INTERVAL,
  assessSchedule,
  isComparableHealthObservation,
  isScheduledObservation,
  successfulExternalScheduleHistory,
  successfulScheduledHistory,
  type HealthAnomaly,
} from "./health";
import { loadHealthHistory } from "./health-artifact";

function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function scheduleMinute(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 59
    ? parsed
    : DEFAULT_SCHEDULE_MINUTE;
}

const evaluatedAt = process.env.DISCOVERY_HEALTH_EVALUATED_AT ?? new Date().toISOString();
const expectedIntervalHours = positiveNumber(
  process.env.DISCOVERY_EXPECTED_INTERVAL_HOURS,
  DEFAULT_EXPECTED_INTERVAL_HOURS
);
const targetIntervalHours = positiveNumber(
  process.env.DISCOVERY_TARGET_INTERVAL_HOURS,
  TWO_HOUR_TARGET_INTERVAL
);
const configuredScheduleMinute = scheduleMinute(process.env.DISCOVERY_SCHEDULE_MINUTE);
const externalSchedulerExpected = process.env.DISCOVERY_EXTERNAL_SCHEDULER_ENABLED === "true";
const history = loadHealthHistory(process.env.DISCOVERY_HEALTH_HISTORY_PATH);
const schedule = assessSchedule(
  history.observations,
  evaluatedAt,
  expectedIntervalHours,
  undefined,
  configuredScheduleMinute
);
const successfulExternalObservations = successfulExternalScheduleHistory(history.observations);
const externalRepeatabilityProven = !externalSchedulerExpected
  || successfulExternalObservations.length >= 3;
const anomaly: HealthAnomaly | null = schedule.state === "missed"
  ? { severity: "critical", code: "scheduled_run_missed", scope: "schedule", message: schedule.reason, observed: schedule.observedGapHours ?? undefined }
  : !externalRepeatabilityProven
    ? { severity: "critical", code: "external_schedule_not_proven", scope: "schedule", message: "External scheduling remains unproven until three distinct nominal slots succeed.", observed: successfulExternalObservations.length, expected: "3 successful external scheduled observations" }
  : schedule.state === "unknown"
    ? { severity: "informational", code: "schedule_history_insufficient", scope: "schedule", message: schedule.reason }
    : null;
const scheduledObservations = history.observations.filter(
  (observation) => isComparableHealthObservation(observation) && isScheduledObservation(observation)
);
const successfulScheduledObservations = successfulScheduledHistory(scheduledObservations);
const nativeScheduledObservations = scheduledObservations.filter(
  (observation) => observation.identity.triggerKind === "scheduled"
);
const externalScheduledObservations = scheduledObservations.filter(
  (observation) => observation.identity.triggerKind === "external_schedule"
);
const latestScheduled = scheduledObservations
  .sort((a, b) => Date.parse(a.identity.startedAt) - Date.parse(b.identity.startedAt))
  .at(-1);
const report = {
  schemaVersion: 1 as const,
  identity: {
    commitSha: process.env.GITHUB_SHA ?? null,
    workflowRunId: process.env.GITHUB_RUN_ID ?? null,
    runAttempt: positiveNumber(process.env.GITHUB_RUN_ATTEMPT, 1),
    evaluatedAt,
  },
  schedule,
  targetIntervalHours,
  configuredForTarget: expectedIntervalHours <= targetIntervalHours,
  externalSchedulerExpected,
  historyDepth: history.observations.length,
  scheduledHistoryDepth: scheduledObservations.length,
  successfulScheduledHistoryDepth: successfulScheduledObservations.length,
  nativeScheduledHistoryDepth: nativeScheduledObservations.length,
  externalScheduledHistoryDepth: externalScheduledObservations.length,
  successfulExternalScheduledHistoryDepth: successfulExternalObservations.length,
  baseline: {
    basis: "successful_scheduled_runs" as const,
    state: successfulScheduledObservations.length >= MIN_BASELINE_OBSERVATIONS
      ? "established" as const
      : "insufficient_history" as const,
    observations: successfulScheduledObservations.length,
    requiredObservations: MIN_BASELINE_OBSERVATIONS,
  },
  latestScheduledRun: latestScheduled
    ? {
        commitSha: latestScheduled.identity.commitSha,
        workflowRunId: latestScheduled.identity.workflowRunId,
        triggerKind: latestScheduled.identity.triggerKind,
        nominalSlot: latestScheduled.identity.nominalSlot,
        startedAt: latestScheduled.identity.startedAt,
        executionState: latestScheduled.executionState,
      }
    : null,
  anomaly,
  twoHourReadiness: expectedIntervalHours <= targetIntervalHours
    && successfulScheduledObservations.length >= 3
    && schedule.state === "on_time"
    && externalRepeatabilityProven
    ? "PROVEN" as const
    : expectedIntervalHours <= targetIntervalHours
      && successfulScheduledObservations.length > 0
      && schedule.state !== "missed"
      && externalRepeatabilityProven
      ? "PARTIALLY_PROVEN" as const
    : "NOT_YET_PROVEN" as const,
  reportContainsSecrets: false as const,
};

const reportPath = process.env.DISCOVERY_SCHEDULE_REPORT_PATH;
if (reportPath) {
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
}
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    [
      "## Discovery schedule monitor",
      "",
      `- State: **${schedule.state}**`,
      `- Reason: ${schedule.reason}`,
      `- Nominal slot / dispatch latency: ${schedule.nominalSlot ?? "unknown"} / ${schedule.dispatchLatencyMinutes === null ? "unknown" : `${schedule.dispatchLatencyMinutes} minutes`}`,
      `- Retained scheduled observations: ${scheduledObservations.length}`,
      `- Native / external scheduled observations: ${nativeScheduledObservations.length} / ${externalScheduledObservations.length}`,
      `- Successful external nominal slots: ${successfulExternalObservations.length}/3`,
      `- Baseline: **${report.baseline.state}** (${report.baseline.observations}/${report.baseline.requiredObservations})`,
      `- Two-hour readiness: **${report.twoHourReadiness}**`,
      "",
    ].join("\n"),
    "utf8"
  );
}
console.log(`DISCOVERY_SCHEDULE_REPORT_JSON=${JSON.stringify(report)}`);
if (schedule.state === "missed" || !externalRepeatabilityProven) process.exitCode = 1;
