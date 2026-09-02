import { runDiscovery } from "./runner";
import { buildHealthReport, type RunIdentity } from "./health";
import { loadHealthHistory, retainHealthReport } from "./health-artifact";

function identity(startedAt: string, finishedAt: string): RunIdentity {
  return {
    commitSha: process.env.GITHUB_SHA ?? null,
    workflowRunId: process.env.GITHUB_RUN_ID ?? null,
    workflowName: process.env.GITHUB_WORKFLOW ?? null,
    event: process.env.GITHUB_EVENT_NAME ?? "local",
    startedAt,
    finishedAt,
  };
}

function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function reportPaths() {
  return {
    reportPath: process.env.DISCOVERY_HEALTH_REPORT_PATH,
    historyPath: process.env.DISCOVERY_HEALTH_HISTORY_PATH,
    stepSummaryPath: process.env.GITHUB_STEP_SUMMARY,
  };
}

async function main() {
  const processStartedAt = new Date().toISOString();
  const history = loadHealthHistory(process.env.DISCOVERY_HEALTH_HISTORY_PATH);
  try {
    const summary = await runDiscovery();
    console.log(JSON.stringify(summary, null, 2));
    const finishedAt = summary.finishedAt ?? new Date().toISOString();
    const health = buildHealthReport({
      summary,
      history,
      identity: identity(summary.startedAt, finishedAt),
      expectedIntervalHours: positiveNumber(process.env.DISCOVERY_EXPECTED_INTERVAL_HOURS, 24),
      targetIntervalHours: positiveNumber(process.env.DISCOVERY_TARGET_INTERVAL_HOURS, 6),
      verificationPassed: process.env.DISCOVERY_VERIFICATION_PASSED === "true",
    });
    retainHealthReport(health, history, reportPaths());
    console.log(`DISCOVERY_HEALTH_REPORT_JSON=${JSON.stringify(health)}`);
    if (health.execution.state === "failure") process.exitCode = 1;
    // Whole-run health gate: individual source failures stay isolated
    // (logged + counted, run exits 0), but when EVERY checked source
    // errored the scheduled run must NOT go green silently — that is a
    // worker-level failure (network, registry, credentials, DB), not a
    // source problem. Partial runs with at least one success keep the
    // designed isolation behavior.
    if (summary.sourcesChecked > 0 && summary.sourcesSucceeded === 0 && summary.errors > 0) {
      console.error(
        `Discovery run failed: all ${summary.sourcesChecked} sources errored (see perSource). Exiting non-zero so the workflow surfaces the outage.`
      );
      process.exitCode = 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown discovery error";
    const health = buildHealthReport({
      summary: null,
      history,
      identity: identity(processStartedAt, new Date().toISOString()),
      expectedIntervalHours: positiveNumber(process.env.DISCOVERY_EXPECTED_INTERVAL_HOURS, 24),
      targetIntervalHours: positiveNumber(process.env.DISCOVERY_TARGET_INTERVAL_HOURS, 6),
      verificationPassed: process.env.DISCOVERY_VERIFICATION_PASSED === "true",
    });
    retainHealthReport(health, history, reportPaths());
    console.log(`DISCOVERY_HEALTH_REPORT_JSON=${JSON.stringify(health)}`);
    console.error(message);
    process.exitCode = 1;
  }
}

main();
