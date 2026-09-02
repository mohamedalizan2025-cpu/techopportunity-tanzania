# Milestone 26 — Six-Hour Evidence Closure Audit

## Observation cutoff

Evidence was inspected at `2026-09-02T01:11:04Z`, after M25 commit
`6c17beffbeceb2d374d71afce3dd8dcfe9029c3b` deployed at `00:59:38Z` and
before the first natural M25 schedule window at `03:00Z`.

GitHub contained one post-rollout Discovery Sync run:

| Run | Event | SHA | Result | Comparable scheduled observation |
|---|---|---|---|---|
| `33577574165` | `push` | `6c17beffbeceb2d374d71afce3dd8dcfe9029c3b` | Success; 18/18 active sources, zero failures, zero pending insertions; health artifact retained | No |

The schedule observer run `33577574239` was also a `push`. It succeeded and
correctly retained `unknown` schedule / `insufficient_history` evidence. There
were zero post-M25 `schedule` events. Five older schedule-event runs all failed
and predate the M24 schema, so none is backfilled.

## Decision

- Successful comparable scheduled observations: `0`
- Repeatability requirement: `3`
- Baseline requirement: `5`
- Pipeline baseline: `insufficient_history`
- Source-specific baseline: `insufficient_history`
- Six-hour readiness: `NOT_YET_PROVEN`

No concurrency delay, replacement, missed M25 window, source trend, runtime
trend, load trend, or anomaly-threshold behavior can yet be inferred. Existing
thresholds and the two-hour tolerance remain unchanged.

## Evidence-integrity correction

Review found two deterministic accounting defects before natural evidence
could reach the relevant thresholds:

1. Baseline statistics used prior history only, so observation five was saved
   but its report still declared four observations and delayed maturity until
   run six.
2. Readiness combined history and the current retry before logical-run
   replacement, allowing two attempts of one workflow run ID to be counted
   separately in the readiness criteria.

M26 now computes descriptive maturity from the retained history after logical
replacement, including the current successful scheduled observation. Anomaly
comparison remains prior-only, preventing self-dilution. Readiness uses the
same de-duplicated retained view. The observer emits the scheduled baseline
state and exact observation requirement.

## Preserved boundaries

No scheduled evidence was generated, replayed, reclassified, or backfilled.
No database query wrote data. M26 changes no cron, concurrency behavior,
qualification, dedupe, source, threshold, migration, historical record,
moderation, publication, AI, or network boundary.
