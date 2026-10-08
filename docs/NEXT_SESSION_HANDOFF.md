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

## 7. Next milestone: Assisted Queue Approval — IMPLEMENTED 2026-10-07

Implemented on this branch: `lib/review-readiness.ts` (pure, no DB) derives
a per-pending-row checklist from the existing deterministic gates —
source-usable (evidence link + attribution + contamination guard),
not-duplicate (canonical-URL + cross-source title-core rules ported from
`scripts/discovery/dedupe.ts`), deadline-clear (consistent truth or
reviewable source value, never expired), evidence-complete (qualification
evidence + meaningful description + country truth; eligibility `unknown`
stays valid moderator input). States: READY FOR REVIEW / NEEDS EVIDENCE /
POSSIBLE DUPLICATE / SOURCE PROBLEM / DEADLINE UNCLEAR, fixed priority in
that gate order. Surfaced display-only: queue per-row badges + "Ready for
review" summary count, and a review-page checklist (pending mode only).
Queue order, filters, navigation, decision form, RPCs, RLS, and Discovery
are untouched: approve/reject/unpublish remain human buttons with verbatim
reasons + audit rows. No auto-mutation, no new visibility state, no schema
change. Contract suite `tests/review-readiness.test.ts` 21/21, wired into
`npm test`. After it: Preview AI smoke §§B–K → privacy-section flip → owner
prod-AI decision ([PRODUCTION_AI_DECISION_CHECKLIST.md](PRODUCTION_AI_DECISION_CHECKLIST.md))
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

Assisted Queue Approval implemented 2026-10-07 on `pre-pilot-convergence`
(base `6ea1328`; convergence itself verified green at merge `214e782`): `lib/review-readiness.ts` + `tests/review-readiness.test.ts`
21/21 (wired into `npm test`) + queue badges/count + review-page checklist,
all display-only. Full `npm run verify` green (all suites, tsc clean, eslint
clean, 43/43 boundaries; plan selected build + moderation-auth gates, no
production evidence satisfiable from here, no owner actions), explicit
`test:review` 40/40 + `test:published-management` 53/53 green, `npm run build`
green (30 pages incl. `/moderation`, `/moderation/[id]`). `git diff --check`
clean. No migration, no RLS, no Discovery/Cloudflare, no env/secret change;
production untouched (no commits to main, no deploys, no DB writes);
production AI OFF. Deployed staff-queue access proof remains owner-side (a
staff browser session is required to see the badges live). Open items: owner
visual checks (§8); staging UI smoke + failure simulation (owner-executed);
audit-ledger rows confirmable only in a staff session; scheduler
24h-observation incident (separate track). No code risks outstanding. This
milestone is committed on top of `6ea1328`.

Frontend QA/fix pass 2026-10-07 on `pre-pilot-convergence` (base `c2bd0c2`):
Profile legend/paragraph negative-margin overlap removed (both fieldsets now
clean stacked spacing, light + dark via existing tokens); desktop header,
mobile footer, homepage journey strip, and footer all name "Ask AI" (mobile
menu keeps "Ask Tech Opportunity"); `/ask` eyebrow reads "Talk to AI ·
grounded answers"; homepage AI entry (AI Match + Ask buttons, Explore
untouched) and AI Match → Ask link retained; no chatbot bubble added.
User-facing "For You" renamed to "AI Match" (activity/saved/profile/privacy
copy, manifest shortcut, profile-saved message; route `/for-you` unchanged).
Real photos verified present and valid WebP (hall renders on homepage hero,
campus on Organizations, both with captions/credits; AI set retained on disk
but unrendered — zero `showCover` callers). Full `npm run verify` green
(all suites incl. updated ai-match/commercial-demo pins, tsc, eslint, 43/43
boundaries; plan selected build + moderation-auth + deadline-alerts, all
satisfied locally except deployed-access proof), `npm run build` green
(30 pages), `git diff --check` clean. No schema/RLS/moderation/Discovery/env
change; production untouched; production AI OFF. Signed-in 390px rendering
and light/dark eyeball QA remain owner-side (no browser tooling here); this
pass is static + contract evidence, not a visual sign-off. This pass is
committed on top of `c2bd0c2`.

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

## Production release 2026-10-07 (promoted to production, owner QA APPROVED)

- STARTING BASELINE: `origin/main` `3928f7d` (final pre-pilot P0A–P0D),
  confirmed before any move. RELEASE: `pre-pilot-convergence` `10069a2`
  (AI Match + Ask V1, real UDSM photography, Assisted Queue Approval
  display-only, Profile robust fieldset headings, pilot-ops docs,
  durable-rules docs). `3928f7d` verified ancestor of `10069a2` —
  fast-forward only, no force, no merge commit.
- PRE-PUSH GATES at `10069a2`: `git diff --check` clean; full
  `npm run verify` green (all suites incl. review-readiness 21/21,
  ai-match 7/7, ask 12/12; tsc, eslint, 43/43 boundaries clean);
  `npm run build` green (30 pages). Diff review `3928f7d..10069a2`:
  47 files, zero `supabase/migrations` entries (no DB migration expected
  or applied), zero `.env` changes, `.env.example` empty placeholders,
  secret scan clean (only `ask-*` identifier false positives), provider
  diff is a pure transport refactor with fail-closed defaults intact,
  Privacy diff is the For-You→AI-Match rename only (no active-AI flip).
- PROMOTION: `main` fast-forwarded `3928f7d..10069a2` in an isolated
  worktree and pushed with plain `git push origin main` (no `--force`).
  Push-to-main auto-deploys Production (architecture.md §6). No env,
  dashboard, or AI-config change; no DB writes; no credentials handled.
- PRODUCTION SMOKE (anonymous, canonical
  `https://techopportunity-tanzania.vercel.app`, post-push): `/` 200
  with AI Match + Ask AI nav/footer, 11 opportunities, Nkrumah Hall
  caption live; both editorial WebP binaries 200; `/organizations` 200
  with Nkrumah exterior caption + SAMPLE-labeled illustrative report;
  `/ask` 200 with "Talk to AI · grounded answers" FAQ + sign-in gate
  for custom Q; `/privacy` `/terms` `/contact` 200 with "Production AI
  is currently OFF" live; `/ai-match` `/for-you` `/profile`
  `/activity` `/saved` `/moderation` all behind the sign-in wall for
  anonymous (auth + moderator gates intact); `/saved` 307 → login;
  `/manifest.webmanifest` 200 with AI Match shortcut; `/robots.txt`
  production-allow; `/offline` 200. Zero `showCover` callers in tree —
  no active AI-generated people. Profile overlap fix is code-verified
  (sr-only legends + visible `h2`, zero `-mt-` hacks, `min-w-0`
  fieldsets, wrapping chips); signed-in 390px visual remains owner-side
  (no staff/session tooling here). Assisted Queue Approval UI is
  code-present + 21/21 contract green but staff-gated — live badge
  eyeball needs a moderator session (owner-side).
- PRODUCTION AI: OFF (live Privacy text + `ENABLED !== "true"` /
  zero-spend fail-closed defaults; nothing activated, nothing
  configured). PRODUCTION DB: UNCHANGED (no migration in release, no
  writes performed). No unexpected regression observed in smoke.
- NEXT: 5–10 real-user pilot on live production per
  `docs/REAL_USER_PILOT_2026-10.md`; owner prod-AI decision stays a
  separate gate; youth/minor legal review rides with broader launch.

## Code-only Ask/AI-behavior release 2026-10-08 (main `a5aec61` → `a0c08b6`, owner-approved, AI stays OFF)

- SOURCE: `origin/main` `a5aec61` confirmed before the move; code
  cherry-picked file-wise from `prod-ai-activation` @ `55e5010` onto
  dedicated branch `prod-ai-release`, then fast-forwarded to main
  (no force, no merge commit) and pushed — push-to-main auto-deploys
  Production (Vercel deployment record for `a0c08b6` present; CI
  monitor + verify checks success).
- INCLUDED (10 files, +405/−59): conversational Ask routing
  (`lib/ask/knowledge|contract|service`), Ask provider adapters +
  identity system prompt (`lib/ask/providers`), Groq-first shared
  chain (`lib/opportunity-intelligence/provider`), required tests
  (`ask` 16/16, `ai-match` 8/8 incl. behavioral allowlist,
  `intelligence` order pins Groq-first), behavior-matching doc
  notes (`AI_OPPORTUNITY_INTELLIGENCE.md`,
  `AI_FRONTEND_V1.md`). EXCLUDED: active-AI Privacy wording,
  active trust pin, staging-runbook §N/F-wording, topology block —
  main keeps the truthful OFF Privacy + OFF pins.
- GATES on the release: `git diff --check` clean; full
  `npm run verify` green (tsc/eslint/43-43 boundaries; plan
  selected build + assistant-kill-switch); `npm run build` green
  (30 pages); `npm audit --omit=dev` 0 vulnerabilities. No
  migration/env/secret/RLS/Discovery/moderation change.
- BEHAVIOR PROOF on release code, providers disabled (production
  simulation): selector `disabled`, 0 providers; Groq-first in
  code; "hello"/"Who are you?"/"What can you do?" →
  `conversational` → deterministic Ask-AI identity fallback (NOT
  the generic verified-information refusal); opportunity question
  → deterministic grounded path; injection + private-data probes
  → `refused`.
- CANONICAL SMOKE (anonymous): `/` 200, `/ask` 200 (FAQ + sign-in
  gate), `/privacy` 200 still truthfully OFF, anonymous
  POST `/api/ask` → 401 (auth gate intact). Interactive Ask
  response text is session-only by design (401 anonymous), so
  greeting/opportunity replies on canonical await a signed-in
  owner check; behavior above is proven on the identical deployed
  code with providers disabled.
- PRODUCTION AI: OFF (no env/config/key change; defaults
  fail-closed). PRODUCTION DB: UNCHANGED. No regression observed.

## Ask AI chat UX release 2026-10-08 (main `0dc3f56` → `b8b1e49`, owner-approved, AI stays OFF)

- SOURCE: `origin/main` `0dc3f56` confirmed pre-move; dedicated
  branch `ask-chat-ux` fast-forwarded to main (no force, no merge)
  and pushed — push-to-main auto-deploys Production (Vercel
  Production deployment record for `b8b1e49` present; canonical
  healthy).
- SHIPPED (10 files): continuous chat transcript + sticky composer
  (arrow send, Enter/Shift+Enter, sending state, autofocus,
  auto-scroll, focus return), starter chips at empty state only,
  ephemeral multi-turn context (≤8 turns, ≤240 chars each, ≤1200
  total; prior refs server-re-resolved, never trusted), warm
  conversational fallback ("how are you?" → "I'm doing well…"),
  safe-unknown defaults to conversational, browser-native voice
  input (editable composer, no audio upload/storage, clean
  unsupported/denied fallback), compact FAQ accordions, light
  conversational rendering (heavy report block only where
  material). No sessionStorage (deliberate, pending privacy
  review); refresh clears V1 chat. Groq → Gemini order untouched.
- EXCLUDED/UNCHANGED: active-AI Privacy wording (canonical still
  truthfully OFF), env/keys/flags, DB/schema/RLS/Discovery/
  moderation, matching authority, sanitizers, validators.
- GATES: full `npm run verify` green (incl. ask 21/21,
  tsc/eslint/43-43 boundaries), `npm run build` green (30 pages),
  `npm audit --omit=dev` 0 vulnerabilities, `git diff --check`
  clean. One lint fix during work (voice probe moved to rAF
  callback); one boundary-gate catch fixed honestly (credential
  literal kept out of the blocklist via separator normalization).
- MULTI-TURN PROOF on deployed code (providers disabled):
  opportunity Q grounds refs; follow-up "What is the deadline?"
  reuses them via history + re-resolved slugs; tampered slugs
  (`../admin`) fail closed to `invalid_question`; unknown slugs
  resolve to nothing.
- CANONICAL SMOKE (anonymous): `/` 200, `/ask` 200 (chat sign-in
  gate + compact FAQ intact), `/privacy` 200 truthfully OFF,
  anonymous POST `/api/ask` → 401 (auth gate intact). Greeting +
  opportunity reply text is session-only by design, so signed-in
  rendering (transcript, composer, voice, 390px/keyboard, dark +
  light) awaits owner browser checks — no browser evidence
  fabricated.
- PRODUCTION AI: OFF. PRODUCTION DB: UNCHANGED. No regression.

## Publishing Engine V2 2026-10-08 (branch `publishing-engine-v2` from main `00dcdfa`, UNMERGED — owner review required)

- GOAL: one moderator safely reviews/publishes many more opportunities
  without weakening trust. PERMANENT RULE KEPT: NO blind auto-publish;
  final publish/approve remains a human action (new boundary invariant
  pins it).
- BASE: clean branch from `00dcdfa`; builds on the existing Assisted
  Queue Approval (`c2bd0c2`) instead of replacing it — its 4 gates, 5
  states, and "unknown never blocks readiness" semantics are preserved
  (all 21 prior readiness tests pass unchanged).
- PIPELINE GAPS FOUND AND CLOSED: (1) duplicate signals had no WHY and
  ignored published rows; (2) no readiness filter / priority order /
  per-state counts; (3) approve had no human-confirmation gate;
  (4) reviewer workspace hid eligibility-access evidence, geography,
  canonical URL, last-checked; (5) published-expired vs active and
  expired-pending counts invisible to staff. NOT gaps (left alone):
  discovery pending-only intake, RLS/auth, lifecycle derivation,
  approval evidence requirements, AI OFF.
- SHIPPED (14 files, no migration): duplicate WHY (matched row title +
  status + rule + compare link, corpus = pending + published, never
  auto-delete/mutate); `readiness` queue filter + tabs + counts per
  state; priority order (ready → possible-duplicate → needs-evidence →
  deadline-unclear → source-problem, oldest-first within state) shared
  by queue render and next-in-queue navigation (oldest-only
  `getQueueNavigation` removed as superseded); expired-pending
  partition (counted, excluded from review work, still directly
  reachable); published active/expired split + badges + counts;
  Tanzania-access evidence line + geography + canonical URL +
  last-checked in the review workspace; APPROVE_CONFIRM_TOKEN checkbox
  enforced server-side on approve AND published re-review (reject path
  unchanged: reason-bearing as before); new `publishing-engine-v2`
  suite (53 tests) + new permanent boundary invariant (44/44).
- DELIBERATE SEMANTIC (documented in code): unknown Tanzanian access
  does NOT demote readiness — it is shown as "Check — verify on the
  official page", and approval still requires evidenced eligibility.
  Unknown can never become verified without the human evidence step.
- GATES (branch HEAD, commit pending): full `npm run verify` green
  (incl. new 53 + fixed 2 bulk-moderation deep-equal pins for the new
  filter dimension), `npx tsc --noEmit` clean, `eslint` clean,
  `verify:boundaries` 44/44, `verify:plan` build + moderation-auth
  gates selected, `npm run build` green (30 pages),
  `npm audit --omit=dev` 0 vulnerabilities, `git diff --check` clean.
  Change-triggered production evidence (deployed moderation access
  proof) is OWNER work — not performed here.
- PRODUCTION: UNTOUCHED (no main push, no DB read/write, no env).
  AI: OFF (no Groq/Gemini code, activation, or LLM authority).
  MIGRATION: NONE (all derived from existing columns).
- NEXT: owner reviews the branch diff → approves PR → merge to main
  (auto-deploys Production) → staff-session smoke of
  /moderation (readiness tabs, priority order, approve-confirmation
  refusal without checkbox, duplicate compare links) +
  /published-management (active/expired split) → then resume the
  50–100 corpus growth path below (verify TZ-access evidence per
  approval; do NOT chase counts).
