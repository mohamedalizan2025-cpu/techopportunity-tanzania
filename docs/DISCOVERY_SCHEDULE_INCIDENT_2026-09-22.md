# Discovery schedule incident — 2026-09-22

## Status

The bounded code mitigation is implemented; operational closure remains pending
future real `schedule` events. Discovery stays at a two-hour target cadence and
all qualification, authority, dedupe, pending-only, and human-publication rules
are unchanged.

## Evidenced root cause

This incident is classified as **A: GitHub schedule delay/drop**, specifically
the known risk of scheduling at the start of the hour.

Production inspection on 2026-09-22 established:

- `main` is the repository default branch and both `Discovery sync` and
  `Discovery schedule health` are active;
- the workflow files exist on `main` and use `contents: read`;
- Discovery had `cancel-in-progress: false`, one shared production lane, and a
  30-minute timeout;
- recent successful Discovery jobs completed in about two minutes, so no job
  occupied the lane across a two-hour window;
- among the last 100 workflow records, 79 were scheduled Discovery runs:
  78 succeeded, one failed on 2026-09-10, and zero were cancelled or skipped;
- from 2026-09-19 through the audit, delivered schedule-event gaps repeatedly
  ranged from about 2.9 to 6.7 hours despite `0 */2 * * *`; and
- the incident monitor at `2026-09-22T05:16:55Z` correctly restored run
  `35672645196`, whose worker observation began at `00:37:13Z`, and reported a
  4.662-hour gap as `scheduled_run_missed` under the unchanged two-hour interval
  plus two-hour tolerance.

GitHub creates no workflow-run record for a schedule event it never delivers, so
an individual absent nominal slot cannot be named from the API. The combination
of missing run records, long schedule-event gaps, short successful job durations,
zero cancellations/skips, active workflows, and the correct default branch rules
out workflow cancellation, disabled/default-branch state, and monitor
misclassification as the cause of this incident.

GitHub documents that scheduled workflows can be delayed during high load,
especially at the start of the hour, and that queued jobs can be dropped. It
recommends choosing another minute: [Events that trigger workflows — schedule](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
GitHub cron is therefore a best-effort trigger, not an exact two-hour SLA.

## Bounded mitigation

- Old Discovery cron: `0 */2 * * *`.
- New Discovery cron: `17 */2 * * *`.
- Old observer cron: `30 */2 * * *`.
- New observer cron: `47 */2 * * *`, still 30 minutes after each nominal
  Discovery slot.
- `DISCOVERY_SCHEDULE_MINUTE=17` is explicit in both workflows and the health
  evaluator reports nominal slots at `00:17`, `02:17`, …, `22:17` UTC.
- The target interval remains two hours. The tolerance remains two hours; there
  is no evidence that weakening it would improve truthfulness.
- `workflow_dispatch` remains the bounded manual recovery path. It uses the same
  worker, pending-only write path, qualification, authority, lifecycle, and
  dedupe controls. No retry or self-trigger loop was added.

Schedule state continues to use retained worker observations, not merely workflow
creation. Complete successful `schedule` observations mature baselines; manual,
push, failed, incomplete, and retry-duplicate observations do not. A late real
scheduled execution can report `delayed`; the observer reports `missed` when no
scheduled worker observation exists inside interval plus tolerance. Cancelled,
skipped, pre-worker failures, and undelivered events cannot create a successful
worker observation and therefore cannot make schedule health green.

## Concurrency finding

No Discovery concurrency defect was found. Scheduled, push, and manual Discovery
runs share `discovery-production`; `cancel-in-progress: false` prevents an active
worker from being cancelled, the 30-minute timeout prevents it from occupying the
next two-hour slot, and overlapping workers remain prohibited. A pending run can
still be observably replaced under GitHub's concurrency semantics, but no such
cancellation exists in the incident history. The observer's separate concurrency
group cannot cancel or suppress Discovery.

## Operational closure and contingency

After deployment, observe at least six consecutive new `:17` nominal cycles
(12 hours), and continue through a full 24-hour window if practical. Evidence
must be real `schedule` events on the incident-fix SHA or a later unchanged SHA;
a push or manual success is recovery evidence only. Confirm run event, SHA,
conclusion, worker observation, `scheduleMinute: 17`, nominal slot, dispatch
latency, and the absence of a new `scheduled_run_missed` critical anomaly.

Until that window exists, the incident is code-closed but not operationally
proven closed. If missed schedule events continue after the off-hour observation
window, the next recommendation is an external scheduler using available
Azure/student resources to invoke the existing bounded Discovery path. That is a
contingency only: no Azure migration, new worker, changed cadence, or altered
admission logic is authorized by this incident.
