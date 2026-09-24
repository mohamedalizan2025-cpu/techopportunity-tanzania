# Discovery schedule incident — 2026-09-22

## Status

The native `:17` GitHub schedule experiment is **confirmed unreliable**. The
no-cost external scheduler is activated and has established **INITIAL READINESS
PROVEN** with six distinct successful natural slots. The incident remains open:
only about ten hours separate the first and latest completed slots, short of the
required 12–24-hour observation window, and latest pipeline health is critical
for upstream source failures. Discovery stays at a two-hour target cadence with
a two-hour tolerance. All qualification, authority, dedupe, pending-only, and
human-publication rules are unchanged.

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

### 2026-09-23 recovery and scheduler preparation

Commit `c4dc66e` repaired the pre-worker test failure. Its push-triggered
Discovery run `35839051623` passed verification and worker execution, but remains
push recovery evidence only. A later authenticated Actions audit found two new
real native `schedule` events: run `35868675410` succeeded at 16:40 EAT and run
`35902298363` succeeded at 21:24 EAT. They are correctly distinct from push runs
`35839051623` and `35844569114`. The gaps from the preceding scheduled run at
10:47 EAT were about 5 hours 53 minutes and 4 hours 44 minutes. Both exceed the
four-hour interval-plus-tolerance boundary. Two successes prove the repaired
worker can run when GitHub delivers it; they do not prove reliable two-hour
delivery. The incident remains outstanding.

The repository prepares Cloudflare Workers Free Cron as the selected external
trigger. On 2026-09-23 the owner authenticated Wrangler by OAuth and deployed
one inert Worker shell, version `b9f8bc54-8f69-455f-b2fb-3da9db1426d2`, with no
URL, route, binding, secret, or Cron Trigger. The live dashboard showed Workers
Free usage at 0/100,000 requests for the day and explicitly reported “No cron
triggers configured.” On 2026-09-23 the owner later created a 60-day
fine-grained credential for `mohamedalizan2025-cpu`, restricted to repository
`techopportunity-tanzania` with Actions read/write and required Metadata read,
and stored it only as encrypted Worker secret `GITHUB_TOKEN`. Cloudflare active
deployment prefix `e4d0296b` records that secret-only configuration change. At
that preparation point no activation variable, Cron Trigger, external dispatch,
route, binding, or paid resource existed. The later activation is recorded
below. Activation and rollback are documented in
[DISCOVERY_EXTERNAL_SCHEDULER.md](DISCOVERY_EXTERNAL_SCHEDULER.md).

### 2026-09-24 external scheduler activation

The owner authorized production activation. GitHub repository variables now
bind exact actor `mohamedalizan2025-cpu` and enable the external gate. Wrangler
4.137.0 deployed Worker version
`9bb741c3-845f-4c2b-bb1b-2cc13217576e` with exactly one Cron Trigger,
`17 */2 * * *`, while preserving `GITHUB_TOKEN` as encrypted `secret_text`.
`workers_dev` and preview URLs remain disabled, and no route, paid binding,
Supabase change, manual dispatch, or AI activation occurred.

The external identity remains owner-enabled, actor-bound, fresh, on-cadence,
and replay-protected. Native, external, manual, and push identities remain
distinct and historical records are not relabeled.

### 2026-09-24 external delivery proof

Cloudflare Cron Events records six successful natural invocations at
22:17:20Z, 00:17:20Z, 02:17:20Z, 04:17:20Z, 06:17:20Z, and 08:17:20Z. Workers
Logs reports 6 successes and 0 errors; the latest event reports HTTP 200, slot
`2026-09-24T08:17:00.000Z`, the configured cron, and deployed version
`9bb741c3-845f-4c2b-bb1b-2cc13217576e`. These provider events correlate to
GitHub runs `35927491375`, `35937732661`, `35946610482`, `35955014166`,
`35963773490`, and `35974363625` respectively.

Every run's trigger artifact records the exact allowed actor,
`triggerKind=external_schedule`, its unique canonical nominal slot, and accepted
authentication/admission. Verification and worker execution completed, and the
report/history artifacts were saved. The six workers processed 1,522 candidates
and qualified 33; all qualified items matched existing records and zero new
pending rows were inserted. Retained history has six distinct external slots
and workflow run IDs with no duplicate group.

Native schedule runs `35931141667` and `35957717707` were skipped at the job
boundary and did not execute duplicate workers. Push runs remained `push` with
no nominal external slot; no push, manual, or skipped native run counts toward
external proof. Independent natural health run `35971711987` reported no
schedule anomaly and `twoHourReadiness=PROVEN` from the first five external
observations; the next Discovery history retained the sixth.

The 06:17 worker isolated one upstream source timeout. The 08:17 worker isolated
two source timeouts and reported critical `multiple_sources_failed`; an
OpportunityDesk detail request also returned HTTP 403 without aborting the
worker. These failures do not weaken the proven scheduler correlation, but they
correctly keep latest pipeline health critical and must not be hidden by
weakening health checks.

At the 08:57 UTC audit checkpoint, about 10.7 hours had elapsed since the first
nominal external slot and the first-to-sixth slot span was ten hours. Three-slot
initial readiness is established, but the incident is **not closed**. Inspect
the natural 10:17 UTC delivery for the 12-hour checkpoint and continue through
22:17 UTC when feasible for the preferred 24-hour observation.

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

No paid resource, migration, or alternate Discovery worker is provisioned. The
Cloudflare Worker, scoped dispatch credential, and one Cron Trigger are active
on Workers Free. The bounded contingency is implemented repository-side:

1. Use an owner-approved Cloudflare Workers Free Cron Trigger to call the
   narrowly scoped GitHub trigger every two hours.
2. Reuse the existing workflow, concurrency group, timeout, gates, secret
   scoping, worker, and pending-only behavior.
3. The authenticated, exact-actor `external_schedule` identity and validated
   nominal-slot input are implemented. Ordinary `workflow_dispatch` remains
   manual evidence.
4. Retained evidence distinguishes native `scheduled`, `external_schedule`,
   `manual`, and `push`; external slots are deduplicated and malformed, stale,
   future, unauthorized, disabled, or replayed claims fail closed.
5. Prove at least six consecutive external scheduled observations (12 hours),
   preferably 24 hours, under the same two-hour target and tolerance.
6. Keep GitHub cron configured for rollback, but automatically skip its worker
   while external scheduling is owner-enabled. Review removal only after proof.

Manual and push successes remain recovery evidence only and cannot satisfy
scheduled readiness. Activation and the initial repeated-delivery gate are
complete. The exact next operational action is to inspect the natural 10:17 UTC
external slot and its artifacts at the 12-hour checkpoint, while retaining the
critical source-health findings; preferably continue observation through 22:17
UTC before closing the incident.
