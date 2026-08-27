# Session Checkpoint

_Recording state at the end of the multi-channel discovery + AI scaffolding session. Created automatically; read this file FIRST in any new session._

## Repository
- Project: TechOpportunity Tanzania
- Branch: `main`
- HEAD commit: `aa3333a` (see Important Commits below for the chain)
- Working tree: clean
- Remote sync: `main` synchronized with `origin/main`

## Current Product State
- **Public experience**: responsive Next.js site — homepage with published opportunity cards, keyword search, category pills (incl. new `admissions`), 31-region Tanzania region select, city select (data-driven), deadline filter (soon/upcoming/rolling), sort; opportunity detail pages; `/submit`; `/login`; `/moderation` (staff-only); custom 404 / error / loading boundaries; global header + skip link; AI assistant panel present but honestly **disabled**.
- **Moderation/review flow**: staff login via Supabase SSR cookies; queue; review page shows provenance panel (source name, discovered date, method) + full prefilled review form (title, category, description, official URL, venue, address, city, canonical-region select, deadline date input, organizer select). Approve applies review fields + status in ONE protected update (double pending-guard). Reject writes status ONLY (never wipes enrichment). Audit rows inserted best-effort into `opportunity_enrichments` (now live) — absence of the table never blocks moderation.
- **Discovery pipeline**: 18 active sources (16 Tanzania institutions + 2 Africa-wide aggregator feeds: OpportunityDesk, OpportunitiesForAfricans). Worker fetches base_url + up to 2 advertised RSS/Atom feeds per source; extractors: RSS, Atom, JSON-LD (location via PostalAddress, deadlines via applicationDeadline/registrationDeadline/validThrough), HTML headings+anchors. URL guards reject www.www hostnames, image files, comment permalinks, non-http schemes. Exact-match navigation/section-label noise gate. `isRoundupTitle` + one-hop `extractOpportunityLinks` expansion turns multi-opportunity roundup posts into individual pending candidates (parent suppressed only if ≥1 inner candidate survives). Category inference includes unambiguous Swahili terms (mafunzo→workshop, mashindano/shindano→competition, kongamano→conference, udhamini→scholarship) + admissions patterns (udahili, fomu ya maombi, application for). Unknown categories are skipped-with-log (never fail the source). Dedupe: canonical URL + batch-level. Provenance: source_id + discovered_at + discovery_method + source_url, immutable.
- **Search/filtering**: all six filter dimensions share one data path (`listPublishedOpportunities`); shareable GET URLs; server-side; published-only.
- **Provenance/transparency**: moderators see source name + discovery date/method; public pages never expose registry metadata. `source_id` is never organizer identity.
- **Enrichment/audit trail**: migration 0003 APPLIED to staging (table `opportunity_enrichments` exists; anon read = 0 rows; anon insert = 401; CHECK constraint rejects invalid fields; staff insert verified via controlled probe). The moderation action writes field-level audit rows (previous/new/evidence_url/method) on approval — currently 0 rows because no moderator enrichment has happened since the migration was applied. Test A (ERASMUS+ record) was enriched PRE-audit and is honestly unaudited.
- **Category handling**: taxonomy = hackathon, competition, scholarship, conference, workshop, internship, fellowship, grant, tech-event, **admissions (NEW — migration 0004 file exists but is NOT YET APPLIED to staging)**, other. Category inference classifies future rows; legacy rows were never reclassified (by design).
- **AI scaffold/provider state**: full provider-independent scaffold implemented and deployed — strict plan contract (`lib/assistant/plan.ts`), grounded execution (`lib/data/assistant-queries.ts`), provider boundary (`lib/assistant/provider.ts`), rate limiter, kill switch (`ASSISTANT_ENABLED !== "true"` → honest disabled response), fallback-to-keyword-search, UI panel (`components/assistant-panel.tsx`, disabled state shown). 17/17 assistant tests.
- **Mobile state**: none, by design. Final phase only, after explicit approval.

## Architecture (current, authoritative — do not drift)
- Next.js 16 (App Router, route groups) + Supabase (Postgres, RLS, Auth, Storage) + Vercel.
- `UI → lib/data/* → Supabase`; zero direct Supabase SDK use in `app/` or `components/` (verified by grep).
- RLS authoritative: anon sees published only; staff via `is_staff()`; service-role only inside `scripts/discovery/*`.
- Moderation-first: discovery hardcodes `status='pending'`, `submitted_by=null`, `organization_id=null`; provenance fields are never read from moderation form input.
- Source registry = staff-managed allow-list (`opportunity_sources`, staff-only RLS, unique base_url).
- Discovery is batch (GitHub Actions daily cron + workflow_dispatch; local runs are the validated equivalent).
- AI: server-side only, published-only reads through `lib/data/*`, no provider runtime until credential + enablement, design in `docs/AI_ASSISTANT_DESIGN.md` (incl. Groq recommendation §11–13 and opportunity-first prompt policy §12).
- $0/month target: public feeds, free tiers only; no paid infrastructure approved.
- Prohibited by roadmap: FastAPI, native mobile/RN/Expo/Flutter, maps/geolocation/PostGIS, vector DB/embeddings, news subsystem, social scraping, general chatbot behavior.

## Data Quality
(measured from live staging at checkpoint time; heuristic labels are lexicon estimates, not ground truth)
- Discovered rows: **178** (pending 170, published 5, rejected 3).
- Discovery method: html=142, rss=36 (feed harvesting working).
- Category: other=160, fellowship=6, scholarship=3, grant=3, conference=2, competition=2, internship=2. **"other" still dominates legacy rows; new-row inference improved by Swahili/admissions patterns.**
- Structured coverage across discovered rows: city=1, region=1, venue=1, deadline=1, organizer=0 — **the owner-enriched ERASMUS+ record is the only fully structured row**.
- Opportunity-vs-news heuristic estimate: opportunity ≈ 7–15, news/nav ≈ 40, ambiguous ≈ 95–100 (NM-AIST programme pages dominate ambiguity).
- Top sources by volume: NM-AIST 37, DIT 16, SUZA 14, YUNA 14, FSDT 13, IHI 11.
- Known source-quality problems: VETA rows carry dead/malformed URLs (incl. one `www.www.` — now blocked for future candidates); DIT subdomain `ditcoltd` dead; YUNA feed returns 403 (feed links skipped, source still succeeds).
- Known vs unknown: which rows are actionable = UNKNOWN until moderated; the lexicon estimate is heuristic only.

## AI Status
- Runtime: **NOT OPERATIONAL** — deliberately disabled (`ASSISTANT_ENABLED` unset).
- Provider research: **Groq recommended** (free tier verified from current official docs: e.g. `openai/gpt-oss-20b` 30 RPM / 1,000 RPD / 200K TPD; OpenAI-compatible plain fetch; structured outputs documented). Gemini: docs timed out from this environment — NOT VERIFIED. OpenAI: verified structured outputs but pay-as-you-go (fails $0 target).
- Credentials: **none exist** — no `ASSISTANT_PROVIDER_API_KEY` anywhere. Owner must choose provider, create the key, store server-side (`.env.local` + hosting env), then set `ASSISTANT_ENABLED=true`.
- Implemented: plan contract + validator, grounded execution reusing `listPublishedOpportunities`, deterministic fallback, kill switch, rate limiter, disabled-state UI panel, 17/17 tests.
- Designed but not implemented: the actual provider HTTP call (Groq plan documented in design doc §13), provider-failure test variants requiring a live provider.

## Owner Gates
1. Apply `supabase/migrations/0004_admissions_category.sql` in the staging SQL Editor (seed row for the new category — worker currently skips `admissions` candidates gracefully until applied).
2. Optionally apply nothing else — 0003 is already applied and verified.
3. Moderation work: ~170 pending rows await review/enrichment (new aggregator rows are first-priority triage).
4. AI activation decision: approve Groq per design doc, create API key, set `ASSISTANT_PROVIDER_API_KEY` + `ASSISTANT_ENABLED=true` (server-side only).
5. Real-device QA pass (never performed in this environment).
6. Taxonomy: decide whether a `vacancies/jobs` category is wanted (documented gap in `docs/DISCOVERY_CHANNELS.md`).

## Next Session Starting Point
1. Read `docs/SESSION_CHECKPOINT.md` (this file), then `docs/ARCHITECTURE.md`, then `docs/AI_ASSISTANT_DESIGN.md`.
2. Highest-value product work: moderate the ~170 pending rows — especially the 20 aggregator rows and any new `admissions` candidates after applying migration 0004. Use the review form; the audit trail now records field-level changes.
3. If AI activation is approved: apply 0004 if not done, set the two assistant env vars, and the route flips to operational with zero code change; then run the provider-gated test additions listed in design doc §13 item 4.
4. Only after the assistant is live and useful: consider the vacancies category migration and source outreach. Mobile remains the final phase.

## Important Commits
- `aa3333a` roundup inner-link title humanization (final code commit of session)
- `b52289a` roundup expansion: one-hop inner-link extraction (one row = one opportunity)
- `13f5720` / `6e0bf01` multi-channel discovery audit documentation
- `60c2c2e` admissions category inference + assistant boundary (+ migration 0004 file)
- `8b7d934` AI design doc: Groq research + opportunity-first prompt policy
- `66d5e9c` disabled-by-default AI assistant scaffold
- `28f2053` enrichment-audit status banner on moderation review page
- `37d5991` moderator review enrichment (editable fields, audit rows)
- `e532aaa`/`f926ecb` Swahili category inference + dry-run category reporting

## Resume Instruction
New session: read `docs/SESSION_CHECKPOINT.md` first, then `docs/ARCHITECTURE.md` and `docs/AI_ASSISTANT_DESIGN.md`. Verify state with `git status/log` and the read-only staging queries in this file before touching anything. The queue (~170 pending) is the product's core asset: continue moderator triage, apply migration 0004 if not yet applied, and only touch the AI layer after the owner completes the provider gate. Never infer location/organizer/deadline/eligibility; never auto-publish; never expose the registry or audit table; keep everything web-first, $0/month, and moderation-first.
