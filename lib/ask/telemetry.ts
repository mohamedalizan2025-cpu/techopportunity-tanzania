/**
 * Privacy-safe operational counters for Ask Tech Opportunity. Aggregates
 * only: request counts, provider mode, fallback reasons, latency
 * observations. Never records questions, answers, user identifiers,
 * slugs, or profile content. In-memory and instance-local; the
 * evaluation harness snapshots and reports them. Raw conversations are
 * never persisted anywhere in V1.
 */
export interface AskTelemetry {
  askRequests: number;
  aiAnswers: number;
  deterministicAnswers: number;
  validationFailures: number;
  quotaExhausted: number;
  timeouts: number;
  totalLatencyMs: number;
  latencyObservations: number;
}

const counters: AskTelemetry = {
  askRequests: 0,
  aiAnswers: 0,
  deterministicAnswers: 0,
  validationFailures: 0,
  quotaExhausted: 0,
  timeouts: 0,
  totalLatencyMs: 0,
  latencyObservations: 0,
};

export function recordAskRequest(): void {
  counters.askRequests += 1;
}

export function recordAskOutcome(outcome: "ai" | "deterministic" | "invalid_response" | "quota" | "timeout"): void {
  if (outcome === "ai") counters.aiAnswers += 1;
  if (outcome === "deterministic") counters.deterministicAnswers += 1;
  if (outcome === "invalid_response") counters.validationFailures += 1;
  if (outcome === "quota") counters.quotaExhausted += 1;
  if (outcome === "timeout") counters.timeouts += 1;
}

export function recordAskLatency(latencyMs: number): void {
  if (!Number.isFinite(latencyMs) || latencyMs < 0) return;
  counters.totalLatencyMs += latencyMs;
  counters.latencyObservations += 1;
}

export function snapshotAskTelemetry(): AskTelemetry {
  return { ...counters };
}

export function resetAskTelemetryForTests(): void {
  counters.askRequests = 0;
  counters.aiAnswers = 0;
  counters.deterministicAnswers = 0;
  counters.validationFailures = 0;
  counters.quotaExhausted = 0;
  counters.timeouts = 0;
  counters.totalLatencyMs = 0;
  counters.latencyObservations = 0;
}
