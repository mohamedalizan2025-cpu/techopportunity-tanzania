import { reconcileDiscoverySummary } from "../scripts/discovery/summary";
import type { DiscoverySummary, SourceRunResult } from "../scripts/discovery/types";

let passed = 0;
let failed = 0;
function assert(name: string, condition: boolean, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` - ${detail}` : ""}`);
  }
}

const sourceResult = (overrides: Partial<SourceRunResult>): SourceRunResult => ({
  sourceId: "source",
  name: "Source",
  ok: true,
  candidatesFound: 0,
  noiseRejected: 0,
  structurallyValidCandidates: 0,
  relevanceRejected: 0,
  eligibilityRejected: 0,
  eligibilityUnknown: 0,
  detailFetches: 0,
  detailSucceeded: 0,
  detailFailures: 0,
  detailDeadlineFound: 0,
  detailEligibilityFound: 0,
  detailApplicationFound: 0,
  duplicatesSkipped: 0,
  deduplicatedCandidates: 0,
  validCandidates: 0,
  categorySkipped: 0,
  insertedPending: 0,
  sourceHealthUpdated: true,
  sourceHealthError: null,
  error: null,
  ...overrides,
});

const perSource = [
  sourceResult({
    sourceId: "a", candidatesFound: 10, noiseRejected: 2,
    structurallyValidCandidates: 8, relevanceRejected: 1,
    eligibilityRejected: 1, eligibilityUnknown: 5, detailFetches: 3,
    detailSucceeded: 2, detailFailures: 1, detailDeadlineFound: 1,
    detailEligibilityFound: 2, detailApplicationFound: 1,
    duplicatesSkipped: 2, deduplicatedCandidates: 4, validCandidates: 3,
    categorySkipped: 1, insertedPending: 3,
  }),
  sourceResult({
    sourceId: "b", ok: false, candidatesFound: 4, noiseRejected: 1,
    structurallyValidCandidates: 3, relevanceRejected: 1,
    eligibilityUnknown: 2, detailFetches: 1, detailFailures: 1,
    duplicatesSkipped: 1, deduplicatedCandidates: 1, validCandidates: 1,
    insertedPending: 0, sourceHealthUpdated: false,
    sourceHealthError: "health update failed", error: "source failed",
  }),
];

const emptySummary: DiscoverySummary = {
  startedAt: "2026-09-01T00:00:00Z",
  finishedAt: "2026-09-01T00:01:00Z",
  sourcesChecked: 3,
  sourcesAttempted: 0,
  sourcesSucceeded: 0,
  sourcesFailed: 0,
  candidatesFound: 0,
  noiseRejected: 0,
  structurallyValidCandidates: 0,
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
  perSource,
};

const summary = reconcileDiscoverySummary(emptySummary);
assert("planned source count is preserved", summary.sourcesChecked === 3);
assert("attempted/succeeded/failed sources derive from evidence", summary.sourcesAttempted === 2 && summary.sourcesSucceeded === 1 && summary.sourcesFailed === 1);
assert("candidate stages reconcile exactly", summary.candidatesFound === 14 && summary.noiseRejected === 3 && summary.structurallyValidCandidates === 11);
assert("qualification counters reconcile exactly", summary.relevanceRejected === 2 && summary.eligibilityRejected === 1 && summary.eligibilityUnknown === 7);
assert("detail counters reconcile exactly", summary.detailFetches === 4 && summary.detailSucceeded === 2 && summary.detailFailures === 2);
assert("detail evidence counters reconcile exactly", summary.detailDeadlineFound === 1 && summary.detailEligibilityFound === 2 && summary.detailApplicationFound === 1);
assert("dedupe/category/insert stages remain distinct", summary.duplicatesSkipped === 3 && summary.deduplicatedCandidates === 5 && summary.categorySkipped === 1 && summary.validCandidates === 4 && summary.insertedPending === 3);
assert("source-health failure is visible independently", summary.sourceHealthFailures === 1);
assert("legacy errors remains the source-failure count", summary.errors === 1);

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
