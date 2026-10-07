# Current operational handoff

Rewritten 2026-10-07 on branch `pre-pilot-convergence` as the concise
controller. It supersedes every dated "next milestone" pointer in the retired
history (full log preserved in git: `main`, `ai-frontend-v1`,
`pilot-ops-prep`, `docs-source-of-truth`). Read
[ENGINEERING_RULES.md](ENGINEERING_RULES.md) before acting.

## 1. Product in one paragraph

Tech Opportunity is an opportunity-intelligence and action platform for
Tanzania's emerging talent — primarily university students and recent
graduates, secondarily early-career developers and professionals. Core
journey: DISCOVER → VERIFY/UNDERSTAND → PRIORITIZE → TRACK → APPLY. It is
not "ChatGPT for opportunities": ChatGPT answers when asked, while Tech
Opportunity continuously maintains a structured, provenance-kept,
human-moderated corpus with deadline/lifecycle tracking, explainable
matching, and private Saved/Interested/Applying/Applied workflow. The model
is replaceable infrastructure; the moat must be earned through trusted local
data, workflow, and distribution — none of which is an established moat yet.

## 2. Current business model

Talent side is free (core product); TZS 1,000/month Talent Plus is an
unvalidated price hypothesis only — no payments built. First plausible
revenue is a staff-managed provider campaign service (verified opportunity
→ agreed community distribution → manual aggregate report; charge for work,
never for passing verification). Institutions path (dashboards, annual
service) comes only after demonstrated use and a budget owner. Permanent
rules: private talent data is never sold; paid promotion never bypasses
moderation; small-cell suppression reviewed before any external report.
Validated: human publication gating, deterministic matching, owner-only
privacy, aggregate-only campaign RPCs. Unvalidated: repeat use, provider
willingness to pay, Talent Plus premium value, institutional demand. See
[PRODUCT_STRATEGY.md](PRODUCT_STRATEGY.md) and
[PROVIDER_PILOT_BRIEF_2026-10-02.md](PROVIDER_PILOT_BRIEF_2026-10-02.md).
Pilot ops package prepared but NOT executed:
[REAL_USER_PILOT_2026-10.md](REAL_USER_PILOT_2026-10.md) (execution update),
[PROVIDER_PILOT_EXECUTION_PACK.md](PROVIDER_PILOT_EXECUTION_PACK.md)
(success criteria), [PILOT_OUTREACH_SCRIPTS.md](PILOT_OUTREACH_SCRIPTS.md)
(copy/paste outreach, aggregate Saved/Interested/Applying/Applied only).

## 3. Current production architecture

ONE Vercel project. Canonical public URL (only linkable product URL):
`https://techopportunity-tanzania.vercel.app` (production Supabase
`jltuufukcwztugvojwjd`). Staging is the protected branch Preview on
isolated staging Supabase (`pumzofcwfjqswkiwfqty`) — internal/testing only,
Vercel-Authentication-gated, noindexed, never a product link. Canonical
policy is authoritative in [architecture.md §6](architecture.md) and
enforced by `app/robots.ts` (disallow-all off-production) plus hardcoded
`metadataBase`. Never merge the Supabase projects. Discovery runs on the
Cloudflare Workers Free cron (`17 */2 * * *`); scheduler 24h-observation
incident remains separately open. Production = `origin/main` (`3928f7d`)
with P0A–P0D live (`/privacy`, `/terms`, `/contact` + footer Trust links;
`listing_reports` via 0023; self-service deletion via 0024 with report
anonymization; incident runbook). Production migration record: 0023 then
0024 applied in order, 342 opportunities / 3 users unchanged, 0 report rows.
Production AI stays OFF. Key rotation satisfied owner-side 2026-10-05;
`.env.example` holds empty placeholders; agents never handle secrets. No
schema, RLS, Discovery, or Cloudflare changes are authorized in product
milestones.

## 4. Convergence branch state (Preview-only, production untouched)

Branch `pre-pilot-convergence` = `ai-frontend-v1` (`33053c8`) +
`pilot-ops-prep` (`3d70190`) + `docs-source-of-truth` (`054b0b8`), merged
conflict-free (disjoint file sets). Production (`origin/main`) untouched.

- **AI Match + Ask V1** (`e957434`): `/for-you` reworked as the eligible-match
  workspace plus `/ai-match` alias; `/ask` deterministic FAQ plus auth-gated
  custom Q&A (`app/api/ask/route.ts` over `lib/ask/*`, 8 s shared
  Gemini → Groq → deterministic-fallback budget, no persistence); shared
  provider-transport helpers; contract suites ai-match 7/7 + ask 12/12.
  No schema, no duplicate profile storage, no chatbot bubble, no
  predictions/submissions. Evidence: [AI_FRONTEND_V1.md](AI_FRONTEND_V1.md).
- **Real photography restored** (`bd694cc` + `33053c8`): two genuine archival
  UDSM photographs served locally (homepage hero: Nkrumah Hall, Nick Fraser,
  CC BY-SA 2.0; Organizations: Nkrumah exterior, Alexander Landfair, public
  domain). No photography on auth, cards/detail, AI Match, or Ask; no
  fabricated community proof. Nine historical AI files retained but
  UNRENDERED. Provenance:
  [VISUAL_ASSET_PROVENANCE.md](VISUAL_ASSET_PROVENANCE.md); delivered-Preview
  evidence: [REAL_PHOTOGRAPHY_VISUAL_QA_2026-10-07.md](REAL_PHOTOGRAPHY_VISUAL_QA_2026-10-07.md).
- **Pilot ops prepared, not executed** (`3d70190`, docs only): user-pilot
  execution update, provider success criteria, outreach scripts. No tester
  contacted, no session run, no provider outreach sent.
- **Durable docs** (`054b0b8` + V1/photo corrections here): ENGINEERING_RULES,
  architecture, PRODUCT_STRATEGY, and AI_OPPORTUNITY_INTELLIGENCE describe
  this branch — AI implemented branch-only with production OFF, real-photo
  provenance, prepared-but-unexecuted pilot.

## 5. Current corpus state (dated snapshot 2026-10-04; production unchanged)

Cleanup 4/4 complete: Ogilvy, AIJC, August jobs roundup, Twaweza all 404 and
absent from browse. Approved and public (9): AfDB Internship 2027 (12 Oct),
Mandela Washington Fellowship 2027 (13 Oct), African Climate Collaborative
PhD (15 Oct), Anzisha 2027 (10 Nov), Kectil 2027 (15 Nov), Jim Leech
Mastercard Fellowship 2027 (1 Dec), HKPFS 2027/28 (1 Dec), MOPGA 2027
(15 Dec), FAO RAF Internship (31 Dec) — all "Evidence verified" +
"Tanzanian access evidenced" with first-party domains. Retained: IMLC 2026
(verified) and YSP (honestly unknown eligibility). Held pending, correctly
NOT public: UONGOZI and IMF FIP. Staff-session counts (owner-reported):
14 published-management rows (11 active + 3 lifecycle-filtered), 211
pending. Do NOT publish the held records without new authoritative evidence.

## 6. Current validation state

`READY_FOR_USER_PILOT` = YES (protocol intact, execution explicitly deferred
by owner priority — do NOT record it as done). Run the protocol in
[USER_VALIDATION_PILOT_2026-10-02.md](USER_VALIDATION_PILOT_2026-10-02.md):
15-minute observed mobile tasks, 7 post-task questions, per-tester metrics,
7-day follow-up, 2-week repeat-use check. PASS requires: median ≥4/5 tasks
unassisted, zero eligibility/deadline deceptions, ≥60% 7-day return OR ≥2
truthful application starts, no unfiled critical blocker. Provider pilot
([PROVIDER_PILOT_BRIEF_2026-10-02.md](PROVIDER_PILOT_BRIEF_2026-10-02.md))
runs ONLY after the user pilot passes.

## 7. Next milestone: Assisted Queue Approval (after convergence verify + owner QA)

Scope is fixed by the pre-pilot audit (§9, human gate preserved): a
per-pending-row read-only "review readiness" checklist DERIVED from the
existing deterministic gates, surfaced in the queue as "READY FOR REVIEW"
only when every item passes; approve/reject/unpublish remain human buttons
with verbatim reasons + audit rows. NOTHING auto-mutates corpus state — no
auto-publish, auto-reject, quarantine state, or report-driven mutation; no
new visibility state; no schema change without a separate owner gate.
After it: Preview AI smoke §§B–K → privacy-section flip → owner prod-AI
decision ([PRODUCTION_AI_DECISION_CHECKLIST.md](PRODUCTION_AI_DECISION_CHECKLIST.md))
→ 5–10 user pilot → provider revenue pilot. Do NOT run the user pilot yet;
do NOT activate AI.

## 8. Owner-only gates

Authenticated moderator browser session (approvals, rejections, unpublishes,
campaign creation — one `[INTERNAL DEMO]` vessel max, never customer-named).
Owner visual checks on the delivered Preview (light mode review of homepage,
Organizations, login, `/for-you`, `/ask`, `/ai-match` at 390px + desktop;
signed-in populated AI Match in both modes; Ask chips + one requested
answer). Preview AI smoke runbook §§B–K + failure simulation. Privacy AI
section flip to active voice. Production-AI activation decision. Provider
credentials + AI privacy/billing attestations. Vercel dashboard actions.
Production DB passwords/keys. An agent must never handle these or work
around them with SQL, service-role, or direct RPC.

## 9. Do not work on

Speculative features; AI production activation or new outbound personal data
without the V2 gates; schema/RLS/migration work; Discovery/source/cadence
changes; Cloudflare changes; bulk or automated moderation; deletions or
corpus resets; UI redesign for decoration; chasing arbitrary opportunity
counts (quality > quota); native apps, APIs, maps, paid infra, monetization
without measured demand. Do not merge to main or deploy Production as part
of checks.

## 10. Model/agent handoff rules

Muse (repo/code/docs/audits) owns implementation and verification; Computer
Use acts ONLY for authenticated browser moderation no API covers, one record
at a time with documented verbatim reasons. One writer at a time — never
edit the same doc from two sessions. Live evidence (production fetches),
exact HEAD, test/build reports outrank any model's memory of prior turns.
Never claim an outcome that was not directly verified; never simulate a
moderation action. This handoff names exactly one next task (§7) and does
not restart closed work.

## 11. Current HEAD / verification

Convergence verified 2026-10-07 at merge `214e782` (base `33053c8` +
`3d70190` + `054b0b8`, zero conflicts): full `npm run verify` green (all
suites incl. ai-match 7/7 + ask 12/12, tsc clean, eslint clean, 43/43
boundaries; docs-only plan gate, no production evidence required, no owner
actions) and `npm run build` green (30 pages incl. `/ai-match`, `/ask`,
`/api/ask`). `git diff --check` clean. Production AI OFF; production
untouched (no commits to main, no deploys, no DB/env changes). Open items:
owner visual checks (§8); staging UI smoke + failure simulation
(owner-executed); audit-ledger rows confirmable only in a staff session;
scheduler 24h-observation incident (separate track). No code risks
outstanding. This reconciliation is committed on top of `214e782`.

## 12. Stop conditions

Stop — do not invent a workaround — when: moderator authentication is
missing (say AUTHENTICATION_REQUIRED); a first-party source contradicts a
record (HOLD/SKIP it); a requested change needs schema/RLS/AI/Discovery/
Cloudflare work without explicit bounded authorization; verification gates
fail (fix or report, never weaken tests); the task asks for customers,
revenue, traction, or partnerships evidence that does not exist.

## Converged history index (pointers; full log in git)

- `ai-frontend-v1`: `e957434` AI Match + Ask V1 → `bd694cc` real-photo
  restoration → `33053c8` Preview evidence record.
- `pilot-ops-prep`: `3d70190` pilot execution update + provider success
  criteria + outreach scripts (docs only).
- `docs-source-of-truth`: `054b0b8` durable rules/architecture/strategy/AI
  docs (+ V1/photo corrections in the convergence commit here).
- `main`: `3928f7d` final pre-pilot release (P0A–P0D live in Production).
- Milestone evidence docs: AI_FRONTEND_V1.md,
  REAL_PHOTOGRAPHY_VISUAL_QA_2026-10-07.md, VISUAL_ASSET_PROVENANCE.md,
  PRE_PILOT_PRIVACY_LEGAL_TRUST_AUDIT_2026-10-06.md (§§17–18 P0 record),
  INCIDENT_RESPONSE_RUNBOOK.md, STAGING_AI_SMOKE_RUNBOOK.md,
  PRODUCTION_AI_DECISION_CHECKLIST.md, USER_PILOT_EXECUTION_PACK.md,
  PROVIDER_PILOT_EXECUTION_PACK.md.
