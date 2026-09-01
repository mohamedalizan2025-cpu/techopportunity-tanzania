# Milestone 21 - Autonomous discovery reliability and six-hour readiness

Date: 2026-09-01
Scope: close only measured observability, accessibility, and deterministic
deduplication gaps; assess readiness without changing data or the schedule.

## 1. Objective

Move the discovery worker closer to trustworthy recurring operation across
acquisition, qualification, evidence, deduplication, persistence, source
health, and operator-visible metrics. The success criterion is evidence of
reliable, Tanzania-accessible technology opportunities, not row volume.

## 2. Starting HEAD

`5e6c635898a5ed221f3aa5363a7ec1d50181135f` on `main`, exactly equal to
`origin/main`, with a clean working tree.

The latest Discovery Sync was and remains run
[#7 (33525075754)](https://github.com/mohamedalizan2025-cpu/techopportunity-tanzania/actions/runs/33525075754):
`workflow_dispatch`, success, head
`e9b995339ea138bb4abffbbc1adf3898579e6062`. It is not a run of the Milestone
21 implementation.

## 3. Ending HEAD

The ending HEAD is the pushed commit containing this report. Its exact SHA is
reported in the final handoff (a commit cannot embed its own SHA in its own
content).

## 4. Git status

The milestone began clean. The implementation and this report are committed
and pushed together; the final handoff records the post-push clean/sync check.

## 5. Changes made

- Reconciled every run-level count from `perSource`, preventing aggregate and
  source evidence from drifting.
- Added explicit source attempted/failed, structural/noise, post-dedupe,
  category-skip, and source-health-update metrics. The final stdout remains one
  structured JSON summary and contains no credentials.
- Canonicalized opportunity URLs by removing fragments and known tracking
  parameters, sorting query parameters, and retaining identity-bearing query
  parameters.
- Added a deliberately conservative cross-source identity fallback: a shared
  cohort year and exact equality of an order-independent substantial title
  core (at least five tokens). It does not use fuzzy, semantic, embedding, or
  AI similarity.
- Recognized the measured explicit wording "People of all nationalities are
  welcome to apply" as worldwide accessibility evidence.
- Added focused regression suites and updated the architecture decision log.

No existing database row was modified.

## 6. Tests

- Qualification: 28/28 passed.
- Deduplication: 9/9 passed.
- Summary reconciliation: 9/9 passed.
- Complete suite: **376/376 passed**.

The new tests cover tracking versus identity query parameters, the two
unambiguous measured duplicate pairs, refusal of the ambiguous Toronto pair,
year/source/short-title safeguards, every new summary counter, and the explicit
all-nationalities wording.

## 7. Lint and typecheck

- ESLint: clean.
- `npx tsc --noEmit`: clean.

The repository has no `typecheck` npm script; invoking it reports only a
missing script, so the workflow's direct TypeScript command was used.

## 8. Build result

The single permitted `next build` attempt reached optimized compilation and
failed only because this environment could not fetch Geist and Geist Mono from
Google Fonts. The import trace was `app/layout.tsx`; no application or
TypeScript defect surfaced. This is the previously established environment
block, not evidence of a deploy failure.

## 9. Discovery metrics

The current worker can now emit, at both aggregate and per-source levels where
applicable: start/end, configured/attempted/succeeded/failed sources,
candidates found, noise rejects, structurally valid candidates, relevance and
eligibility rejects, eligibility unknowns, detail fetch/success/failure and
evidence counts, duplicate skips, deduplicated candidates, category skips,
valid candidates, inserted pending rows, and source-health update failures.

Exact GitHub values for these fields are **NOT PROVEN**: run #7 predates this
change and its private worker stdout remains inaccessible from this session.
No local write-mode run was substituted for GitHub execution.

For context only, the prior Milestone 20 read-only local replay measured 18
sources, 34 fetches, zero fetch failures, 130 queue survivors, 37
structural/noise rejects, 29 relevance rejects, 5 eligibility rejects, 129
eligibility-unknown survivors, 10 detail fetches, 6 detail deadlines, 7 detail
eligibility sections, and 3 application links. These are local replay results,
not run-7 metrics.

## 10. Quality of the 15 Milestone 20 records

This was a read-only record-level audit; no cleanup occurred.

| Measure | Result |
|---|---:|
| Status | 15 pending |
| Deterministically relevant | 6 |
| Relevance ambiguous | 9 |
| Clearly technology-oriented by conservative human review | 2 |
| Explicit Tanzania/Africa/worldwide access | 2 |
| Explicitly foreign-only | 1 |
| Accessibility unknown | 12 |
| Usable item-level detail evidence proxy | 5 |
| Explicit application deadlines | 4 |
| Obvious editorial/news/navigation pages | 0 |
| Exact-URL duplicate pairs | 0 |
| Unambiguous deterministic cross-source pairs | 2 |
| Additional plausible but ambiguous cross-source pairs | 1 |

The two clearly technology-oriented records were the Africa CDC digital
health/innovation opportunity and the KAUST scientists/engineers research
opportunity. Intuit was technology-enabled but foreign-only and a general
small-business programme. Most of the remainder were general academic,
scholarship, public-health, or fellowship records rather than clearly
technology-first opportunities.

## 11. Source-quality findings

- Insert contribution: OpportunitiesForAfricans 9; OpportunityDesk 6; the
  other 16 active sources inserted 0 in run #7.
- Only those two aggregators have positive insertion evidence from that run,
  but the measured batch has low technology precision and high accessibility
  uncertainty. Insert count alone is therefore not activation evidence.
- Several institutional sources yielded ambiguous/noisy candidates during the
  prior local replay, but one observation is insufficient evidence for
  deactivation.
- No source was activated, deactivated, or reprioritized. Repeated structured
  results are required before changing the registry.

## 12. Deduplication findings

There were no exact-URL pairs among the 15. The new deterministic rule catches
two unambiguous OFA/OpportunityDesk pairs despite different URLs and word order:

1. University of British Columbia Mastercard Foundation Scholars Program 2027.
2. University of Michigan African Presidential Scholars (UMAPS) 2027.

The University of Toronto Mastercard titles overlap only partially and remain
separate for moderator judgment. Existing duplicates were not merged, rejected,
or rewritten. Future candidates alone receive the new gate.

## 13. Six-hour readiness: C - NOT READY

| Criterion | Evidence | Status |
|---|---|---|
| Successful current-head execution | Run #7 is green, but predates Milestone 21 HEAD | NOT PROVEN |
| Correct GitHub secret contract | Run #7 worker succeeded after owner secret correction | Proven once |
| Source acquisition | 18-source local replay and run-7 inserts | Proven once |
| Qualification | Deterministic tests green; production precision remains weak | Partial |
| Detail acquisition | Bounded tests green; 5/15 measured proxy coverage | Partial |
| Deduplication | Focused deterministic tests green | Locally proven |
| Pending-only persistence | 15/15 run-7 inserts pending | Proven once |
| Useful worker metrics | Contract implemented; GitHub output not yet captured | Locally proven |
| Failure isolation | Existing per-source isolation plus whole-run failure gate | Locally proven |
| No credential leakage | Secret values absent; secrets scoped to worker step | Proven |
| Reasonable duration | Run-7 worker approximately 61 seconds | Proven once |
| Database correlation | Run-7 insertion window correlated to 15 rows | Proven once |
| Repeatability | Only one successful production worker execution | NOT PROVEN |

The existing daily cron, `0 3 * * *`, remains unchanged. One green historical
run is not evidence for switching to six-hour recurrence.

## 14. Owner gates

1. Dispatch one post-push run on the Milestone 21 HEAD and preserve its complete
   worker JSON.
2. Correlate that run to new pending rows, including duplicate, relevance,
   accessibility, detail, insertion, and source-health outcomes.
3. Obtain a later independent repeat run before considering a six-hour cron.
4. Existing-data cleanup remains a separate future owner decision.

## 15. Security findings

- No secret value was printed, stored, or added to the diff.
- Actions credentials remain scoped only to the worker step; quality gates
  receive none.
- No service-role credential appears in `app/`, `components/`, `lib/`,
  `proxy.ts`, or `next.config.ts`.
- `fetchPage` remains the only discovery `fetch()` implementation. SSRF,
  scheme, redirect, response-size, timeout, one-hop, and detail-volume bounds
  were not weakened.
- Pending-only insertion, RLS, human moderation authority, and the assistant
  kill switch remain intact.

## 16. Production probes

Read-only probes after implementation:

- homepage, search, category filter, and deadline filter: 200;
- known published detail: 200;
- run-7 pending detail: 404;
- `/moderation`: 307 to `/login?next=%2Fmoderation`;
- assistant API: `mode = disabled`.

No production row was changed by these probes.

## 17. Architecture impact

Architecture score remains **9.7/10**. The changes extend the existing
structured result and deterministic identity boundaries; they introduce no
new service, table, route, client state, credential, or runtime dependency.
The architecture document now records URL-first canonical identity plus the
narrow cross-source fallback and its human-review boundary.

## 18. Deliberately not changed

No database cleanup or record mutation; no migration; no cron change; no
source activation/deactivation; no AI/LLM/provider credential; no embeddings,
vector store, fuzzy matching, recursive crawling, application-link crawling,
social scraping, auto-publication, RLS relaxation, UI redesign, API route, or
mobile work.

## 19. Exact next milestone

**Milestone 22 - Post-M21 current-head execution and correlation proof.**
Capture the complete JSON from one owner-triggered run, verify that every
aggregate reconciles with `perSource`, correlate database inserts without
cleanup, assess whether the two exact-core duplicates are prevented, and
measure technology relevance plus accessibility/detail precision. If it is
green, plan a later repeatability proof; do not change the cron in Milestone 22.

## 20. Exact owner action

After this commit is pushed: open **GitHub Actions -> Discovery sync -> Run
workflow**, select `main`, and dispatch **exactly once**. Open **Run discovery
worker** and preserve its complete JSON stdout/stderr for Milestone 22. Do not
clean the database and do not change the schedule.
