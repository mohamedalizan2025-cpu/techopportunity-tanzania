import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadHealthHistory, retainHealthReport } from "../scripts/discovery/health-artifact";
import {
  HEALTH_HISTORY_LIMIT,
  MIN_BASELINE_OBSERVATIONS,
  appendObservation,
  assessSchedule,
  buildHealthReport,
  classifyFreshness,
  triggerKindForEvent,
  type HealthHistory,
  type HealthObservation,
  type RunIdentity,
} from "../scripts/discovery/health";
import { reconcileDiscoverySummary } from "../scripts/discovery/summary";
import type { DiscoverySummary, SourceRunResult } from "../scripts/discovery/types";

let passed = 0;
function test(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
}

function source(overrides: Partial<SourceRunResult> = {}): SourceRunResult {
  return {
    sourceId: "source-a",
    name: "Source A",
    ok: true,
    candidatesFound: 20,
    noiseRejected: 5,
    structurallyValidCandidates: 15,
    evidencePresent: 15,
    deadlineEvidencePresent: 3,
    eligibilityEvidencePresent: 5,
    relevanceEvidencePresent: 12,
    applicationEvidencePresent: 2,
    relevanceRejected: 2,
    eligibilityRejected: 1,
    eligibilityUnknown: 5,
    detailFetches: 5,
    detailSucceeded: 5,
    detailFailures: 0,
    detailDeadlineFound: 3,
    detailEligibilityFound: 3,
    detailApplicationFound: 2,
    duplicatesSkipped: 2,
    deduplicatedCandidates: 10,
    validCandidates: 10,
    categorySkipped: 0,
    insertedPending: 2,
    sourceHealthUpdated: true,
    sourceHealthError: null,
    error: null,
    ...overrides,
  };
}

function summary(sources: SourceRunResult[], startedAt = "2026-09-01T00:00:00Z", finishedAt = "2026-09-01T00:01:00Z"): DiscoverySummary {
  return reconcileDiscoverySummary({
    startedAt,
    finishedAt,
    sourcesChecked: sources.length,
    sourcesAttempted: 0,
    sourcesSucceeded: 0,
    sourcesFailed: 0,
    candidatesFound: 0,
    noiseRejected: 0,
    structurallyValidCandidates: 0,
    evidencePresent: 0,
    deadlineEvidencePresent: 0,
    eligibilityEvidencePresent: 0,
    relevanceEvidencePresent: 0,
    applicationEvidencePresent: 0,
    deduplicatedCandidates: 0,
    validCandidates: 0,
    insertedPending: 0,
    duplicatesSkipped: 0,
    categorySkipped: 0,
    relevanceRejected: 0,
    eligibilityRejected: 0,
    eligibilityUnknown: 0,
    detailFetches: 0,
    detailSucceeded: 0,
    detailFailures: 0,
    detailDeadlineFound: 0,
    detailEligibilityFound: 0,
    detailApplicationFound: 0,
    sourceHealthFailures: 0,
    errors: 0,
    perSource: sources,
  });
}

function identity(index = 0, event = "push"): RunIdentity {
  const hour = String(index).padStart(2, "0");
  return {
    commitSha: `sha-${index}`,
    workflowRunId: `run-${index}`,
    workflowName: "Discovery sync",
    runAttempt: 1,
    event,
    triggerKind: triggerKindForEvent(event),
    startedAt: `2026-09-01T${hour}:00:00Z`,
    finishedAt: `2026-09-01T${hour}:01:00Z`,
  };
}

function observation(index: number, sourceOverrides: Partial<SourceRunResult> = {}, event = "schedule"): HealthObservation {
  return buildHealthReport({
    summary: summary([source(sourceOverrides)], identity(index, event).startedAt, identity(index, event).finishedAt),
    identity: identity(index, event),
    verificationPassed: true,
  }).observation;
}

const history = (observations: HealthObservation[]): HealthHistory => ({ schemaVersion: 1, observations });
const anomaly = (report: ReturnType<typeof buildHealthReport>, code: string) => report.anomalies.find((item) => item.code === code);

test("schedule is unknown without a retained scheduled run", () => {
  assert.equal(assessSchedule([], "2026-09-02T00:00:00Z").state, "unknown");
});

test("schedule is on-time inside the interval plus tolerance", () => {
  const result = assessSchedule([observation(0)], "2026-09-01T07:59:00Z", 6, "schedule");
  assert.equal(result.state, "on_time");
  assert.equal(result.toleranceHours, 2);
});

test("late completed execution is delayed before a second interval", () => {
  assert.equal(assessSchedule([observation(0)], "2026-09-01T09:00:00Z", 6, "schedule").state, "delayed");
});

test("absent execution beyond tolerance is missed", () => {
  assert.equal(assessSchedule([observation(0)], "2026-09-01T09:00:00Z", 6).state, "missed");
});

test("invalid schedule time remains unknown", () => {
  assert.equal(assessSchedule([observation(0)], "not-a-date").state, "unknown");
});

test("manual and push runs never satisfy scheduled evidence", () => {
  assert.equal(assessSchedule([observation(0, {}, "workflow_dispatch"), observation(1, {}, "push")], "2026-09-01T02:00:00Z", 6).state, "unknown");
});

test("trigger identity distinguishes scheduled, manual, push, and other runs", () => {
  assert.equal(triggerKindForEvent("schedule"), "scheduled");
  assert.equal(triggerKindForEvent("workflow_dispatch"), "manual");
  assert.equal(triggerKindForEvent("push"), "push");
  assert.equal(triggerKindForEvent("repository_dispatch"), "other");
});

test("fewer than five successful runs is insufficient history", () => {
  const report = buildHealthReport({ summary: summary([source()]), history: history([0, 1, 2, 3].map((i) => observation(i))), identity: identity(5) });
  assert.equal(report.baseline.state, "insufficient_history");
  assert.equal(report.baseline.historyDepth, MIN_BASELINE_OBSERVATIONS - 1);
});

test("five successful runs establish a descriptive baseline", () => {
  const report = buildHealthReport({ summary: summary([source()]), history: history([0, 1, 2, 3, 4].map((i) => observation(i))), identity: identity(5) });
  assert.equal(report.baseline.state, "established");
  assert.equal(report.baseline.pipeline.candidatesFound.mean, 20);
  assert.equal(report.baseline.basis, "successful_scheduled_runs");
});

test("the fifth scheduled success matures the baseline in its own report", () => {
  const report = buildHealthReport({
    summary: summary([source()], identity(4, "schedule").startedAt, identity(4, "schedule").finishedAt),
    history: history([0, 1, 2, 3].map((i) => observation(i))),
    identity: identity(4, "schedule"),
    verificationPassed: true,
  });
  assert.equal(report.baseline.state, "established");
  assert.equal(report.baseline.historyDepth, 5);
  assert.equal(report.baseline.comparisonHistoryDepth, 4);
  assert.equal(report.baseline.pipeline.candidatesFound.observations, 5);
  assert.equal(anomaly(report, "candidate_volume_collapse"), undefined);
});

test("manual and push observations are excluded from scheduled baselines", () => {
  const observations = [
    ...[0, 1, 2, 3].map((i) => observation(i)),
    observation(4, {}, "workflow_dispatch"),
    observation(5, {}, "push"),
  ];
  const report = buildHealthReport({ summary: summary([source()]), history: history(observations), identity: identity(6) });
  assert.equal(report.baseline.state, "insufficient_history");
  assert.equal(report.baseline.historyDepth, 4);
});

test("failed and incomplete scheduled observations are excluded from baselines", () => {
  const failed = { ...observation(4), executionState: "failure" as const };
  const incomplete = structuredClone(observation(5)) as HealthObservation;
  delete (incomplete.metrics as Partial<typeof incomplete.metrics>).duplicateRate;
  const report = buildHealthReport({
    summary: summary([source()]),
    history: history([... [0, 1, 2, 3].map((i) => observation(i)), failed, incomplete]),
    identity: identity(6),
  });
  assert.equal(report.baseline.historyDepth, 4);
  assert.equal(report.baseline.state, "insufficient_history");
});

test("healthy-range metrics remain healthy after baseline", () => {
  const report = buildHealthReport({ summary: summary([source()]), history: history([0, 1, 2, 3, 4].map((i) => observation(i))), identity: identity(5) });
  assert.equal(report.pipelineHealth.state, "healthy");
  assert.equal(anomaly(report, "candidate_volume_collapse"), undefined);
});

test("one moderate volume deviation is informational", () => {
  const report = buildHealthReport({ summary: summary([source({ candidatesFound: 6 })]), history: history([0, 1, 2, 3, 4].map((i) => observation(i))), identity: identity(5) });
  assert.equal(anomaly(report, "candidate_volume_collapse")?.severity, "informational");
});

test("consecutive volume deviation becomes warning", () => {
  const prior = [0, 1, 2, 3, 4].map((i) => observation(i));
  prior.push(observation(5, { candidatesFound: 6 }));
  const report = buildHealthReport({ summary: summary([source({ candidatesFound: 6 })]), history: history(prior), identity: identity(6) });
  assert.equal(anomaly(report, "candidate_volume_collapse")?.severity, "warning");
});

test("severe volume collapse warns immediately", () => {
  const report = buildHealthReport({ summary: summary([source({ candidatesFound: 1 })]), history: history([0, 1, 2, 3, 4].map((i) => observation(i))), identity: identity(5) });
  assert.equal(anomaly(report, "candidate_volume_collapse")?.severity, "warning");
});

test("eligibility-unknown spike is deterministic", () => {
  const base = [0, 1, 2, 3, 4].map((i) => observation(i, { eligibilityUnknown: 1 }));
  const report = buildHealthReport({ summary: summary([source({ eligibilityUnknown: 14 })]), history: history(base), identity: identity(5) });
  assert.equal(anomaly(report, "eligibility_unknown_spike")?.severity, "warning");
});

test("duplicate spike is deterministic", () => {
  const base = [0, 1, 2, 3, 4].map((i) => observation(i, { duplicatesSkipped: 1, deduplicatedCandidates: 14 }));
  const report = buildHealthReport({ summary: summary([source({ duplicatesSkipped: 12, deduplicatedCandidates: 1 })]), history: history(base), identity: identity(5) });
  assert.equal(anomaly(report, "duplicate_rate_spike")?.severity, "warning");
});

test("source-specific eligibility-unknown spike is attributed to that source", () => {
  const base = [0, 1, 2, 3, 4].map((i) => observation(i, { eligibilityUnknown: 1 }));
  const report = buildHealthReport({ summary: summary([source({ eligibilityUnknown: 14 })]), history: history(base), identity: identity(5) });
  const finding = anomaly(report, "source_eligibility_unknown_spike");
  assert.equal(finding?.severity, "warning");
  assert.equal(finding?.scope, "source:source-a");
});

test("source-specific duplicate spike is attributed to that source", () => {
  const base = [0, 1, 2, 3, 4].map((i) => observation(i, { duplicatesSkipped: 1, deduplicatedCandidates: 14 }));
  const report = buildHealthReport({ summary: summary([source({ duplicatesSkipped: 12, deduplicatedCandidates: 1 })]), history: history(base), identity: identity(5) });
  const finding = anomaly(report, "source_duplicate_rate_spike");
  assert.equal(finding?.severity, "warning");
  assert.equal(finding?.scope, "source:source-a");
});

test("rate deviations below the absolute sample floor do not warn", () => {
  const base = [0, 1, 2, 3, 4].map((i) => observation(i, { eligibilityUnknown: 1 }));
  const tiny = source({ candidatesFound: 2, structurallyValidCandidates: 2, eligibilityUnknown: 2, evidencePresent: 2 });
  const report = buildHealthReport({ summary: summary([tiny]), history: history(base), identity: identity(5) });
  assert.equal(anomaly(report, "eligibility_unknown_spike"), undefined);
  assert.equal(anomaly(report, "source_eligibility_unknown_spike"), undefined);
});

test("detail-fetch degradation is detected", () => {
  const report = buildHealthReport({ summary: summary([source({ detailSucceeded: 0, detailFailures: 5 })]), history: history([0, 1, 2, 3, 4].map((i) => observation(i))), identity: identity(5) });
  assert.equal(anomaly(report, "detail_evidence_degradation")?.severity, "warning");
});

test("evidence degradation is detected", () => {
  const report = buildHealthReport({ summary: summary([source({ evidencePresent: 2 })]), history: history([0, 1, 2, 3, 4].map((i) => observation(i))), identity: identity(5) });
  assert.equal(anomaly(report, "evidence_degradation")?.severity, "warning");
});

test("zero qualified with healthy execution is valid under insufficient history", () => {
  const report = buildHealthReport({ summary: summary([source({ duplicatesSkipped: 0, deduplicatedCandidates: 0, validCandidates: 0, insertedPending: 0 })]), identity: identity(0) });
  assert.equal(report.execution.state, "success");
  assert.equal(report.pipelineHealth.state, "observed");
  assert.equal(anomaly(report, "qualified_candidates_disappeared"), undefined);
});

test("zero qualified against a strong baseline warns without weakening qualification", () => {
  const report = buildHealthReport({ summary: summary([source({ duplicatesSkipped: 0, deduplicatedCandidates: 0, validCandidates: 0, insertedPending: 0 })]), history: history([0, 1, 2, 3, 4].map((i) => observation(i))), identity: identity(5) });
  assert.equal(anomaly(report, "qualified_candidates_disappeared")?.severity, "warning");
});

test("pending insertion spike uses absolute and relative thresholds", () => {
  const base = [0, 1, 2, 3, 4].map((i) => observation(i, { insertedPending: 1 }));
  const report = buildHealthReport({ summary: summary([source({ insertedPending: 10 })]), history: history(base), identity: identity(5) });
  assert.equal(anomaly(report, "pending_insertion_spike")?.severity, "warning");
});

test("one insertion collapse is informational", () => {
  const base = [0, 1, 2, 3, 4].map((i) => observation(i, { insertedPending: 4 }));
  const report = buildHealthReport({ summary: summary([source({ insertedPending: 0 })]), history: history(base), identity: identity(5) });
  assert.equal(anomaly(report, "pending_insertion_collapse")?.severity, "informational");
});

test("consecutive insertion collapse becomes warning", () => {
  const base = [0, 1, 2, 3, 4].map((i) => observation(i, { insertedPending: 4 }));
  base.push(observation(5, { insertedPending: 0 }));
  const report = buildHealthReport({ summary: summary([source({ insertedPending: 0 })]), history: history(base), identity: identity(6) });
  assert.equal(anomaly(report, "pending_insertion_collapse")?.severity, "warning");
});

test("one failed source is isolated but degraded", () => {
  const failed = source({ sourceId: "source-b", name: "Source B", ok: false, sourceHealthUpdated: true, error: "unavailable" });
  const report = buildHealthReport({ summary: summary([source(), failed]), identity: identity(0) });
  assert.equal(report.sourceHealth.state, "degraded");
  assert.equal(anomaly(report, "source_failed")?.severity, "warning");
});

test("multiple active source failures are critical", () => {
  const failedA = source({ ok: false, error: "unavailable" });
  const failedB = source({ sourceId: "source-b", name: "Source B", ok: false, error: "unavailable" });
  const report = buildHealthReport({ summary: summary([source({ sourceId: "source-c" }), failedA, failedB]), identity: identity(0) });
  assert.equal(anomaly(report, "multiple_sources_failed")?.severity, "critical");
  assert.equal(report.pipelineHealth.state, "failed");
});

test("all-source failure is critical", () => {
  const report = buildHealthReport({ summary: summary([source({ ok: false, error: "unavailable" })]), identity: identity(0) });
  assert.equal(anomaly(report, "all_sources_failed")?.severity, "critical");
  assert.equal(report.execution.state, "failure");
});

test("zero attempted sources is critical", () => {
  const report = buildHealthReport({ summary: summary([]), identity: identity(0) });
  assert.equal(anomaly(report, "no_sources_attempted")?.severity, "critical");
  assert.equal(report.execution.state, "failure");
});

test("source-health persistence failure is separately observable", () => {
  const report = buildHealthReport({ summary: summary([source({ sourceHealthUpdated: false, sourceHealthError: "write failed" })]), identity: identity(0) });
  assert.equal(anomaly(report, "source_health_write_failed")?.severity, "warning");
});

test("source-specific unusual volume uses its own baseline", () => {
  const base = [0, 1, 2, 3, 4].map((i) => observation(i, { candidatesFound: 10 }));
  const report = buildHealthReport({ summary: summary([source({ candidatesFound: 0 })]), history: history(base), identity: identity(5) });
  assert.equal(report.anomalies.some((item) => item.code === "source_volume_deviation" && item.severity === "warning"), true);
});

test("worker failure creates a critical report without raw exception text", () => {
  const report = buildHealthReport({ summary: null, identity: identity(0) });
  assert.equal(report.execution.state, "failure");
  assert.equal(anomaly(report, "worker_failed")?.severity, "critical");
  assert.equal(JSON.stringify(report).includes("service-role-secret"), false);
});

test("trust evidence rates are derived from existing counters", () => {
  const report = buildHealthReport({ summary: summary([source()]), identity: identity(0) });
  assert.equal(report.pipelineHealth.metrics.evidenceRate, 1);
  assert.equal(report.pipelineHealth.metrics.deadlineEvidenceRate, 0.2);
  assert.equal(report.pipelineHealth.metrics.applicationEvidenceRate, 2 / 15);
});

test("unmeasured source duration is explicitly unavailable", () => {
  const report = buildHealthReport({ summary: summary([source()]), identity: identity(0) });
  assert.equal(report.sourceHealth.sources[0].metrics.durationMs, null);
});

test("daily configuration cannot claim six-hour readiness", () => {
  const report = buildHealthReport({ summary: summary([source()]), identity: identity(0), expectedIntervalHours: 24, targetIntervalHours: 6, verificationPassed: true });
  assert.equal(report.schedule.configuredForTarget, false);
  assert.equal(report.readiness.state, "NOT_YET_PROVEN");
});

test("one real scheduled success is only partially proven", () => {
  const report = buildHealthReport({
    summary: summary([source()]),
    identity: identity(0, "schedule"),
    expectedIntervalHours: 6,
    targetIntervalHours: 6,
    verificationPassed: true,
  });
  assert.equal(report.readiness.state, "PARTIALLY_PROVEN");
  assert.equal(report.schedule.state, "unknown");
});

test("three on-time scheduled successes satisfy the readiness contract", () => {
  const report = buildHealthReport({
    summary: summary([source()], identity(12, "schedule").startedAt, identity(12, "schedule").finishedAt),
    history: history([observation(0), observation(6)]),
    identity: identity(12, "schedule"),
    expectedIntervalHours: 6,
    targetIntervalHours: 6,
    verificationPassed: true,
  });
  assert.equal(report.schedule.state, "on_time");
  assert.equal(report.readiness.state, "PROVEN");
  assert.equal(report.readiness.criteria.every((criterion) => criterion.passed), true);
});

test("freshness: recent discovery is fresh", () => {
  assert.equal(classifyFreshness(null, "2026-08-30T00:00:00Z", "2026-09-02T00:00:00Z"), "fresh");
});

test("freshness: eight-to-thirty days is aging", () => {
  assert.equal(classifyFreshness(null, "2026-08-15T00:00:00Z", "2026-09-02T00:00:00Z"), "aging");
});

test("freshness: older discovery is stale", () => {
  assert.equal(classifyFreshness(null, "2026-07-01T00:00:00Z", "2026-09-02T00:00:00Z"), "stale");
});

test("freshness: passed deadline is expired regardless of discovery age", () => {
  assert.equal(classifyFreshness("2026-09-01T00:00:00Z", "2026-09-01T00:00:00Z", "2026-09-02T00:00:00Z"), "expired");
});

test("freshness: missing or malformed evidence is unknown", () => {
  assert.equal(classifyFreshness(null, null, "2026-09-02T00:00:00Z"), "unknown");
  assert.equal(classifyFreshness("not-a-date", "2026-09-01T00:00:00Z", "2026-09-02T00:00:00Z"), "unknown");
});

test("history retention is bounded", () => {
  let retained: HealthHistory | undefined;
  for (let index = 0; index < HEALTH_HISTORY_LIMIT + 5; index += 1) {
    retained = appendObservation(retained, observation(index % 24));
  }
  assert.equal(retained?.observations.length, HEALTH_HISTORY_LIMIT);
});

test("a rerun replaces its logical workflow observation instead of double-counting", () => {
  const first = observation(0);
  const retry = structuredClone(first);
  retry.identity.runAttempt = 2;
  retry.metrics.candidatesFound = 21;
  const retained = appendObservation(appendObservation(undefined, first), retry);
  assert.equal(retained.observations.length, 1);
  assert.equal(retained.observations[0].identity.runAttempt, 2);
  assert.equal(retained.observations[0].metrics.candidatesFound, 21);
});

test("a retry cannot satisfy readiness by double-counting one logical scheduled run", () => {
  const first = observation(0);
  const retry = structuredClone(first);
  retry.identity.runAttempt = 2;
  const report = buildHealthReport({
    summary: summary([source()], retry.identity.startedAt, retry.identity.finishedAt),
    history: history([first]),
    identity: retry.identity,
    expectedIntervalHours: 6,
    targetIntervalHours: 6,
    verificationPassed: true,
  });
  assert.equal(report.readiness.state, "PARTIALLY_PROVEN");
  assert.equal(report.productionEvidence.retainedHistoryDepth, 1);
  assert.equal(report.readiness.criteria.find((criterion) => criterion.id === "repeated_scheduled_runs")?.evidence.startsWith("1 successful"), true);
});

test("invalid retained history fails closed to an empty baseline", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "discovery-health-invalid-"));
  const historyPath = path.join(directory, "history.json");
  try {
    writeFileSync(historyPath, "{invalid-json", "utf8");
    assert.deepEqual(loadHealthHistory(historyPath), { schemaVersion: 1, observations: [] });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("legacy M24 identity is normalized without becoming scheduled evidence", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "discovery-health-legacy-"));
  const historyPath = path.join(directory, "history.json");
  try {
    const legacy = structuredClone(observation(0, {}, "push")) as unknown as {
      identity: Record<string, unknown>;
    };
    delete legacy.identity.runAttempt;
    delete legacy.identity.triggerKind;
    writeFileSync(historyPath, JSON.stringify({ schemaVersion: 1, observations: [legacy] }), "utf8");
    const loaded = loadHealthHistory(historyPath);
    assert.equal(loaded.observations[0].identity.runAttempt, 1);
    assert.equal(loaded.observations[0].identity.triggerKind, "push");
    const report = buildHealthReport({ summary: summary([source()]), history: loaded, identity: identity(1) });
    assert.equal(report.baseline.historyDepth, 0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("retention writes a machine-readable report and bounded history", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "discovery-health-retention-"));
  const reportPath = path.join(directory, "report.json");
  const historyPath = path.join(directory, "history.json");
  try {
    const report = buildHealthReport({ summary: summary([source()]), identity: identity(0) });
    const retained = retainHealthReport(report, { schemaVersion: 1, observations: [] }, { reportPath, historyPath });
    assert.equal(retained.observations.length, 1);
    assert.equal(JSON.parse(readFileSync(reportPath, "utf8")).schemaVersion, 1);
    assert.equal(JSON.parse(readFileSync(historyPath, "utf8")).observations.length, 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("report is machine-readable and omits source errors and URLs", () => {
  const report = buildHealthReport({ summary: summary([source({ error: "https://secret.example/?token=secret" })]), identity: identity(0) });
  const serialized = JSON.stringify(report);
  assert.equal(serialized.includes("token=secret"), false);
  assert.equal(report.schemaVersion, 1);
});

console.log(`\n${passed} discovery health tests passed.`);
