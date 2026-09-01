# Milestone 20 - Current-head Discovery Sync proof and queue-quality correction

Date: 2026-09-01  
Scope: correlate the first green current-head workflow with live data, then fix
the smallest directly measured qualification defect.

## 1. Milestone number

Milestone 20, following the Milestone 19/19B GitHub worker-forensics gate.

## 2. Objective

Prove that the newly green Discovery Sync executed current `main`, correlate
its worker window with live Supabase state, verify pending-only/privacy and
provenance invariants, assess the inserted queue's product quality, and make
only an evidence-backed deterministic correction.

## 3. What was measured

### GitHub execution

Latest run: [33525075754](https://github.com/mohamedalizan2025-cpu/techopportunity-tanzania/actions/runs/33525075754),
run number 7, `workflow_dispatch`, head
`e9b995339ea138bb4abffbbc1adf3898579e6062`, conclusion `success`.

- run timestamps: `15:19:59Z` to `15:21:43Z` (104 seconds);
- job `99913778885`: `15:20:10Z` to `15:21:42Z` (92 seconds);
- worker step: `15:20:35Z` to `15:21:36Z` (61 seconds);
- checkout, Node 22 setup, `npm ci`, tests, typecheck, lint, worker, and post
  steps all succeeded;
- the run SHA exactly matched the then-current `main` and `origin/main`.

The owner reports that the preceding failure was a missing
`NEXT_PUBLIC_SUPABASE_URL` Actions secret and that the correct project URL was
then added. Run 6 failed and run 7 succeeded on the same repository SHA after
that owner change, which is consistent with and materially corroborates the
owner-supplied incident cause.

The complete worker stdout remains inaccessible: the unauthenticated job-log
endpoint returns HTTP 403 (`Must have admin rights to Repository`). Therefore
GitHub's exact `candidatesFound`, rejection, duplicate, detail-fetch, and
per-source JSON counters are unknown and are not replaced by local metrics.

### Database correlation

The read-only live census after run 7 is:

| Status | Rows |
|---|---:|
| Pending | 206 |
| Published | 17 |
| Rejected | 5 |
| Expired | 0 |
| **Total** | **228** |

Milestone 18 measured 213 total rows. The entire +15 delta was created inside
the run 7 worker window:

- 9 rows from OpportunitiesForAfricans at
  `2026-09-01T15:21:08.246576Z`;
- 6 rows from OpportunityDesk at `2026-09-01T15:21:11.622645Z`.

All 15 are `pending`. Zero new rows are published/rejected/expired, so no
auto-publication or unintended status transition occurred.

Category distribution is 9 `other`, 3 `fellowship`, 2 `scholarship`, and 1
`conference`. Every new row has `source_id`, opportunity URL, `source_url`,
and `discovery_method = rss`. Five rows have item-level `source_url == url`
plus rich description evidence, consistent with successful detail enrichment.
The other ten retain feed evidence.

Four rows store future deadlines, each backed by explicit `Application
Deadline` text in its persisted description. Eleven remain null; feed dates
were not promoted into deadlines. The Canada Small Business detail page has a
real deadline, but the feed-only row stayed null, which is conservative rather
than fabricated.

All 18 active sources wrote `last_checked_at` and `last_success_at` inside the
worker window and now have `last_error = null`. This proves all source-level
runs reached the success health update. It cannot reveal isolated feed/detail
subfetch messages hidden in private stdout.

### Dedupe and qualification quality

No new row has an exact normalized-URL match against any other database row.
The private worker's `duplicatesSkipped` count is unavailable. Three
cross-source logical duplicate pairs are visible (UBC Mastercard, Toronto
Mastercard, and UMAPS); this is the documented URL-only identity limitation,
not an exact-URL dedupe failure. They remain pending for human moderation.

A diagnostic reclassification using only persisted fields produced 6 relevant
and 9 ambiguous rows. It is not the worker's exact classification because
transient `detailEvidence` is not stored. Exact evidence in the queue includes:

- AfricaCDC Youth Pre-Conference: African Union member-state eligibility,
  which includes Tanzania;
- Intuit IDEAS: explicitly restricted to businesses in named U.S. locations;
- Canada Small Business 100: detail page requires operation in Canada and a
  Canadian-resident executive, but its row remained feed-only;
- the remaining eligibility is unknown unless the evidence explicitly proves
  otherwise.

The live schema still lacks `eligibility` and `eligibility_evidence` (PostgreSQL
42703), so classification remains a pipeline/moderation fact rather than a
persisted field. All new rows also carry legacy `country = Tanzania` because
migration 0008 is unapplied; that value is not evidence and the public UI
continues to suppress it.

### Separate read-only replay

One post-run local dry-run measured 18 sources, 34 total fetches, zero failures,
130 queue survivors, 37 structural/noise rejections, 29 relevance rejections,
5 eligibility rejections, 129 survivor eligibility-unknown results, 10/10
successful detail fetches, 6 detail deadlines, 7 detail eligibility sections,
and 3 application links. These are local replay metrics, not GitHub run 7
stdout.

## 4. What changed

The measured Intuit detail was acquired but incorrectly left accessibility
`unknown`. `qualification.ts` now recognizes only explicit restrictive wording
of the form `program ... open to ... located/based/resident in` combined with a
small measured list of foreign jurisdictions. That evidence yields
`tanzanians_not_eligible` and stops the candidate before moderation insertion.

The rule deliberately does not treat ordinary event venue text, source
country, physical location, or a Tanzania operating location as proof of
applicant eligibility. No source, schedule, workflow, dependency, schema,
deadline parser, publication rule, or AI behavior changed.

Existing run 7 rows were not mutated or deleted. The Intuit, Canada, and
cross-source duplicate rows remain pending for the moderator to decide.

## 5. Tests

- Focused qualification: 27/27 passed.
- Focused detail acquisition: 34/34 passed.
- Full battery: **357/357 passed**.
- ESLint: clean.
- `tsc --noEmit`: clean.
- One `next build` attempt: environment-blocked by failed Google-hosted Geist
  and Geist Mono font requests; no application/type/build defect surfaced.

New regression coverage proves:

- the exact foreign operating-location restriction is excluded;
- it cannot enter moderation;
- a foreign event venue alone stays eligibility-unknown;
- a Tanzania operating location alone does not invent eligibility;
- the extracted detail path applies the same exclusion.

## 6. Security

- No secret value was printed or persisted.
- No credential, Actions secret, RLS policy, migration, or production setting
  was changed.
- `fetchPage` remains the only discovery network-read implementation.
- SSRF, scheme, redirect, response-size, timeout, one-hop, and per-source detail
  limits are unchanged.
- Discovery remains pending-only; moderation remains authoritative.
- No public write path, service-role client exposure, social scraping, AI
  classifier, fuzzy dedupe, or error suppression was added.

## 7. Production verification

Read-only probes after correlation:

- homepage, search query, category filter, deadline filter: 200;
- an existing published detail: 200;
- a run 7 pending detail: 404;
- moderation: 307 to `/login?next=%2Fmoderation`;
- assistant API: `mode = disabled`.

Thus newly pending rows remain private and no rejected/private row was exposed
through the checked detail route. The published probe used the previously
identified `production-link-test-delete-me` artifact; it was not deleted or
otherwise mutated because production cleanup remains owner-controlled.

## 8. Git SHA

The green run executed `e9b995339ea138bb4abffbbc1adf3898579e6062`.
Milestone 20 began clean and synchronized at that SHA. The final implementation
and report commit becomes the new current head; its pushed SHA is recorded in
the session handoff.

## 9. Database impact

Run 7 inserted exactly 15 rows, all pending. Milestone 20's own probes and code
work were read-only and caused zero database mutations. No historical record,
source activation, status, schema, or migration was changed.

## 10. Source-quality impact

The first successful current-head run confirms that the only inserting sources
were OpportunitiesForAfricans and OpportunityDesk. The correction prevents an
explicit class of foreign operating-location restrictions from being softened
to unknown when detail evidence is available.

It does not claim the 15-row queue is uniformly high quality. Nine persisted
rows remain deterministically ambiguous, several are general academic/public-
sector programmes rather than clearly technology-first opportunities, and the
detail cap left some actionable deadline/eligibility evidence on source pages
unpersisted. Source volume was not expanded.

## 11. Known limitations

- Worker stdout is private, so exact GitHub discovery counters remain unknown.
- One green run proves operability, not repeated reliability.
- Cross-source identity remains exact-URL-only by architectural design; three
  duplicate pairs require moderation.
- Detail acquisition is capped at five fetches for each of two supported
  sources; feed-only candidates can retain unresolved evidence.
- The 15 existing pending rows are unchanged, including measured foreign-only
  and duplicate candidates.
- Migrations 0004, 0010, 0008, and 0009 remain unapplied/owner-gated; the
  eligibility columns are also absent.
- The six-hour cadence is not yet justified from one green run and a noisy
  insertion sample.

## 12. Owner gates

No secret, migration, cleanup, schedule, or AI action was taken. Existing
pending records should be handled through normal staff moderation, not direct
database deletion. The owner should specifically review the Intuit IDEAS and
Canada Small Business 100 rows plus the three cross-source duplicate pairs.

The next workflow proof requires owner-authenticated GitHub Actions dispatch
and log access.

## 13. Architecture assessment

**9.7/10, unchanged.** The green current-head run proves the core scheduler ->
bounded acquisition -> qualification -> dedupe -> pending -> moderation path.
The new defect was a narrow deterministic vocabulary gap, not a structural
failure. Pending-only writes, evidence separation, security boundaries, and
human authority remain intact.

Six-hour readiness remains **C - not ready**: operational execution is now
proven once, but repeated green behavior, private worker metrics, detail
coverage, and insertion precision still need evidence.

## 14. Exact next milestone

Milestone 21: perform one post-fix current-head Discovery Sync reliability and
quality proof. Capture the private JSON summary, correlate any new pending
rows, verify the foreign-location exclusion, measure duplicate/detail/rejection
rates, and decide whether detail-budget ordering needs one small improvement.
Do not change the cron until repeated evidence supports it.

## 15. Exact next owner action

After the Milestone 20 commit is pushed, open GitHub Actions -> Discovery sync
-> Run workflow, select `main`, and dispatch **exactly once**. Open `Run
discovery worker` and preserve its complete JSON stdout/stderr for Milestone 21.
