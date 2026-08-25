# TechOpportunity Tanzania

Discover hackathons, scholarships, competitions, conferences, workshops,
internships, fellowships, grants, and tech/AI events across Tanzania.

**This is a responsive website** (desktop, laptop, tablet, mobile browsers)
built with Next.js — not a native Android/iOS app. A future native client
could reuse the same Supabase backend unchanged; see
`docs/architecture.md` §10.

## Stack

- [Next.js](https://nextjs.org) 16 — App Router, TypeScript, React Server Components
- [Tailwind CSS](https://tailwindcss.com) v4 — styling
- [Supabase](https://supabase.com) — PostgreSQL, auth, storage *(to be connected)*
- [Vercel](https://vercel.com) — hosting *(to be connected)*

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
├── .env.example       # Required variable NAMES (values never committed)
└── pipeline/          # (future) Python scraping/AI batch jobs
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

Until Supabase credentials exist in `.env.local`, the home page lists three
clearly marked `[MOCK]` records from `lib/data/mock-opportunities.ts` so the
UI can be verified. When the real database connects, only the internals of
`lib/data/opportunities.ts` change — the mocks disappear and real data flows
through the same functions.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build (also type-checks) |
| `npm run start` | Serve the production build locally |
| `npm run lint` | ESLint |

## Environment variables

Variable names are documented in `.env.example`. Create `.env.local` from it
and fill in real values yourself. `.env.local` is git-ignored and must never
be committed, pasted into chat, or shared.

## Learning path

`docs/architecture.md` explains where the frontend, backend logic, database,
auth, files, secrets, and deployments live — and exactly which future
requirements would justify adding a separate backend service.

## Roadmap

1. **MVP** — curated listings + admin moderation (current phase)
2. **Aggregation** — scheduled Python discovery/extraction/classification
3. **Users** — accounts, saved searches, deadline digests
4. **Intelligence** — recommendations via offline embedding jobs
5. **Platform** — independent API service only if a concrete trigger appears
6. **Native mobile apps** *(optional, undecided)* — would attach to the same
   Supabase backend via official mobile SDKs; nothing to build now
