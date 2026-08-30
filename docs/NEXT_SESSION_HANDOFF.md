# Next-Session Handoff — End-of-Day Freeze / Checkpoint (authoritative restart)

STOP/FREEZE note. This is the single authoritative document for resuming
work next session. It is not a redesign and not a feature plan. Git state
and the safety battery below were re-run on **2026-08-30** (Milestone 14);
live data counts come from a fresh read-only DB probe on 2026-08-30
(213/198/10/5) — re-confirm with
`scripts/discovery/inspect-live.ts` before acting on any number.

---

## A. Current Git HEAD
Tip of `main` / `origin/main` is the Milestone-14 docs commit sitting on
top of the Milestone-14 code commit (staff-only published-record
management), then:
- `0b5574e` docs: Milestone 13 owner-gate activation pass
- `6c01f87` docs: Milestone 12 verification pass
- `7e792f4` docs: Milestone 11 record
- `1f352e7` feat(moderation): server-side queue view filters

## B. Branch / origin synchronization
- Branch `main`, **in sync** with `origin/main` (ahead 0, behind 0) after
  the Milestone-14 push.
- No force-push, no history rewrite, no duplicate checkpoint commits.

## C. Latest completed milestone
**Milestone 14 — published-record management + public trust cleanup.**
The first mutation-capable staff surface since moderation, built inside
the existing authorization boundary and with zero DDL. It ships the
CONTROL; the actual cleanup of the test artifacts is the owner's
per-record decision. Architecture review CLOSED, score holds 9.7/10 —
do not reopen without new structural evidence.

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

## E. What was DELIBERATELY NOT implemented (Milestones 11–14)
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
  all **ABSENT** (last live-verified 2026-08-29), owner action required.
- Live `categories` table has exactly **10** rows. `admissions`/`jobs`
  are NOT seeded; discovery skips them loudly; submit form, homepage hub
  AND the moderation category select all hide them until 0004/0010 land
  (then they appear automatically, no code change).
- `country` is still `not null default 'Tanzania'` (0008 pending), so
  public UI suppresses country display entirely; moderation writes country
  only when the moderator supplies it.

## G. Current discovery state
- Registry `opportunity_sources`: 29 rows, 18 active. Pipeline unchanged.
- Milestone-9 validation run (exact CI command, 2026-08-30): 18/18 ok,
  0 errors, 215 candidates → 0 inserted (177 duplicates skipped —
  everything discoverable today is already queued), ~49s wall time.
- Live DB (re-probed 2026-08-30, M11): **213 total / 198 pending /
  10 published / 5 rejected.**
- **GitHub-side proof still pending**: latest runs are still #1–#3 (all
  pre-fix typecheck failures; re-checked M12 + M13 + M14, 2026-08-30 — no
  new run yet). No dispatch credential exists here. The green run is
  expected at the 2026-08-31 03:00 UTC cron or an owner dispatch.
- **M12 behavior probes (2026-08-30)**: 0004 NOT applied (no
  `admissions` row), 0010 NOT applied (no `jobs` row), 0008 NOT applied
  (all 213 rows still carry `country='Tanzania'`, 0 NULL — the count of
  historical default rows if/when 0008 lands), 0009 NOT applied
  (`decided_by` column absent), 0003 applied (audit table live).

## H. Current moderation state
- Pending backlog 198 rows (live-confirmed); moderation throughput
  remains THE binding constraint. M10 shortened the per-record path;
  M11 added batch navigation (bucket + source filters with
  carry-forward) so like records clear like one walk-through.
- **M12 quality measurement of the 198 pending rows** (exact triage
  regexes, read-only): 31 high-value + 3 hack/comp + 2 event/training +
  21 actionable* = **57 candidates worth reviewing first**; 135
  ambiguous + 6 news-like*. Best sources: OpportunitiesForAfricans
  (17 high-value / 25), OpportunityDesk (10/20), Youth of UNATA (11/14),
  SUZA (5/15); worst yield: NMAIST (1 actionable of 36 — 35 ambiguous
  nav fragments like "Monetary Policy", "Quick Links").
- Next-in-queue navigation preserved and filter-aware; NO bulk actions
  (attribution needs 0009 anyway).
- 10 published rows include 5 loudly-titled test artifacts identified by
  exact title (`PRODUCTION LINK TEST — DELETE ME`, `REGRESSION Alpha`,
  `REGRESSION Bravo`, `hack`, `hackkka`) plus a Swahili news headline;
  all 5 artifacts have `opportunity_sources` = null (manual test writes,
  not discovery output).
- **M14 shipped the missing control surface**: `/published-management`
  (staff-only, one confirmed unpublish per row, `published → rejected`).
  Using it is still the owner's per-record decision and requires a real
  staff session — no record has been unpublished by engineering.

## I. Current AI state
- **Disabled.** Runtime gated by `ASSISTANT_ENABLED`/provider credential,
  which do not exist. Do not activate until moderation + taxonomy gates
  clear and the owner supplies a provider credential.

## J. Known production state
- Production (https://techopportunity-tanzania.vercel.app) deploys from
  `origin/main`; M7–M14 become live as Vercel redeploys. **Verify at
  session start**: homepage live-taxonomy hub (M7), `/moderation`
  staff-gated with filter chips (M11), unauthenticated
  `/published-management` → login redirect (M14), and the next Discovery
  sync cron green (M9). Staff INTERACTION with the new surface is
  unverified until a real staff session exists — do not claim otherwise.

## K. Known environment problems
- `next build` **environment-blocked**: Turbopack pooled-process spawn
  "Access is denied" (os error 5), machine-level, unrelated to code, seen
  Milestones 5–14. Attempt once, classify, move on. CI gates on
  install→test→tsc→lint→discovery, NOT on `next build`.
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
3. Optionally trigger ONE `workflow_dispatch` of "Discovery sync" from
   the Actions tab to validate the M9 fix immediately instead of waiting
   for the 03:00 UTC cron.
4. Provide a provider credential + decision before enabling AI.
5. Provision/confirm Supabase Auth staff accounts for moderators.
6. Hide the 5 known published test rows with the new M14 tool
   (`/published-management`, staff login, one deliberate confirmation
   per record). There is deliberately no bulk path and engineering will
   not perform this cleanup autonomously.

## M. Exact FIRST task for the next session
> **Confirm the Discovery sync workflow ran green on GitHub (cron run of
> 2026-08-31 03:00 UTC or an owner dispatch). Then run the FIRST REAL
> MODERATION SESSION with a staff account (owner gate L5): walk the
> filtered pending queue AND use `/published-management` to hide the 5
> known test artifacts one record at a time. Friction must be reported
> from actual usage — the tooling is now complete enough that further
> UI work without a session would be speculation.**

Concretely: fetch `/actions/workflows/343653332/runs?per_page=3`; if the
newest run is green with a `discover` step that reached the worker,
Milestone 9 is closed end-to-end. If it failed, read that run's jobs +
annotations (same method as M9) and fix only the proven cause. After any
manual unpublish, re-probe `/`, `?category=hackathon` and
`?category=fellowship` to confirm the removed rows are gone and nothing
else changed.

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

## Freeze record (this session, 2026-08-30, Milestone 14; M12/M13 verification passes appended below)

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
