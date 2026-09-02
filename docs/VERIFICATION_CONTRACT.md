# Milestone Verification Contract

This contract replaces milestone-by-milestone verification ceremony with one
deterministic repository command and exception-based review. It does not turn a
green test run into production-readiness evidence.

## Standard commands

- `npm run verify` runs the complete tests, TypeScript, ESLint, permanent
  boundary assertions, and the change classifier. It emits a human report plus
  `VERIFICATION_REPORT_JSON=...` for CI or an agent to retain.
- `npm run verify:ci` adds the production application build.
- `npm run verify:plan -- --base <sha>` reports the relevant gates without
  running production or using credentials. A dirty working tree is included;
  CI supplies its event base SHA.
- `npm run verify:boundaries` checks critical architecture and security
  invariants without network or database access.
- `npm run test:health` exercises schedule, baseline, anomaly, source,
  pipeline, freshness, and safety behavior. `npm run health:monitor` evaluates
  retained production schedule evidence without credentials.

The planner reports every selected gate, every skipped gate with a reason,
migration and registry changes, security-sensitive paths, production-evidence
requirements, and true owner actions. A skipped gate means its file trigger did
not match; it never means a failing check was ignored.

## Every milestone

The standard gate is the full regression suite, TypeScript, ESLint, and the
boundary suite. This includes discovery qualification, acquisition safety,
deduplication, evidence/deadline preservation, moderation, lifecycle,
published management, and the assistant kill switch. The credential-free
`Milestone verification` workflow runs these gates plus a production build on
every pull request and every push to `main`.

Before committing, the planner also exposes the complete diff classification.
An agent must review the changed-file list, migration classification, source
registry classification, and owner actions. Generated files and secrets remain
prohibited even when all code gates pass.

## Change-triggered gates

| Change | Selected evidence |
|---|---|
| Runtime UI, application data layer, config, dependencies | Production build |
| `scripts/discovery/**` or core discovery tests | Full discovery regression |
| Discovery health, summary, worker identity, or schedule workflows | Discovery health/anomaly regression |
| Qualification, normalization, validation, or extraction | Qualification corpus |
| `fetch.ts`, detail acquisition, or acquisition tests | SSRF/network acquisition suite |
| Moderation, published management, auth, or `proxy.ts` | Moderation/auth regression and deployed access proof |
| Assistant route/provider/tests | Assistant-disabled and boundary suite |
| `supabase/migrations/**` | Explicit migration review and production owner gate |
| Source loader or pilot registry seed | Registry review; live mutation is owner-gated |
| `.github/workflows/**` | Static workflow and credential-boundary validation |

The full tests still run on every milestone. A selected focused gate explains
why that subsystem deserves explicit attention; it does not replace the full
suite.

## Production verification

Production proof is required after a discovery behavior, qualification,
scheduler/workflow, dependency, source-registry, moderation/auth subsystem, or
production environment/credential change; after an incident; and periodically
for health. It is not required for documentation-only or isolated test-only
changes.

Discovery-sensitive pushes to `main` start the existing `Discovery sync`
workflow automatically. The authoritative UTC schedule `0 3/6 * * *` runs at
03:00, 09:00, 15:00, and 21:00 UTC. Scheduled and manual runs share the fixed
`discovery-production` concurrency group with active-run cancellation disabled;
the 30-minute job timeout bounds queue occupation. GitHub may replace an older
pending member when a newer run queues, but that cancellation is observable and
the schedule monitor detects the missing scheduled evidence. The job
runs the permanent gates without credentials, then exposes the three existing
Supabase secrets only to the pending-only worker step. Workflow concurrency
prevents overlapping production discovery runs. No verification script has a
database or network client.

Each production run now retains a bounded machine-readable health report and
history artifact. Cache/artifact keys include run attempt, while logical run ID
replacement prevents a retry from becoming a second baseline observation. A
separate credential-free schedule observer runs 30 minutes after each window
and can detect a missing retained run without invoking the worker.

Evidence is valid only when the workflow `head_sha` equals the commit being
claimed. Record the workflow name, run ID, event, conclusion, start/finish
times, and worker outcome. Discovery JSON metrics distinguish source failure,
success-with-noise, structural validity, relevance/eligibility rejection,
eligibility unknown, duplicate, qualification, pending insertion, detail
success/failure, category skips, and source-health write failures. Abnormal
volume, rejection, unknown, duplicate, or insertion counts are health signals;
they are never permission to loosen qualification.

A single successful run proves one execution only. It does not prove stable
six-hour operation or long-term source health. Repeated scheduled, exact-SHA
evidence is required before claiming repeatability. Once a subsystem has an
exact-SHA production baseline, unchanged future milestones may rely on CI plus
periodic scheduled health evidence.

## Owner-only actions

Owner involvement is reserved for authority the repository must not assume:

- granting or rotating production credentials;
- approving or applying production migrations;
- approving destructive cleanup or historical-record changes;
- approving a live source-registry mutation or new external integration; and
- manually dispatching only when repository/GitHub permissions prevent the
  automatic supported path.

Ordinary tests, builds, security regression, diff classification, and
discovery-sensitive push verification are automated and are not owner actions.

## Reporting rule for future milestones

Report the exact commit and comparison base, every standard gate result,
selected and skipped change gates, build result, production-evidence decision,
exact-SHA workflow evidence when required, repository synchronization, and only
unavoidable owner actions. Never infer production readiness from local tests,
never claim one run proves six-hour repeatability, and never manufacture proof
by changing production data.
