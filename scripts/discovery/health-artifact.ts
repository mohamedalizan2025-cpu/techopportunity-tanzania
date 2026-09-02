import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  HEALTH_HISTORY_LIMIT,
  appendObservation,
  type DiscoveryHealthReport,
  type HealthHistory,
} from "./health";

export interface HealthArtifactPaths {
  reportPath?: string;
  historyPath?: string;
  stepSummaryPath?: string;
}

function validHistory(value: unknown): value is HealthHistory {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<HealthHistory>;
  return candidate.schemaVersion === 1 && Array.isArray(candidate.observations) && candidate.observations.every((observation) => {
    if (!observation || typeof observation !== "object") return false;
    const item = observation as Partial<HealthHistory["observations"][number]>;
    return item.schemaVersion === 1
      && (item.executionState === "success" || item.executionState === "failure")
      && Boolean(item.identity && typeof item.identity.startedAt === "string" && typeof item.identity.event === "string")
      && Boolean(item.metrics && typeof item.metrics.candidatesFound === "number")
      && Array.isArray(item.sources);
  });
}

export function loadHealthHistory(historyPath: string | undefined): HealthHistory {
  if (!historyPath || !existsSync(historyPath)) return { schemaVersion: 1, observations: [] };
  try {
    const parsed: unknown = JSON.parse(readFileSync(historyPath, "utf8"));
    if (!validHistory(parsed)) return { schemaVersion: 1, observations: [] };
    return { schemaVersion: 1, observations: parsed.observations.slice(-HEALTH_HISTORY_LIMIT) };
  } catch {
    return { schemaVersion: 1, observations: [] };
  }
}

function writeJsonAtomically(file: string, value: unknown) {
  mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  renameSync(temporary, file);
}

function healthMarkdown(report: DiscoveryHealthReport): string {
  const counts = report.anomalies.reduce(
    (total, anomaly) => ({ ...total, [anomaly.severity]: total[anomaly.severity] + 1 }),
    { critical: 0, warning: 0, informational: 0 }
  );
  return [
    "## Discovery health",
    "",
    `- Commit: \`${report.identity.commitSha ?? "unavailable"}\``,
    `- Workflow run: \`${report.identity.workflowRunId ?? "unavailable"}\``,
    `- Execution: **${report.execution.state}** (${report.execution.durationMs === null ? "duration unavailable" : `${report.execution.durationMs} ms`})`,
    `- Schedule: **${report.schedule.state}** (${report.schedule.reason})`,
    `- Sources: ${report.sourceHealth.succeeded}/${report.sourceHealth.attempted} succeeded`,
    `- Candidates / qualified / inserted pending: ${report.pipelineHealth.metrics.candidatesFound} / ${report.pipelineHealth.metrics.qualifiedCandidates} / ${report.pipelineHealth.metrics.insertedPending}`,
    `- Baseline: **${report.baseline.state}** (${report.baseline.historyDepth}/${report.baseline.requiredHistory} successful prior observations)`,
    `- Anomalies: ${counts.critical} critical, ${counts.warning} warning, ${counts.informational} informational`,
    `- Six-hour readiness: **${report.readiness.state}**`,
    "",
  ].join("\n");
}

export function retainHealthReport(
  report: DiscoveryHealthReport,
  history: HealthHistory,
  paths: HealthArtifactPaths
): HealthHistory {
  const updatedHistory = appendObservation(history, report.observation);
  if (paths.reportPath) writeJsonAtomically(paths.reportPath, report);
  if (paths.historyPath) writeJsonAtomically(paths.historyPath, updatedHistory);
  if (paths.stepSummaryPath) appendFileSync(paths.stepSummaryPath, healthMarkdown(report), "utf8");
  return updatedHistory;
}
