# Discovery external scheduler activation runbook

Status: **INITIAL READINESS PROVEN — POST-GRANT PROOF COMPLETE, 14-HOUR CHECKPOINT REACHED, 24-HOUR OBSERVATION IN PROGRESS**.
Repository support, the repository-scoped GitHub credential, its encrypted
Cloudflare Worker secret, both GitHub activation variables, and the two-hour
Cloudflare Cron Trigger are live. Eight distinct natural external slots have now
completed successfully (22:17 through 12:17 UTC, a fourteen-hour span). The
first post-0021/0022 production run (`35998109570`, slot `2026-09-24T12:17:00Z`)
proves the tightened grants did not break Discovery with zero
permission-denied errors. This exceeds the six-observation / 12-hour minimum
gate, but the preferred 24-hour checkpoint (`2026-09-24T22:17:00Z`) is still
pending, so the incident remains open.

## Decision

Use a **Cloudflare Workers Free Cron Trigger** at `17 */2 * * *` UTC to call the
GitHub Actions workflow-dispatch API. This preserves the existing Discovery
workflow, permanent verification, 30-minute timeout, non-cancelling concurrency
lane, credential scoping, worker, qualification, authority, dedupe, pending-only
writes, human moderation, and health artifacts.

This is the smallest safe no-cost option found:

| Option | Finding | Decision |
| --- | --- | --- |
| Existing Vercel Hobby | Current limit is once per day with hourly precision; a two-hour expression fails deployment. | Reject. |
| Azure Functions | Execution grants apply on paid consumption subscriptions and required storage is separately billed. Student credits are not permanent $0 infrastructure. | Reject. |
| Supabase database cron | Could reuse an account but would couple scheduler/token custody to the production database and require database/Vault/network changes. | Reject as unnecessary risk. |
| Cloudflare Workers Free | 5 cron triggers/account, 100,000 requests/day, 50 subrequests/invocation, 10 ms CPU; the design uses 1 trigger, 12 invocations/day, and 1 subrequest. Limits fail closed rather than creating paid overage on the Free plan. | Select. |

The GitHub repository is currently public and the workflow uses the standard
`ubuntu-latest` runner, for which GitHub documents Actions usage as free. The
external trigger replaces native worker execution rather than adding runs, so it
does not increase the existing artifact/cache cadence. The permanent-$0 claim is
conditional on the repository remaining public, use of a standard runner, and
the owner confirming the target Cloudflare account is still on Workers Free at
activation; it does not rely on student credits.

Official references: [Cloudflare limits](https://developers.cloudflare.com/workers/platform/limits/),
[Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/),
[Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/),
[Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/),
[Workers logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/),
[Workers SLA](https://www.cloudflare.com/workers-service-level-agreement/),
[GitHub workflow dispatch API](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event),
[GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions),
[Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing), and
[Azure Functions pricing](https://azure.microsoft.com/en-us/pricing/details/functions/).

Cloudflare Free has no contractual availability SLA; the published Workers SLA
is for Enterprise subscriptions. Selection therefore does not declare recovery.
Cron Events retains the 100 most recent scheduled invocations, Workers Logs gives
provider-side evidence, and Tech Opportunity's independent health report remains
the authority for product readiness.

## Current Cloudflare evidence (2026-09-24)

- Wrangler 4.137.0 is authenticated through owner-approved OAuth; its credential
  is stored in an encrypted file with the key in Windows Credential Manager.
- Account `7f88dee382a3a25649535105b5ef55f1` shows Workers Free usage of
  0/100,000 requests for the day. No upgrade or paid binding was selected.
- Worker `tech-opportunity-discovery-scheduler` retains the inert and
  credential-only versions in history. Owner-authorized Wrangler deployment at
  `2026-09-23T21:05:00Z` made version
  `9bb741c3-845f-4c2b-bb1b-2cc13217576e` current at 100%.
- The live configuration has `workers_dev=false`, `preview_urls=false`, no
  routes or billable bindings, and exactly one Cron Trigger: `17 */2 * * *`.
- Only the non-secret variables `GITHUB_OWNER`, `GITHUB_REPOSITORY`,
  `GITHUB_WORKFLOW`, and `GITHUB_REF` exist. Encrypted Worker secret
  `GITHUB_TOKEN` is configured; its value is not displayed or recorded.
- GitHub credential `Tech Opportunity scheduler` belongs to
  `mohamedalizan2025-cpu`, expires on 2026-11-22, selects only
  `techopportunity-tanzania`, has no user permissions, and grants only required
  Metadata read plus Actions read/write. Its authenticated dispatches are now
  evidenced by eight accepted external runs from the exact allowed actor.
- Repository variables now read
  `DISCOVERY_EXTERNAL_SCHEDULER_ACTOR=mohamedalizan2025-cpu` and
  `DISCOVERY_EXTERNAL_SCHEDULER_ENABLED=true`.

The Wrangler OAuth grant is account-administration tooling, not the runtime
dispatch identity and is never exposed to the Worker. Runtime dispatch still
requires the separately scoped GitHub credential described below.

## Real delivery evidence (audited 2026-09-24 at 08:57 UTC)

Cloudflare Cron Events shows six natural successful invocations at
`2026-09-23T22:17:20Z` and `2026-09-24T00:17:20Z`, `02:17:20Z`, `04:17:20Z`,
`06:17:20Z`, and `08:17:20Z`. CPU time was 0.691–0.907 ms. The matching Workers
Logs view reports 6 successes and 0 errors. Its latest
`external_schedule_dispatched` event identifies nominal slot
`2026-09-24T08:17:00.000Z`, HTTP 200, cron `17 */2 * * *`, scheduled origin,
and deployed version `9bb741c3-845f-4c2b-bb1b-2cc13217576e`.

Each provider event correlates to one accepted GitHub run and a completed
Discovery worker:

| Nominal external slot (UTC) | GitHub run | Sources | Candidates / qualified / existing duplicates / inserted | Result |
| --- | ---: | ---: | --- | --- |
| 2026-09-23 22:17 | `35927491375` | 20/20 | 264 / 6 / 6 / 0 | success |
| 2026-09-24 00:17 | `35937732661` | 20/20 | 264 / 6 / 6 / 0 | success |
| 2026-09-24 02:17 | `35946610482` | 20/20 | 242 / 6 / 6 / 0 | success |
| 2026-09-24 04:17 | `35955014166` | 20/20 | 242 / 5 / 5 / 0 | success |
| 2026-09-24 06:17 | `35963773490` | 19/20 | 242 / 5 / 5 / 0 | success; one source warning |
| 2026-09-24 08:17 | `35974363625` | 18/20 | 268 / 5 / 5 / 0 | success; source health critical |
| 2026-09-24 10:17 | `35986342203` | 17/20 | 258 / 5 / 5 / 0 | success; on_time (gap 1.998h); 3 upstream timeouts |
| 2026-09-24 12:17 | `35998109570` | 18/20 | 268 / 5 / 5 / 0 | success; on_time (gap 2.002h); post-grant proof, 2 upstream timeouts |

The seventh run's trigger artifact records `workflow_dispatch`, exact actor
`mohamedalizan2025-cpu`, `triggerKind=external_schedule`, canonical slot
`2026-09-24T10:17:00.000Z`, and `accepted=true`. Permanent verification passed
at exact head `838dbdc`; the worker finished at 10:20:02Z with 258 candidates,
5 qualified, all 5 duplicates, and 0 inserts. Its log contains no
permission-denied / `insufficient_privilege` error. Retained history now holds
seven distinct external slots and seven distinct workflow run IDs with zero
duplicate slot or run groups. First-to-latest nominal span is exactly twelve
hours (22:17 → 10:17 UTC).

All eight `trigger-report.json` files record `workflow_dispatch`, exact actor
`mohamedalizan2025-cpu`, `triggerKind=external_schedule`, a canonical accepted
slot, and `accepted=true`. Permanent verification and the Discovery worker
completed before `report.json` and `history.json` were saved. Across the eight
runs, 2,048 candidates produced 43 qualified records; all 43 matched existing
records, so the admission path correctly inserted zero duplicate pending rows.
Retained history contains eight distinct external slots and eight distinct
workflow run IDs, with zero duplicate slot or run groups.

Native GitHub schedule runs `35931141667` and `35957717707` were skipped at the
job boundary while external scheduling was enabled, so they did not execute a
second worker. Push runs remain classified as `push`, have no nominal external
slot, and are excluded from scheduled proof. No manual run is counted.

The latest natural schedule-health evaluation, run `35971711987` at
`2026-09-24T07:49Z`, restored five successful external observations, found no
schedule anomaly, and reported `twoHourReadiness=PROVEN`; the 08:17 Discovery
artifact then retained the sixth successful external observation. Initial
readiness is therefore proven by repeated real delivery rather than by one run.

Pipeline health is nevertheless critical at the audit point. The 06:17 run
isolated one upstream Ministry of Agriculture timeout. The 08:17 run isolated
timeouts from the Higher Education Students' Loans Board and Ministry of
Agriculture; OpportunityDesk also returned an isolated HTTP 403 during detail
fetching.
The 10:17 run isolated timeouts from the Higher Education Students' Loans
Board, the Ministry of Agriculture, and the State University of Zanzibar; the
health logic again reported critical `multiple_sources_failed`. These are
acquisition-source failures, not scheduler, authentication, replay,
concurrency, admission, permission, or history failures, and the health checks
are unchanged. Its worker log contains no permission-denied error.

The first external nominal slot was 22:17 UTC and the seventh was 10:17 UTC, a
twelve-hour slot span. The 12-hour checkpoint is therefore met by run
`35986342203`; the preferred 24-hour checkpoint remains `2026-09-24T22:17:00Z`.
Do not close the incident before continued natural delivery and health evidence
are inspected at the 24-hour checkpoint.

### 2026-09-24 post-grant proof + 14-hour checkpoint (12:17 UTC slot)

Natural external run
[`35998109570`](https://github.com/mohamedalizan2025-cpu/techopportunity-tanzania/actions/runs/35998109570)
is the FIRST genuine Discovery execution after the production 0021 + 0022
rollout (recovery `20260924T102906Z`, ~10:29 UTC; prior 10:17 worker finished
10:20:02Z). It completed successfully at head `8722246` (current HEAD):
`workflow_dispatch` from exact actor `mohamedalizan2025-cpu`,
accepted `triggerKind=external_schedule` for canonical slot
`2026-09-24T12:17:00.000Z`, permanent verification passed (all
every-milestone gates `passed`, `DISCOVERY_VERIFICATION_PASSED=true`), worker
12:18:14Z → 12:19:56Z (`success`, 101,626 ms), schedule `on_time`
(observed gap 2.002h, dispatch latency 1 minute). The worker processed 268
candidates into 5 qualified records, all 5 duplicates (`duplicatesSkipped=5`),
with 0 pending inserts, `categorySkipped=0`, `evidencePersistenceSkipped=0`,
detail 9/10 succeeded (one OpportunityDesk HTTP 403 detail failure, source
`ok=true`), 18/20 sources succeeded. The two failures are recurring upstream
acquisition timeouts (Higher Education Students' Loans Board, Ministry of
Agriculture); State University of Zanzibar recovered versus the 10:17 run.
All 20 sources report `sourceHealthUpdated=true` with `sourceHealthError=null`,
proving production service-role source-health writes still succeed under the
tightened grants. The cleaned worker log contains zero `permission-denied` /
`insufficient_privilege` / `42501` / `PGRST` errors (only test-name
`denied` strings). Report, history, and trigger-report artifacts were saved
(artifact `10807201703`); retained history now holds eight distinct external
slots with eight distinct workflow run IDs and zero duplicate slot or run
groups — a fourteen-hour first-to-latest span (22:17 → 12:17 UTC). Native
schedule run `35995351786` (11:50 UTC) was skipped at the job boundary while
external scheduling was enabled; push runs `35972215362` / `35976920309`
remain excluded. This is the real operational confirmation that the
tightened production grants did not break Discovery.

## Trigger and authentication contract

The Cloudflare source in `ops/discovery-scheduler/` sends:

- workflow: `discovery.yml` on `main`;
- `trigger_kind=external_schedule`; and
- the exact UTC nominal slot, for example `2026-09-23T10:17:00.000Z`.

GitHub accepts the identity only when all conditions hold:

1. the event is `workflow_dispatch`;
2. repository variable `DISCOVERY_EXTERNAL_SCHEDULER_ENABLED` is exactly `true`;
3. `github.actor` exactly matches `DISCOVERY_EXTERNAL_SCHEDULER_ACTOR`;
4. the nominal slot is canonical UTC, on the even-hour `:17` cadence, no more
   than five minutes in the future, and no more than two hours old; and
5. the nominal slot is not already present in retained native/external evidence.

Ordinary `workflow_dispatch` remains `manual`. Native cron remains `scheduled`.
Push remains `push`. Historical observations are not renamed. One nominal slot
can contribute at most one scheduled observation.

The owner explicitly selected the existing GitHub account
`mohamedalizan2025-cpu` as the dispatch identity. Use a fine-grained token whose
resource owner is that account, whose repository access selects only
`techopportunity-tanzania`, whose sole selectable repository permission is
**Actions: read and write**, and whose expiry is 30–90 days. GitHub adds required
**Metadata: read** automatically; grant no account or other repository
permission. Store the value only as the encrypted Cloudflare Worker secret
`GITHUB_TOKEN`; never put it in Git, Wrangler variables, GitHub variables, logs,
or command output.

Actions-write also permits other workflow-management operations in the selected
repository. Using the owner's identity therefore has a larger attribution and
account-compromise impact than a separate machine identity. The explicit owner
decision, one-repository scope, short expiration, encrypted custody, exact actor
allowlist, slot guards, and immediate revocation rollback are the compensating
controls. The workflow must set `DISCOVERY_EXTERNAL_SCHEDULER_ACTOR` to exactly
`mohamedalizan2025-cpu`; dispatches by any other actor still fail closed.

## Monitoring and proof

When the owner enables the external scheduler, native GitHub `schedule` jobs are
skipped at the Discovery job boundary. This prevents two workers in one slot and
keeps the native cron available for rollback. Push and manual recovery still run
but never count as scheduled evidence.

Health treats `scheduled` and `external_schedule` as distinct identities while
using both as scheduled observations. With external scheduling enabled, it emits
critical `external_schedule_not_proven` and remains `NOT_YET_PROVEN` until three
successful external runs at three distinct nominal slots are retained. The
two-hour interval and two-hour tolerance are unchanged. A missed run remains
critical. Five successful scheduled observations remain necessary for baseline
maturity.

Provider-side proof for each slot is the Cloudflare Cron Event / Workers Log.
Product-side proof is the GitHub run plus `trigger-report.json`, `report.json`,
and `history.json`. Correlate nominal slot, actor, run ID, commit, worker result,
artifact, and Cloudflare dispatch status. One success is never reliability proof.

## Owner-controlled activation gate

Do not execute these steps without explicit owner authorization:

1. Confirm the target Cloudflare account is on **Workers Free**, has capacity for
   one of its five cron triggers, and has no paid-plan upgrade or billable binding.
2. **Complete 2026-09-23:** create/approve the 30–90-day fine-grained token for owner
   `mohamedalizan2025-cpu`, selected repository `techopportunity-tanzania`, with
   Actions read/write and unavoidable Metadata read only.
3. **Complete 2026-09-23:** the Worker shell exists without a Cron Trigger and
   `GITHUB_TOKEN` is stored as an encrypted Worker secret. Do
   not deploy the committed `wrangler.toml` yet: it contains the live cron by
   design.
4. **Complete 2026-09-24:** set
   `DISCOVERY_EXTERNAL_SCHEDULER_ACTOR=mohamedalizan2025-cpu`.
5. **Complete 2026-09-24:** in one controlled window after the last completed
   native Discovery worker, set
   `DISCOVERY_EXTERNAL_SCHEDULER_ENABLED=true`, then deploy the reviewed source
   with the committed `wrangler.toml`; that deployment adds `17 */2 * * *`.
   Native worker execution then suppresses automatically. If deployment fails,
   immediately delete/false the enabled variable so native execution resumes.
6. **12-hour checkpoint complete 2026-09-24:** seven distinct external slots
   (22:17 → 10:17 UTC) have succeeded with zero duplicates. Continue
   observation through the natural 22:17 UTC slot (24 hours from first nominal
   delivery) before operational closure.

Both activation variables and the Cron Trigger are live. Natural Cron events and
their correlated GitHub artifacts now satisfy the initial-readiness and
12-hour portions of step 6; the 24-hour continued-observation portion remains
open.

## Rollback

Rollback changes triggers only; it never changes database rows or publication:

1. Immediately disable/remove the Cloudflare Cron Trigger.
2. Set `DISCOVERY_EXTERNAL_SCHEDULER_ENABLED=false` (or delete the variable) so
   native GitHub schedule jobs resume worker execution.
3. Use one ordinary manual dispatch only if recovery is needed; it remains manual
   evidence and cannot make health green.
4. Revoke the fine-grained GitHub token and remove the Worker secret.
5. Retain existing GitHub and Cloudflare logs/artifacts for incident evidence.

The code rollback is a normal revert of the activation-support commit. Do not
delete historical health observations or relabel external runs as native runs.
