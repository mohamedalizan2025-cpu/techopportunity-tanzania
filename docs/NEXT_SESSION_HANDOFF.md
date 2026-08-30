# Next-Session Handoff — End-of-Day Freeze / Checkpoint (authoritative restart)

STOP/FREEZE note. This is the single authoritative document for resuming
work next session. It is not a redesign and not a feature plan. Git state
and the safety battery below were re-run on **2026-08-30** (Milestone 9);
live data counts come from the last real DB probe (2026-08-29) plus the
verified Milestone-8/9 runs — re-confirm with
`scripts/discovery/inspect-live.ts` before acting on any number.

---

## A. Current Git HEAD
`75fbc39` — "ci(workflow): bump Actions to v5 / Node 22; add fresh-checkout
typecheck guard", with this Milestone-9 docs record committed directly
on top of it (the docs commit is the tip of `main` and `origin/main`).

The two Milestone-9 fix commits immediately before it:
- `c1babe5` fix(layout): explicit root-layout prop type instead of
  build-generated LayoutProps
- `75fbc39` ci(workflow): bump Actions to v5 / Node 22; add fresh-checkout
  typecheck guard

## B. Branch / origin synchronization
- Branch `main`, **in sync** with `origin/main` (ahead 0, behind 0).
- **The 9-session push outage is OVER.** On 2026-08-30 the full backlog
  (`ed13afe..75fbc39`, 11 commits incl. Milestones 3–8) pushed cleanly
  over https. No force-push, no history rewrite, no duplicate commits were
  ever needed.

## C. Latest completed milestone
**Milestone 9 — GitHub Discovery Sync forensics + operational recovery.**
The repeated CI failure now has a proven root cause, a shipped fix, and a
bit-for-bit local reproduction. No architecture change (score holds
9.7/10).

## D. What WAS implemented (Milestone 9)
- **Incident resolved with hard evidence.** Run 33302411277 (schedule,
  commit ed13afe): jobs API shows checkout/setup-node/npm ci/tests all
  succeeded; **Typecheck failed in 4s**; Lint + discovery worker were
  SKIPPED. Annotation: `app/layout.tsx:22:50 — Cannot find name
  'LayoutProps'` (exit code 2). Runs #1–#3 all failed identically;
  discovery has never executed in CI.
- **Root cause**: `RootLayout` used `LayoutProps<"/">`, a global declared
  only by git-ignored `.next/types/routes.d.ts` (via `next-env.d.ts`).
  Present after any local dev/build → local tsc green; absent on a fresh
  CI checkout → TS2304. Stale `tsconfig.tsbuildinfo` reinforced the local
  blind spot. Reproduced bit-for-bit (same file/line/column/message/exit).
- **Fixes**: explicit `RootLayoutProps` in `app/layout.tsx`; workflow
  actions bumped to `checkout@v5` / `setup-node@v5` + Node 22 (resolves
  the Node-20 deprecation annotation); `tsconfig.ci-check.json` added as
  the fresh-checkout typecheck diagnostic (full fidelity with `.next`
  moved aside).
- Pre-push L3 deep security review: **0 findings**.
- Safety battery this freeze: tests 194/194, lint clean, tsc clean,
  fresh-checkout typecheck clean.

## E. What was DELIBERATELY NOT implemented
- No discovery-code change (the worker never ran in any failed run —
  evidence, not suspicion, drives edits).
- No migrations applied; no GitHub secrets created/modified/verified.
- No retry storm, no `|| true`, no `continue-on-error`, no suppression of
  any failure signal.
- **The workflow is NOT yet proven green on GitHub.** Pushes do not
  trigger it (schedule + workflow_dispatch only) and no credential exists
  here to dispatch. Claim of success is held for a real run.

## F. Live migration / taxonomy state (owner-gated)
- Migrations **0004** (admissions), **0010** (jobs), **0008** (drop
  `'Tanzania'` country default), **0009** (moderation attribution) —
  all **ABSENT** (last live-verified 2026-08-29), owner action required.
- Live `categories` table has exactly **10** rows. `admissions`/`jobs`
  are NOT seeded and are skipped loudly by discovery; UI hides them in
  BOTH hub and submit form. They auto-appear when 0004/0010 land.
- `country` is still `not null default 'Tanzania'` (0008 pending), so
  public UI suppresses country display entirely.

## G. Current discovery state
- Registry `opportunity_sources`: 29 rows, 18 active. Pipeline unchanged:
  fetch (SSRF choke point) → adapter → extract → normalize → validate →
  noise gate → dedupe → pending → moderation.
- Milestone-9 validation run (exact CI command, 2026-08-30): 18 checked,
  **18 ok, 0 errors**, 215 candidates → 0 valid → 0 inserted (177
  duplicates skipped — everything discoverable today is already queued),
  ~49s wall time. The Milestone-8 health gate + timeout remain in place.
- Estimated DB now: ~213 total / ~198 pending. **Re-verify with
  `inspect-live.ts`.**

## H. Current moderation state
- Pending backlog is substantial (~198 rows) with <4% metadata coverage —
  moderation throughput, not discovery volume, is the binding constraint
  (Milestone-9 run proved discovery now finds net-zero new items).
- Next-in-queue navigation exists; no bulk actions (needs 0009).
- ~5 published test artifacts (`regression-*`, `hack*`,
  `production-link-test-delete-me`) still need owner/moderator cleanup —
  deliberately not touched.

## I. Current AI state
- **Disabled.** Scaffold complete and tested (plan parser, grounded
  published-only executor, boundary detection, rate limiter,
  `mode:disabled` on POST). Runtime gated by `ASSISTANT_ENABLED`/provider
  credential, which do not exist. Do not activate until moderation +
  taxonomy gates clear and the owner supplies a provider credential.

## J. Known production state
- Production (https://techopportunity-tanzania.vercel.app) was probed
  PRE-push on 2026-08-30: healthy, still the PRE-Milestone-7 build,
  `/moderation` routes through staff sign-in.
- Since the push, Vercel deploys from `origin/main` — Milestones 7–9
  become live when its redeploy completes. **Verify at session start**:
  homepage should show the live-taxonomy hub + deadline quick links
  (M7), and the next Discovery sync cron should run green (M9).

## K. Known environment problems
- `next build` **environment-blocked**: Turbopack pooled-process spawn
  "Access is denied" (os error 5), machine-level, unrelated to code, seen
  Milestones 5–9. Attempt once, classify, move on. CI gates on
  install→test→tsc→lint→discovery, NOT on `next build`.
- `gh` CLI is NOT installed; read-only GitHub inspection works through
  unauthenticated REST (`api.github.com`, repo is public). Any future
  log forensics can repeat the M9 method: `/actions/runs/<id>/jobs` +
  `/check-runs/<id>/annotations`.
- Windows fallback-shell quirks: quote mangling breaks inline `node -e`,
  `findstr` multi-pattern, and `git commit -m "..."`. Use script files,
  the Grep tool, and `git commit -F <file>`.

## L. Outstanding owner gates
1. Apply migrations in order **0004 → 0010 → 0008 → 0009**.
2. Confirm the three GitHub Actions secrets exist (names verified to
   match: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`) — existence is not readable unauthenticated.
3. Optionally trigger ONE `workflow_dispatch` of "Discovery sync" from
   the Actions tab to validate the fix immediately instead of waiting for
   the 03:00 UTC cron.
4. Provide a provider credential + decision before enabling AI.
5. Provision/confirm Supabase Auth staff accounts for moderators.
6. Decide removal of the ~5 published test rows.

## M. Exact FIRST task for the next session
> **Confirm the Discovery sync workflow ran green on GitHub (cron run of
> 2026-08-31 03:00 UTC or an owner dispatch), then STOP infrastructure
> archaeology and return to product.**

Concretely: fetch `/actions/workflows/343653332/runs?per_page=3`; if the
newest run is green with a `discover` step that reached the worker,
Milestone 9 is closed end-to-end. If it failed, read that run's jobs +
annotations (same method as M9) and fix only the proven cause.

Then, per owner direction, build the product:
1. richer actionable opportunities
2. stronger opportunity categorization
3. better moderator throughput (the binding constraint)
4. worldwide opportunity experience (gated on 0008/eligibility migrations)
5. AI assistant activation (owner credential gate)
6. final whole-system audit

## N. Recommended model for that first task
A lighter flash-tier model is sufficient for the run-status check and
routine product work. Reserve a MAX-tier high-reasoning model for a
new forensics round ONLY if the next workflow run fails again.

## O. Do-not-do list (architectural boundaries, preserved)
- No uncontrolled social scraping.
- No autonomous publishing — human moderation is the only gate.
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

## Freeze record (this session, 2026-08-30, Milestone 9)
- Git: `main` in sync with `origin/main` at the docs tip; 11 previously
  backlogged commits pushed (`ed13afe..75fbc39` + docs commits).
- Tests 194/194; lint clean; typecheck clean; fresh-checkout typecheck
  clean; build environment-blocked (Turbopack os error 5); L3 security
  review 0 findings before push.
- Discovery validation run: 18/18 ok, 0 errors, 0 inserts (all
  duplicates), no DB changes from this session.
- `.env.local` ignored + untracked; no temp/probe files tracked; no
  `SERVICE_ROLE` reference in `app`/`components`/`lib`; workflow never
  echoes secrets.
- **No new feature work, no migration, no audit, no speculative change
  was started.** Repository frozen for an exact, safe restart at
  section M.
