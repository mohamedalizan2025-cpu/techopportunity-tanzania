# TechOpportunity Tanzania

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
- [Supabase](https://supabase.com) — PostgreSQL, auth, storage *(connected: `tto-staging`)*
- [Vercel](https://vercel.com) — hosting *(deployed)*

## Project structure

```text
├── app/               # Pages and layouts (App Router)
│   ├── layout.tsx     # Root layout
│   ├── page.tsx       # Home page
│   └── globals.css    # Global styles / theme
├── components/        # Reusable UI components
├── lib/
│   ├── types.ts       # Domain types (single source of truth)
│   └── data/          # DATA-ACCESS LAYER - all DB queries live here
│       └── mock-opportunities.ts  # clearly-marked temporary samples
├── docs/
│   └── architecture.md# Architecture decisions - start here
├── public/            # Static assets
├── scripts/discovery/ # TypeScript discovery pipeline (GitHub Actions daily)
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

With `.env.local` configured (staging credentials you enter yourself), the
home page lists **published opportunities from the staging database**.
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

1. **MVP** — curated listings + admin moderation (done)
   - within MVP+: interactive location maps, "Get Directions", city/region
     filters, near-me search — data model already ready
     (`docs/architecture.md` §11); no map SDK chosen yet
2. **Aggregation** — scheduled discovery (done: TypeScript pipeline in
   `scripts/discovery/`, daily GitHub Actions run, moderation-first)
3. **Users** — accounts, saved searches, deadline digests
4. **Intelligence** — recommendations via offline embedding jobs
5. **Platform** — independent API service only if a concrete trigger appears
6. **Native mobile apps** *(optional, undecided)* — would attach to the same
   Supabase backend via official mobile SDKs; nothing to build now
