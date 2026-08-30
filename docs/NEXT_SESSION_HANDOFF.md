# Next-Session Handoff — End-of-Day Freeze / Checkpoint (authoritative restart)

STOP/FREEZE note. This is the single authoritative document for resuming
work next session. It is not a redesign and not a feature plan. Git state
and the safety battery below were re-run on **2026-08-30** (Milestone 11);
live data counts come from a fresh read-only DB probe on 2026-08-30
(213/198/10/5) — re-confirm with
`scripts/discovery/inspect-live.ts` before acting on any number.

---

## A. Current Git HEAD
Tip of `main` / `origin/main` is the Milestone-11 docs commit sitting on
top of:
- `feat(moderation): server-side queue view filters` (Milestone-11 code)
- `60c739b` docs: Milestone 10 record
- `a34e38e` feat(moderation): evidence-first review, triage hints,
  live-taxonomy categories (Milestone-10 code)

## B. Branch / origin synchronization
- Branch `main`, **in sync** with `origin/main` (ahead 0, behind 0) after
  the Milestone-11 push.
- No force-push, no history rewrite, no duplicate checkpoint commits.

## C. Latest completed milestone
**Milestone 11 — real moderation experience + targeted filtering.**
Product (display-layer) work only. Architecture review CLOSED, score
holds 9.7/10 — do not reopen without new structural evidence.

## D. What WAS implemented (Milestone 11, on top of Milestone 10)
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

## E. What was DELIBERATELY NOT implemented (Milestone 11)
- No DB-side filter engine, no client JS state, no keyword/location/
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
  pre-fix typecheck failures). CI fix is pushed and locally verified;
  the green run is expected at the 2026-08-31 03:00 UTC cron or an owner
  dispatch.

## H. Current moderation state
- Pending backlog 198 rows (live-confirmed); moderation throughput
  remains THE binding constraint. M10 shortened the per-record path;
  M11 added batch navigation (bucket + source filters with
  carry-forward) so like records clear like one walk-through.
- Next-in-queue navigation preserved and filter-aware; NO bulk actions
  (attribution needs 0009 anyway).
- 10 published rows include ~5 loudly-titled test artifacts
  (`regression-*`, `hack*`, `production-link-test-delete-me`) — no
  moderator-facing published-record management exists yet; removal is
  an owner decision (bulk mutation boundary).

## I. Current AI state
- **Disabled.** Runtime gated by `ASSISTANT_ENABLED`/provider credential,
  which do not exist. Do not activate until moderation + taxonomy gates
  clear and the owner supplies a provider credential.

## J. Known production state
- Production (https://techopportunity-tanzania.vercel.app) deploys from
  `origin/main`; M7–M11 become live as Vercel redeploys. **Verify at
  session start**: homepage live-taxonomy hub (M7), `/moderation`
  staff-gated with filter chips (M11), and the next Discovery sync cron
  green (M9).

## K. Known environment problems
- `next build` **environment-blocked**: Turbopack pooled-process spawn
  "Access is denied" (os error 5), machine-level, unrelated to code, seen
  Milestones 5–11. Attempt once, classify, move on. CI gates on
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
6. Decide removal of the ~5 published test rows.

## M. Exact FIRST task for the next session
> **Confirm the Discovery sync workflow ran green on GitHub (cron run of
> 2026-08-31 03:00 UTC or an owner dispatch). Then get REAL moderator
> usage of the filtered queue — the next friction list must come from
> actual review sessions, not more speculative UI. Likely candidates
> once moderation is in motion: published-record management (cleaning
> the test artifacts) and queue pagination past the 500-row cap (still
> far away at 198).**

Concretely: fetch `/actions/workflows/343653332/runs?per_page=3`; if the
newest run is green with a `discover` step that reached the worker,
Milestone 9 is closed end-to-end. If it failed, read that run's jobs +
annotations (same method as M9) and fix only the proven cause.

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

## Freeze record (this session, 2026-08-30, Milestone 11)
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
