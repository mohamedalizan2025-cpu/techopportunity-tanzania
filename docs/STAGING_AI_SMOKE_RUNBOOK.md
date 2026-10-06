# Staging AI smoke runbook (owner-executed, Preview only)

Status 2026-10-05: **PREPARATION ONLY — NOT YET EXECUTED.** Staging AI is
owner-approved; the protected Preview environment is reported configured.
Live smoke has never been performed from an agent environment
(Vercel-Authentication-blocked) and must be executed by the owner in an
authenticated browser session. Target time: **10–20 minutes** after key
rotation + Preview redeploy.

Authoritative design:
[AI_OPPORTUNITY_INTELLIGENCE.md](AI_OPPORTUNITY_INTELLIGENCE.md) (§7, §10),
evaluation evidence:
[AI_OPPORTUNITY_INTELLIGENCE_EVALUATION.md](AI_OPPORTUNITY_INTELLIGENCE_EVALUATION.md).
Production decision is separate:
[PRODUCTION_AI_DECISION_CHECKLIST.md](PRODUCTION_AI_DECISION_CHECKLIST.md).

## 0. Prerequisites (do not start without these)

- [ ] Owner has confirmed BOTH provider keys rotated/revoked after the
      `.env.example` exposure (see
      [NEXT_SESSION_HANDOFF.md](NEXT_SESSION_HANDOFF.md) §11). **Do not run
      this runbook on pre-rotation keys.**
- [ ] Protected Preview deployment redeployed with the new values (env names
      only — values never recorded here):
      `AI_OPPORTUNITY_INTELLIGENCE_ENABLED`,
      `AI_OPPORTUNITY_INTELLIGENCE_SPEND_MODE` (`free-quota`),
      `AI_OPPORTUNITY_INTELLIGENCE_PROVIDER_CHAIN` (`gemini,groq`),
      `GEMINI_API_KEY`, `GROQ_API_KEY`, and all four attestations
      (`…_GEMINI_UNPAID_DATA_USE_CONFIRMED`, `…_GEMINI_NO_BILLING_CONFIRMED`,
      `…_GROQ_ZDR_CONFIRMED`, `…_GROQ_NO_BILLING_CONFIRMED`).
- [ ] Production AI verified OFF (AI vars absent from production env;
      production takes env from the dashboard only — §F check F-1 confirms).
- [ ] Two staging-only synthetic test users ready: one with an
      **incomplete profile** (no core fields), one with a **complete profile**
      (career level + field + 1–2 sectors + 1–2 types). Synthetic data only —
      never copy production identities to staging.
- [ ] Know which staging records to use — the synthetic smoke corpus in
      [STAGING_AI_SMOKE_CORPUS.md](STAGING_AI_SMOKE_CORPUS.md) (insert first,
      staging dashboard only; verify Step 2 there before starting here):
  - `staging-smoke-national-fellowship-2026` (National, AI-searchable)
  - `staging-smoke-international-fellowship-2026` (International,
    AI-searchable)
  - `staging-smoke-no-deadline-grant-2026` (no deadline, AI-searchable)
  - `staging-smoke-unknown-eligibility-2026` (unknown eligibility, insight
    WITHHELD by design — D-3 PASS condition, not a defect)
- [ ] No deadline-soon (≤14 days) synthetic record exists in this corpus by
  design (stable far-future deadlines keep the smoke repeatable). D-4 is
  N/A unless a qualifying record happens to exist on staging at run time.

How to fill this in: for every check copy the four rows, run the TEST, write
what you saw under OBSERVED RESULT, and mark PASS/FAIL. Leave no check blank.

## A. Deployment guard (Preview only, production OFF)

### A-1 Preview deployment only

- TEST: Open the protected branch Preview URL (the `git-staging`
  deployment on isolated staging Supabase). Confirm the URL is the Preview
  origin, NOT the canonical production URL.
- EXPECTED RESULT: Page loads behind Vercel Authentication; canonical
  production URL is never opened during this runbook.
- PASS/FAIL:
- OBSERVED RESULT:

### A-2 Production AI remains OFF

- TEST: During this whole runbook, never set AI variables on production.
  Confirm production env has no `AI_OPPORTUNITY_INTELLIGENCE_*` /
  `GEMINI_API_KEY` / `GROQ_API_KEY` values (dashboard check, names only).
- EXPECTED RESULT: Production AI = OFF; production behavior unchanged
  (deterministic guidance everywhere).
- PASS/FAIL:
- OBSERVED RESULT:

## B. Authenticated login

### B-1 Staging sign-in (complete-profile user)

- TEST: Sign in on the Preview as the complete-profile synthetic user.
- EXPECTED RESULT: Login succeeds, session persists after reload, no error
  page; staff nav NOT visible (non-moderator).
- PASS/FAIL:
- OBSERVED RESULT:

### B-2 Staging sign-in (incomplete-profile user)

- TEST: Sign out, sign in as the incomplete-profile synthetic user.
- EXPECTED RESULT: Login succeeds; `/profile` shows empty/skippable fields
  with no forced sharing.
- PASS/FAIL:
- OBSERVED RESULT:

## C. For You explanation (both profile states)

### C-1 For You, complete profile

- TEST: As the complete-profile user, open `/for-you`; expand one
  on-demand per-card AI explanation ("Why this fits you").
- EXPECTED RESULT: Deterministic reasons always visible; on-demand
  explanation adds bounded why-fit/readiness/next-action detail; no
  percentage or score; never auto-fetched on list render.
- PASS/FAIL:
- OBSERVED RESULT:

### C-2 For You, incomplete profile

- TEST: As the incomplete-profile user, open `/for-you`.
- EXPECTED RESULT: Honestly empty (or minimal) state — no guessed matches,
  no fabricated reasons; Explore stays complete and ungated.
- PASS/FAIL:
- OBSERVED RESULT:

## D. Opportunity Intelligence brief (record matrix)

Run D-1…D-3 on the synthetic corpus slugs from §0
([STAGING_AI_SMOKE_CORPUS.md](STAGING_AI_SMOKE_CORPUS.md)). Open the detail
page, trigger the "Opportunity Intelligence" brief explicitly where offered.

### D-1 National opportunity

- TEST: Open a National record; trigger the brief.
- EXPECTED RESULT: Brief labeled "AI-assisted explanation based on verified
  opportunity data"; geography/eligibility/deadline match the deterministic
  evidence (National, stated eligibility, real deadline); official source
  linked; nothing invented.
- PASS/FAIL:
- OBSERVED RESULT:

### D-2 International opportunity

- TEST: Open an International record; trigger the brief.
- EXPECTED RESULT: Same labeling; classified International with evidenced
  Tanzanian access stated; no reclassification to National.
- PASS/FAIL:
- OBSERVED RESULT:

### D-3 Unknown eligibility (withheld panel = PASS)

- TEST: Open `staging-smoke-unknown-eligibility-2026`. Confirm the detail
  page renders AND the Opportunity Insight panel is absent (no
  `#ai-opportunity-insight` section, no "Get Opportunity Insight" button).
  Optionally POST the slug to the insight endpoint and confirm it refuses.
- EXPECTED RESULT: "Who can apply?" shows the honest unknown-eligibility
  fallback; no insight UI is offered; no AI-generated unknown-eligibility
  response is required or expected. AI must NOT run when the deterministic
  trust/eligibility gate is unsatisfied. Panel withheld = PASS, not a
  defect. Do NOT weaken `isAiSearchableOpportunity()` to make this produce
  a brief.
- PASS/FAIL:
- OBSERVED RESULT:

### D-4 Deadline soon (N/A for this corpus)

- TEST: Only if a ≤14-day record happens to exist on staging at run time;
  otherwise record N/A. The synthetic corpus intentionally carries stable
  far-future deadlines, so there is no dedicated deadline-soon record.
- EXPECTED RESULT (if run): Deadline + urgency match the deterministic
  countdown; brief advises confirming timezone and submitting early; no
  date invented.
- PASS/FAIL:
- OBSERVED RESULT:

## E. Readiness planner

### E-1 Planner, Interested/Applying state

- TEST: As the complete-profile user, mark one record Interested (or
  Applying); open the readiness planner.
- EXPECTED RESULT: Ordered plan (review eligibility → confirm
  deadline/timezone → check each required document at the source → submit
  early). A document appears as REQUIRED only with stored evidence;
  otherwise the step reads "Check whether the official application
  requires …". Planning assistance only — never auto-submits.
- PASS/FAIL:
- OBSERVED RESULT:

### E-2 Planner, incomplete profile

- TEST: As the incomplete-profile user, open the planner on the same record.
- EXPECTED RESULT: Planner still renders honestly (generic steps, unknown
  handling); no profile fields invented; no forced profiling.
- PASS/FAIL:
- OBSERVED RESULT:

## F. Provider chain, fallback, failure behavior

### F-1 Gemini primary serves

- TEST: Trigger 2–3 briefs/explanations; note which path served (UI shows
  "AI-assisted result" mode only — mode by behavior: fast structured brief
  ≈ primary; record latency in §I).
- EXPECTED RESULT: Primary serves structured briefs on most attempts
  (measured 14/16 on the fixed corpus); deterministic facts never
  overridden.
- PASS/FAIL:
- OBSERVED RESULT:

### F-2 Groq backup exercisable

- TEST: Same session — if a primary attempt falls back, confirm a backup
  attempt occurs before deterministic fallback (single attempt each, no
  retry storm).
- EXPECTED RESULT: Backup path exercisable (measured 9/16 paced, zero quota
  errors); at most one attempt per provider per uncached insight.
- PASS/FAIL:
- OBSERVED RESULT:

### F-3 Deterministic fallback honest

- TEST: If any brief shows the deterministic/fallback label (or force one
  by opening an untrusted/inactive record if the route allows), confirm
  the label.
- EXPECTED RESULT: Fallback returns deterministic guidance with an honest
  label; full Explore/For You/detail/Save/Activity works; no stack trace,
  no fake percentage, no provider name exposed.
- PASS/FAIL:
- OBSERVED RESULT:

### F-4 Timeout / invalid-output behavior (simulate only if safe)

- TEST: Only if safely simulatable in staging (e.g. brief on a record with
  missing requirements, or a slow-network attempt): observe timeout/invalid
  handling. Do NOT attack the deployment, throttle production, or touch
  provider accounts.
- EXPECTED RESULT: Timeout (8s shared budget) or invalid output fails closed
  to deterministic guidance with a machine-readable reason; no hang, no
  partial AI text presented as fact.
- PASS/FAIL:
- OBSERVED RESULT:

## G. Viewports

### G-1 Mobile 390px

- TEST: Run sections B–F on a 390px-wide viewport (real phone preferred).
- EXPECTED RESULT: Brief, explanation, and planner readable with no
  horizontal overflow; touch targets usable; no layout breakage.
- PASS/FAIL:
- OBSERVED RESULT:

### G-2 Desktop 1366/1440px

- TEST: Repeat core path (C-1 + D-1 + E-1) at 1366px (and 1440px if
  available).
- EXPECTED RESULT: Same content/behavior as mobile; layout intact.
- PASS/FAIL:
- OBSERVED RESULT:

## H. Privacy check

### H-1 No private data leaves the device boundary

- TEST: While signed in with the complete profile, trigger a brief; confirm
  the product never asks for or sends: name, email, phone, auth/user ID,
  display name, database IDs, activity history, saved/funnel states, goals,
  CVs, essays, documents, organization-private metadata, or source URLs.
  (Allowlist: bounded opportunity evidence + selected profile fields only —
  see AI doc §6.)
- EXPECTED RESULT: No identity/contact/activity/CV data transmitted; free-text
  identifiers redacted; rate-limit keys are one-way hashes.
- PASS/FAIL:
- OBSERVED RESULT:

## I. Latency + fallback recording

Record every AI-triggered action (aim: ≥6 samples across C/D/E):

| # | Action (brief/explanation/planner) | Profile (complete/incomplete) | Result (AI/fallback) | Latency (s, approx) |
|---|------------------------------------|-------------------------------|----------------------|---------------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |
| 6 | | | | |

- AI successes: ___ / total: ___
- Deterministic fallbacks: ___ (reasons seen: ___)
- Median latency (approx): ___
- Any timeout/quota/invalid observed: ___

## J. Cost / quota check

### J-1 Free-quota posture

- TEST: After the run, note the provider-dashboard free-tier usage delta for
  the session (counts only — record numbers, never keys): requests made,
  any 429/quota responses seen.
- EXPECTED RESULT: Session fits easily in free quota (single requests under
  the 8 req/min route limit; 200-entry/6h cache absorbs repeats); zero
  billing exposure; no paid resource enabled.
- PASS/FAIL:
- OBSERVED RESULT:

## K. Rollback (emergency kill switch)

If anything deceives (wrong eligibility/deadline/geography/trust), leaks
private data, or bills:

1. Set `AI_OPPORTUNITY_INTELLIGENCE_ENABLED=false` in the protected Preview
   env.
2. Redeploy the Preview.
3. Re-verify: every surface returns deterministic guidance (fallback label).

- TEST (only if rollback was needed): perform steps 1–3, re-run C-1 + D-1.
- EXPECTED RESULT: All AI surfaces deterministic; no external calls.
- PASS/FAIL:
- OBSERVED RESULT:

## L. Sign-off

- Staging smoke executed by: ___ Date: ___
- Checks passed: ___ / ___ failed: ___
- Authority/deadline/eligibility/trust deception observed: YES / NO
  (any YES blocks the production decision — see
  [PRODUCTION_AI_DECISION_CHECKLIST.md](PRODUCTION_AI_DECISION_CHECKLIST.md))
- Staging evidence attached (this filled runbook): YES / NO
- Next: staging-evidence review → owner production-AI decision (separate
  gate; staging evidence informs but never auto-satisfies it).

## M. Engineering-side validation record 2026-10-06 (staging branch only, no product code)

Status: **ENGINEERING-SIDE COMPLETE — OWNER VISUAL CHECK REMAINING.**
Browser §§B–K were NOT executed here (no browser tooling, Preview is
Vercel-Authentication-gated). This section records only what was
directly verified from the agent environment with existing tooling.
It does not fill §§B–L and does not approve production.

- [DIRECTLY VERIFIED] Starting staging SHA
  `f944899b9644bcd5315c3e7612a093046cdc2f1e`; main
  `22ad5c89d0c335f663dcc8ed33bf56b66d755378` untouched (no main
  commit, no production env/config change).
- [LIVE STAGING DATA] Pre-validation probe (read-only, staging ref
  `pumzofcwfjqswkiwfqty` only): `smoke_rows=4`,
  `canonical_references=4`, `non_smoke_rows=6`, `total=10`,
  non-published smoke `0`. Slugs exactly the corpus in
  [STAGING_AI_SMOKE_CORPUS.md](STAGING_AI_SMOKE_CORPUS.md).
- [DIRECTLY VERIFIED + LIVE STAGING DATA] Real trust gate
  `isAiSearchableOpportunity()` on live rows:
  National `TRUE` (national, trusted),
  International `TRUE` (international, trusted),
  No-deadline `TRUE` (national, trusted),
  Unknown-eligibility `FALSE` (reviewable, insight withheld = PASS).
  Local gate proof `tests/staging-ai-smoke-corpus.test.ts` 6/6 green.
- [LOCAL INTEGRATION] Real-provider smoke (existing service/validator,
  complete synthetic profile, chain Gemini-primary/Groq-backup):
  National `AI/gemini/fallback-NO/2017.4ms`,
  International `AI/gemini/fallback-NO/1507.2ms`,
  No-deadline `AI/gemini/fallback-NO/1193.3ms`;
  all `hard=0`, all within 8s budget, no invented
  eligibility/deadline/geography/requirements/documents, no completion,
  no selection probability, evidence refs valid.
  Mock paths: valid-AI, quota→`quota_exhausted`,
  invalid→`invalid_response`, timeout→`timeout` (~52–57ms) — all
  fail-closed honest, `hard=0`. Fixed-corpus contract simulation
  16 cases `14 AI / 2 fallbacks / 0 hard / 80-soft` green.
  Authority/deception failures `0`; privacy failures `0`
  (allowlist only; goals never sent; identifiers redacted).
- [LOCAL INTEGRATION] Unknown-eligibility guard PASS:
  `searchable=false`; detail renders with honest unknown fallback;
  `showOpportunityInsight=false` so no `#ai-opportunity-insight`
  section/button; API route refuses with 409
  (code truth `app/api/opportunity-insight/route.ts`).
- [LOCAL INTEGRATION] Readiness planner PASS (deterministic insight):
  Interested/Applying/Applied all render planning-only steps
  (National 6, International 6, No-deadline 5);
  never claims submission (`never submits on your behalf`);
  no document called REQUIRED; unknown stays
  `Check whether the official application requires …`;
  deterministic activity state remains authoritative
  (code truth `components/opportunity-insight.tsx`).
- [LOCAL INTEGRATION + STATIC/STRUCTURAL] For You PASS (non-browser):
  deterministic `rankForYou` first (complete profile 2 matches,
  incomplete 0 honestly empty); AI only on explicit
  `Why this fits you` click (no `useEffect`, no auto-fetch);
  no fit percentage, no selection probability
  (validator rejects `%`/score language).
- [STATIC/STRUCTURAL, not browser proof] Responsive:
  login, forgot-password, For You, opportunity detail,
  Opportunity Insight, readiness planner all use fluid
  `w-full/max-w/px-5/sm:px-8`, single-column mobile →
  `sm:grid/sm:grid-cols-2`, `min-h-11` targets, `break-words/min-w-0`;
  no fixed width above 390px observed in code.
  Real 390px + desktop rendering still requires owner browser proof.
- [DIRECTLY VERIFIED] Test gates at staging HEAD:
  `npm test` PASS (exit 0), `npm run verify` PASS (exit 0),
  `npm run build` PASS (exit 0).
- [DIRECTLY VERIFIED + LIVE STAGING DATA] Cleanup (bounded,
  staging-only, after validation): `delete … where slug like
  'staging-smoke-%'` → `deleted=4`, `smoke_rows_after=0`,
  `smoke_references_after=0`, `non_smoke_unchanged=true`
  (6 rows, digest preserved). Production never connected;
  production touched `NO`.
- [OWNER VISUAL CHECK REMAINING] In the protected Preview with
  synthetic users: B-1/B-2 login, C-1/C-2 For You,
  D-1/D-2 briefs + D-3 withheld panel, E-1/E-2 planner,
  F-1…F-4 chain/fallback/timeout, G-1 390px + G-2 desktop,
  H-1 privacy, §I latency table, §J quota counts, §K rollback
  rehearsal, §L sign-off. Then staging-behavior review →
  owner production decision.
