# Next-Session Handoff — End-of-Day Freeze / Checkpoint (authoritative restart)

STOP/FREEZE note. This is the single authoritative document for resuming
work next session. It is not a redesign and not a feature plan. Git state
and the safety battery below were re-run on **2026-08-30** (Milestone 15);
live data counts come from a fresh read-only DB probe on 2026-08-30
(213/198/10/5) — re-confirm with
`scripts/discovery/inspect-live.ts` before acting on any number.
**Caution (M15)**: `inspect-live.ts` contains a reversible INSERT+DELETE
schema probe — use read-only selects unless the owner explicitly asks for
that probe.

---

## EMERGENCY CHECKPOINT — 2026-08-30 (credit exhaustion, safe-close)

Repository frozen at a clean boundary: **no work in progress, nothing
uncommitted**. `main == origin/main` @ `0442046`, working tree clean, no
temp/probe files left, `.env.local` ignored (only `.env.example`
tracked). The Milestone-15 record below (sections C–J + the M15 freeze
block) is complete and pushed, so this checkpoint adds no new facts — it
only guarantees an exact resume point.

- **Latest verified battery** (code unchanged since): 296/296 tests, lint
  clean, tsc clean (standard + fresh-checkout ci-check). `next build`
  environment-blocked (Turbopack os error 5, Milestones 5–15) — do NOT
  retry it; the successful Vercel production build of the same commit is
  the substitute proof.
- **Live DB** (probed 2026-08-30): 213 total / 198 pending / 10 published
  / 5 rejected / 0 expired. Migrations 0004/0010/0008/0009 ABSENT, 0003
  live. GitHub Discovery Sync: 3 runs, all failures, every one checked out
  a PRE-FIX `head_sha` (section G) — CI is NOT green and no code change is
  waiting on it. AI disabled. **No record has ever been unpublished by
  engineering, and no staff session was simulated.**
- **Verification pending** (do not assume): staff interaction with
  `/published-management` + the moderation queue, post-unpublish public
  cleanup proof, and the deadline-evidence census.
- **Do NOT repeat this session's work**: the read-only inventory probe,
  the triage distribution recompute, the migration-absence probes, the
  GitHub runs re-check, another build attempt. Every result is recorded
  here; re-running them spends credits for no new information.
- **Project direction preserved**: an opportunity-discovery platform for
  Tanzanians at home and worldwide, running
  PERMITTED SOURCES → automated recurring discovery → extraction →
  normalization → validation → dedupe → pending → human moderation →
  published → search/filter → grounded AI LATER. Not a general news site;
  no prohibited social scraping. Architecture review CLOSED at 9.7/10;
  emphasis is PRODUCT EXECUTION (reliable automated discovery, trustworthy
  inventory, efficient moderation, strong search), not redesign.

NEXT SESSION START HERE:
Ask the owner for ONE real staff login and spend a single session on the
two things engineering cannot do: unpublish the 5 known test artifacts in
`/published-management` (one deliberate confirmation each), then re-fetch
the section-J baseline URLs and require every needle gone with the 5
legitimate rows untouched. If no login can be had, run the READ-ONLY
deadline-evidence census of the 57 first-review pending rows instead and
write no code.

RECOMMENDED MODEL:
Flash (light tier). Reserve Max for a forensics round only if the owner's
staff session exposes a real defect.

WHY:
Both options are single-session, evidence-producing, and fully armed by
this document — no speculative build or redesign involved.

---

## A. Current Git HEAD
Tip of `main` / `origin/main` is **`0442046`** (M15 CI forensics) on top
of `5381a18` (Milestone-15 docs record), both sitting on the Milestone-14
pair (`c099972` code, `46bca13` docs), then:
- `0b5574e` docs: Milestone 13 owner-gate activation pass
- `6c01f87` docs: Milestone 12 verification pass
- `7e792f4` docs: Milestone 11 record

## B. Branch / origin synchronization
- Branch `main`, **in sync** with `origin/main` (ahead 0, behind 0) after
  the Milestone-15 push.
- No force-push, no history rewrite, no duplicate checkpoint commits.

## C. Latest completed milestone
**Milestone 15 — first real moderation/trust session ATTEMPT.** It could
not happen: no staff session exists in this environment and none was
simulated. What it produced instead is the most important measurement of
the project so far — a **supply ceiling**: no record in the product has
deadline evidence (see section H). Verification-only milestone: no code
written, no data modified, no migration touched. Architecture review
CLOSED, score holds 9.7/10.

## D. What WAS implemented (Milestone 14, on top of Milestones 11–13)
- **Staff-only `/published-management`** (new route, `noindex`): lists
  the live published set — title, category, organization, source (or an
  explicit "none recorded (manually entered)"), publication date,
  "Status · publicly visible", a link to the public page — with ONE
  unpublish action per row behind a required confirmation step. Reached
  from the moderation queue header. No dashboards, no bulk selection,
  no analytics.
- **Unpublish = `published → rejected`** using the EXISTING enum value:
  no new status invented, no DDL, no deletion. The public detail page
  404s afterwards via the pre-existing published-only read; provenance
  columns are untouched; the row does not re-enter the pending queue.
- **Same authorization boundary**: `getModerationAccess()`, the same
  staff client, the same `OPPORTUNITY_SELECT`/`mapOpportunityRow`, the
  same explicit 500-row cap and `created_at asc, id asc` order.
  No RLS change, no second auth system.
- **Single-record safety**: pure pre-query gates (exact UUID target +
  fixed confirmation token + staff role + still-published) and a
  conditional update `.eq("id").eq("status","published")` that no-ops on
  a concurrent change; the payload is provably `{ status }` only.
- **New tests**: `tests/published-management.test.ts` (43 contract tests
  mapped 1:1 onto the ten required guarantees), wired into `npm test` →
  **296/296**.
- **Build caught a real defect** introduced by this milestone: a client
  component imported a value from a server-only module, pulling
  `next/headers` into the browser bundle. The confirm token now lives in
  client-safe `lib/staff-form-state.ts`. Treat "lint + tsc green" as
  insufficient for client/server boundaries — only `next build` proves it.

### Milestone 11 (on top of Milestone 10)
- **Live re-probe replaced estimates**: 213 total / 198 pending / 10
  published / 5 rejected (sum closes); 79% of records are category
  `other`; top 5 sources hold ~half the queue; live categories remain
  the 10 seeded rows (0004/0010 still absent).
- **Queue view filters** (`?bucket=1..8`, `?source=<name>`): server-side
  URL params over the SAME deterministic staff-only pending read — chip
  row for triage buckets (with counts), collapsible source list, "All" /
  "Clear filter", filtered empty state. Pure `parseQueueFilter` is
  hostile-input-safe; buckets reuse `triageBucketOf` (no second score).
- **Filter carry-forward**: `getQueueNavigation(id, filter)` computes
  position + next WITHIN the filtered batch ("Item X of Y in this
  filter"); back-to-queue and next-record links keep the filter;
  end-of-batch has no fallthrough to hidden rows. `DecisionForm` takes
  server-built `nextHref`/`queueHref`.
- **New tests**: `tests/queue-filter.test.ts` (30 contract tests),
  wired into `npm test`.
- **Milestone 10 stands**: evidence-first review, known/unknown hints,
  sticky decisions, Enter-driven next record, live-taxonomy select,
  suggested entry, triage badges (all unchanged and still tested).
- Safety battery this freeze: tests **253/253**, lint clean, tsc clean
  (standard + fresh-checkout ci-check).

## E. What was DELIBERATELY NOT implemented (Milestones 11–15)
- **Milestone 15**: NO record unpublished (no staff session existed), no
  simulated/faked session, no new moderation UI, no redesign of the
  existing queue, no speculative efficiency numbers, no source added or
  removed on anecdotal evidence, no deadline "fix" invented for the
  supply ceiling, no AI activation, no migration applied. The one
  suspected post-unpublish UI quirk (the success message may not render
  because the row leaves the list on revalidation) was deliberately NOT
  touched — unobservable without a session and speculation to fix.
- **Milestone 14**: NO record was unpublished — cleanup is the owner's
  per-record decision, not an autonomous batch. No new status, no
  migration, no delete path, no re-publish path, no bulk action, no
  second auth system, no public mutation route. A status-change AUDIT
  row is impossible without DDL (0003 CHECK-constrains
  `opportunity_enrichments.field` to venue/address/city/region/deadline)
  — reported as an owner gate rather than worked around or faked.
- **Milestone 11**: no DB-side filter engine, no client JS state, no keyword/location/
  deadline filters — the data justified exactly two filters; more would
  turn the queue into a dashboard.
- No auto-approve / auto-reject / bulk decisions; filters are views,
  never verdicts; heuristic buckets stay starred.
- No deletion of the published test artifacts (mutation boundary).
- No inferred unknown values; no schema/migration changes; no new
  secrets/env vars/API routes/external integrations.

## F. Live migration / taxonomy state (owner-gated)
- Migrations **0004** (admissions), **0010** (jobs), **0008** (drop
  `'Tanzania'` country default), **0009** (moderation attribution) —
  all **ABSENT** (re-verified by live behavior probes 2026-08-30 in
  Milestone 15), owner action required.
- Live `categories` table has exactly **10** rows. `admissions`/`jobs`
  are NOT seeded; discovery skips them loudly; submit form, homepage hub
  AND the moderation category select all hide them until 0004/0010 land
  (then they appear automatically, no code change).
- `country` is still `not null default 'Tanzania'` (0008 pending), so
  public UI suppresses country display entirely; moderation writes country
  only when the moderator supplies it.

## G. Current discovery state
- Registry `opportunity_sources`: 29 rows, 18 active. Every active source
  has succeeded at least once (`last_success_at` set, `last_error` null).
  Two transient fetch failures on 2026-08-30: Bank of Tanzania, Youth of
  UNATA.
- Milestone-9 validation run (exact CI command, 2026-08-30): 18/18 ok,
  0 errors, 215 candidates → 0 inserted (177 duplicates skipped —
  everything discoverable today is already queued), ~49s wall time.
- Live DB (re-probed 2026-08-30, M11 + M15): **213 total / 198 pending /
  10 published / 5 rejected / 0 expired** — unchanged, no drift.
- **M15 read-only dry-run** (`scripts/discovery/dry-run.ts`, writes
  nothing): 18 sources → 20 fetches, 2 failures, **147 valid candidates,
  0 with explicit location, 0 with deadline, 0 with both, 147 with
  neither**, 29 obvious section labels noise-filtered. This is the
  primary evidence for the deadline ceiling in section H.
- **Latent 0004/0010 recovery, measured WITHOUT applying them**: 5 of the
  147 live candidates propose `admissions` (4) or `jobs` (1); today
  `runner.ts` counts them `categorySkipped` because no seed row exists.
  They would be captured by the first run after the owner applies 0004 +
  0010 — a real, if small, expected yield, not an estimate.
- **GitHub-side proof still pending**: latest runs are still #1–#3 (all
  failures; re-checked M12 + M13 + M14 + M15, 2026-08-30 — no new run
  yet). Run #3 step detail: Install ✓, Tests ✓, **Typecheck ✗**, Lint and
  the discovery worker skipped — the failure is the known pre-fix
  typecheck, NOT a discovery defect.
- **NEW M15 forensic fact (post-push re-check)**: all three runs report
  `head_branch: main` but `head_sha` = `ed13afe` (runs #2, #3) /
  `f1a8c21` (run #1) — `git merge-base --is-ancestor` proves `ed13afe`
  predates the Milestone-9 fix `75fbc39`, and `main` is now `5381a18`.
  **The scheduled runs never checked out the fixed code**, so the fix is
  still unexercised — and the cron appears to resolve a stale ref.
  Consequence: do NOT infer pass/fail from the cron; only an owner
  `workflow_dispatch` (gate L3) proves the current tip. No dispatch
  credential exists here; the next cron is 2026-08-31 03:00 UTC.
- **M12 + M15 behavior probes agree (2026-08-30)**: 0004 NOT applied (no
  `admissions` row among the 10 live category slugs), 0010 NOT applied
  (no `jobs` row), 0008 NOT applied (all 213 rows still carry
  `country='Tanzania'`, 0 NULL — the count of historical default rows
  if/when 0008 lands), 0009 NOT applied (`select decided_by` → "column
  opportunities.decided_by does not exist"), 0003 applied (audit table
  live, 0 status audit rows).

## H. Current moderation state
- Pending backlog 198 rows (live-confirmed). M10 shortened the per-record
  path; M11 added batch navigation (bucket + source filters with
  carry-forward) so like records clear like one walk-through.
- **M15 refuted part of the earlier claim that "moderation throughput is
  THE binding constraint".** Effort is a constraint, but there is a hard
  supply ceiling underneath it: **198/198 pending rows have
  `deadline = NULL`**. Persistence is NOT the bug — `runner.ts`
  `buildPendingRow` does write `deadline`, and `enrich.ts` re-derives it
  from JSON-LD. The gap is upstream: `extract.ts` deliberately reads a
  deadline only from explicit typed evidence
  (`applicationDeadline → registrationDeadline → validThrough`) and
  never infers one from `startDate`/`endDate`/`pubDate` (fixture-tested
  behaviour). Honest policy, so the cost shows up as NULL.
- **What that means for the KPI, measured with the production
  derivations** (`lib/lifecycle.ts` `deriveLifecycleState`, real
  `lib/triage-bucket.ts`): the 10 published rows are 1 active / 2
  expired / 7 unknown, and the one active row is a test artifact →
  **0 legitimate published records are currently provably actionable by
  deadline**. Of the 57 first-review pending rows (buckets 1–6),
  **active = 0, unknown = 57** → *a perfect first session can publish at
  most 0 provably-live items without reading each source page.*
- **M12/M15 triage distribution of the 198** (real library, read-only):
  bucket 1 looks-actionable 21, bucket 2 high-value 31, bucket 5
  hackathon/competition 3, bucket 6 event/training 2, bucket 7 ambiguous
  135, bucket 8 news-like 6 (= 198). Non-ambiguous yield by source:
  OpportunitiesForAfricans 17/25, Youth of UNATA 11/14, OpportunityDesk
  10/20, SUZA 5/15, DIT 4/16, VETA 4/10; worst NMAIST 1/36 (35 ambiguous
  nav fragments). No source was added or removed on this evidence.
- Next-in-queue navigation preserved and filter-aware; NO bulk actions
  (attribution needs 0009 anyway).
- 10 published rows include 5 loudly-titled test artifacts identified by
  exact title (`PRODUCTION LINK TEST — DELETE ME`, `REGRESSION Alpha`,
  `REGRESSION Bravo`, `hack`, `hackkka`) plus a Swahili news headline;
  M15 re-confirmed by id/slug/date: **all five artifacts have
  `opportunity_sources` = null and 2026-08-26 timestamps, while the five
  legitimate rows are source-linked 2026-08-27 discovery output** — the
  cleanup target set is unambiguous.
- **M14 shipped the missing control surface**: `/published-management`
  (staff-only, one confirmed unpublish per row, `published → rejected`).
  Using it is still the owner's per-record decision and requires a real
  staff session — **no record has been unpublished by engineering, and
  none was simulated in M15**.
- **Staff account state (M15)**: `profiles` holds exactly one row, `role
  = 'moderator'`, which satisfies both authorization layers — the app
  check `["moderator","admin"]` (`lib/data/moderation.ts`) and SQL
  `is_staff()` (`role in ('admin','moderator')`, 0001). So gate L5 is a
  credential/session handoff, not a provisioning defect.

## I. Current AI state
- **Disabled, and confirmed disabled in production** (M15): no provider
  or assistant vars exist in this environment (names audited, values
  never printed), and `POST /api/assistant/ask` returns
  `{"mode":"disabled"}`. Do not activate until moderation + taxonomy
  gates clear, the published corpus is trustworthy, and the owner
  supplies a provider credential — M15's supply-ceiling finding moves
  AI further away, not closer.

## J. Known production state
- Production (https://techopportunity-tanzania.vercel.app) deploys from
  `origin/main`; M7–M14 are live. **M15 verified unauthenticated**:
  `/published-management` → 307 `/login?next=%2Fpublished-management`,
  `/moderation` → 307, published detail 200, pending detail 404,
  rejected detail 404, category filters render, assistant disabled.
- **The cleanup baseline is armed.** As of 2026-08-30 all five artifact
  detail pages return 200 and their exact titles are still present in
  the HTML of `/`, `?category=hackathon`, `?category=competition`,
  `?category=fellowship`, `?category=scholarship` and `?sort=newest`
  (needle list recorded in the M15 freeze record). After the owner
  unpublishes them, the same fetches must show every needle gone and
  nothing else changed.
- Staff INTERACTION with `/published-management` and the moderation queue
  remains unverified — no staff session existed and none was simulated.

## K. Known environment problems
- `next build` **environment-blocked**: Turbopack pooled-process spawn
  "Access is denied" (os error 5), machine-level, unrelated to code, seen
  Milestones 5–15. Attempt once, classify, move on; the successful
  Vercel production build of the same commit is the substitute proof.
  CI gates on install→test→tsc→lint→discovery, NOT on `next build`.
- `gh` CLI is NOT installed; read-only GitHub inspection works through
  unauthenticated REST (`api.github.com`, repo is public). Forensics
  method: `/actions/runs/<id>/jobs` + `/check-runs/<id>/annotations`.
- Windows fallback-shell quirks: quote mangling breaks inline `node -e`,
  `findstr` multi-pattern, and `git commit -m "..."`. Use script files,
  the Grep tool, and `git commit -F <file>`.

## L. Outstanding owner gates
1. Apply migrations in order **0004 → 0010 → 0008 → 0009**.
2. Confirm the three GitHub Actions secrets exist (names verified to
   match: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`) — existence is not readable
   unauthenticated.
3. Trigger ONE `workflow_dispatch` of "Discovery sync" from the Actions
   tab. This is now the ONLY trustworthy proof of the M9 fix: the M15
   re-check showed every cron run checked out a pre-fix commit (`ed13afe`)
   even though `main` had moved on, so a scheduled run cannot be read as
   a verdict on the current tip.
4. Provide a provider credential + decision before enabling AI.
5. Supply ONE interactive staff login (browser session on production).
   M15 proved the account already exists and is authorized (`role =
   'moderator'`, passes both layers) — what is missing is only the
   credential/handoff, so no provisioning work is needed.
6. Hide the 5 known published test rows with the new M14 tool
   (`/published-management`, staff login, one deliberate confirmation
   per record). There is deliberately no bulk path and engineering will
   not perform this cleanup autonomously. The BEFORE baseline (section J)
   is armed, so each action is verifiable after the fact.
7. NEW (M15): decide whether deadline EVIDENCE becomes the next product
   focus. 198/198 pending rows and 147/147 live candidates carry no
   deadline, so moderation effort alone cannot raise trustworthy
   published inventory — that is a data-supply problem, not a UI one.

## M. Exact FIRST task for the next session
> **Spend one real staff session on the two things engineering cannot
> do: (1) unpublish the 5 known test artifacts in
> `/published-management`, one confirmation each, then re-fetch the
> section-J URLs and require every needle gone; (2) review the first
> 10–15 bucket-2 high-value pending records with the CURRENT UI and
> write down only friction actually hit.** No new moderation feature
> before that observation exists.

Then: fetch `/actions/workflows/343653332/runs?per_page=3` and read
`head_sha` BEFORE interpreting the conclusion — if it is not current
`main`, the run did not test the fix (that is exactly what M15 found for
all three existing runs). A green result on the current tip with the
`discover` worker reached closes Milestone 9 end-to-end; if it failed,
read that run's jobs + annotations (same method as M9) and fix only the
proven cause.
If the owner's unpublish actions happened, also re-confirm the 5
legitimate published rows are untouched (ids recorded in the M15 freeze
record) and that no record was deleted — status only.

## N. Recommended model for that first task
A lighter flash-tier model is sufficient for the run-status check and
routine product work. Reserve a MAX-tier high-reasoning model for a
new forensics round ONLY if the next workflow run fails again.

## O. Do-not-do list (architectural boundaries, preserved)
- No uncontrolled social scraping.
- No autonomous publishing — human moderation is the only gate.
- No auto-approve/auto-reject or bulk decisions from heuristics.
- No eligibility guessing from domain, institution, or title.
- No fabricated deadlines, locations, organizers, categories, or country.
- No crawler framework, vector DB, or extra backend without evidence.
- No mobile work before web product maturity.
- No architecture rewrite without concrete evidence.
- No applying owner-gated migrations from application code or scripts.
- No presenting heuristic classification as ground truth.
- No suppressing workflow failures (`|| true`, `continue-on-error`) to
  appear green.
- No claiming an issue fixed or a milestone deployed without evidence.

---

## Freeze record (this session, 2026-08-30, Milestone 15; M14/M13/M12 passes appended below)

### M15 first-session attempt (2026-08-30, read-only, no code changes)
- Started clean at `46bca13`, `main == origin/main`; ended with docs only.
  **No code written, no row modified, no migration applied, no AI
  activation.**
- **The first real moderation/trust session DID NOT happen and was not
  simulated.** This environment has no authenticated staff session; env
  var NAMES were audited (3 Supabase vars only, no credentials printed),
  and the single `profiles` row is `role = 'moderator'` — so the
  authorized account exists and the gate is purely the interactive
  login. Implementation was verified by code, tests, and the public
  authentication boundary instead (307 to `/login?next=…` from
  production for both `/published-management` and `/moderation`).
- Phase 2 boundary checks passed with no design change needed: staff-only
  listing of `status='published'` only, one unpublish action per row,
  no delete, no bulk, no arbitrary status control (43 contract tests +
  production auth probe).
- **BEFORE baseline (armed for the owner's cleanup)** — all five artifact
  detail URLs 200, and these exact needles present in `/`,
  `?category=hackathon|competition|fellowship|scholarship`,
  `?sort=newest`: `REGRESSION Alpha`, `hackkka`,
  `PRODUCTION LINK TEST — DELETE ME`, `hack`, `REGRESSION Bravo`.
  Target ids (for after-the-fact verification, read from live DB):
  `regression-alpha`, `hackkka-3bde699b`,
  `production-link-test-delete-me-23cf5bc9`, `hack-194b91c0`,
  `regression-bravo`. Keep rows (source-linked, 2026-08-27):
  `digital-financial-services-…`, `master-of-innovation-…`,
  `university-of-dar-es-salaam-…`, `waziri-wa-elimu-…`,
  `erasmus-global-call-for-applications-…`.
- **Highest-value finding — the supply ceiling**: 198/198 pending and
  147/147 freshly extracted candidates have NO deadline evidence; 0
  legitimate published rows are provably live; a perfect first session
  publishes at most 0 provably-live items without reading source pages.
  Traced to the intentional extraction policy, NOT a persistence bug
  (`runner.ts` writes `deadline`; `extract.ts` refuses `startDate`/
  `endDate`/`pubDate`; `enrich.ts` is JSON-LD-only).
- Post-cleanup projection (read-only): hiding the 5 artifacts leaves 5
  published rows — 4 category `other`, 1 scholarship whose deadline is
  already past. Public trust improves; inventory usefulness does not.
- Battery: **296/296** tests, lint clean, tsc clean (standard +
  ci-check). Build attempted ONCE → known Turbopack os error 5 at
  pooled-process spawn AFTER every code-level gate passed
  (environment-blocked, Milestones 5–15); no code error hidden behind
  that classification.
- Security re-verified by grep: 0 `SERVICE_ROLE` outside
  `scripts/discovery`, no Supabase `.delete(` anywhere in app code, no
  `.upsert(`/`.in(`/`.match(`, one API route, `.env.local` ignored,
  `/published-management` reachable only from staff pages.
- Post-push re-check added the CI forensics in section G (cron runs
  checked out a pre-fix `head_sha`), which is why gate L3 became "the
  only trustworthy proof" rather than "optional speed-up".

### M14 published-record management pass (2026-08-30)
- Started clean at `0b5574e`; read-only Phase 0 inventory listed all 10
  published rows with id/slug/category/source/date and pinned the 5
  exact-title test artifacts (every one of them `src` = null).
- One new staff-only route + one new data module + one new server action
  path (`app/published-management/`, `lib/data/published-management.ts`,
  `unpublishOpportunityAction`); moderation queue gained a single link.
- `published → rejected` chosen after reading the 0001 enum + RLS
  policies: existing value, no DDL, no delete, public read scoping does
  the hiding. No audit row written because 0003's `field` CHECK forbids
  it — reported as an owner gate, not silently worked around.
- Security verified by grep, not assertion: 0 `SERVICE_ROLE` in `app/` +
  `components/`, 0 `.delete(` / `.upsert(` in `app/`, 0 `.from(` in
  `app/api` (assistant still cannot mutate), exactly one new write op in
  `lib/data` and it is status-only.
- Battery: **296/296** tests (43 new), lint clean, tsc clean (standard +
  ci-check). Build attempt 1 failed on a REAL defect introduced here
  (`next/headers` in the client bundle) → fixed → attempt 2 returned the
  known Turbopack os error 5 (environment-blocked, Milestones 5–14).
- **NO data was modified**: nothing unpublished, no cleanup performed,
  no production staff interaction claimed as verified.

### M13 owner-gate activation pass (2026-08-30, read-only, no code changes)
- Git unchanged at start: `main` == `origin/main` @ `6c01f87`, tree clean.
- All four owner migrations re-probed and STILL ABSENT (0004 no
  `admissions` row, 0010 no `jobs` row, 0008 213/213 `'Tanzania'` +
  0 NULL, 0009 no `decided_by` column); 0003 audit live. Dependent
  Phases 3/4/5/6 could not run and were not faked.
- Honesty re-verified while gated: `decided_by`/`decided_at` are
  referenced NOWHERE in `app/` or `lib/` (no writes to missing 0009
  columns); country written only when supplied (not-null guard holds);
  `?category=jobs` / `?category=admissions` render honest empty states;
  homepage hub lists only the 10 live categories.
- Source yield re-measured (identical 213/198 — discovery still gated,
  nothing drifted): NMAIST 1 actionable of 36 (3%) — noise pattern
  CONFIRMED; best OpportunitiesForAfricans (17 actionable / 15
  high-value), Youth of UNATA (79% yield). Aggregates match M12
  (31 high-value, 57 actionable-first).
- **NEWLY PROVEN (Phase 8)**: the ~6 test/noise published artifacts are
  live on the PUBLIC homepage and category filters (`?category=hackathon`
  → "REGRESSION Alpha", "hack"; `?category=fellowship` → "PRODUCTION
  LINK TEST — DELETE ME"; homepage also shows the "WAZIRI…" news
  headline). They actively damage public trust and the KPI, and there is
  NO published-record management surface to remove them. This is now an
  evidence-backed owner need, not speculation.
- Battery: 253/253 tests, lint, tsc green on unchanged tree; build
  env-blocked (Turbopack os error 5) as usual, attempted once.
- Production re-probed: `/`, scholarship/fellowship/hackathon/internship,
  jobs/admissions/soon honest-empty, published detail 200, pending
  detail 404, `/moderation` staff gate, assistant disabled — all correct.
- **First real moderation session: still blocked** on staff credentials
  (owner gate L5); no friction invented.

### M12 verification pass (2026-08-30, read-only, no code changes)
- Git unchanged: `main` == `origin/main` @ `7e792f4`, tree clean; no
  checkpoint commit created.
- All four owner-gated migrations re-confirmed ABSENT by live behavior
  (details in section G). Category recovery, country probe, and
  attribution test were therefore SKIPPED — they need the owner's SQL
  action first (0004 → 0010 → 0008 → 0009).
- First real moderation session: **not executable here** — moderation
  requires staff credentials that only the owner can provision (gate
  L5). No speculative friction was invented.
- Battery re-run clean on the unchanged tree: 253/253 tests, lint,
  tsc; build env-blocked (os error 5) as usual.
- Production re-probed: homepage, category filters (jobs/admissions
  honestly empty), region filter, published detail 200, pending 404,
  `/moderation` staff gate — all correct.
- **Next session**: same as section M — confirm the green cron run,
  then the owner's migration + staff-account gates unblock everything
  downstream (recovery, attribution, the real session).

### Milestone 11 freeze record
- Git: `main` pushed to `origin/main`; working tree clean; one code
  commit + one docs commit on top of the M10 tip.
- Tests 253/253; lint clean; typecheck clean (standard + fresh-checkout
  ci-check); build environment-blocked (Turbopack os error 5); pre-push
  L3 deep security review run per policy.
- Security pass: moderation staff-gated, zero SERVICE_ROLE references
  outside `scripts/discovery`, filter code is pure/read-only/view-only;
  no new write path / env var / secret / external integration;
  decision semantics unchanged.
- Live DB probes were READ-ONLY (count + slug selects); no rows touched.
- `.env.local` ignored + untracked; no temp/probe files tracked.
- **No migration, no schema change, no auto-decision logic, no bulk
  action was introduced.** Repository frozen for an exact, safe restart
  at section M.
