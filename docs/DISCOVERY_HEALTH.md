# Discovery Health Contract

Discovery health observes the existing pipeline; it never changes
qualification, deduplication, moderation, publication, or database state.

## Report and retention

Every production worker execution emits `DISCOVERY_HEALTH_REPORT_JSON` and, in
GitHub Actions, writes:

- `discovery-health/report.json`: the current stable-schema health report;
- `discovery-health/history.json`: at most 24 observations; and
- a concise GitHub step summary.

The workflow restores the newest bounded history from a uniquely keyed GitHub
Actions cache and uploads both JSON files as a 90-day run artifact. Cache loss
does not change discovery behavior: the next report honestly returns to
`insufficient_history`. The artifact contains source identity and numeric
outcomes, but no source URLs, raw errors, environment variables, tokens, or
credentials. No health code imports Supabase or a network client.

The separate `Discovery schedule health` workflow runs without credentials
every six hours and on relevant pushes. It only reads the retained history. It
does not invoke the discovery worker or change the production discovery cron.
It exits non-zero on a deterministic missed-run result and uploads its own
schedule report.

## Execution and source semantics

Run identity records commit SHA, workflow run ID/name/event, start, finish,
duration, and success/failure. A thrown worker with no complete summary is a
critical `worker_failed` observation. An all-source failure remains a failed
worker outcome; partial source failures preserve existing failure isolation.

Each attempted source reports success/failure and the existing worker's exact
counts: candidate, noise, structural, relevance, eligibility, unknown,
duplicate, post-dedupe, category, valid, insertion, detail-fetch/detail-failure,
detail evidence, and general evidence counts. Derived rates use those same
counters. Source duration is `null` because it is not currently measured; the
report never substitutes zero for unavailable evidence.

## Schedule states

Production discovery remains daily at `0 3 * * *`. Its expected interval is 24
hours with a six-hour tolerance, reflecting observed GitHub scheduler delay
without pretending cron is exact.

- `on_time`: the latest scheduled observation is no older than 30 hours.
- `delayed`: a scheduled execution occurred after tolerance but before a
  second interval elapsed.
- `missed`: an observer finds no scheduled execution inside interval plus
  tolerance, or a scheduled execution arrives more than two intervals late.
- `unknown`: timestamps are invalid or no scheduled observation is retained.

The six-hour target is recorded separately. A six-hour observer is not a
six-hour discovery schedule and does not satisfy readiness by itself.

## Baselines

Baselines are descriptive and source-aware. At least five prior successful,
schema-compatible observations are required. Before that, the run and each
source report `insufficient_history`. Established baselines expose observation
count, mean, minimum, and maximum for candidate volume, rejection/unknown/
duplicate rates, detail and evidence rates, qualified/inserted counts, and run
duration.

History is bounded to 24 observations. Earlier production runs are documented
evidence but are not silently converted into the new schema when exact counters
were unavailable. This avoids manufacturing a stable baseline from partial or
incomparable data.

## Deterministic anomalies

Critical findings are immediate hard failures:

- worker failure or zero sources attempted;
- all sources failed or at least two active sources failed; and
- missed scheduled execution.

Warnings include one isolated source failure, source-health write failure,
severe candidate-volume deviation, severe/consecutive rate degradation,
qualified-candidate disappearance against a strong baseline, insertion spikes,
and consecutive insertion collapse. Source volume, eligibility-unknown,
duplicate, detail, and evidence signals use that source's own history.

Soft rate anomalies require at least 10 relevant candidates (three detail
fetches for detail success). A moderate first deviation is informational and
normally requires a consecutive observation before becoming a warning. A
successful zero-qualified or zero-insertion run is valid when sources execute;
it is not treated as failure without sufficient comparative evidence. None of
these findings modifies pipeline decisions.

## Trust and freshness foundation

The worker now counts real evidence present, explicit deadline/rolling
evidence, qualification eligibility/relevance evidence, application evidence,
detail evidence, source identity, discovery/run timestamp, and dedupe outcome.
These are foundations for later user-facing explanations, not permission to
display a “verified” badge.

Freshness is a pure read-only classification:

- `expired`: explicit deadline is at or before now;
- `fresh`: discovered no more than 7 days ago;
- `aging`: discovered 8–30 days ago;
- `stale`: discovered more than 30 days ago; and
- `unknown`: missing/malformed evidence or inconsistent timestamps.

It does not alter current publication semantics or historical rows. A future
public treatment must be separately designed and moderator-safe.

## Six-hour readiness

`PROVEN` requires all ten criteria in the report: target schedule configured,
workflow/run identity captured, worker success, at least 80% source reachability,
observable failures, at least three successful scheduled observations, timing
inside tolerance, reconciled metrics, anomaly evaluation, and preceding
security verification. The current daily discovery schedule fails the first
criterion, and retained scheduled history initially fails the repeatability
criteria. Therefore the honest state is `NOT_YET_PROVEN`.
