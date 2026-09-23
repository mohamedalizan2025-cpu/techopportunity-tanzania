# Discovery external scheduler activation runbook

Status: **INERT WORKER SHELL DEPLOYED, NOT ACTIVATED**. Repository support and
one Cloudflare Worker version exist, but there is no Cron Trigger, route,
binding, GitHub dispatch token, Worker secret, activation variable, external
dispatch, or paid resource. The owner gate is closed.

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

## Current Cloudflare evidence (2026-09-23)

- Wrangler 4.137.0 is authenticated through owner-approved OAuth; its credential
  is stored in an encrypted file with the key in Windows Credential Manager.
- Account `7f88dee382a3a25649535105b5ef55f1` shows Workers Free usage of
  0/100,000 requests for the day. No upgrade or paid binding was selected.
- Worker `tech-opportunity-discovery-scheduler` has one uploaded inert version,
  `b9f8bc54-8f69-455f-b2fb-3da9db1426d2`, created at
  `2026-09-23T18:40:20.504Z`.
- The dashboard reports no active routes, workers.dev disabled, zero bindings,
  zero invocations, and **No cron triggers configured**.
- Only the non-secret variables `GITHUB_OWNER`, `GITHUB_REPOSITORY`,
  `GITHUB_WORKFLOW`, and `GITHUB_REF` exist. `GITHUB_TOKEN` does not exist.

The Wrangler OAuth grant is account-administration tooling, not the runtime
dispatch identity and is never exposed to the Worker. Runtime dispatch still
requires the separately scoped GitHub credential described below.

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
2. Create/approve the 30–90-day fine-grained token for owner
   `mohamedalizan2025-cpu`, selected repository `techopportunity-tanzania`, with
   Actions read/write and unavoidable Metadata read only.
3. The Worker shell already exists without a Cron Trigger. After the token
   settings pass review, add `GITHUB_TOKEN` as an encrypted Worker secret. Do
   not deploy the committed `wrangler.toml` yet: it contains the live cron by
   design.
4. Set `DISCOVERY_EXTERNAL_SCHEDULER_ACTOR=mohamedalizan2025-cpu`.
5. In one controlled window just after a completed Discovery slot, set
   `DISCOVERY_EXTERNAL_SCHEDULER_ENABLED=true`, then deploy the reviewed source
   with the committed `wrangler.toml`; that deployment adds `17 */2 * * *`.
   Native worker execution then suppresses automatically. If deployment fails,
   immediately delete/false the enabled variable so native execution resumes.
6. Observe three distinct external slots (minimum six hours), then continue for
   at least 12 hours and preferably 24 hours before operational closure.

The repository currently has neither activation variable. The committed
`wrangler.toml` is deployable configuration; the inert shell is not evidence of
Cron activation or external delivery.

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
