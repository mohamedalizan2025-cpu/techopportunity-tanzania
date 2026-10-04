/**
 * Privacy-safe operational counters for Opportunity Intelligence.
 * Aggregates only: attempts, outcomes, validation failures, and latency
 * observations. Never records prompts, responses, user identifiers, slugs,
 * or any profile content. In-memory and instance-local by design; the
 * evaluation harness snapshots and reports them.
 */
export interface OpportunityIntelligenceTelemetry {
  providerAttempts: number;
  aiSuccesses: number;
  deterministicFallbacks: number;
  validationFailures: number;
  quotaExhausted: number;
  timeouts: number;
  totalLatencyMs: number;
  latencyObservations: number;
}

const counters: OpportunityIntelligenceTelemetry = {
  providerAttempts: 0,
  aiSuccesses: 0,
  deterministicFallbacks: 0,
  validationFailures: 0,
  quotaExhausted: 0,
  timeouts: 0,
  totalLatencyMs: 0,
  latencyObservations: 0,
};

export function recordInsightAttempt(): void {
  counters.providerAttempts += 1;
}

export function recordInsightOutcome(outcome: "ai" | "fallback" | "invalid_response" | "quota" | "timeout"): void {
  // Event counters (quota/timeout/invalid) tally per occurrence;
  // deterministicFallbacks tallies terminal fallback outcomes exactly once.
  if (outcome === "ai") counters.aiSuccesses += 1;
  if (outcome === "fallback") counters.deterministicFallbacks += 1;
  if (outcome === "invalid_response") counters.validationFailures += 1;
  if (outcome === "quota") counters.quotaExhausted += 1;
  if (outcome === "timeout") counters.timeouts += 1;
}

export function recordInsightLatency(latencyMs: number): void {
  if (!Number.isFinite(latencyMs) || latencyMs < 0) return;
  counters.totalLatencyMs += latencyMs;
  counters.latencyObservations += 1;
}

export function snapshotInsightTelemetry(): OpportunityIntelligenceTelemetry {
  return { ...counters };
}

export function resetInsightTelemetryForTests(): void {
  counters.providerAttempts = 0;
  counters.aiSuccesses = 0;
  counters.deterministicFallbacks = 0;
  counters.validationFailures = 0;
  counters.quotaExhausted = 0;
  counters.timeouts = 0;
  counters.totalLatencyMs = 0;
  counters.latencyObservations = 0;
}
