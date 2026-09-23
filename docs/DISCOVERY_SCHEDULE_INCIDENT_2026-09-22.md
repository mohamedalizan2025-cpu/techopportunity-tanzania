# Discovery schedule incident — 2026-09-22

## Status

The incident remains **NOT_YET_PROVEN** and the `:17` GitHub schedule experiment
is now **confirmed unreliable and awaiting a scheduler change**. Discovery stays
at a two-hour target cadence with a two-hour tolerance. All qualification,
authority, dedupe, pending-only, and human-publication rules are unchanged.

## Evidenced root cause

The original incident was classified as **A: GitHub schedule delay/drop**,
specifically the known risk of scheduling at the start of the hour.

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

### 2026-09-23 follow-up

Authenticated Actions evidence after the `:17` change shows four scheduled
Discovery runs: `35764031590` succeeded at `17:57:39Z`, `35786175596`
succeeded at `21:21:52Z`, `35802833205` failed at `00:37:00Z`, and
`35833551425` failed at `07:47:12Z`. Their delivered-run gaps were about
3.404, 3.252, and 7.170 hours. Both failures completed checkout, Node setup,
and dependency installation, then failed the permanent verification gate on
the same AI opportunity test before history restoration or worker execution.
Neither was cancelled, stalled, skipped, nor retried.

That test combined a live-clock expected value with a fixed-clock result,
causing an `about 23 days` versus `about 24 days` mismatch. Production deadline
semantics were not wrong. The current incident therefore includes **B:
dispatched but failed before the worker**. Independent 3.4- and 7.2-hour gaps
also show that **A: missing/delayed dispatch** persists at `:17`. The experiment
is confirmed unreliable, not operationally proven.

Health run `35834538425`, evaluated at `2026-09-23T07:58:55.465Z`, restored
`discovery-health-35786175596-1`. It correctly identified the last successful
scheduled worker observation at `2026-09-22T21:22:45Z`, calculated a
10.6027575-hour gap and 66-minute dispatch latency from the nominal `20:17Z`
slot, and reported critical `scheduled_run_missed` / `NOT_YET_PROVEN`. The
evaluation intentionally failed only after writing its report; the always-upload
then succeeded as artifact `discovery-schedule-health-35834538425-1` (artifact
ID `10738273361`). **C: monitor evidence failure is ruled out.** No concurrency,
cancellation, disabled-workflow, default-branch, or long-running-worker cause
was found (**D ruled out**).

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

This repair fixes the mixed-clock test and adds explicit UTC/date-boundary
coverage without changing deadline behavior. Deadline alert evaluation also
writes a credential-free `blocked` report when verification fails before alert
work; the verification failure still makes the workflow fail and the artifact
upload remains strict. Action runtimes that emitted Node 20 / `DEP0040` warnings
move to their official Node 24 releases. Application dependencies are unchanged
because the observed warnings came from action runtimes.

No external service, paid resource, credential, migration, or alternate worker
is provisioned here. The bounded contingency is:

1. Use an owner-approved existing no-cost scheduler to call a narrowly scoped
   GitHub trigger every two hours.
2. Reuse the existing workflow, concurrency group, timeout, gates, secret
   scoping, worker, and pending-only behavior.
3. Before activation, add a dedicated authenticated `external_schedule` trigger
   identity and validated nominal-slot input. Do not relabel ordinary
   `workflow_dispatch` runs as scheduled evidence.
4. Extend retained evidence to distinguish `github_schedule`,
   `external_schedule`, `manual`, and `push`; deduplicate each nominal slot and
   reject malformed, future, or replayed slot claims.
5. Prove at least six consecutive external scheduled observations (12 hours),
   preferably 24 hours, under the same two-hour target and tolerance.
6. Keep GitHub cron until that proof is complete, then remove the redundant
   trigger in a separate reviewed change.

Manual and push successes remain recovery evidence only and cannot satisfy
scheduled readiness. Once this repair is deployed, the exact next operational
action is to confirm ordinary CI restores worker eligibility and inspect the
next real `:17` schedule plus health artifact. In parallel, the owner must
select and authorize an existing no-cost external scheduler and least-privilege
GitHub credential.
The external trigger identity and health contract must be implemented before the
first external run. Operational closure still requires real scheduled evidence.
