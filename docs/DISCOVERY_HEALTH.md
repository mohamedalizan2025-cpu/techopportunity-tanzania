# Discovery Health Contract

Discovery health observes the existing pipeline; it never changes
qualification, deduplication, moderation, publication, or database state.

## Report and retention

Every production worker execution emits `DISCOVERY_HEALTH_REPORT_JSON` and, in
GitHub Actions, writes:

- `discovery-health/report.json`: the current stable-schema health report;
- `discovery-health/history.json`: at most 24 observations; and
- `discovery-health/trigger-report.json`: credential-free trigger admission evidence; and
- a concise GitHub step summary.

The workflow restores the newest bounded history from a key containing GitHub
run ID and run attempt, and uploads the JSON evidence as a 90-day run artifact.
A re-run replaces the same logical workflow observation instead of inflating
the baseline. Cache loss
does not change discovery behavior: the next report honestly returns to
`insufficient_history`. The artifact contains source identity and numeric
outcomes, but no source URLs, raw errors, environment variables, tokens, or
credentials. No health code imports Supabase or a network client.

The separate `Discovery schedule health` workflow runs without credentials at
minute 47, 30 minutes after every minute-17 discovery window, and on relevant
pushes. It only reads retained history and does not invoke the discovery worker.
It exits non-zero on a deterministic missed-run result or, after owner
activation, while external repeatability is unproven; it uploads its own schedule
report.

## Execution and source semantics

Run identity records commit SHA, workflow run ID/name/event, run attempt, actor,
native-scheduled/external-schedule/manual/push trigger kind, exact external
nominal slot when applicable, start, finish, duration, and success/failure.
A thrown worker with no complete summary is a
critical `worker_failed` observation. An all-source failure remains a failed
worker outcome; partial source failures preserve existing failure isolation.

Each attempted source reports success/failure and the existing worker's exact
counts: candidate, noise, structural, relevance, eligibility, unknown,
duplicate, post-dedupe, category, valid, insertion, detail-fetch/detail-failure,
detail evidence, and general evidence counts. Derived rates use those same
counters. Source duration is `null` because it is not currently measured; the
report never substitutes zero for unavailable evidence.

## Schedule states

The repository retains one native GitHub Actions UTC cron, `17 */2 * * *`: 00:17,
02:17, …, and 22:17 UTC. It moved from `0 */2 * * *` after the 2026-09-22
schedule-delivery incident to reduce GitHub's documented start-of-hour delay/drop
risk. When the owner enables the prepared external trigger, the native schedule
still records a run but its worker job is skipped; only the authenticated
external dispatch may execute the worker for that slot. The expected and target
interval remain two hours. The existing formula
`max(2 hours, 25% of the interval)` gives a two-hour tolerance; the incident did
not justify weakening that threshold.

- `on_time`: the latest scheduled observation is no older than 4 hours.
- `delayed`: a scheduled execution occurred after tolerance but before a
  second interval plus tolerance elapsed (more than 4 and no more than 6 hours).
- `missed`: an observer finds no scheduled execution inside interval plus
  tolerance, or a scheduled execution arrives more than 6 hours after the
  preceding retained scheduled observation.
- `unknown`: timestamps are invalid or no scheduled observation is retained.

Nominal slot and dispatch latency use the configured minute 17, never the old
minute 0 assumption. All timestamps are parsed as absolute instants;
display/local timezone does not participate in the calculation. GitHub schedule
delivery is best-effort, not a two-hour SLA; see
[the incident record](DISCOVERY_SCHEDULE_INCIDENT_2026-09-22.md).

## Baselines

Baselines are descriptive and source-aware. Only successful, complete,
schema-compatible native or authenticated external scheduled observations
participate. Pushes, manual
dispatches, failures, incomplete observations, and retry duplicates do not.
At least five prior observations are required. Before that, the run and each
source report `insufficient_history`. Established baselines expose observation
count, mean, minimum, and maximum for candidate volume, rejection/unknown/
duplicate rates, detail and evidence rates, qualified/inserted counts, and run
duration.

The current successful scheduled observation contributes to descriptive
maturity, so the fifth valid run reports `established`. Anomaly comparisons use
prior observations only; the current run never dilutes its own deviation.
`comparisonHistoryDepth` makes that distinction explicit. A re-run replaces its
earlier attempt before both maturity and readiness are evaluated.

History is bounded to 24 observations. Earlier production runs are documented
evidence but are not silently converted into the new schema when exact counters
were unavailable. This avoids manufacturing a stable baseline from partial or
incomparable data.

## Deterministic anomalies

Critical findings are immediate hard failures:

- worker failure or zero sources attempted;
- all sources failed or at least two active sources failed; and
- missed scheduled execution; and
- owner-enabled external scheduling with fewer than three successful distinct
  nominal slots.

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

## Two-hour readiness

`PARTIALLY_PROVEN` means the target schedule is configured and at least one real
scheduled success is retained, but the minimum repeatability contract is not
yet complete. When the owner enables external scheduling, health remains critical
and `NOT_YET_PROVEN` until three successful external runs at distinct nominal
slots are retained. `PROVEN` requires the standard criteria in the report: target schedule configured,
workflow/run identity captured, worker success, at least 80% source reachability,
observable failures, at least three successful scheduled observations, timing
inside tolerance, reconciled metrics, anomaly evaluation, and preceding
security verification, plus external repeatability when enabled. Five successful scheduled observations are separately
required for baseline maturity. Configuration or push execution alone remains
`NOT_YET_PROVEN`.

The prepared external design, cost limits, authentication, activation, and
rollback are in [DISCOVERY_EXTERNAL_SCHEDULER.md](DISCOVERY_EXTERNAL_SCHEDULER.md).
