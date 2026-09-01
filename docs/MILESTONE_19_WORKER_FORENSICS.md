# Milestone 19 - Current-head discovery worker forensics

Date: 2026-09-01  
Scope: exact worker-failure evidence and current-head operational proof only.

## 1. Exact GitHub worker error

The exact worker stderr is **unavailable**. GitHub run
[33485590406](https://github.com/mohamedalizan2025-cpu/techopportunity-tanzania/actions/runs/33485590406)
exposes only `Process completed with exit code 1.` through its public check
annotation. It would be a guess to report a more specific GitHub error.

## 2. Exact failing operation

GitHub proves that the failing workflow operation was:

```text
node --import tsx scripts/discovery/index.ts
```

It does not publicly expose which operation inside that process failed. In the
executed code, the first operation that can fail is `loadActiveSources()`:
first its URL/service-key guard, then its Supabase source-registry query. Later
possible failure points include the runner environment guard, category load,
dedupe-row load, and insert path. Per-source fetch/adapter failures are isolated
and only produce a failing process result when all checked sources fail.

## 3. Evidence source

Read-only evidence comprises the run API, job `99784793318`, its step
conclusions and the public check annotation. Checkout, Node setup, `npm ci`,
tests, typecheck and lint all passed; `Run discovery worker` failed from
08:09:59Z to 08:10:00Z. Unauthenticated log download returns 403. No usable
signed-in browser session, GitHub CLI or GitHub token is available in this
environment, so the private step log remains an owner-controlled evidence gate.

## 4. Code SHA that failed

Run 33485590406 executed
`191f53d410d7fdd3741abe4f80b8dd50a5e63028` (`191f53d`). It genuinely contains
the Milestone 9 fix because `75fbc39` is its ancestor. It does not contain the
Milestone 16 qualification or Milestone 17 detail-acquisition changes.

Between `191f53d` and the starting Milestone 19 head, the relevant changes are:

- modified: `package.json`, `scripts/discovery/adapters.ts`,
  `scripts/discovery/fetch.ts`, `scripts/discovery/runner.ts`, and
  `scripts/discovery/types.ts`;
- added: `scripts/discovery/detail.ts` and
  `scripts/discovery/qualification.ts`;
- unchanged: `scripts/discovery/index.ts`, `package-lock.json`, and
  `.github/workflows/discovery.yml`.

The `fetch.ts` change is comments only. Therefore the failed run did not
execute the current qualification/detail pipeline, and current code was not
debugged as if it had.

## 5. Current HEAD SHA

Milestone 19 began clean and synchronized at
`0acbf9e39315a7769edf698a4adb738bb9c8c50e` (`0acbf9e`), with
`main == origin/main`. This report is the milestone's only repository change;
its focused documentation commit becomes the new current head.

## 6. Local reproduction

Running the exact command locally without injected environment variables exits
1 at the first guard with:

```text
Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY
```

That reproduces one possible startup failure, not the exact GitHub failure.
The duration is not evidence of identity. A credentialed current-head run was
not used as a diagnostic substitute because it is the production write-capable
worker and the private GitHub error has not identified a defect to reproduce.

Parity facts: GitHub uses Ubuntu, Bash, Node 22 and the canonical command;
local inspection uses Windows PowerShell, Node 26.7.0 and `tsx` 4.23.12. The
workflow's locked install passed on Node 22, as did tests, typecheck and lint.
There is no evidence that Node-version drift caused the worker failure.

## 7. Root cause

**Unknown.** Missing or invalid GitHub secrets, a source-registry query error,
and later worker failures remain hypotheses until the private worker log names
the first error. The workflow supplies the exact variable names consumed by
the code:

- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`;
- `SUPABASE_SERVICE_ROLE_KEY`.

No additional worker environment variable is required. Values were not read or
printed.

## 8. Fix

No code, workflow, schedule or secret was changed. There is no proven root
cause and therefore no evidence-supported fix.

Exact owner action: open GitHub Actions -> Discovery sync -> run 33485590406 ->
`discover` -> `Run discovery worker`, and inspect/copy the private stderr. If it
names a missing secret, create or correct only that exact repository Actions
secret. If it names a repository defect, reproduce and fix only that defect.

## 9. Current-head local worker result

There is no credentialed current-head worker result. The only exact-entrypoint
local result is the deliberately unconfigured environment-guard failure in
section 6. Milestone 17's read-only dry-run is useful quality evidence but is
not the write-capable CI entrypoint and is not presented as full worker proof.

The startup trace is:

```text
index -> source registry/env -> source load -> runner env/clients
      -> categories -> dedupe rows -> per-source fetch/adapter
      -> qualification -> bounded detail acquisition -> validation
      -> dedupe -> pending insert -> source health -> final summary
```

## 10. Current GitHub workflow result

No workflow run exists for `0acbf9e` or later. The latest Discovery Sync remains
run 33485590406 on `191f53d`, conclusion `failure`. CI is **not green** for
current head.

Owner proof action: after this report is on `main`, dispatch exactly one
Discovery Sync run against `main`. Success requires every setup/quality step
and `Run discovery worker` to pass. If it fails, capture that run's private
worker log before making any change.

## 11. Database correlation

There is no current-head execution to correlate. The latest read-only census
remains the Milestone 18 result: 213 total rows (191 pending, 17 published, 5
rejected), zero rows created at or after run 33485590406 began, and the newest
row predates it at `2026-08-29T20:43:35.945145Z`. Thus the inspected failed run
inserted no rows. No historical record was mutated.

## 12. Six-hour readiness

**C - not ready, for an operational reason.** No current-head GitHub run is
green, and its actual runtime, insert, duplicate and failure metrics do not
exist. The schedule remains unchanged. Reclassify only after one current-head
run yields sources/run, fetches/run, detail fetches/run, runtime, candidate
volume, duplicate rate and failure rate.

## 13. Source quality impact

No source or quality behavior changed. Current head still preserves the
Milestone 16-17 model: relevance noise is rejected, explicit foreign-only
eligibility is rejected separately, ambiguous eligibility remains unknown,
deadlines require evidence, detail evidence is retained, and bounded detail
failures fall back safely. This is code/read-only-test evidence, not GitHub
current-head execution proof.

## 14. Migration state

No migration was applied and no new database archaeology was performed. The
most recent behavior probes remain: 0004 admissions absent, 0010 jobs absent,
0009 `decided_by` absent (PostgreSQL 42703), and 0008 behavior unchanged with
all 213 legacy rows having non-null country. A row-level behavior probe does
not independently establish a schema default.

## 15. AI state

AI remains disabled. No credential, provider, embedding system, classifier or
LLM-based acquisition path was added.

## 16. Tests, lint, typecheck and build

There is no code change, so Milestone 19 did not repeat the full battery or
build. The latest current-head code evidence remains Milestone 17: 351/351
tests, lint clean and `tsc --noEmit` clean; its single build attempt was blocked
only by the environment's Google-hosted Geist font fetch. Run 33485590406 also
passed its older-SHA tests, typecheck and lint on Node 22 before the worker
failed. None of this substitutes for current-head worker execution.

## 17. Security

- `fetchPage` remains the sole discovery network-read implementation.
- Scheme/SSRF, redirect, response-size and timeout protections are unchanged.
- Detail acquisition remains source-bound, one-hop and capped.
- No new acquisition path or public write route was introduced.
- Service-role use remains server/workflow-only; credentials were not exposed.
- Discovery insertion remains pending-only and moderation authoritative.
- Source and evidence provenance remain part of the pipeline.

## 18. Production

No code was changed or deployed and no discovery cycle was run. The latest
read-only production evidence remains Milestone 18: public routes and a
published detail returned 200, a pending detail remained private with 404,
moderation redirected to authentication, and the assistant reported disabled.

## 19. Git

The repository began at clean, synchronized `0acbf9e`. The worker, workflow,
dependencies and application are unchanged. This focused report is the only
Milestone 19 diff; its final commit/push synchronization is recorded in the
session handoff.

## 20. A/B/C/D

- **A - required owner action:** inspect the private stderr for run 33485590406,
  then dispatch exactly one current-`main` run and inspect its complete result.
- **B - conditional smallest change:** fix only the exact secret or repository
  defect named by that evidence, then perform the single proof run.
- **C - defer:** six-hour cadence, source expansion, migrations, staff cleanup
  and AI activation until current-head discovery is green and correlated.
- **D - reject:** guessing from duration, equating the local missing-env error
  with CI, treating a dry-run as CI proof, or changing schedule/architecture to
  mask an unknown failure.

## 21. New architectural findings only

No new structural defect was proven. The only new conclusion is forensic: the
available public GitHub surface cannot identify the operation inside the failed
worker, so secret state/private logs are an owner-controlled observability
boundary. That is not evidence for reopening the architecture.

## 22. Architecture score

**9.7/10, unchanged.** The open problem is operational proof and private error
evidence, not system structure.

## 23. Single highest-value next product milestone

Complete one **owner-observed current-head Discovery Sync proof**: obtain the
private worker error, correct only its evidenced cause if necessary, dispatch
exactly once on current `main`, capture the full discovery summary, and
correlate all resulting pending rows and provenance. Only a green correlated
run can unlock a measured six-hour cadence decision.
