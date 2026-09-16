# Tech Opportunity

**Continuing development? Read [the authoritative engineering handoff](docs/NEXT_SESSION_HANDOFF.md) first.**
M31 is closed and isolated staging is established. Published Unpublish Attribution
Hardening is promoted to production; no production moderation action was used for
proof. The promotion-push corpus delta has been reconciled read-only, but its
two-record resolution remains stopped before mutation. Pending Rejection Attribution
Hardening is now promoted to production (migration 0016 plus capability `71f4a33`)
with a zero-row corpus delta; no production moderation action was used for proof.
Both real pending records have since been rejected through the authenticated
Moderator path with exact attributable reasons, one at a time with independent
verification. Bulk Moderator Actions is promoted
to production at exact capability commit `1645973`;
no production moderation action
was used for proof. The push Discovery run inserted five pending records and
six references; read-only reconciliation accepts the delta as legitimate
mechanical growth (all pending-only, no corruption). The one Tanzania-excluded
Nordic row has now been rejected through the authenticated production Moderator
path with exact reason, attribution, timestamp, and audit; the other four delta
rows remain untouched. The Batch 1 expired-calls cleanup, the Batch 2
EBID pair, and the Batch 3 AWARD single then followed with exact reasons
and per-record audits, and the furniture sweep's first confirmation rejected
50 rows. Manual legacy cleanup and the 200-row corpus reset are abandoned:
the historical corpus stays physically untouched with full history preserved.
Authoritative Discovery + Active Lifecycle Hardening is implemented (HEAD
`27ab009`; not yet deployed to the production runtime): public active browse
and the moderator active queue exclude expired lifecycle at query/view time
(no status sweeper, no deletions; direct detail keeps "Deadline passed"), new
discovery admits only unexpired qualified candidates from authoritative
origins or with resolved external application evidence, and the legacy
ambiguous queue filter is retired. Manual legacy cleanup and the 200-row
corpus reset are abandoned — the historical corpus stays physically untouched.
The owner-gated controlled Discovery run was executed and PASSED (run
`35088590079` at `27ab009`): two pending inserts (Kectil Program 2027,
AfricaLics PhD VFP 2027), both future-deadline, relevant, non-excluded, and
unduplicated, admitted — from the secondary origin OpportunityDesk — only with
external application evidence. The repo-targeted 2-hour cadence is now live
(Discovery sync `active`, `cron: '0 */2 * * *'`). The Authoritative Source
Registry Expansion milestone is **CLOSED (2026-09-16)**: the owner applied
`supabase/seeds/0003_first_party_listing_adapters.sql` to production, activating
exactly the two reviewed first-party listing adapters (UDSM announcements view,
NM-AIST events archive) in `scripts/discovery/source-adapters.ts` — active
registry 18 → 20, admission gate and 2-hour cadence unchanged. Two live
Discovery runs were observed (`35106123095`, `35107041338`): UDSM admitted 5
real opportunities and NM-AIST 1 Data-Science/AI scholarship item (all `pending`
for human moderation; no institutional news admitted); NM-AIST's one transient
fetch timeout self-cleared on re-run. Tech Opportunity is organization-first and
opportunity-only — authority belongs to the genuine organization/channel
(official sites, application portals, government/ministry/agency channels,
universities/research institutions, companies/foundations/NGOs/hubs, verified or
demonstrably official LinkedIn/Instagram/Facebook/X accounts, and official forms
they link), never to general news; an item is an opportunity only when it carries
a concrete user action (apply, register, compete, submit, pitch, attend, train,
receive funding, research, intern, work, exhibit); aggregators, reposts,
unofficial accounts and secondary news remain discovery leads only. Immediately
after closure one systemic admission gap the run exposed was fixed at the gate: a
narrow, title-only **opportunity-only actionability guard** in
`scripts/discovery/qualification.ts` now withholds selection results,
shortlisted/successful-applicant and awardee lists, and administrative follow-ups
addressed only to already-selected people **before** they reach the Moderator
queue (a class rule, not one title — genuine open calls that merely mention
selection criteria still pass). The **National/International classification +
opportunity taxonomy** milestone is now implemented: `lib/taxonomy.ts` is the
single deterministic classifier for three dimensions — TYPE (the existing
categories plus three owner-gated slugs: accelerator/incubator, research call,
government/public-sector challenge), GEOGRAPHY (exactly two groups, National /
International, derived from stored country + eligibility evidence, with cities and
regions kept as metadata) and SECTOR (13 practical slugs, independent from type).
Geography and sector are derived, not stored (no new columns); unknown fails safe
to null (never an "Ambiguous" workflow); discovery classifies every candidate
automatically; public browse and the Moderator queue filter by group, sector and
type. The only schema change is the additive, idempotent seed
`supabase/migrations/0017_opportunity_taxonomy_categories.sql`, now applied to
production (owner-authorized), so discovery admits the three new types. Geography
classification follows the OPPORTUNITY, not the organizer's nationality: a
canonical Tanzania region/city (e.g. Zanzibar, Arusha) is National even for a
foreign-run event, a Tanzania-specific call is National, and a global call with
evidenced Tanzanian access is International; every opportunity entering the
publishable corpus must be determinate National/International, and an item with
insufficient geographic evidence is held out until evidence exists (never
"Ambiguous"). Full `npm run verify` and `npm run build` are green.
**Showcase UI/UX Readiness (roadmap priority 8) is now CLOSED (2026-09-16)** —
performance, design-system primitives, trust badges, filter UX, pagination,
accessibility, and full staff-moderation palette reconciliation delivered; all
gates green (tsc, 27 tests, 35 boundaries, build, lint). All 8 near-term roadmap
priorities are closed. Next: owner-directed growth phase (see "Following product
phases" in [PRODUCT_ROADMAP.md](docs/PRODUCT_ROADMAP.md)).

**User Profile + Personalized Opportunity Foundation is now implemented
(2026-09-16, talent side only; migration 0018 DESIGNED — NOT APPLIED, OWNER
GATE).** The permanent three-sided platform architecture (TALENT now;
OPPORTUNITY PROVIDERS and INSTITUTIONS future, documented only) lives in
[PLATFORM_ARCHITECTURE.md](docs/PLATFORM_ARCHITECTURE.md). Explore stays the
complete trusted opportunity universe for everyone and is never gated by
personalization; **For You** (`/for-you`) is a separate, optional layer that
re-orders and explains the *same* trusted corpus using an owner-only talent
profile (`/profile`, progressive and fully skippable). Personalization is a pure,
deterministic matching-input contract with human-readable reasons
(`lib/personalization.ts`) — no percentages, no score gimmicks, no LLM/AI, no CV
parsing. The profile table is OWNER-ONLY RLS (never staff- or org-readable, no
anonymous access, identity from authenticated claims), so personal user data is
never exposed to organizations. All gates green (tsc, tests incl. the new
`test:personalization`, 35 boundaries, build, lint).

> _"A web platform for discovering opportunities all across Tanzania."_

Discover hackathons, scholarships, competitions, conferences, workshops,
internships, fellowships, grants, and tech/AI events across Tanzania.

**This is a responsive website** (desktop, laptop, tablet, mobile browsers)
built with Next.js — not a native Android/iOS app. A future native client
could reuse the same Supabase backend unchanged; see
`docs/architecture.md` §10.

## Stack

- [Next.js](https://nextjs.org) 16 — App Router, TypeScript, React Server Components
- [Tailwind CSS](https://tailwindcss.com) v4 — styling
- [Supabase](https://supabase.com) — PostgreSQL, auth, storage *(environment identity requires independent verification)*
- [Vercel](https://vercel.com) — hosting *(deployed)*

## Project structure

```text
├── app/               # Pages and layouts (App Router)
│   ├── layout.tsx     # Root layout
│   ├── (home)/page.tsx # Home page
│   └── globals.css    # Global styles / theme
├── components/        # Reusable UI components
├── lib/
│   ├── types.ts       # Domain types (single source of truth)
│   └── data/          # DATA-ACCESS LAYER - all DB queries live here
│       └── mock-opportunities.ts  # clearly-marked temporary samples
├── docs/
│   └── architecture.md# Architecture decisions; current state in NEXT_SESSION_HANDOFF.md
├── public/            # Static assets
├── scripts/discovery/ # TypeScript discovery pipeline (GitHub Actions every two hours)
├── supabase/          # Migrations + source-registry seeds
└── .env.example       # Required variable NAMES (values never committed)
```

Architectural rule: **UI → `lib/data/` → database.** Components never query
the database directly. See `docs/architecture.md` §5 for why.

## Getting started

Prerequisites: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local   # fill in values yourself; never commit this file
npm run dev
```

Open http://localhost:3000.

With `.env.local` configured, the home page reads published opportunities from
the configured database. **Its environment identity is not inferred from this file.**
An isolated staging target must be established before any staging mutation.
Without configuration it renders empty with a console warning — builds still
pass. `lib/data/mock-opportunities.ts` remains available as an offline
fixture and is never mixed into real results.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build (also type-checks) |
| `npm run start` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm test` | All test suites (fixtures, review, assistant, lifecycle, acquisition) |
| `npm run test:fixtures` | Discovery extraction/normalization/dedupe fixture tests |
| `npm run test:review` | Moderator review parser tests |
| `npm run test:assistant` | Assistant plan-contract/grounding tests |
| `npm run test:lifecycle` | Lifecycle derivation tests (four states) |
| `npm run test:acquisition` | Acquisition-guard + country-honesty tests |
| `npm run test:personalization` | Talent profile + deterministic For You matching tests |

## Environment variables

Variable names are documented in `.env.example`. Create `.env.local` from it
and fill in real values yourself. `.env.local` is git-ignored and must never
be committed, pasted into chat, or shared.

## Learning path

`docs/architecture.md` explains where the frontend, backend logic, database,
auth, files, secrets, and deployments live — and exactly which future
requirements would justify adding a separate backend service.

## Roadmap

Permanent boundaries are in [ENGINEERING_RULES.md](docs/ENGINEERING_RULES.md), the
ordered near-term priorities are in [PRODUCT_ROADMAP.md](docs/PRODUCT_ROADMAP.md),
and current state plus the one exact next milestone are maintained in
[NEXT_SESSION_HANDOFF.md](docs/NEXT_SESSION_HANDOFF.md). Do not follow historical
migration or AI-activation plans as current instructions.
