import type { DiscoverySummary, SourceRunResult } from "./types";

export const HEALTH_HISTORY_LIMIT = 24;
export const MIN_BASELINE_OBSERVATIONS = 5;
export const DEFAULT_EXPECTED_INTERVAL_HOURS = 6;
export const SIX_HOUR_TARGET_INTERVAL = 6;

export type ScheduleState = "on_time" | "delayed" | "missed" | "unknown";
export type BaselineState = "established" | "insufficient_history";
export type Severity = "critical" | "warning" | "informational";
export type FreshnessState = "fresh" | "aging" | "stale" | "expired" | "unknown";
export type TriggerKind = "scheduled" | "manual" | "push" | "other";
export type ReadinessState = "PROVEN" | "PARTIALLY_PROVEN" | "NOT_YET_PROVEN";

export interface RunIdentity {
  commitSha: string | null;
  workflowRunId: string | null;
  workflowName: string | null;
  runAttempt: number;
  event: string;
  triggerKind: TriggerKind;
  startedAt: string;
  finishedAt: string;
}

export interface HealthMetrics {
  candidatesFound: number;
  noiseRejected: number;
  structurallyValidCandidates: number;
  relevanceRejected: number;
  eligibilityRejected: number;
  eligibilityUnknown: number;
  duplicatesSkipped: number;
  deduplicatedCandidates: number;
  validCandidates: number;
  categorySkipped: number;
  detailFetches: number;
  detailSucceeded: number;
  detailFailures: number;
  detailDeadlineFound: number;
  detailEligibilityFound: number;
  detailApplicationFound: number;
  evidencePresent: number;
  deadlineEvidencePresent: number;
  eligibilityEvidencePresent: number;
  relevanceEvidencePresent: number;
  applicationEvidencePresent: number;
  noiseRate: number | null;
  relevanceRejectionRate: number | null;
  eligibilityRejectionRate: number | null;
  eligibilityUnknownRate: number | null;
  duplicateRate: number | null;
  detailSuccessRate: number | null;
  evidenceRate: number | null;
  deadlineEvidenceRate: number | null;
  eligibilityEvidenceRate: number | null;
  applicationEvidenceRate: number | null;
  qualifiedCandidates: number;
  qualifiedRate: number | null;
  insertedPending: number;
  insertionRate: number | null;
  /** null for per-source observations because source duration is not measured. */
  durationMs: number | null;
}

export interface HealthSourceObservation {
  sourceId: string;
  name: string;
  attempted: true;
  ok: boolean;
  metrics: HealthMetrics;
}

export interface HealthObservation {
  schemaVersion: 1;
  identity: RunIdentity;
  executionState: "success" | "failure";
  sourcesAttempted: number;
  sourcesSucceeded: number;
  sourcesFailed: number;
  sourceHealthFailures: number;
  metrics: HealthMetrics;
  sources: HealthSourceObservation[];
}

export interface HealthHistory {
  schemaVersion: 1;
  observations: HealthObservation[];
}

export interface MetricBaseline {
  state: BaselineState;
  observations: number;
  mean: number | null;
  min: number | null;
  max: number | null;
}

export interface HealthAnomaly {
  severity: Severity;
  code: string;
  scope: "run" | "schedule" | "pipeline" | `source:${string}`;
  message: string;
  observed?: number | string;
  expected?: string;
}

export interface ScheduleAssessment {
  state: ScheduleState;
  expectedIntervalHours: number;
  toleranceHours: number;
  observedGapHours: number | null;
  reason: string;
}

export interface ReadinessCriterion {
  id: string;
  passed: boolean;
  evidence: string;
}

export interface DiscoveryHealthReport {
  schemaVersion: 1;
  identity: RunIdentity;
  execution: {
    state: "success" | "failure";
    durationMs: number | null;
    workerErrors: number;
  };
  schedule: ScheduleAssessment & {
    targetIntervalHours: number;
    configuredForTarget: boolean;
  };
  baseline: {
    state: BaselineState;
    basis: "successful_scheduled_runs";
    historyDepth: number;
    requiredHistory: number;
    pipeline: Record<BaselineMetricKey, MetricBaseline>;
    sources: Record<string, {
      state: BaselineState;
      historyDepth: number;
      candidatesFound: MetricBaseline;
      eligibilityUnknownRate: MetricBaseline;
      duplicateRate: MetricBaseline;
      detailSuccessRate: MetricBaseline;
      evidenceRate: MetricBaseline;
    }>;
  };
  sourceHealth: {
    state: "healthy" | "degraded" | "failed" | "observed";
    attempted: number;
    succeeded: number;
    failed: number;
    sourceHealthFailures: number;
    sources: Array<HealthSourceObservation & { baselineState: BaselineState }>;
  };
  pipelineHealth: {
    state: "healthy" | "degraded" | "failed" | "observed";
    metrics: HealthMetrics;
  };
  anomalies: HealthAnomaly[];
  productionEvidence: {
    state: "captured" | "partial";
    retainedHistoryDepth: number;
    reportContainsSecrets: false;
  };
  readiness: {
    state: ReadinessState;
    criteria: ReadinessCriterion[];
  };
  observation: HealthObservation;
}

export interface BuildHealthReportInput {
  summary: DiscoverySummary | null;
  history?: HealthHistory;
  identity: RunIdentity;
  expectedIntervalHours?: number;
  targetIntervalHours?: number;
  verificationPassed?: boolean;
}

export const BASELINE_METRICS = [
  "candidatesFound",
  "noiseRate",
  "relevanceRejectionRate",
  "eligibilityRejectionRate",
  "eligibilityUnknownRate",
  "duplicateRate",
  "detailSuccessRate",
  "evidenceRate",
  "deadlineEvidenceRate",
  "eligibilityEvidenceRate",
  "applicationEvidenceRate",
  "qualifiedCandidates",
  "qualifiedRate",
  "insertedPending",
  "insertionRate",
  "durationMs",
] as const;

export type BaselineMetricKey = (typeof BASELINE_METRICS)[number];

export function triggerKindForEvent(event: string): TriggerKind {
  if (event === "schedule") return "scheduled";
  if (event === "workflow_dispatch") return "manual";
  if (event === "push") return "push";
  return "other";
}

function hasBaselineMetrics(value: unknown): value is HealthMetrics {
  if (!value || typeof value !== "object") return false;
  const metrics = value as Partial<HealthMetrics>;
  return BASELINE_METRICS.every((key) => {
    const metric = metrics[key];
    return metric === null || (typeof metric === "number" && Number.isFinite(metric));
  });
}

/** Runtime guard used before any retained observation can influence a baseline. */
export function isComparableHealthObservation(value: unknown): value is HealthObservation {
  if (!value || typeof value !== "object") return false;
  const observation = value as Partial<HealthObservation>;
  if (observation.schemaVersion !== 1) return false;
  if (observation.executionState !== "success" && observation.executionState !== "failure") return false;
  if (!observation.identity || typeof observation.identity.event !== "string") return false;
  if (typeof observation.identity.commitSha !== "string" || observation.identity.commitSha.length === 0) return false;
  if (typeof observation.identity.workflowRunId !== "string" || observation.identity.workflowRunId.length === 0) return false;
  if (!Number.isFinite(Date.parse(observation.identity.startedAt))) return false;
  if (!Number.isFinite(Date.parse(observation.identity.finishedAt))) return false;
  if (!hasBaselineMetrics(observation.metrics) || !Array.isArray(observation.sources)) return false;
  for (const count of [
    observation.sourcesAttempted,
    observation.sourcesSucceeded,
    observation.sourcesFailed,
    observation.sourceHealthFailures,
  ]) {
    if (typeof count !== "number" || !Number.isInteger(count) || count < 0) return false;
  }
  if (observation.sources.length !== observation.sourcesAttempted) return false;
  return observation.sources.every((source) =>
    Boolean(source)
    && typeof source.sourceId === "string"
    && typeof source.ok === "boolean"
    && hasBaselineMetrics(source.metrics)
  );
}

function successfulScheduledHistory(history: HealthObservation[]): HealthObservation[] {
  return history.filter(
    (observation) => isComparableHealthObservation(observation)
      && observation.executionState === "success"
      && observation.identity.event === "schedule"
  );
}

const ratio = (numerator: number, denominator: number): number | null =>
  denominator > 0 ? numerator / denominator : null;

function durationMs(startedAt: string, finishedAt: string): number | null {
  const duration = Date.parse(finishedAt) - Date.parse(startedAt);
  return Number.isFinite(duration) && duration >= 0 ? duration : null;
}

function metricsFromCounters(
  counters: Pick<
    DiscoverySummary | SourceRunResult,
    | "candidatesFound"
    | "noiseRejected"
    | "structurallyValidCandidates"
    | "relevanceRejected"
    | "eligibilityRejected"
    | "eligibilityUnknown"
    | "duplicatesSkipped"
    | "deduplicatedCandidates"
    | "detailFetches"
    | "detailSucceeded"
    | "detailFailures"
    | "detailDeadlineFound"
    | "detailEligibilityFound"
    | "detailApplicationFound"
    | "evidencePresent"
    | "deadlineEvidencePresent"
    | "eligibilityEvidencePresent"
    | "relevanceEvidencePresent"
    | "applicationEvidencePresent"
    | "validCandidates"
    | "categorySkipped"
    | "insertedPending"
  >,
  runDurationMs: number | null
): HealthMetrics {
  const qualifiedCandidates = counters.duplicatesSkipped + counters.deduplicatedCandidates;
  const dedupePopulation = counters.duplicatesSkipped + counters.deduplicatedCandidates;
  return {
    candidatesFound: counters.candidatesFound,
    noiseRejected: counters.noiseRejected,
    structurallyValidCandidates: counters.structurallyValidCandidates,
    relevanceRejected: counters.relevanceRejected,
    eligibilityRejected: counters.eligibilityRejected,
    eligibilityUnknown: counters.eligibilityUnknown,
    duplicatesSkipped: counters.duplicatesSkipped,
    deduplicatedCandidates: counters.deduplicatedCandidates,
    validCandidates: counters.validCandidates,
    categorySkipped: counters.categorySkipped,
    detailFetches: counters.detailFetches,
    detailSucceeded: counters.detailSucceeded,
    detailFailures: counters.detailFailures,
    detailDeadlineFound: counters.detailDeadlineFound,
    detailEligibilityFound: counters.detailEligibilityFound,
    detailApplicationFound: counters.detailApplicationFound,
    evidencePresent: counters.evidencePresent,
    deadlineEvidencePresent: counters.deadlineEvidencePresent,
    eligibilityEvidencePresent: counters.eligibilityEvidencePresent,
    relevanceEvidencePresent: counters.relevanceEvidencePresent,
    applicationEvidencePresent: counters.applicationEvidencePresent,
    noiseRate: ratio(counters.noiseRejected, counters.candidatesFound),
    relevanceRejectionRate: ratio(counters.relevanceRejected, counters.structurallyValidCandidates),
    eligibilityRejectionRate: ratio(counters.eligibilityRejected, counters.structurallyValidCandidates),
    eligibilityUnknownRate: ratio(counters.eligibilityUnknown, counters.structurallyValidCandidates),
    duplicateRate: ratio(counters.duplicatesSkipped, dedupePopulation),
    detailSuccessRate: ratio(counters.detailSucceeded, counters.detailFetches),
    evidenceRate: ratio(counters.evidencePresent, counters.structurallyValidCandidates),
    deadlineEvidenceRate: ratio(counters.deadlineEvidencePresent, counters.structurallyValidCandidates),
    eligibilityEvidenceRate: ratio(counters.eligibilityEvidencePresent, counters.structurallyValidCandidates),
    applicationEvidenceRate: ratio(counters.applicationEvidencePresent, counters.structurallyValidCandidates),
    qualifiedCandidates,
    qualifiedRate: ratio(qualifiedCandidates, counters.structurallyValidCandidates),
    insertedPending: counters.insertedPending,
    insertionRate: ratio(counters.insertedPending, qualifiedCandidates),
    durationMs: runDurationMs,
  };
}

function emptyMetrics(runDurationMs: number | null): HealthMetrics {
  return {
    candidatesFound: 0,
    noiseRejected: 0,
    structurallyValidCandidates: 0,
    relevanceRejected: 0,
    eligibilityRejected: 0,
    eligibilityUnknown: 0,
    duplicatesSkipped: 0,
    deduplicatedCandidates: 0,
    validCandidates: 0,
    categorySkipped: 0,
    detailFetches: 0,
    detailSucceeded: 0,
    detailFailures: 0,
    detailDeadlineFound: 0,
    detailEligibilityFound: 0,
    detailApplicationFound: 0,
    evidencePresent: 0,
    deadlineEvidencePresent: 0,
    eligibilityEvidencePresent: 0,
    relevanceEvidencePresent: 0,
    applicationEvidencePresent: 0,
    noiseRate: null,
    relevanceRejectionRate: null,
    eligibilityRejectionRate: null,
    eligibilityUnknownRate: null,
    duplicateRate: null,
    detailSuccessRate: null,
    evidenceRate: null,
    deadlineEvidenceRate: null,
    eligibilityEvidenceRate: null,
    applicationEvidenceRate: null,
    qualifiedCandidates: 0,
    qualifiedRate: null,
    insertedPending: 0,
    insertionRate: null,
    durationMs: runDurationMs,
  };
}

function metricBaseline(values: Array<number | null>): MetricBaseline {
  const available = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (available.length === 0) {
    return { state: "insufficient_history", observations: 0, mean: null, min: null, max: null };
  }
  return {
    state: available.length >= MIN_BASELINE_OBSERVATIONS ? "established" : "insufficient_history",
    observations: available.length,
    mean: available.reduce((sum, value) => sum + value, 0) / available.length,
    min: Math.min(...available),
    max: Math.max(...available),
  };
}

function buildPipelineBaselines(history: HealthObservation[]): Record<BaselineMetricKey, MetricBaseline> {
  const successful = successfulScheduledHistory(history);
  return Object.fromEntries(
    BASELINE_METRICS.map((key) => [key, metricBaseline(successful.map((observation) => observation.metrics[key]))])
  ) as Record<BaselineMetricKey, MetricBaseline>;
}

function buildSourceBaselines(history: HealthObservation[]): Record<
  string,
  {
    state: BaselineState;
    historyDepth: number;
    candidatesFound: MetricBaseline;
    eligibilityUnknownRate: MetricBaseline;
    duplicateRate: MetricBaseline;
    detailSuccessRate: MetricBaseline;
    evidenceRate: MetricBaseline;
  }
> {
  const scheduledHistory = successfulScheduledHistory(history);
  const sourceIds = new Set(scheduledHistory.flatMap((observation) => observation.sources.map((source) => source.sourceId)));
  return Object.fromEntries(
    [...sourceIds].sort().map((sourceId) => {
      const observations = scheduledHistory
        .flatMap((observation) => observation.sources)
        .filter((source) => source.sourceId === sourceId && source.ok);
      const state: BaselineState = observations.length >= MIN_BASELINE_OBSERVATIONS ? "established" : "insufficient_history";
      return [sourceId, {
        state,
        historyDepth: observations.length,
        candidatesFound: metricBaseline(observations.map((source) => source.metrics.candidatesFound)),
        eligibilityUnknownRate: metricBaseline(observations.map((source) => source.metrics.eligibilityUnknownRate)),
        duplicateRate: metricBaseline(observations.map((source) => source.metrics.duplicateRate)),
        detailSuccessRate: metricBaseline(observations.map((source) => source.metrics.detailSuccessRate)),
        evidenceRate: metricBaseline(observations.map((source) => source.metrics.evidenceRate)),
      }];
    })
  );
}

function toleranceFor(intervalHours: number): number {
  return Math.max(2, intervalHours * 0.25);
}

export function assessSchedule(
  history: HealthObservation[],
  now: string,
  expectedIntervalHours = DEFAULT_EXPECTED_INTERVAL_HOURS,
  currentEvent?: string
): ScheduleAssessment {
  const toleranceHours = toleranceFor(expectedIntervalHours);
  const nowMs = Date.parse(now);
  if (!Number.isFinite(nowMs) || expectedIntervalHours <= 0) {
    return { state: "unknown", expectedIntervalHours, toleranceHours, observedGapHours: null, reason: "Invalid schedule inputs." };
  }
  const scheduled = history
    .filter((observation) => isComparableHealthObservation(observation) && observation.identity.event === "schedule")
    .sort((a, b) => Date.parse(a.identity.startedAt) - Date.parse(b.identity.startedAt));
  const last = scheduled.at(-1);
  if (!last) {
    return { state: "unknown", expectedIntervalHours, toleranceHours, observedGapHours: null, reason: "No retained scheduled observation exists." };
  }
  const gapHours = (nowMs - Date.parse(last.identity.startedAt)) / 3_600_000;
  if (!Number.isFinite(gapHours) || gapHours < 0) {
    return { state: "unknown", expectedIntervalHours, toleranceHours, observedGapHours: null, reason: "Scheduled timestamps are not comparable." };
  }
  if (gapHours <= expectedIntervalHours + toleranceHours) {
    return { state: "on_time", expectedIntervalHours, toleranceHours, observedGapHours: gapHours, reason: "Latest scheduled execution is inside the expected interval and tolerance." };
  }
  if (currentEvent === "schedule" && gapHours <= expectedIntervalHours * 2 + toleranceHours) {
    return { state: "delayed", expectedIntervalHours, toleranceHours, observedGapHours: gapHours, reason: "This scheduled execution arrived outside tolerance but before a second full interval elapsed." };
  }
  return { state: "missed", expectedIntervalHours, toleranceHours, observedGapHours: gapHours, reason: "No scheduled execution was retained inside the expected interval and tolerance." };
}

function deviation(value: number, baseline: MetricBaseline, moderateLow: number, moderateHigh: number, severeLow: number, severeHigh: number) {
  if (baseline.state !== "established" || baseline.mean === null || baseline.mean === 0) return "none";
  const relative = value / baseline.mean;
  if (relative <= severeLow || relative >= severeHigh) return "severe";
  if (relative <= moderateLow || relative >= moderateHigh) return "moderate";
  return "none";
}

function priorMetric(history: HealthObservation[], key: BaselineMetricKey): number | null {
  return successfulScheduledHistory(history).at(-1)?.metrics[key] ?? null;
}

function addPipelineAnomalies(
  anomalies: HealthAnomaly[],
  metrics: HealthMetrics,
  baselines: Record<BaselineMetricKey, MetricBaseline>,
  history: HealthObservation[]
) {
  const volume = deviation(metrics.candidatesFound, baselines.candidatesFound, 0.4, 2.5, 0.1, 5);
  if (baselines.candidatesFound.mean !== null && baselines.candidatesFound.mean >= 10 && volume !== "none") {
    const prior = priorMetric(history, "candidatesFound");
    const confirmed = prior !== null && deviation(prior, baselines.candidatesFound, 0.4, 2.5, 0.1, 5) !== "none";
    anomalies.push({
      severity: volume === "severe" || confirmed ? "warning" : "informational",
      code: metrics.candidatesFound < baselines.candidatesFound.mean ? "candidate_volume_collapse" : "candidate_volume_spike",
      scope: "pipeline",
      message: volume === "severe" || confirmed ? "Candidate volume materially deviated from its retained baseline." : "Candidate volume changed once; confirmation is required before warning.",
      observed: metrics.candidatesFound,
      expected: `mean ${baselines.candidatesFound.mean.toFixed(2)}`,
    });
  }

  for (const [key, code, direction] of [
    ["eligibilityUnknownRate", "eligibility_unknown_spike", "up"],
    ["duplicateRate", "duplicate_rate_spike", "up"],
    ["detailSuccessRate", "detail_evidence_degradation", "down"],
    ["evidenceRate", "evidence_degradation", "down"],
  ] as const) {
    const current = metrics[key];
    const baseline = baselines[key];
    const sampleSize = key === "duplicateRate"
      ? metrics.duplicatesSkipped + metrics.deduplicatedCandidates
      : key === "detailSuccessRate"
        ? metrics.detailFetches
        : metrics.structurallyValidCandidates;
    const minimumSample = key === "detailSuccessRate" ? 3 : 10;
    if (sampleSize < minimumSample) continue;
    if (current === null || baseline.state !== "established" || baseline.mean === null) continue;
    const delta = direction === "up" ? current - baseline.mean : baseline.mean - current;
    if (delta < 0.3) continue;
    const prior = priorMetric(history, key);
    const priorDelta = prior === null ? 0 : direction === "up" ? prior - baseline.mean : baseline.mean - prior;
    anomalies.push({
      severity: delta >= 0.5 || priorDelta >= 0.3 ? "warning" : "informational",
      code,
      scope: "pipeline",
      message: delta >= 0.5 || priorDelta >= 0.3 ? "Rate degradation is severe or consecutive." : "One rate deviation was observed; confirmation is required before warning.",
      observed: Number(current.toFixed(4)),
      expected: `baseline mean ${baseline.mean.toFixed(4)}`,
    });
  }

  const qualifiedBaseline = baselines.qualifiedCandidates;
  if (metrics.qualifiedCandidates === 0 && qualifiedBaseline.state === "established" && (qualifiedBaseline.mean ?? 0) >= 3) {
    const consecutive = priorMetric(history, "qualifiedCandidates") === 0;
    anomalies.push({
      severity: consecutive || (qualifiedBaseline.mean ?? 0) >= 10 ? "warning" : "informational",
      code: "qualified_candidates_disappeared",
      scope: "pipeline",
      message: consecutive ? "Qualified candidates disappeared in consecutive observations." : "A zero-qualified run is valid but differs from the retained baseline.",
      observed: 0,
      expected: `baseline mean ${qualifiedBaseline.mean?.toFixed(2)}`,
    });
  }

  const insertionBaseline = baselines.insertedPending;
  if (insertionBaseline.state === "established" && insertionBaseline.mean !== null) {
    if (metrics.insertedPending >= Math.max(10, insertionBaseline.mean * 4)) {
      anomalies.push({ severity: "warning", code: "pending_insertion_spike", scope: "pipeline", message: "Pending insertions exceeded both the absolute and relative spike thresholds.", observed: metrics.insertedPending, expected: `baseline mean ${insertionBaseline.mean.toFixed(2)}` });
    } else if (metrics.insertedPending === 0 && insertionBaseline.mean >= 3) {
      const consecutive = priorMetric(history, "insertedPending") === 0;
      anomalies.push({ severity: consecutive ? "warning" : "informational", code: "pending_insertion_collapse", scope: "pipeline", message: consecutive ? "Pending insertions were zero in consecutive observations." : "One zero-insertion run is valid and requires confirmation.", observed: 0, expected: `baseline mean ${insertionBaseline.mean.toFixed(2)}` });
    }
  }
}

function addSourceAnomalies(
  anomalies: HealthAnomaly[],
  sources: HealthSourceObservation[],
  sourceBaselines: ReturnType<typeof buildSourceBaselines>
) {
  for (const source of sources) {
    if (!source.ok) {
      anomalies.push({ severity: "warning", code: "source_failed", scope: `source:${source.sourceId}`, message: `${source.name} failed while other sources may have continued.` });
      continue;
    }
    const baseline = sourceBaselines[source.sourceId]?.candidatesFound;
    if (!baseline || (baseline.mean ?? 0) < 3) continue;
    const volume = deviation(source.metrics.candidatesFound, baseline, 0.25, 4, 0.05, 8);
    if (volume !== "none") {
      anomalies.push({
        severity: volume === "severe" ? "warning" : "informational",
        code: "source_volume_deviation",
        scope: `source:${source.sourceId}`,
        message: `${source.name} candidate volume differs from its source-specific baseline.`,
        observed: source.metrics.candidatesFound,
        expected: `source mean ${baseline.mean?.toFixed(2)}`,
      });
    }
    for (const [key, code, direction] of [
      ["eligibilityUnknownRate", "source_eligibility_unknown_spike", "up"],
      ["duplicateRate", "source_duplicate_rate_spike", "up"],
      ["detailSuccessRate", "source_detail_degradation", "down"],
      ["evidenceRate", "source_evidence_degradation", "down"],
    ] as const) {
      const current = source.metrics[key];
      const rateBaseline = sourceBaselines[source.sourceId]?.[key];
      const sampleSize = key === "duplicateRate"
        ? source.metrics.duplicatesSkipped + source.metrics.deduplicatedCandidates
        : key === "detailSuccessRate"
          ? source.metrics.detailFetches
          : source.metrics.structurallyValidCandidates;
      const minimumSample = key === "detailSuccessRate" ? 3 : 10;
      if (sampleSize < minimumSample) continue;
      if (current === null || !rateBaseline || rateBaseline.state !== "established" || rateBaseline.mean === null) continue;
      const delta = direction === "up" ? current - rateBaseline.mean : rateBaseline.mean - current;
      if (delta < 0.3) continue;
      anomalies.push({
        severity: delta >= 0.5 ? "warning" : "informational",
        code,
        scope: `source:${source.sourceId}`,
        message: `${source.name} rate differs from its source-specific baseline.`,
        observed: Number(current.toFixed(4)),
        expected: `source mean ${rateBaseline.mean.toFixed(4)}`,
      });
    }
  }
}

function readinessCriteria(
  observation: HealthObservation,
  history: HealthObservation[],
  schedule: ScheduleAssessment,
  configuredForTarget: boolean,
  verificationPassed: boolean
): ReadinessCriterion[] {
  const scheduledSuccesses = successfulScheduledHistory([...history, observation]);
  return [
    { id: "scheduler_configured", passed: configuredForTarget, evidence: configuredForTarget ? "Configured interval meets the six-hour target." : "Configured discovery interval does not yet meet the six-hour target." },
    { id: "workflow_executes", passed: observation.identity.workflowRunId !== null, evidence: observation.identity.workflowRunId ? `Workflow run ${observation.identity.workflowRunId} captured.` : "No workflow run identifier captured." },
    { id: "worker_succeeds", passed: observation.executionState === "success", evidence: `Worker state: ${observation.executionState}.` },
    { id: "sources_reachable", passed: observation.sourcesAttempted > 0 && observation.sourcesSucceeded / observation.sourcesAttempted >= 0.8, evidence: `${observation.sourcesSucceeded}/${observation.sourcesAttempted} sources succeeded.` },
    { id: "failures_observable", passed: true, evidence: "Structured execution, source, pipeline, and anomaly fields are emitted." },
    { id: "repeated_scheduled_runs", passed: scheduledSuccesses.length >= 3, evidence: `${scheduledSuccesses.length} successful scheduled observations retained; 3 required.` },
    { id: "timing_within_tolerance", passed: schedule.state === "on_time" && scheduledSuccesses.length >= 3, evidence: `Schedule state: ${schedule.state}.` },
    { id: "metrics_consistent", passed: observation.sourcesAttempted === observation.sources.length, evidence: "Aggregate/source observation counts reconcile." },
    { id: "anomalies_surfaced", passed: true, evidence: "Deterministic anomaly evaluation completed." },
    { id: "security_boundaries", passed: verificationPassed, evidence: verificationPassed ? "Permanent verification gates passed before production execution." : "No preceding boundary verification evidence supplied." },
  ];
}

export function buildHealthReport(input: BuildHealthReportInput): DiscoveryHealthReport {
  const history = input.history?.observations.slice(-HEALTH_HISTORY_LIMIT) ?? [];
  const runDuration = durationMs(input.identity.startedAt, input.identity.finishedAt);
  const summary = input.summary;
  const executionSucceeded = Boolean(
    summary
      && summary.sourcesAttempted > 0
      && !(summary.sourcesSucceeded === 0 && summary.sourcesFailed > 0)
  );
  const metrics = summary ? metricsFromCounters(summary, runDuration) : emptyMetrics(runDuration);
  const sources = summary?.perSource.map((source) => ({
    sourceId: source.sourceId,
    name: source.name,
    attempted: true as const,
    ok: source.ok,
    metrics: metricsFromCounters(source, null),
  })) ?? [];
  const observation: HealthObservation = {
    schemaVersion: 1,
    identity: input.identity,
    executionState: executionSucceeded ? "success" : "failure",
    sourcesAttempted: summary?.sourcesAttempted ?? 0,
    sourcesSucceeded: summary?.sourcesSucceeded ?? 0,
    sourcesFailed: summary?.sourcesFailed ?? 0,
    sourceHealthFailures: summary?.sourceHealthFailures ?? 0,
    metrics,
    sources,
  };

  const pipelineBaselines = buildPipelineBaselines(history);
  const sourceBaselines = buildSourceBaselines(history);
  const successfulHistory = successfulScheduledHistory(history);
  const baselineState: BaselineState = successfulHistory.length >= MIN_BASELINE_OBSERVATIONS ? "established" : "insufficient_history";
  const expectedInterval = input.expectedIntervalHours ?? DEFAULT_EXPECTED_INTERVAL_HOURS;
  const targetInterval = input.targetIntervalHours ?? SIX_HOUR_TARGET_INTERVAL;
  const schedule = assessSchedule(history, input.identity.startedAt, expectedInterval, input.identity.event);
  const configuredForTarget = expectedInterval <= targetInterval;
  const anomalies: HealthAnomaly[] = [];

  if (!summary) {
    anomalies.push({ severity: "critical", code: "worker_failed", scope: "run", message: "Discovery worker failed before producing a complete summary." });
  } else {
    if (summary.sourcesAttempted === 0) {
      anomalies.push({ severity: "critical", code: "no_sources_attempted", scope: "run", message: "Discovery completed without attempting an active source." });
    }
    if (summary.sourcesFailed >= 2) {
      anomalies.push({ severity: "critical", code: "multiple_sources_failed", scope: "run", message: "Multiple active sources failed in one observation.", observed: summary.sourcesFailed });
    }
    if (summary.sourcesSucceeded === 0 && summary.sourcesFailed > 0) {
      anomalies.push({ severity: "critical", code: "all_sources_failed", scope: "run", message: "Every attempted source failed." });
    }
    if (summary.sourceHealthFailures > 0) {
      anomalies.push({ severity: "warning", code: "source_health_write_failed", scope: "run", message: "One or more source-health updates failed.", observed: summary.sourceHealthFailures });
    }
    addPipelineAnomalies(anomalies, metrics, pipelineBaselines, history);
    addSourceAnomalies(anomalies, sources, sourceBaselines);
  }
  if (schedule.state === "missed") {
    anomalies.push({ severity: "critical", code: "scheduled_run_missed", scope: "schedule", message: schedule.reason, observed: schedule.observedGapHours ?? undefined });
  } else if (schedule.state === "delayed") {
    anomalies.push({ severity: "warning", code: "scheduled_run_delayed", scope: "schedule", message: schedule.reason, observed: schedule.observedGapHours ?? undefined });
  } else if (schedule.state === "unknown") {
    anomalies.push({ severity: "informational", code: "schedule_history_insufficient", scope: "schedule", message: schedule.reason });
  }

  const critical = anomalies.some((anomaly) => anomaly.severity === "critical");
  const warning = anomalies.some((anomaly) => anomaly.severity === "warning");
  const observedState = baselineState === "insufficient_history" ? "observed" : "healthy";
  const pipelineState = critical ? "failed" : warning ? "degraded" : observedState;
  const sourceState = !summary || summary.sourcesSucceeded === 0 ? "failed" : summary.sourcesFailed > 0 ? "degraded" : observedState;
  const criteria = readinessCriteria(observation, history, schedule, configuredForTarget, input.verificationPassed ?? false);

  return {
    schemaVersion: 1,
    identity: input.identity,
    execution: { state: observation.executionState, durationMs: runDuration, workerErrors: summary?.errors ?? 1 },
    schedule: { ...schedule, targetIntervalHours: targetInterval, configuredForTarget },
    baseline: {
      state: baselineState,
      basis: "successful_scheduled_runs",
      historyDepth: successfulHistory.length,
      requiredHistory: MIN_BASELINE_OBSERVATIONS,
      pipeline: pipelineBaselines,
      sources: sourceBaselines,
    },
    sourceHealth: {
      state: sourceState,
      attempted: observation.sourcesAttempted,
      succeeded: observation.sourcesSucceeded,
      failed: observation.sourcesFailed,
      sourceHealthFailures: observation.sourceHealthFailures,
      sources: sources.map((source) => ({
        ...source,
        baselineState: sourceBaselines[source.sourceId]?.state ?? ("insufficient_history" as BaselineState),
      })),
    },
    pipelineHealth: { state: pipelineState, metrics },
    anomalies,
    productionEvidence: {
      state: input.identity.commitSha && input.identity.workflowRunId ? "captured" : "partial",
      retainedHistoryDepth: Math.min(history.length + 1, HEALTH_HISTORY_LIMIT),
      reportContainsSecrets: false,
    },
    readiness: {
      state: criteria.every((criterion) => criterion.passed)
        ? "PROVEN"
        : configuredForTarget && successfulScheduledHistory([...history, observation]).length > 0
          ? "PARTIALLY_PROVEN"
          : "NOT_YET_PROVEN",
      criteria,
    },
    observation,
  };
}

export function appendObservation(history: HealthHistory | undefined, observation: HealthObservation): HealthHistory {
  const logicalMatch = (candidate: HealthObservation): boolean => {
    if (candidate.identity.workflowRunId && observation.identity.workflowRunId) {
      return candidate.identity.workflowRunId === observation.identity.workflowRunId;
    }
    return candidate.identity.event === observation.identity.event
      && candidate.identity.commitSha === observation.identity.commitSha
      && candidate.identity.startedAt === observation.identity.startedAt;
  };
  return {
    schemaVersion: 1,
    observations: [
      ...(history?.observations ?? []).filter((candidate) => !logicalMatch(candidate)),
      observation,
    ].slice(-HEALTH_HISTORY_LIMIT),
  };
}

export function classifyFreshness(deadline: string | null, discoveredAt: string | null, now: string): FreshnessState {
  const nowMs = Date.parse(now);
  if (!Number.isFinite(nowMs)) return "unknown";
  if (deadline) {
    const deadlineMs = Date.parse(deadline);
    if (!Number.isFinite(deadlineMs)) return "unknown";
    if (deadlineMs <= nowMs) return "expired";
  }
  if (!discoveredAt) return "unknown";
  const discoveredMs = Date.parse(discoveredAt);
  if (!Number.isFinite(discoveredMs) || discoveredMs > nowMs) return "unknown";
  const ageDays = (nowMs - discoveredMs) / 86_400_000;
  if (ageDays <= 7) return "fresh";
  if (ageDays <= 30) return "aging";
  return "stale";
}
