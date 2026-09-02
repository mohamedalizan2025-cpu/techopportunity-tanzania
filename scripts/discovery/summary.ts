import type { DiscoverySummary, SourceRunResult } from "./types";

type NumericSourceMetric = {
  [K in keyof SourceRunResult]: SourceRunResult[K] extends number ? K : never
}[keyof SourceRunResult];

function sum(results: SourceRunResult[], key: NumericSourceMetric): number {
  return results.reduce((total, result) => total + (result[key] as number), 0);
}

/**
 * Reconcile every run-level counter from the structured per-source results.
 * This prevents drift between the operator-facing aggregate and its evidence.
 */
export function reconcileDiscoverySummary(summary: DiscoverySummary): DiscoverySummary {
  const results = summary.perSource;
  const sourcesFailed = results.filter((result) => !result.ok).length;
  return {
    ...summary,
    sourcesAttempted: results.length,
    sourcesSucceeded: results.filter((result) => result.ok).length,
    sourcesFailed,
    candidatesFound: sum(results, "candidatesFound"),
    noiseRejected: sum(results, "noiseRejected"),
    structurallyValidCandidates: sum(results, "structurallyValidCandidates"),
    evidencePresent: sum(results, "evidencePresent"),
    deadlineEvidencePresent: sum(results, "deadlineEvidencePresent"),
    eligibilityEvidencePresent: sum(results, "eligibilityEvidencePresent"),
    relevanceEvidencePresent: sum(results, "relevanceEvidencePresent"),
    applicationEvidencePresent: sum(results, "applicationEvidencePresent"),
    relevanceRejected: sum(results, "relevanceRejected"),
    eligibilityRejected: sum(results, "eligibilityRejected"),
    eligibilityUnknown: sum(results, "eligibilityUnknown"),
    detailFetches: sum(results, "detailFetches"),
    detailSucceeded: sum(results, "detailSucceeded"),
    detailFailures: sum(results, "detailFailures"),
    detailDeadlineFound: sum(results, "detailDeadlineFound"),
    detailEligibilityFound: sum(results, "detailEligibilityFound"),
    detailApplicationFound: sum(results, "detailApplicationFound"),
    duplicatesSkipped: sum(results, "duplicatesSkipped"),
    deduplicatedCandidates: sum(results, "deduplicatedCandidates"),
    validCandidates: sum(results, "validCandidates"),
    categorySkipped: sum(results, "categorySkipped"),
    insertedPending: sum(results, "insertedPending"),
    sourceHealthFailures: results.filter((result) => !result.sourceHealthUpdated).length,
    errors: sourcesFailed,
  };
}
