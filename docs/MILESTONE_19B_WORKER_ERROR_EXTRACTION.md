# Milestone 19B - Discovery Sync run 5 worker-error extraction

Date: 2026-09-01  
Scope: authenticated-log extraction attempt and evidence-only incident report.

## 1. Exact run ID

GitHub Actions run
[33485590406](https://github.com/mohamedalizan2025-cpu/techopportunity-tanzania/actions/runs/33485590406),
Discovery sync run number 5, event `schedule`, branch `main`, conclusion
`failure`.

## 2. Exact job ID

Job `99784793318`, named `discover`, began `2026-09-01T08:09:25Z` and
completed `2026-09-01T08:10:02Z` with conclusion `failure`.

## 3. Exact failing step

Step 8, `Run discovery worker`, began `2026-09-01T08:09:59Z` and completed
`2026-09-01T08:10:00Z` with conclusion `failure`. Its command was:

```text
node --import tsx scripts/discovery/index.ts
```

Checkout, Node setup, `npm ci`, tests, typecheck, and lint all succeeded first.

## 4. Exact stderr/error

**The worker stderr could not be retrieved.** The exact required conclusion is:

> GitHub exposes only exit code 1 publicly; the worker stderr is inaccessible
> without authenticated Actions-log access.

The public annotation contains exactly:

```text
Process completed with exit code 1.
```

The job-log REST endpoint returns HTTP 403 with:

```json
{
  "message": "Must have admin rights to Repository.",
  "status": "403"
}
```

No `gh` executable is installed, no `GH_TOKEN`/`GITHUB_TOKEN` environment
variable is present, no GitHub connector is installed, and the in-app browser
has no connected browser session. Therefore no authenticated read-only surface
is available. The annotation is not promoted into a guessed root cause.

## 5. Exact executed SHA

Run 5 executed `191f53d410d7fdd3741abe4f80b8dd50a5e63028` (`191f53d`).

Compared with current head, the relevant changed files are:

- modified: `package.json`, `scripts/discovery/adapters.ts`,
  `scripts/discovery/fetch.ts`, `scripts/discovery/runner.ts`, and
  `scripts/discovery/types.ts`;
- added: `scripts/discovery/detail.ts` and
  `scripts/discovery/qualification.ts`;
- unchanged: `scripts/discovery/index.ts`, `scripts/discovery/sources.ts`,
  `package-lock.json`, and `.github/workflows/discovery.yml`.

Run 5 did not execute the current detail-acquisition or qualification code.

## 6. Current HEAD

Milestone 19B began clean and synchronized at
`673559ba4ce03fc68e094ff26323f4e373d0183d` (`673559b`), with
`main == origin/main`. This report is the only intended repository change.

## 7. Root cause

**Unknown.** Public GitHub evidence does not identify an exception, missing
variable, Supabase error, network error, module error, permission error, or
timeout. A one-second failing step is not enough to distinguish them.

The executed worker's first possible failure is `loadActiveSources()`: its
URL/service-key guard runs first, followed by the Supabase source-registry
query. Later possible failures include the runner environment guard, category
load, dedupe-row load, source processing, and insert path. This startup trace
defines possibilities only, not the incident cause.

## 8. Local reproduction

The exact entrypoint, run locally without injected variables, emitted:

```text
Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY; the worker needs
the service key for registry reads and source-health updates only (GitHub
Actions secret / local .env.local, never NEXT_PUBLIC_*)
```

Exit code: 1. First operation: the `loadActiveSources()` environment guard.
This occurs before database access, source iteration, or any fetch.

This reproduces only the deliberately unconfigured local environment. It does
not reproduce the unknown GitHub error and does not prove a GitHub secret is
missing.

## 9. Fix, if any

No fix was made. The actual error is unavailable, so changing the workflow,
worker, dependencies, Node version, schedule, or error handling would be a
guess-fix. No suppression, `continue-on-error`, fallback credential, or
architecture change was introduced.

## 10. Tests

No code changed, so tests, lint, typecheck, and build were not repeated. The
latest current-code evidence remains 351/351 tests, lint clean, and typecheck
clean from Milestone 17. Run 5 separately passed all three quality gates for
its older SHA before the worker step failed.

## 11. Worker result

There is no authenticated, credentialed current-head worker result. The only
Milestone 19B worker execution was the safe no-environment guard check in
section 8. A credentialed run was not used to manufacture production evidence
while the actual CI failure remains unidentified.

Environment-name inspection confirms that the worker requires only:

- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`;
- `SUPABASE_SERVICE_ROLE_KEY`.

All three names exist in local `.env.local`; values were never printed. The
workflow maps the same three GitHub secret names into only the worker step.

## 12. GitHub current-head result

No Discovery Sync run has executed `673559b` or later. Run 33485590406 on
`191f53d` remains the latest public workflow result, so current-head GitHub
proof remains open.

## 13. Database impact

Milestone 19B performed no credentialed worker run, write, migration, or
historical-record mutation. Database impact is zero. The prior read-only
correlation already established that run 5 inserted no rows.

## 14. Six-hour readiness

**C - not ready.** There is no green current-head workflow and no current-head
runtime, fetch, candidate, duplicate, insert, or source-failure summary. The
schedule remains unchanged.

## 15. Security

- No credential value was printed, copied, stored, or requested.
- No GitHub account/security setting or Actions secret was changed.
- No service-role operation, production discovery write, or DDL was performed.
- Discovery network, SSRF, redirect, size, timeout, pending-only, provenance,
  source-isolation, and moderation controls are unchanged.
- No error suppression or unrestricted acquisition path was added.

## 16. Git

The repository began clean at synchronized `673559b`. Worker code, workflow,
dependencies, application code, and configuration remain unchanged. This
focused report is the only Milestone 19B diff; final commit/push state is
recorded in the session handoff.

## 17. Owner gates

The owner must provide one authenticated Actions-log path:

1. sign in to GitHub and open run 33485590406 -> job `discover` -> step
   `Run discovery worker`, then copy its complete stdout/stderr; or
2. make an authenticated `gh run view 33485590406 --log` result available.

If the log explicitly names a missing repository secret, the owner must create
or correct only that exact Actions secret. If it names a repository-code
defect, reproduce it and apply the smallest fix. After that, dispatch exactly
one Discovery Sync run against the then-current `main` and inspect every step.

## 18. New architectural findings only

No new architectural defect was proven. The only finding is an access boundary:
public Actions job metadata and annotations do not contain the worker stderr,
while the log-download endpoint requires authenticated repository rights.

## 19. Architecture score

**9.7/10, unchanged.** The blocker is private operational evidence, not a
demonstrated structural problem.

## 20. Single next product milestone

Obtain the exact authenticated worker stderr, correct only its proven cause,
and complete one green, database-correlated current-head Discovery Sync run.
That single proof is the prerequisite for evaluating a recurring six-hour
cadence.
