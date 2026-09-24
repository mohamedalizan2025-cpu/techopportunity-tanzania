# ExpoNav Project Intelligence Report

Status: **KNOWLEDGE RECOVERY ONLY — NO IMPLEMENTATION, NO DEPLOYMENT, NO CLOUD CHANGES.**
Prepared: 2026-09-24 from the actual repository at HEAD `2886052` (see §1).
This report exists so another session can proceed without this chat's history.
It does not authorize building anything. Implementation stays stopped until Ali and ChatGPT review it.

Critical finding up front: **ExpoNav does not exist in this repository.**
No `AGENTS.md`, no ExpoNav code, migration, test, page, map, booth, exhibitor,
navigation, QR, PWA, voice, or Azure resource exists here. Everything under §4
is therefore **planned only**, and §6 classifies the whole pilot journey as
missing except for reusable Tech Opportunity foundations (§7) that must not be
misrepresented as ExpoNav features.

## 1. Exact current state (evidence, not claims)

- Repository: `mohamedalizan2025-cpu/techopportunity-tanzania`, branch `main`,
  HEAD `2886052` (`Record post-grant Discovery proof 35998109570 and 14-hour
  scheduler checkpoint`), tree clean, `origin/main` synchronized at audit time.
  Prior heads: `8722246`, `5cab9de` (see `git log --oneline -10`).
- Product in this repo: **Tech Opportunity Tanzania** — a responsive Next.js
  website "for discovering opportunities all across Tanzania" (README.md:136),
  explicitly **not** a native app (README.md:141-144, docs/architecture.md:27-30).
- `AGENTS.md`: **absent** — glob `**/AGENTS*` returns zero files. The task's
  "read AGENTS.md" step cannot be satisfied from the repo. Authoritative
  substitutes used: `docs/ENGINEERING_RULES.md`, `docs/NEXT_SESSION_HANDOFF.md`,
  `README.md`, `docs/architecture.md`.
- `DOCS_INDEX.md`: **absent** at audit time (glob returns zero files). Created
  minimally alongside this report only because this task explicitly requires it;
  the handoff remains the authoritative continuity record.
- No ExpoNav-named file, branch, commit, migration, workflow, or doc exists:
  full-content grep for `ExpoNav|exponav|EXPO_NAV` returns zero hits; `git log
  --all --oneline` grep for expo/booth/exhibitor returns only Tech Opportunity
  "provider campaign pilot" and "pilot source seeds" commits (e.g. `d9b678c`),
  which are opportunity-listing concepts, not exhibition concepts.
- Method: directory listing, `git log/status/branch`, globs for
  `docs/*`, `app/**`, `components/*`, `lib/**`, `supabase/migrations/*.sql`,
  `ops/**`, Docker/Azure manifests (zero hits), full-text grep for
  exhibition/booth/floor-plan/venue-map/indoor-navigation/walkway/QR-checkpoint/
  Pilot-Kit/paper-prototype terms (only `venue_name` opportunity-location
  fields hit — see §4.4), and reads of README, `.env.example`,
  `docs/architecture.md` (§1-5), `docs/PLATFORM_ARCHITECTURE.md`,
  `docs/PRODUCT_ROADMAP.md`, `docs/AI_OPPORTUNITY_INTELLIGENCE.md`,
  `docs/AI_ASSISTANT_DESIGN.md`, `docs/COMMERCIAL_DEMO.md`,
  `docs/ADOPTION_TESTING.md`, `docs/DATABASE_RECOVERY.md`,
  `docs/DATA_API_GRANTS.md`, `docs/DISCOVERY_EXTERNAL_SCHEDULER.md`,
  `docs/NEXT_SESSION_HANDOFF.md` head. No product code was changed, no cloud
  resource touched, no test or deployment run by this task.

### Verification vocabulary used in this report

- implemented = code/migration present in repo at HEAD.
- deployed = evidenced live URL/deployment record naming the commit.
- automated-test verified = named suite green against the checked-in code.
- live-test verified = real human run against staging/production recorded in docs.
- physically verified = on-site observation with named venue/date/witness.
- partially implemented = code exists but owner-gated or unpromoted.
- planned only = documented intent, zero implementation.
- unknown / requires owner acceptance = cannot be proven from repo alone.

## 2. What actually exists (Tech Opportunity — do not relabel as ExpoNav)

### 2.1 Frontend (implemented, automated-test verified, live-test verified on web)

- Pages at HEAD (`app/**`): `(home)` Explore, `/for-you`, `/profile`,
  `/activity`, `/saved`, `/opportunities/[slug]`, `/submit`, `/login`,
  `/auth/callback`, `/moderation`, `/moderation/[id]`,
  `/published-management`, `/campaigns`, `/campaigns/[id]`,
  `/api/assistant/ask`, `/api/opportunity-insight`. No event/venue/booth/
  exhibitor/map/QR/voice/offline page exists.
- Components (`components/*`): opportunity-card/detail/filters, save control,
  activity control, profile form, campaign forms/status, assistant panel,
  opportunity-insight, alert preference, site header, mobile navigation,
  empty state, ui-icon. Responsive mobile-first web per README and Showcase
  milestone (2026-09-16, all gates green). No map canvas, overlay editor,
  route preview, QR scanner, voice input, or PWA service worker exists —
  verified by component glob (15 files, none map/voice/QR/PWA).
- Resilience: empty states, honest zero-states, 307-to-login guards,
  `noindex` on private/staff routes (per handoff/ADOPTION_TESTING).
  Known UX posture: demo script requires saying zeros aloud
  (`COMMERCIAL_DEMO.md`: "0 campaigns, 0 tracked activity, 0 audience").

### 2.2 Backend / database (implemented, RLS-enforced, migration-gated)

- Architecture: `UI → lib/data/* → Supabase` golden rule
  (`docs/architecture.md` §5, enforced by `verify:boundaries`). No separate
  backend server. Modules under `lib/data/` cover opportunities, categories,
  moderation/review/actions, saved, talent profile/activity, campaigns,
  deadline alerts, auth, assistant queries, for-you.
- Migrations `0001–0022` (`supabase/migrations/`): initial schema, discovery
  pipeline, enrichment audit, lifecycle/eligibility/country evidence, RLS and
  attribution hardening, deadline alerts, M31 data trust, taxonomy seeds,
  talent profile (0018), talent activity (0019), campaign pilot (0020),
  explicit Data API grants (0021) + future-sequence close (0022, production +
  staging applied 2026-09-24 per `DATA_API_GRANTS.md`).
- Auth: Supabase Auth JWT + RLS; owner-only talent tables, staff-gated
  moderation/campaign RPCs (`SECURITY DEFINER`, exact OUT params); anon key
  browser-safe only because RLS constrains it (`ENGINEERING_RULES.md`).
- Media/storage: Supabase Storage referenced by architecture; no ExpoNav
  floor-plan bucket, upload flow, or media policy exists.
- Seeds: `0002_pilot_sources.sql` (discovery web sources),
  `0003_first_party_listing_adapters.sql` (UDSM/NM-AIST listing adapters) —
  opportunity-web-source concepts, not exhibition data.

### 2.3 Discovery pipeline (implemented, production-proven on its own terms)

- TypeScript worker (`scripts/discovery/`), 2-hour cadence `17 */2 * * *`,
  Cloudflare Workers Free external scheduler + GitHub Actions
  (`ops/discovery-scheduler/`, `.github/workflows/discovery.yml`),
  pending-only writes, human moderation sole publish path, 30-min timeout,
  non-cancelling `discovery-production` lane.
- Proven: 8/8 external slots over 14h at HEAD-audit time, first post-grant run
  `35998109570` with zero permission errors
  (`DISCOVERY_EXTERNAL_SCHEDULER.md`, incident record, handoff). This proves
  **web-opportunity harvesting discipline**, not ExpoNav map/exhibitor import.

### 2.4 AI (scaffold implemented, external providers DISABLED)

- Two separate bounded designs: natural-language search-plan assistant
  (`AI_ASSISTANT_DESIGN.md`, scaffold + kill switch + rate limit, provider
  disabled) and per-opportunity readiness layer
  (`AI_OPPORTUNITY_INTELLIGENCE.md`: Gemini primary → Groq backup →
  deterministic fallback; strict allowlist; provider cannot override facts).
- Models named in `.env.example`: `gemini-3.5-flash-lite`,
  `openai/gpt-oss-20b`; Azure AI/Foundry is a **clean future adapter only**
  (`AI_OPPORTUNITY_INTELLIGENCE.md`:113,227; `provider.ts` type includes
  `"azure"` but no credential/SDK/endpoint configured).
- Usage/cost: real provider requests = 0; production AI off; 16-case synthetic
  evaluation green; owner gates (keys + unpaid-data-use/ZDR + no-billing
  attestations) unmet. No cost evidence beyond $0-spend posture.
- Map-recognition capability: **none**. Discovery extraction is HTML/feed/
  JSON-LD text extraction; fixture tests explicitly reject image files and
  non-HTTP schemes, and PDFs survive only as link evidence —
  `scripts/discovery/test-fixtures.ts`. Scanned/image plan understanding,
  label OCR, and duplicate-label resolution do not exist anywhere.

### 2.5 Deployment & operations (Tech Opportunity only)

- Hosting: Vercel Hobby (README "deployed"); production alias per
  `.env.example` comment `https://techopportunity-tanzania.vercel.app`;
  one immutable URL recorded 2026-09-17 in handoff
  (`techopportunity-tanzania-ldfkpt53l-...vercel.app`). **Latest deployed
  commit is unknown from repo alone** — no Vercel API check performed in this
  read-only task; do not assume HEAD `2886052` is deployed.
- Environments: Supabase production `jltuufukcwztugvojwjd`, staging
  `pumzofcwfjqswkiwfqty` (handoff); staging free-plan pausing is
  platform-controlled and health checks do not guarantee exemption
  (`STAGING_HEALTH.md`, handoff).
- CI: `verification.yml` (tests/typecheck/lint/boundaries/plan + build),
  `discovery-health.yml` observer, `staging-health.yml`, `deadline-alerts.yml`.
- Monitoring: Discovery health `report.json`/`history.json`/`trigger-report.json`
  artifacts (90-day retention) + Cloudflare Cron Events/Workers Logs for the
  scheduler. No ExpoNav monitoring, no app APM/RUM in repo.
- Backup/recovery: protected local schema-only sets outside Git
  (`DATABASE_RECOVERY.md`, `DATA_API_GRANTS.md`; e.g.
  `C:\Users\hp\.tech-opportunity-backups\...`), ACL-hardened, never committed.
  No ExpoNav data recovery plan exists.

## 3. Resources, tools, and cost baseline (repo-evidenced only)

| Resource | Repo evidence | Running / cost verdict |
|---|---|---|
| Laptop/local dev | Windows paths, Node 20+/npm, Python `tsx`, PowerShell tooling, `.next/`, `node_modules/` present | Assumed available; no license cost in repo. |
| GitHub | Public repo, Actions workflows, standard `ubuntu-latest` runners; scheduler doc notes Actions free for public repo + standard runner | Workflows running (Discovery 2-hourly, observers). No billing evidence in repo. |
| Cloudflare Workers Free | `ops/discovery-scheduler/wrangler.toml` (1 cron `17 */2 * * *`, `workers_dev=false`, no bindings), version `9bb741c3…`, 0/100k req cited in scheduler doc | Running for scheduler only. Free-plan limits cited; no overage mechanism on Free (fail-closed). |
| Supabase staging+production | Refs in handoff, migrations 0001–0022, RLS policies, health workflows | Both live per handoff. Plan/limits/burn not evidenced in repo. |
| Vercel Hobby | README + architecture + daily-cron limit note in scheduler doc | App deployed (exact SHA unverified here). Hobby limits not measured in repo. |
| GitHub Student Developer Pack | One-line roadmap mention (custom domain eligibility); rejected-cost reasoning for Vercel-daily/Azure in scheduler doc | **No benefit inventory in repo.** Which packs/credits are claimed, linked, or expired is unknown. |
| Codex/Astra, Muse access | Codex mentioned once as evidence custodian (`NEXT_SESSION_HANDOFF.md`:1844); Muse named only in this task prompt | **No subscription, quota, or token-balance evidence in repo.** |
| Azure for Students / credits / Container Apps / Postgres / Blob / ACR / email | Azure Functions explicitly **rejected** (paid consumption + billed storage; student credits "not permanent $0") in scheduler doc; `"azure"` appears only as a future AI-adapter stub; zero Docker/Bicep/ARM/ACR/Blob/mail configs in repo (glob: none) | **Nothing Azure is running from this repo. No balance, burn, quota, or expiry evidenced.** |
| AI providers/free tiers | `.env.example` model names + gates; synthetic eval green; 0 external requests | $0 spend to date. Free-tier eligibility and remaining quotas unknown. |
| Any other connected service | None found (no mail, analytics, map-tile, OCR, push, or ExpoNav SaaS configs) | Unknown beyond repo. |

What Ali must check in the Azure portal (nothing assumed, nothing provisioned by this task):
1. Active subscription name/ID, offer type (Students vs other), status, and administrator.
2. Current credit balance, expiry date, and burn-down history (do not assume the opening balance is intact).
3. Any existing resource groups and resources (Container Apps, managed Postgres, Storage accounts, ACR, Communication/Email, Key Vault, App Insights) — record names, regions, SKUs, and running/stopped state.
4. Monthly free-grant vs metered usage for each candidate service, plus quota/request limits that could block a pilot (egress, storage transactions, container replicas).
5. Whether student-benefit renewals or verification steps are pending.
6. Export or screenshot the billing/credits blade and file it outside Git (never commit subscription IDs, keys, or personal data).

Zero-cash rule: no new out-of-pocket spending; existing credits/quotas are finite. This task provisioned, resized, stopped, deleted, or modified nothing.

## 4. ExpoNav capability inventory (all PLANNED ONLY unless noted)

### 4.1 Organizer experience — planned only
Event create/edit/delete, venue setup, floor-plan upload, PDF/image/link
import, map digitization, booth management, CSV import, exhibitor
assignment/invitations, schedule, facilities, publishing, QR/Pilot Kit,
reusable venues: **zero implementation**. The only "venue" in code is the
`venue_name` text field on web opportunities (`lib/types.ts`,
`lib/data/submit-opportunity.ts`, `moderation-review.ts`, migrations
0001/0008/0013/0014) — a location string, not an exhibition venue system.
The only "campaign pilot" is the staff-only aggregate-count rehearsal
(migration 0020, `lib/provider-campaign-state.ts`, `/campaigns`) — not an
exhibitor workflow. No CSV booth import, no invitation round-trip, no
publishing flow for events, no QR kit, no reusable-venue library.

### 4.2 Exhibitor experience — planned only
Auth, invitations, permissions, profiles, products/services, photos, booth
assignment, public visibility: **zero implementation**. Talent
`profiles`/`talent_profiles` (owner-only) and staff `is_staff()` are
different domains and must not be cited as exhibitor accounts. No exhibitor
role, invite token, or product/photo table exists (migrations 0001–0022
contain none).

### 4.3 Visitor experience — planned only (adjacent Tech Opportunity features noted, not credited)
Event discovery, exhibitor search, schedules, interactive maps, route
previews, turn-by-turn navigation, AI assistant, voice, QR checkpoints,
offline/PWA, outdoor arrival: **zero implementation**. Adjacent working
systems that inform but do not satisfy the journey: Explore/browse + filters
(implemented, live-test green per `ADOPTION_TESTING.md`), deterministic For
You explanations, grounded search-plan assistant scaffold (disabled),
deadline alerts (owner-gated migration 0012). None handles venues, booths,
maps, routes, QR, voice, or offline.

### 4.4 Map & navigation architecture — planned only
PDF label recognition, scanned-plan handling, overlays, location records,
walkway graph, calibration, routing, venue GPS, entrance handoff, trusted
indoor observations: **zero implementation**. Decisive negative evidence:
`test-fixtures.ts` rejects image files and bare-URL titles; PDFs are link
evidence, never parsed geometry; no `venue GPS`/`latitude-longitude` pipeline
beyond nullable stored coordinates; no graph/router/calibration module under
`lib/` or `scripts/`; no map component under `components/`. Repeated or
mismatched detected labels cannot occur — nothing detects labels.
Physical-verification requirements are therefore entirely unmet (no venue,
no path, no witness record).

### 4.5 Frontend — no ExpoNav pages/components (see §2.1 for what exists)
Existing pages/components are listed in §2.1. Cross-device position: one
responsive web codebase (desktop/tablet/mobile browsers); no native client,
no PWA manifest/service worker, no offline cache, no camera/QR/voice/GPS
integration, no map renderer. UX gaps for ExpoNav are total (every journey
screen missing), not incremental.

### 4.6 Backend/database — no ExpoNav model (see §2.2 for what exists)
No event/venue/floor-plan/booth/exhibitor/invitation/schedule/facility/route/
checkpoint table, RLS policy, RPC, storage bucket, or media handling exists.
API shape, migration discipline (hash-locked, failure-stop, recovery export,
post-proof), and RLS patterns are reusable **practices**, not reusable
**tables**.

### 4.7 AI — no ExpoNav AI (see §2.4 for what exists)
No grounding over exhibition data, no map-vision adapter, no routing LLM, no
voice pipeline, no cost/usage history (0 external calls). The deterministic-
first, allowlisted, fail-closed safety pattern is the reusable asset.

### 4.8 Deployment — no ExpoNav deployment
No ExpoNav URL, environment, pipeline, monitor, backup, or runbook exists.
§2.5 records Tech Opportunity operations only.

## 5. Business and product decisions (Tech Opportunity evidenced; ExpoNav unknown)

Tech Opportunity (research-supported vs hypothesis, per docs):
- Problem (supported by build direction): Tanzanian students/innovators need
  one trusted place for hackathons, scholarships, competitions, conferences,
  workshops, internships, fellowships, grants, tech/AI events (README, corpus
  of ~298 moderated rows cited in demo script).
- Users (implemented): talent now; providers/institutions future-only
  (`PLATFORM_ARCHITECTURE.md` — dashboards, verified publishing, targeting,
  monetization explicitly not built).
- Value props (live-test supported): Explore = full trusted universe;
  For You = explained re-ordering of the same corpus; Activity = private
  Saved/Interested/Applying/Applied; campaign pilot = aggregate-only proof
  with zero private-data exposure (`COMMERCIAL_DEMO.md`, `ADOPTION_TESTING.md`).
- Revenue hypotheses (not evidenced): provider promotion/targeting, campaign
  analytics, institution dashboards — future phases in roadmap, zero customers,
  zero traction claimed (demo script mandates honest zeros).
- Differentiation (claimed, corpus-backed): evidence-grounded trust
  (authority, eligibility, deadline, application URL) + human publication
  authority + deterministic explainability over listing volume.
- Priorities/deferred: 8 near-term priorities closed (roadmap); AI, native
  apps, paid features deferred behind gates; adoption/provider-pilot/business
  validation is the stated next evidence source (handoff).
- Pilot/acceptance readiness (Tech Opportunity): owner + 5–10 real-tester
  checklist defined (`ADOPTION_TESTING.md`); security/privacy posture =
  RLS boundary, least-privilege grants (0021/0022), no secret in Git, recovery
  sets outside Git with ACLs. Legal readiness (terms/privacy/consent for
  commercial operation): **not evidenced in repo — unknown**.

ExpoNav business (all unknown from repo, none may be inferred):
problem statement, target customers/users, organizer/exhibitor/visitor value
props, business model/revenue hypotheses, Zanzibar-first scope definition,
differentiation, paper-prototype vision, product priorities, deferred list,
pilot acceptance criteria, security/privacy/legal readiness — **no document,
commit, or code in this repo defines any of them**. The task prompt's
Zanzibar-exhibition objective and "paper-prototype vision" are the only
sources and are themselves unevidenced inputs, not recovered findings.
Any revenue, customer, traction, partnership, or sponsorship claim for
ExpoNav would be fabrication.

## 6. Gap analysis: ideal pilot journey vs actual

Ideal: organizer creates event → imports map + exhibitor data → ExpoNav
proposes interactive map → organizer confirms locations/paths → exhibitors
complete profiles → publish → visitors search/discover → navigate from
credible starts → one real Zanzibar exhibition proves usefulness.

Actual: none of the nine steps exists. The smallest genuine gaps (no rebuild
of working Tech Opportunity systems — reuse §2/§7 as noted):

| # | Gap (smallest genuine form) | Classification | Notes |
|---|---|---|---|
| G1 | Single-event data model (event → venue → booth/exhibitor → location point) + RLS + migration discipline | BLOCKER BEFORE PILOT | No tables exist. Reuse 0018–0022 authorship/RLS patterns, not their tables. |
| G2 | Manual map publish: upload one venue image/PDF as static backdrop + hand-placed booth pins (no AI recognition) | BLOCKER BEFORE PILOT | Scanned/image understanding is absent (§2.4); do not attempt OCR/vision before pilot. Hand placement is the honest path. |
| G3 | Booth↔exhibitor matching + organizer confirm screen (CSV import, dedupe on deterministic key, human confirm) | BLOCKER BEFORE PILOT | Mirrors pending-only + human-publish rule; repeated/mismatched labels handled by human confirm, not AI. |
| G4 | Exhibitor invite/content round-trip (token link, own profile/products, consent + photo) | BLOCKER BEFORE PILOT | No auth role/invite exists. Minimal magic-link or Supabase-auth extension; consent text required. |
| G5 | Visitor browse/search/exhibitor detail on the same corpus (reuse Explore/filter/detail patterns) | IMPORTANT BEFORE PILOT | Closest reuse of working Tech Opportunity UI; still needs event-scoped IA. |
| G6 | Credible-start navigation: entrance select + static path polyline per booth + "walk this marked path" guidance (no turn-by-turn, no indoor positioning) | BLOCKER BEFORE PILOT | Honest positioning: show hand-verified path, state accuracy limits on screen. |
| G7 | QR/checkpoint scan → booth card (manual QR print + URL scheme) | IMPORTANT BEFORE PILOT | No QR code exists; static URLs + printed codes suffice for Pilot 1. |
| G8 | Cross-device fallback matrix (low-end Android, offline screenshot/print map, printed directory) | IMPORTANT BEFORE PILOT | No PWA/offline/voice in repo; fallbacks are paper + cached page, not new infra. |
| G9 | Physical-accuracy record (measured walk, photo, organizer sign-off per path/booth) | REQUIRES PHYSICAL PILOT | Cannot be completed off-site; template + witness log must exist before the event. |
| G10 | Scanned-plan auto-understanding, label OCR/dedupe, auto walkway graph, AI routing, voice nav, outdoor→indoor GPS handoff, native apps | DEFER UNTIL AFTER PILOT | Explicitly deferred; attempting now risks false-precision wayfinding. |
| G11 | Azure/self-hosted Postgres/Container Apps/ACR/email provisioning | DEFER UNTIL AFTER PILOT | No evidence of need; current Supabase+Vercel+GitHub+Cloudflare path is the zero-cash baseline until credits/quotas force otherwise. |
| G12 | Monetization, provider self-serve, institution dashboards, analytics beyond counts | DEFER UNTIL AFTER PILOT | Matches platform architecture's future-phase gate. |

What not to rebuild: Next.js App Router + `lib/data` boundary, Supabase
RLS/migration/recovery discipline, verification contract (`verify`, `verify:
plan`, boundaries), deterministic-first AI safety, handoff/demo honesty
practices. These transfer as method, not as ExpoNav features.

## 7. Recommended zero-cash implementation sequence (stopped — for Ali + ChatGPT review)

0. Freeze understanding: accept this report; record ExpoNav decisions (problem,
   customers, revenue hypothesis, Zanzibar venue target, acceptance bar) in a
   dated, owner-signed note before any code. (Owner action.)
1. Paper prototype + one real venue commitment (hall name, date, organizer
   contact, permission to map/photograph). No code.
2. Minimal data model (G1) on a **separate Supabase project or clearly
   namespaced schema** — never co-mingle pilot rows with the Tech Opportunity
   production corpus; separate recovery export per `DATABASE_RECOVERY.md`
   practice. (Owner-authorized migration with hash + post-proof.)
3. Manual static map + pins (G2) and CSV booth import + confirm screen (G3),
   reusing Explore/detail UI patterns (G5 slice).
4. Exhibitor round-trip (G4) with consent + photo; publish gate = organizer
   confirm (mirrors human-publication rule).
5. Visitor event pages + entrance-anchored static paths (G6) + printed QR
   URLs (G7) + fallback matrix (G8: low-end device pass, printed map/directory).
6. Physical rehearsal (G9): measured walks, photos, sign-off sheet; fix pins/
   paths on site; record deviations.
7. Pilot 1 at the real exhibition: staffed help point, observation log
   (find-rate, time-to-booth, fallback uses, failures), no new features
   during the event.
8. Retro + decision: only then scope routing/AI/voice/offline/PWA or any
   Azure provisioning (G10–G12 remain deferred).

Explicit stop/defer boundaries: no native apps; no indoor-positioning
hardware/fingerprinting; no LLM map parsing or auto-graph; no voice; no
offline-first rebuild; no paid service, resize, or new cloud account; no
Tech Opportunity production-corpus mutation for ExpoNav; no traction,
customer, or accuracy claims beyond logged pilot evidence. Real-spend or
schema/prod work needs separate bounded owner authorization per
`ENGINEERING_RULES.md`.

## 8. Exact owner-only tests and physical evidence still required

- Venue agreement: named Zanzibar exhibition, date, hall, organizer contact,
  written permission to map, photograph, and QR-tag booths.
- Map truth pack: source plan file + version, pin/booth list with IDs, who
  placed each pin, entrance point(s), photographed hand-verified paths.
- Walk evidence: per-route measured walk (start→booth), time, observer name,
  device used, photo of start/end markers, deviation notes.
- Exhibitor consent: invite acceptance + profile/photo consent per exhibitor;
  withdrawal path tested.
- Visitor pilot log: find-success rate, time-to-booth, fallback usage
  (staff help, printed map), failure list with causes; 5–10 real visitors
  minimum on their own phones (mirrors `ADOPTION_TESTING.md` method).
- Acceptance sign-off: organizer confirms locations/paths accurate enough to
  publish; dated signature.
- Cost confirmation: Azure portal screenshots/exports per §3 filed outside
  Git; written zero-cash compliance (no spend incurred).
- Security/privacy/legal: terms, privacy notice, photo/consent handling, and
  data-retention statement reviewed before public pilot (currently unknown —
  §5). Production AI (if ever used for ExpoNav) needs the same key +
  data-use/ZDR/no-billing gates as Tech Opportunity AI.

## 9. Uncertainty and contradictions discovered

1. Task premise vs repo reality: the brief assumes an ExpoNav system with
   canonical docs to read; the repo contains a different product (Tech
   Opportunity) and zero ExpoNav artifacts. This report records the absence
   rather than inventing coverage.
2. `AGENTS.md` and `DOCS_INDEX.md` do not exist; task instructions referencing
   them cannot be grounded in repo files. Substitutes and the newly created
   minimal index are named explicitly.
3. Deployment currency is unverifiable locally: live Vercel SHA, Supabase
   plan usage, and Azure balances/quotas require owner portal/API access this
   task did not attempt (read-only, no provisioning). §3 lists exact checks.
4. "Pilot sources / campaign pilot" language in Tech Opportunity docs is a
   false-friend match for ExpoNav "pilot" — verified by reading the code as
   web-source and aggregate-count concepts, not exhibition concepts.
5. Handoff HEAD references in `NEXT_SESSION_HANDOFF.md` lag the true HEAD
   (`5cab9de` closure text vs `2886052` actual) — normal doc lag, noted so a
   future session re-verifies with `git log` rather than trusting the prose.

## 10. Authoritative-source map (avoid duplicating docs)

- Continuity/handoff: `docs/NEXT_SESSION_HANDOFF.md` (authoritative; now
  points here — §11).
- Rules/gates: `docs/ENGINEERING_RULES.md`, `docs/VERIFICATION_CONTRACT.md`.
- Architecture: `docs/architecture.md` (rationale), `README.md` (stack/scope).
- Data/grants/recovery: `docs/DATA_API_GRANTS.md`, `docs/DATABASE_RECOVERY.md`,
  `supabase/migrations/0001–0022`.
- Discovery/scheduler: `docs/DISCOVERY_EXTERNAL_SCHEDULER.md`,
  `docs/DISCOVERY_SCHEDULE_INCIDENT_2026-09-22.md`, `ops/discovery-scheduler/`,
  `.github/workflows/discovery*.yml`.
- AI: `docs/AI_OPPORTUNITY_INTELLIGENCE.md`,
  `docs/AI_OPPORTUNITY_INTELLIGENCE_EVALUATION.md`,
  `docs/AI_ASSISTANT_DESIGN.md`, `lib/opportunity-intelligence/`,
  `lib/assistant/`, `.env.example` (names only).
- Product/business (Tech Opportunity): `docs/PRODUCT_ROADMAP.md`,
  `docs/PLATFORM_ARCHITECTURE.md`, `docs/COMMERCIAL_DEMO.md`,
  `docs/ADOPTION_TESTING.md`, `docs/M31_STAGING_RUNBOOK.md`.
- This report: `EXPO_NAV_PROJECT_INTELLIGENCE_REPORT.md` (repo root) —
  authoritative for ExpoNav recovery status only; it grants no build authority.

## 11. Documentation update from this task

- Created: `EXPO_NAV_PROJECT_INTELLIGENCE_REPORT.md` (this file).
- Created (minimal, task-required): `DOCS_INDEX.md` pointing to canonical
  docs + this report (the file did not exist).
- Updated: `docs/NEXT_SESSION_HANDOFF.md` with a pointer entry (docs-only,
  no product change).
- Verification: `verify:plan` docs-only path (no production evidence,
  no owner actions); commit + push documentation only; no deploy.
