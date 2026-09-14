# Tech Opportunity

**Continuing development? Read [the authoritative engineering handoff](docs/NEXT_SESSION_HANDOFF.md) first.**
M31 is closed and isolated staging is established. Published Unpublish Attribution
Hardening is promoted to production; no production moderation action was used for
proof. The promotion-push corpus delta has been reconciled read-only, but its
two-record resolution remains stopped before mutation. Pending Rejection Attribution
Hardening is now implemented and fully verified in isolated staging. The exact next
milestone is its bounded production-promotion review; production schema/data and the
two real pending records remain unchanged.

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
├── scripts/discovery/ # TypeScript discovery pipeline (GitHub Actions every six hours)
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
