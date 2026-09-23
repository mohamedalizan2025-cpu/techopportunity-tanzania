import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadHealthHistory } from "./health-artifact";
import { resolveDiscoveryTrigger } from "./trigger-identity";

const historyPath = process.env.DISCOVERY_HEALTH_HISTORY_PATH;
const configuredScheduleMinute = Number(process.env.DISCOVERY_SCHEDULE_MINUTE);
const configuredIntervalHours = Number(process.env.DISCOVERY_EXPECTED_INTERVAL_HOURS);
const resolution = resolveDiscoveryTrigger({
  event: process.env.GITHUB_EVENT_NAME ?? "local",
  requestedKind: process.env.DISCOVERY_REQUESTED_TRIGGER_KIND,
  actor: process.env.GITHUB_ACTOR,
  allowedExternalActor: process.env.DISCOVERY_EXTERNAL_SCHEDULER_ACTOR,
  externalSchedulerEnabled: process.env.DISCOVERY_EXTERNAL_SCHEDULER_ENABLED === "true",
  nominalSlot: process.env.DISCOVERY_EXTERNAL_NOMINAL_SLOT,
  evaluatedAt: process.env.DISCOVERY_TRIGGER_EVALUATED_AT,
  scheduleMinute: Number.isInteger(configuredScheduleMinute)
    ? configuredScheduleMinute
    : undefined,
  intervalHours: Number.isInteger(configuredIntervalHours) && configuredIntervalHours > 0
    ? configuredIntervalHours
    : undefined,
  history: loadHealthHistory(historyPath),
});

const report = {
  schemaVersion: 1 as const,
  evaluatedAt: process.env.DISCOVERY_TRIGGER_EVALUATED_AT ?? new Date().toISOString(),
  event: process.env.GITHUB_EVENT_NAME ?? "local",
  actor: process.env.GITHUB_ACTOR ?? null,
  accepted: resolution.accepted,
  triggerKind: resolution.triggerKind,
  nominalSlot: resolution.nominalSlot,
  reason: resolution.reason,
  containsSecrets: false as const,
};
const reportPath = process.env.DISCOVERY_TRIGGER_REPORT_PATH;
if (reportPath) {
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
}
if (resolution.accepted && process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `trigger_kind=${resolution.triggerKind}\nnominal_slot=${resolution.nominalSlot ?? ""}\n`,
    "utf8"
  );
}
console.log(`DISCOVERY_TRIGGER_REPORT_JSON=${JSON.stringify(report)}`);
if (!resolution.accepted) process.exitCode = 1;
