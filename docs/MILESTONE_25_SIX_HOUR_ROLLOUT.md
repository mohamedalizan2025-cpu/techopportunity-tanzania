# Milestone 25 — Controlled Six-Hour Discovery Rollout

## Starting evidence

M25 starts clean and synchronized at M24 commit
`485b0000e91a31cf09fbbd80407f9345dd757d4f`. The M24 push execution proved
18/18 active-source success and retained the first health-schema observation,
but it was a `push`, not a scheduled execution. Scheduled history depth and
scheduled baseline depth therefore start at zero.

GitHub's public run history contains five older `schedule`-event executions
from August 28 through September 1, all concluded `failure` and all predate the
M24 health schema. They are operational history, not successful comparable M25
observations, and are not backfilled into the baseline.

## Operating contract

Discovery Sync has one UTC schedule: `0 3/6 * * *`, producing windows at 03:00,
09:00, 15:00, and 21:00 UTC. Tanzania observes them at 06:00, 12:00, 18:00,
and 00:00 EAT. The expected interval is six hours and tolerance is two hours.
The credential-free observer runs 30 minutes after each nominal window.

Scheduled and manual invocations share `discovery-production` with
`cancel-in-progress: false`. A live worker is not cancelled; another invocation
may wait in the same lane. GitHub permits at most one pending member of a
concurrency group and can replace an older pending run with a newer one; that
outcome remains visible as a cancelled workflow and as missing schedule
evidence to the independent observer. The existing 30-minute timeout is far
shorter than the six-hour interval, preventing routine starvation by a stuck
job. No automatic retry loop is added.

## Evidence discipline

Only complete successful `schedule` observations enter pipeline and
source-specific baselines. Manual dispatches, pushes, failures, incomplete
schema, and duplicate attempts of one GitHub run ID are excluded. Run-attempt
keys preserve each artifact while replacement by logical run ID prevents retry
inflation.

Readiness progresses honestly:

- `NOT_YET_PROVEN`: configured only, with no real scheduled success;
- `PARTIALLY_PROVEN`: at least one real scheduled success, but fewer than the
  three required by the readiness contract; and
- `PROVEN`: all ten M24 criteria pass with at least three successful scheduled
  executions and timing inside tolerance.

Baseline maturity remains separate and requires five comparable successful
scheduled observations. No scheduled observation is simulated or backfilled.

## Preserved boundaries

M25 changes scheduling and evidence classification only. It introduces no
migration, source change, cleanup, historical mutation, retry amplification,
qualification change, AI, public health UI, auto-publication, or moderation
bypass. Every discovered row remains pending and existing dedupe/detail/network
limits remain unchanged.
