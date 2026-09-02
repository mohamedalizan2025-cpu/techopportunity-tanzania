# Milestone 24 — Discovery Reliability and Health Baselines

## Starting evidence

M24 started clean and synchronized at M23 commit
`3276bf61f7f15fb36229a2155962dad14dcdab2e`. GitHub has three recent successful
production worker executions:

| Run | Event | SHA | Evidence quality |
|---|---|---|---|
| 7 / `33525075754` | workflow dispatch | `e9b995339ea138bb4abffbbc1adf3898579e6062` | Worker succeeded; 18 source-health successes and 15 pending inserts correlated, but private aggregate stdout unavailable |
| 8 / `33545030490` | workflow dispatch | `850f4d683fe6005b251a7e6037594ea5bc9d4e5a` | Worker succeeded; supplied aggregate metrics and five pending inserts correlated |
| 9 / `33551125688` | push | `3276bf61f7f15fb36229a2155962dad14dcdab2e` | Exact M23 SHA; worker succeeded, 18/18 source-health successes and one pending insert correlated; private aggregate stdout unavailable |

These observations prove repeated execution, not repeated scheduled execution.
They occurred close together and do not all expose the same complete metric
schema. They are not seeded into a statistical baseline. M24 starts retained
health history at zero and reports `insufficient_history` until five comparable
successful observations accumulate.

## Implementation

- Extended the existing `DiscoverySummary`/`SourceRunResult` spine with five
  evidence counters; no competing metric collector was added.
- Added a pure health evaluator covering execution, schedule, sources,
  pipeline, source-aware baselines, deterministic anomalies, trust evidence,
  freshness, and the ten-part readiness contract.
- Added bounded local artifact/history I/O and a failure-path report. Raw errors,
  source URLs, and environment values are deliberately excluded.
- Added cache-backed rolling history and 90-day per-run GitHub artifacts.
- Added a credential-free schedule monitor independent from the worker it
  observes. The daily discovery schedule remains unchanged.
- Extended M23 change classification and static boundaries with a focused
  `discovery-health` gate.

No dependency, migration, source activation/deactivation, registry mutation,
historical cleanup, status change, public route, AI, crawler, or publication
behavior is introduced.

## Threshold policy

Five comparable successful prior observations establish a descriptive
baseline; history is capped at 24. Moderate one-off volume/rate differences are
informational. Warnings require severe magnitude or consecutive confirmation.
Rate checks require absolute sample floors. Hard execution, multi-source, and
missed-schedule failures remain critical immediately.

This policy deliberately permits healthy low-volume and zero-qualified runs.
Health observes qualification; it never weakens or overrides it.

## Current readiness

`SIX_HOUR_READINESS: NOT_YET_PROVEN`

The production discovery cron is still daily, no schema-compatible scheduled
history has accumulated, and no repeated six-hour production sequence exists.
The new observer and retained artifacts make that evidence automatic going
forward without asking the owner to paste logs or manually re-run verification.
