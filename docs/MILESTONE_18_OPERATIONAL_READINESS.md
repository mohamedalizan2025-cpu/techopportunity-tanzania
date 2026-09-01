# Milestone 18 - Current-head Discovery Sync proof and operational readiness

Date: 2026-09-01  
Scope: operational proof only; architecture review remains closed.

## 1. Current HEAD

Repository inspection began clean and synchronized at
`9014a3004b27261fcfb2a039cea133551e3a7ee1` (`9014a30`). This report is the
only Milestone 18 repository change and will become the final documentation
commit after all read-only checks.

## 2. Current origin/main

At the start of the milestone, `origin/main` was the same full SHA:
`9014a3004b27261fcfb2a039cea133551e3a7ee1`.

## 3. Latest Discovery Sync run

Latest run: [33485590406](https://github.com/mohamedalizan2025-cpu/techopportunity-tanzania/actions/runs/33485590406),
run number 5, `schedule`, created `2026-09-01T08:09:21Z`, completed with
`failure` at `2026-09-01T08:10:03Z`.

The workflow has only five runs:

| Run | Run ID | Head SHA | Fix relation | Result |
|---:|---:|---|---|---|
| 5 | 33485590406 | `191f53d` | post-`75fbc39` | failure |
| 4 | 33376199122 | `191f53d` | post-`75fbc39` | failure |
| 3 | 33302411277 | `ed13afe` | pre-fix | failure |
| 2 | 33245882749 | `ed13afe` | pre-fix | failure |
| 1 | 33181756033 | `f1a8c21` | pre-fix | failure |

## 4. Exact run head SHA

Run 5 used `191f53d410d7fdd3741abe4f80b8dd50a5e63028`, not the current
Milestone 17 head. No run has executed `64db738`, `9014a30`, or this report
commit.

## 5. Is the run genuinely post-fix?

Yes: `git merge-base --is-ancestor 75fbc39 191f53d` succeeds. It proves the
Milestone 9 Actions/Node/typecheck fix reached runs 4 and 5. It does **not**
prove the Milestone 16 qualification or Milestone 17 detail-acquisition code.

## 6. Exact workflow result

Run 5 conclusion: `failure`. Job `discover` ran from 08:09:25Z to 08:10:02Z.
No discovery summary JSON was produced through public GitHub evidence.

## 7. Exact successful/failing step

GitHub's jobs API proves:

- checkout: success;
- setup Node: success;
- `npm ci`: success;
- `npm test`: success;
- `npx tsc --noEmit`: success;
- `npm run lint`: success;
- `node --import tsx scripts/discovery/index.ts`: **failure**, about one second.

The unauthenticated log-download endpoint returns 403. The only public check
annotation is `Process completed with exit code 1.` The in-app browser had no
available browser/session, `gh` is not installed and no GitHub token variable
is present. Therefore the exact worker stderr is unavailable and must not be
invented.

## 8. Secret-name contract

The workflow references exactly:

- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`;
- `SUPABASE_SERVICE_ROLE_KEY`.

The same names are consumed by the worker. Values were never printed. Running
the exact worker command locally without injected variables fails immediately
with the explicit missing URL/service-key guard, which is consistent with the
one-second GitHub failure but does not prove that missing secrets caused it.

Owner action: inspect the private `Run discovery worker` log. If a secret is
named as missing, create/fix that exact repository Actions secret and nothing
else.

## 9. Local/CI parity

GitHub uses Node 22, `npm ci`, `npm test`, `npx tsc --noEmit`, `npm run lint`
and `node --import tsx scripts/discovery/index.ts`. The worker command and
package commands are canonical; there is no second production worker.

The local machine currently runs Node 26.7.0/npm 11.19.0. Milestone 17's
read-only measurement used `scripts/discovery/dry-run.ts`, which shares
fetch/extraction/detail/qualification code but deliberately does not exercise
the worker's dedupe/insert/source-health path. Only the current-head GitHub
run can close Node-22 and end-to-end parity.

## 10. Discovery metrics

No GitHub metrics exist for run 5 because the worker failed before a public
summary. Do not substitute local dry-run metrics as CI output.

The most recent bounded local evidence remains Milestone 17: 18 active
sources, 34 total fetches including 10 details, 164 structurally valid
candidates, 29 relevance rejects, 2 eligibility rejects, 133 survivors,
4 deadline-bearing survivors, zero fetch failures and about 45 seconds.

## 11. Database correlation

Read-only live census remains 213 rows: 191 pending, 17 published and 5
rejected. Zero rows have `created_at >= 2026-09-01T08:09:21Z` (run 5 start).
The newest row was created `2026-08-29T20:43:35.945145Z`.

Conclusion: run 5 inserted no rows. There is no current-head run to correlate.

## 12. Detail-evidence integrity

No actual Milestone 17 workflow inserts exist, so database integrity cannot
be sampled honestly. Historical latest rows still show the old feed/base
`source_url` and null deadlines. The Milestone 17 read-only dry-run proved
transient detail evidence, but only a successful current-head worker can prove
persisted title/description/deadline/source URL behavior.

## 13. Source-failure behavior

The runner catches each source independently, increments `summary.errors`,
records `perSource.error`, updates source health and continues. Detail failures
also retain the original candidate. The worker exits non-zero when every
checked source fails; partial failures finish with JSON/error logs so other
sources are not discarded.

Operational caveat: a partial failure may still have a green workflow
conclusion because only total failure sets a non-zero exit code. It is not
silent in the summary/log, but warning/step-summary surfacing should be judged
from the first successful current-head run before changing the health gate.

## 14. Six-hour readiness classification

**C - NOT READY, operational reason.** Runtime/load were acceptable in the
Milestone 17 dry-run, but no current-head GitHub run exists and the two newest
post-fix runs fail at the worker step without public error detail.

Smallest required action:

1. owner opens Actions -> Discovery sync -> Run workflow;
2. select `main` and dispatch exactly once after this report is pushed;
3. inspect the private worker log if it fails;
4. change only the named secret/verified code defect;
5. require one green current-head run before any cron edit.

## 15. Source-quality findings

- OpportunitiesForAfricans: strongest current deadline yield (four surviving
  parsed deadlines in the M17 dry-run), but item-level nationality checks are
  mandatory.
- OpportunityDesk: valuable real calls mixed with editorials/profiles and
  roundups; detail qualification removed three additional non-opportunities.
- Youth of UNATA: 12 M17 survivors, but no detail/deadline proof.
- SUZA: 9 survivors with substantial institutional/news noise and no deadline.
- DIT: 8 survivors, including genuine admissions/scholarship material, but no
  current deadline evidence.
- VETA: 6 survivors and useful applications, but no explicit deadline.
- ICT Commission: Tanzania-relevant but only two ambiguous/currently generic
  candidates; COSTECH remains a stronger deferred technology-source lead.

No source was added, removed or activated in this milestone.

## 16. Migration state

Read-only behavior probes:

- 0004 admissions: absent (`admissions` category missing);
- 0010 jobs: absent (`jobs` category missing);
- 0009 moderation attribution: absent (`decided_by` returns PostgreSQL 42703);
- 0008 country honesty: all 213 rows remain non-null country (0 nulls), so live
  behavior is unchanged and consistent with the legacy default. A read-only
  row query does not independently prove the column default definition.
- eligibility fields also remain absent (42703).

No migration or schema mutation was attempted.

## 17. AI state

AI remains disabled. Production `POST /api/assistant/ask` returns
`mode: disabled`. No provider, credential, classifier or vector system was
added or activated.

## 18. Tests, lint, typecheck and build

No code changed in Milestone 18, so the full battery/build was not repeated.
Current-head evidence from Milestone 17 remains 351/351 tests, ESLint clean,
`tsc --noEmit` clean; the single build attempt was environment-blocked only by
Google-hosted Geist font fetches. Run 5 independently passed its then-current
tests, typecheck and lint on Node 22 before the worker failure.

## 19. Security

- `fetchPage` remains the only discovery `fetch()` implementation.
- Scheme/SSRF, redirect, response-size and timeout guards are unchanged.
- Detail acquisition remains source-bound, one-hop and capped.
- Service role remains in workflow/server scripts only; inserts use the anon
  client and hardcode `status = pending`.
- Moderation remains authoritative; no public write path or credential was
  added.
- No social scraping, DDL, data mutation or secret exposure occurred.

## 20. Production

Current read-only checks: homepage/search/category/deadline pages and a
published detail return 200; a pending detail returns 404; moderation redirects
to login; assistant returns its explicit disabled response. No M18 code was
deployed and no discovery row was created.

## 21. Git

Before this report, `main == origin/main` at `9014a30` and the tree was clean.
This report is the only focused change. Final commit/push and synchronization
are recorded in the session handoff/final response.

## 22. A/B/C/D findings

- **A - owner action now:** dispatch exactly one Discovery Sync run on current
  `main`, then expose/inspect its worker log and summary.
- **B - only if evidenced:** correct the exact missing secret or worker defect;
  consider a partial-failure warning annotation after seeing a real run.
- **C - defer:** six-hour cron, source expansion, migrations, staff cleanup and
  AI activation.
- **D - reject:** guessing the CI error, treating local dry-run as GitHub proof,
  adding credentials to code, bypassing social/platform controls, or changing
  schedule before green proof.

## 23. New architectural findings only

No new product-architecture defect. One operational parity gap is now explicit:
the safe local dry-run shares the quality pipeline but is not the exact
write-capable worker path, and partial source failures do not affect the final
workflow conclusion unless all sources fail. Both are observability/operations
issues to evaluate after the first current-head run, not justification for a
new framework.

## 24. Architecture score

**9.7/10, unchanged.** The blocker is owner-controlled GitHub execution and
private observability, not the discovery architecture.

## 25. Single highest-value next product milestone

Complete one owner-triggered **current-head Discovery Sync proof**, capture its
full summary and correlate any pending inserts with database provenance. If it
is green, the next controlled change is a monitored six-hour schedule pilot;
if it fails, fix only the exact private-log cause first.
