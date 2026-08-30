# Next-Session Handoff — End-of-Day Freeze / Checkpoint (authoritative restart)

STOP/FREEZE note. This is the single authoritative document for resuming
work next session. It is not a redesign and not a feature plan. Git state
and the safety battery below were re-run on **2026-08-30** (Milestone 10);
live data counts come from the last real DB probe (2026-08-29) plus the
verified Milestone-8/9 runs — re-confirm with
`scripts/discovery/inspect-live.ts` before acting on any number.

---

## A. Current Git HEAD
Tip of `main` / `origin/main` is the Milestone-10 docs commit sitting on
top of:
- `a34e38e` feat(moderation): evidence-first review, triage hints,
  live-taxonomy categories (the Milestone-10 code commit)
- `e64fe93` docs: Milestone 9 record

## B. Branch / origin synchronization
- Branch `main`, **in sync** with `origin/main` (ahead 0, behind 0) after
  the Milestone-10 push.
- No force-push, no history rewrite, no duplicate checkpoint commits.

## C. Latest completed milestone
**Milestone 10 — moderation throughput + opportunity quality.** Product
(display-layer) work only. Architecture review CLOSED, score holds 9.7/10
— do not reopen without new structural evidence.

## D. What WAS implemented (Milestone 10)
- **Queue (`/moderation`)**: triage bucket badge per row (port of the CLI
  triage buckets, `lib/triage-bucket.ts`), "suggested high-value record"
  entry link, honesty footnote for the two starred heuristic buckets
  (actionable-looking / news-like). Queue order itself unchanged
  (deterministic `created_at`).
- **Review (`/moderation/[id]`)**: evidence-first layout replacing the
  duplicated public detail render — prominent official-page link +
  discovery provenance block + honesty note first; "as discovered" facts;
  known-from-source vs unknown hints on every enrichment field (from
  defaultValue only — nothing inferred); sticky decision bar (`form=`
  attribute); "Item X of Y" position pill via a single queue read;
  success panel's next-record link autoFocused (Enter-driven flow).
  Approve AND reject both lead to the next pending record.
- **Category**: select now driven by the live taxonomy
  (`listReviewCategoryOptions` → pure `reviewCategoryOptions`); unseeded
  slugs never offered; record's own category always reviewable; foreign
  slugs dropped; falls back to the record's own category if the table is
  unreadable. Adopts 0004/0010 automatically when they land.
- **New tests**: `tests/triage-bucket.test.ts` (29 contract tests:
  buckets, heuristic honesty, suggestion stability, taxonomy honesty),
  wired into the `npm test` chain.
- **Audited, UNCHANGED**: `parseReviewInput`, `decideOpportunityAction`
  (double pending guard, reject = status-only, approve = validated write,
  provenance never read from form), RLS, migrations, secrets.
- Safety battery this freeze: tests **223/223**, lint clean, tsc clean
  (standard + fresh-checkout ci-check). Build: known Turbopack os error 5
  — environment-blocked, not redesigned.

## E. What was DELIBERATELY NOT implemented
- No auto-approve / auto-reject / bulk decisions of any kind. Triage is a
  prioritization hint only.
- No inferred unknown values; no eligibility guessing; no fabricated
  evidence; no provenance semantics change; no scraping from the
  moderation UI.
- No schema/migration changes; no fake admissions/jobs seeds.
- No queue reordering (suggestion is an entry point, not a reshuffle).
- No public write path, no new API route, no new env var/secret.

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
- Estimated DB now: ~213 total / ~198 pending. **Re-verify with
  `inspect-live.ts`.**
- **GitHub-side proof still pending**: as of the M10 freeze no new
  Discovery sync run existed since Milestone 9 (runs #1–#3 all failed at
  typecheck pre-fix). CI fix is pushed and locally verified; the green
  run is expected at the 2026-08-31 03:00 UTC cron or an owner dispatch.

## H. Current moderation state
- Pending backlog ~198 rows; moderation throughput is THE binding
  constraint. Milestone 10 shortened the per-record path:
  evidence visible immediately, decisions sticky, next record one Enter.
- Next-in-queue navigation preserved and improved; NO bulk actions
  (attribution needs 0009 anyway).
- ~5 published test artifacts (`regression-*`, `hack*`,
  `production-link-test-delete-me`) still need owner/moderator cleanup —
  deliberately not touched.

## I. Current AI state
- **Disabled.** Runtime gated by `ASSISTANT_ENABLED`/provider credential,
  which do not exist. Do not activate until moderation + taxonomy gates
  clear and the owner supplies a provider credential.

## J. Known production state
- Production (https://techopportunity-tanzania.vercel.app) deploys from
  `origin/main`; M7–M10 become live as Vercel redeploys. **Verify at
  session start**: homepage live-taxonomy hub (M7), `/moderation`
  staff-gated with the new evidence-first review (M10), and the next
  Discovery sync cron green (M9).

## K. Known environment problems
- `next build` **environment-blocked**: Turbopack pooled-process spawn
  "Access is denied" (os error 5), machine-level, unrelated to code, seen
  Milestones 5–10. Attempt once, classify, move on. CI gates on
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
> 2026-08-31 03:00 UTC or an owner dispatch). Then continue PRODUCT work:
> the actual moderation of the ~198-row queue is now owner/moderator
> work; the next engineering milestone is whatever the moderation
> experience still lacks (candidates: per-bucket queue filtering,
> deadline visibility in the queue rows, or enrichment prefill rules the
> owner explicitly approves).**

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

## Freeze record (this session, 2026-08-30, Milestone 10)
- Git: `main` pushed to `origin/main`; working tree clean; one code
  commit (`a34e38e`) + one docs commit on top of `e64fe93`.
- Tests 223/223; lint clean; typecheck clean (standard + fresh-checkout
  ci-check); build environment-blocked (Turbopack os error 5); pre-push
  L3 deep security review run per policy.
- Security pass: moderation staff-gated, zero SERVICE_ROLE references
  outside `scripts/discovery`, no new write path / env var / secret /
  external integration; decision semantics unchanged.
- `.env.local` ignored + untracked; no temp/probe files tracked.
- **No migration, no schema change, no auto-decision logic, no bulk
  action was introduced.** Repository frozen for an exact, safe restart
  at section M.
