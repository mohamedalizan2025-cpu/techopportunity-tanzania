# Next-Session Handoff — End-of-Day Freeze / Checkpoint (authoritative restart)

STOP/FREEZE note. This is the single authoritative document for resuming
work next session. It is not a redesign and not a feature plan. Git state
and the safety battery below were re-run on **2026-08-30**; live data
counts come from the last real DB probe (2026-08-29) plus the verified
Milestone-8 run — re-confirm with `scripts/discovery/inspect-live.ts`
before acting on any number.

---

## A. Current Git HEAD
`d7a1a9a` — "docs: Milestone 8 record — discovery reliability + taxonomy consistency"

The three Milestone-8 commits immediately before it:
- `204409b` fix(discovery): whole-run health gate + job timeout-minutes
- `b17947b` fix(submit): offer only live-taxonomy categories
- `d7a1a9a` docs: Milestone 8 record

## B. Branch / origin synchronization
- Branch `main`, **ahead 8, behind 0** of `origin/main`.
- The 8 unpushed commits are all legitimate (5 prior-milestone + 3
  Milestone-8). No temp files, no secrets, working tree clean.
- **Not pushed because github.com is unreachable from this environment**
  (8th consecutive session; `Failed to connect to github.com:443 after
  ~21000 ms`). Recovery is a single `git push origin main` once
  connectivity returns. No force-push, no history rewrite.

## C. Latest completed milestone
**Milestone 8 — Discovery Sync Reliability + Git Recovery + Taxonomy
Consistency.** Operational-reliability pass; no architecture change
(score holds 9.7/10).

## D. What WAS implemented (Milestone 8)
- Whole-run health gate (`scripts/discovery/index.ts`): per-source/feed/
  roundup failures stay isolated (exit 0), but when EVERY checked source
  errors the run now exits NON-zero — no more silent green on a total
  outage.
- `timeout-minutes: 30` on the `discover` job (`.github/workflows/discovery.yml`).
- Submit form switched to the SAME live taxonomy as the homepage hub
  (`listLiveCategories()` via a prop), so unseeded admissions/jobs are no
  longer selectable. 6 contract tests in `tests/submit-taxonomy.test.ts`.
- Docs: `architecture.md` §12.16 + decision-log row.
- Safety battery this freeze: tests 194/194, lint clean, tsc clean, L3
  security review 0 findings.
- Carried locally (from Milestone 7, still unpushed): live-taxonomy hub,
  deadline quick links, opportunity-first hero, country display
  suppressed pending 0008, assistant boundary copy.

## E. What was DELIBERATELY NOT implemented
- No migrations applied; no GitHub secrets created/modified.
- No retry storm, no `|| true`, no `continue-on-error`, no suppression of
  any failure signal.
- Did NOT claim the GitHub Actions failure is fixed (no run log could be
  read). Did NOT claim Milestone 7 is production-deployed (it is not).
- No new sources, no news/classifier subsystem, no AI provider, no
  architecture change, no second search engine.

## F. Live migration / taxonomy state (owner-gated)
- Migrations **0004** (admissions), **0010** (jobs), **0008** (drop
  `'Tanzania'` country default), **0009** (moderation attribution) —
  all **ABSENT**, owner action required.
- Live `categories` table has exactly **10** rows: hackathon, competition,
  scholarship, conference, workshop, internship, fellowship, grant,
  tech-event, other. `admissions`/`jobs` are NOT seeded and are skipped
  loudly (warn + counter) by discovery; UI now hides them in BOTH hub and
  submit form. They auto-appear when 0004/0010 land — no frontend change.
- `country` is still `not null default 'Tanzania'` (0008 pending), so
  public UI suppresses country display entirely.

## G. Current discovery state
- Registry `opportunity_sources`: 29 rows, 18 active. Pipeline: fetch
  (SSRF choke point in `scripts/discovery/fetch.ts`) → adapter → extract
  → normalize → validate → noise gate → dedupe → pending → moderation.
- Last FULL run (exact CI command, 2026-08-29): 18 checked, 14 ok, 4 fetch
  errors (ICT Commission, NM-AIST, UDSM, UDOM — isolated, run completed),
  165 candidates → 28 valid → **28 inserted pending**, 108 duplicates
  skipped, **0 categorySkipped**.
- Estimated DB now: ~213 total / ~198 pending (185/170 last probe + 28
  inserts). **Re-verify with `inspect-live.ts`.**

## H. Current moderation state
- Pending backlog is substantial (~198 rows) with <4% metadata coverage —
  moderation throughput, not discovery volume, is the binding constraint.
- Next-in-queue navigation exists; no bulk actions (needs 0009).
- ~5 published test artifacts (`regression-*`, `hack*`,
  `production-link-test-delete-me`) need owner/moderator cleanup —
  deliberately not touched.

## I. Current AI state
- **Disabled.** Scaffold complete and tested (plan parser, grounded
  published-only executor, boundary detection, rate limiter, `mode:disabled`
  on POST). Runtime gated by `ASSISTANT_ENABLED`/provider credential, which
  do not exist. Do not activate until moderation + taxonomy gates clear and
  the owner supplies a provider credential.

## J. Known production state
- Production (https://techopportunity-tanzania.vercel.app) is the **PRE-
  Milestone-7 build**: still renders static "Admissions & Programmes" /
  "Jobs & Vacancies" chips and an enabled assistant form. Vercel deploys
  from `origin/main`, which lacks the 8 unpushed commits.
- Therefore **Milestone 7 AND 8 are NOT deployed.** Deployment truth is
  gated entirely on the push succeeding.

## K. Known environment problems (do not chase tonight)
- GitHub (`github.com`, `api.github.com`, Actions) unreachable from this
  environment — blocks both push and CI-log forensics.
- No `gh` CLI installed.
- `next build` **environment-blocked**: Turbopack pooled-process spawn
  "Access is denied" (os error 5), machine-level, unrelated to code, seen
  Milestones 5–8. Attempt once, classify, move on. CI gates on
  install→test→tsc→lint→discovery, NOT on `next build`.
- Windows fallback-shell quirks: quote mangling breaks inline `node -e`,
  `findstr` multi-pattern, and `git commit -m "..."`. Use script files, the
  Grep tool, and `git commit -F <file>`.

## L. Outstanding owner gates
1. Apply migrations in order **0004 → 0010 → 0008 → 0009**.
2. Restore GitHub connectivity / repo credentials so the 8 commits can
   push and Actions logs become readable.
3. Confirm the three GitHub Actions secrets exist (names verified to
   match: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`) — existence is not readable from here.
4. Provide a provider credential + decision before enabling AI.
5. Provision/confirm Supabase Auth staff accounts for moderators.
6. Decide removal of the ~5 published test rows.

## M. Exact FIRST task for the next session
> **Investigate the repeated GitHub Actions "Discovery sync" failures
> before any further discovery expansion.**

Concretely, once GitHub is reachable: read the actual failed run logs
(`gh run list`, `gh run view --log`), identify the exact failing step and
error, and classify it (do not infer from the ~28s duration). Prior local
evidence pointed at the checkout→setup-node→`npm ci` window (dependency /
runtime / Actions-infra), never at discovery code — confirm or correct that
with real logs.

Then:
> **After discovery reliability is understood/fixed, return to
> opportunity-first product implementation.**

## N. Recommended model for that first task
A **MAX-tier high-reasoning model** for the Actions forensics (log triage
across steps, timing, and dependency/runtime hypotheses is reasoning-heavy).
A lighter flash-tier model is appropriate for routine checkpoint/freeze and
docs work like this one, but not for the forensic investigation.

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

## Freeze record (this session, 2026-08-30)
- HEAD `d7a1a9a`; `main` ahead 8, behind 0; working tree clean.
- Tests 194/194; lint clean; typecheck clean; build environment-blocked
  (Turbopack os error 5); L3 security review 0 findings.
- `.env.local` ignored + untracked; no temp/probe files tracked or on disk;
  no `SERVICE_ROLE` reference in `app`/`components`/`lib`.
- Checkpoint commit created after this edit; push attempted.
- **No new feature work, no migration, no audit, no speculative change was
  started.** Repository frozen for an exact, safe restart at section M.
