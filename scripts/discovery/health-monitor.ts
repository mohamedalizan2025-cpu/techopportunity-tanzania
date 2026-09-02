import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  DEFAULT_EXPECTED_INTERVAL_HOURS,
  SIX_HOUR_TARGET_INTERVAL,
  assessSchedule,
  type HealthAnomaly,
} from "./health";
import { loadHealthHistory } from "./health-artifact";

function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const evaluatedAt = process.env.DISCOVERY_HEALTH_EVALUATED_AT ?? new Date().toISOString();
const expectedIntervalHours = positiveNumber(
  process.env.DISCOVERY_EXPECTED_INTERVAL_HOURS,
  DEFAULT_EXPECTED_INTERVAL_HOURS
);
const targetIntervalHours = positiveNumber(
  process.env.DISCOVERY_TARGET_INTERVAL_HOURS,
  SIX_HOUR_TARGET_INTERVAL
);
const history = loadHealthHistory(process.env.DISCOVERY_HEALTH_HISTORY_PATH);
const schedule = assessSchedule(history.observations, evaluatedAt, expectedIntervalHours);
const anomaly: HealthAnomaly | null = schedule.state === "missed"
  ? { severity: "critical", code: "scheduled_run_missed", scope: "schedule", message: schedule.reason, observed: schedule.observedGapHours ?? undefined }
  : schedule.state === "unknown"
    ? { severity: "informational", code: "schedule_history_insufficient", scope: "schedule", message: schedule.reason }
    : null;
const scheduledObservations = history.observations.filter(
  (observation) => observation.identity.event === "schedule"
);
const latestScheduled = scheduledObservations
  .sort((a, b) => Date.parse(a.identity.startedAt) - Date.parse(b.identity.startedAt))
  .at(-1);
const report = {
  schemaVersion: 1 as const,
  identity: {
    commitSha: process.env.GITHUB_SHA ?? null,
    workflowRunId: process.env.GITHUB_RUN_ID ?? null,
    evaluatedAt,
  },
  schedule,
  targetIntervalHours,
  configuredForTarget: expectedIntervalHours <= targetIntervalHours,
  historyDepth: history.observations.length,
  scheduledHistoryDepth: scheduledObservations.length,
  latestScheduledRun: latestScheduled
    ? {
        commitSha: latestScheduled.identity.commitSha,
        workflowRunId: latestScheduled.identity.workflowRunId,
        startedAt: latestScheduled.identity.startedAt,
        executionState: latestScheduled.executionState,
      }
    : null,
  anomaly,
  sixHourReadiness: "NOT_YET_PROVEN" as const,
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
      `- Retained scheduled observations: ${scheduledObservations.length}`,
      `- Six-hour readiness: **NOT_YET_PROVEN**`,
      "",
    ].join("\n"),
    "utf8"
  );
}
console.log(`DISCOVERY_SCHEDULE_REPORT_JSON=${JSON.stringify(report)}`);
if (schedule.state === "missed") process.exitCode = 1;
