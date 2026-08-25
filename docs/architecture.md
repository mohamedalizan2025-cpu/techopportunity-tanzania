# TechOpportunity Tanzania — Architecture

Status: **MVP scaffold** · Last updated: 2026-08-25

This document explains *how the system is put together and why*. It is written
for a student learning software architecture — implementation details live in
the code; this file explains the decisions behind it.

---

## 1. What this project is

A platform where Tanzanian students and young innovators discover
opportunities: hackathons, competitions, scholarships, conferences,
workshops, internships, fellowships, grants, and tech/AI events.

The MVP is a **curated, read-heavy listing site**: an admin publishes
opportunities, everyone else browses and searches them. Later phases add
automated discovery and AI-assisted processing.

This product is a **responsive web platform** — one codebase serving
desktop, laptop, tablet, and mobile *browsers*. It is not a native
Android/iOS application; §10 explains how a future native client could
reuse this exact backend without rebuilding anything.

---

## 2. The approved MVP architecture

```
   GitHub  ──────────►  Vercel (hosts Next.js)
                            │
                       Next.js website
                       ┌─────┴─────┐
                 UI components   server logic
                 (app/,          (Server Components,
                  components/)    Route Handlers)
                            │
                     lib/data/*        ← THE data-access layer
                            │
                        Supabase
                    ┌──────┼──────────┐
                PostgreSQL  Auth    Storage
```

- **GitHub** — source control. Every push is the deployment trigger.
- **Next.js** — one application containing both the frontend *and* the
  backend logic. Code that runs on the server (never in the visitor's
  browser) lives in Server Components, Route Handlers (`app/api/*`) and
  Server Actions.
- **Supabase** — managed PostgreSQL plus authentication and file storage
  under one roof. Its API is only ever reached through `lib/data/`.
- **Vercel** — hosts the Next.js app. Free Hobby tier for now.
- **GitHub Actions** — CI/CD and, later, scheduled Python data pipelines.
  Not used yet; introduced when there is something to automate.

---

## 3. Where everything lives (the mental model)

| Question | Answer |
|---|---|
| Where does the frontend live? | `app/` (pages/layouts) and `components/` (reusable UI), rendered by Next.js |
| Where does the backend / server logic live? | Two places: Next.js server-side code running on Vercel, and database-level logic in Postgres (Row Level Security policies, views). There is no separate backend server. |
| Where does the database live? | Supabase-hosted PostgreSQL (staging project during development, production project at launch) |
| How do frontend and backend communicate? | UI never talks to the database directly. Components call functions in `lib/data/`; those functions use the Supabase client over HTTPS (PostgREST). |
| How does authentication work? | Supabase Auth issues signed JWT tokens on login. Row Level Security policies decide what each authenticated role may read/write. |
| Where are uploaded files stored? | Supabase Storage buckets, with access policies tied to auth. Not on the web server. |
| Where is the app deployed? | Vercel (frontend + server logic). Database and files stay in Supabase. |
| How does GitHub connect to deployment? | Vercel watches the repository. A push to `main` → production deploy. Any pull request → isolated preview URL. |
| How do environment variables work? | Locally: `.env.local` (git-ignored, you create it). In the cloud: Vercel project settings. See §7. |
| How do staging and production differ? | Same code, different data and URLs — see §6. |
| When would we need another backend service? | Only when a trigger from §8 fires. |
| What about a future mobile app? | It would connect to the *same* Supabase database, auth, and storage via official Supabase mobile SDKs — no backend rebuild needed. See §10. |

---

## 4. Why these choices

### Why Next.js
One language (TypeScript) across the whole stack; industry-standard;
first-class support on Vercel; server-side rendering gives fast pages and a
natural place to keep secret-using code off the client.

### Why Supabase / PostgreSQL
PostgreSQL is the most transferable database skill in software and data
science. Supabase layers auth, storage, auto-generated APIs, and the
`pgvector` extension (embeddings/similarity search — needed later for
duplicate detection and recommendations) on standard Postgres, so almost
nothing is proprietary. The free tier includes two active projects, which
map exactly onto staging + production.

### Why Vercel
Zero-configuration Next.js hosting with automatic deploys from Git and
per-PR preview URLs. Deploys are reversible; no servers to manage.

### Why GitHub Actions (later)
Free for public repositories, version-controlled workflows, and it doubles
as the scheduler/runtime for the future Python pipelines — no extra
infrastructure account required.

---

## 5. The golden rule: centralized data access

```
UI  →  lib/data/*  →  Supabase
```

Components must **never** import a database client or run queries directly.
All reads/writes go through functions in `lib/data/`.

Why this rule matters:

1. **Replaceability** — if we ever add a FastAPI service, only `lib/data/`
   changes (its functions call an HTTP endpoint instead of Supabase).
   Zero frontend rewrites.
2. **One place to review security** — every query that touches data is in
   one folder.
3. **Consistent types** — everything returns the interfaces from
   `lib/types.ts`.
4. **Testability** — data functions can be tested or mocked independently
   of UI.

Current state: connected to the `tto-staging` Supabase project. The
Supabase client factory lives beside the queries in `lib/data/supabase-client.ts`,
so even the SDK import stays inside the data layer. Reads use the anon key,
which means Row Level Security is always in force. `mock-opportunities.ts`
remains as an offline fixture file and is not part of the real data path.

---

## 6. Environments

| | Local development | Staging | Production |
|---|---|---|---|
| Code location | your machine | `main` branch via PR previews | `main` branch |
| Frontend/server | `npm run dev` on localhost:3000 | Vercel preview URL | vercel.app domain (custom domain optional) |
| Database | Supabase project **`tto-staging`** | Supabase project **`tto-staging`** | Supabase project **`tto-prod`** |
| Secrets source | `.env.local` (pointing at staging) | Vercel env vars scoped to *Preview* | Vercel env vars scoped to *Production* |

Notes:
- Local development deliberately uses the **staging** cloud database so we
  do not need Docker or a local Postgres install.
- Production data is never touched while developing features.
- Staging gets seeded/test data; production gets real data only after you
  explicitly apply migrations there.

Known platform behavior to engineer around (verify current terms when we
connect accounts): idle Supabase free projects pause after roughly a week;
a small scheduled GitHub Actions "keep-alive" ping solves this later.

---

## 7. Secret-management principles

1. **Secrets never enter Git.** `.gitignore` ignores every `.env*` file;
   only `.env.example` (names and explanations, no values) is committed.
2. **You personally** copy `.env.example` → `.env.local` and fill in real
   values. Never paste secrets into chat, terminal history, tickets, or
   screenshots. The coding agent only needs variable *names*.
3. **The browser is public.** Anything prefixed `NEXT_PUBLIC_` ships to
   every visitor. Only the Supabase URL and anon key get that prefix; their
   safety model is Row Level Security, not secrecy.
4. **`SUPABASE_SERVICE_ROLE_KEY` bypasses all permissions.** Server-side
   code only; never in the browser, never `NEXT_PUBLIC_`.
5. **Cloud secrets live in dashboards**, scoped per environment
   (Preview vs Production) in Vercel project settings.
6. **CI/CD secrets** (later) go in GitHub repository settings and are
   referenced as `${{ secrets.NAME }}` inside workflows.
7. **If a secret leaks, rotate it immediately** in the provider dashboard —
   deleting it from a commit is not enough.

---

## 8. Why FastAPI is postponed

The MVP has no requirement that justifies operating a second always-on
backend service: listing, filtering, submission, moderation, and uploads are
all covered by Next.js server logic + Postgres. Adding FastAPI now would
double deployment surface, split business logic across languages, and slow
every feature — while solving problems that do not exist yet.

Python still enters the stack early — as **scheduled batch jobs**
(scraping, classification, deduplication) run by GitHub Actions writing
straight into Postgres. Batch scripts are the natural shape of data/ML
work and require no HTTP service.

**Introduce FastAPI only when one of these becomes true:**

1. Real-time ML inference is needed inside user requests (< ~1 s response).
2. A GPU-backed model must be served.
3. Long-running interactive tasks cannot be chunked into batch jobs.
4. A second major client (mobile app, partner integration) needs a
   versioned, rate-limited, API-keyed public API.
5. Business logic outgrows route handlers and needs its own independently
   deployed, tested service.
6. Team growth requires independent frontend/backend release cycles.

Thanks to §5, migrating then is incremental: point `lib/data/` at FastAPI
endpoint by endpoint.

---

## 9. Future evolution

```
Phase 1  MVP            curated listings, admin moderation        ← now
Phase 2  Aggregation    nightly Python scrapers (GitHub Actions)
                        extraction → cleaning → classification
                        (LLM/local model) → pgvector dedup
                        → rows land as "pending" for human review
Phase 3  Users          auth, saved searches, deadline digests
                        (Supabase Auth + Edge Functions/pg_cron)
Phase 4  Intelligence   recommendation embeddings computed offline,
                        served as ordinary SQL-backed queries
Phase 5  Platform       only if a §8 trigger fires: FastAPI service
                        alongside Next.js, strangler-migrated
```

Future pipeline code will live in a top-level `pipeline/` directory
(Python, its own virtualenv, not installed yet).

---

## 10. Web-first today; mobile-ready tomorrow

TechOpportunity Tanzania is built as a **responsive website**, not a native
mobile application. One Next.js codebase serves every screen size through
CSS-based responsiveness (Tailwind breakpoints). No React Native, Expo,
Flutter, or mobile build tooling belongs in this project, and none should be
added unless a dedicated native app is actually decided on later.

If that decision ever happens, the architecture already supports it:

```
Next.js Website ──────┐
                      ├── Supabase PostgreSQL (+ Auth, Storage, RLS)
Future Mobile App ────┘
```

A future mobile app would **not** talk to the Next.js pages at all. It
would use the official Supabase client libraries (Android / iOS /
React Native) to reach the same PostgreSQL database, the same
authentication, and the same file storage — with exactly the same
Row Level Security rules deciding what it may read or write.
The "backend" is Supabase itself, so new clients attach to it without
rebuilding it.

Three habits keep this door open:

1. **Permissions live in the database (RLS)**, not in website code — every
   future client inherits them automatically.
2. **Domain types (`lib/types.ts`) stay framework-free** — they describe
   data, not UI, so they can be mirrored in any language or platform.
3. **All data access flows through `lib/data/`** — if a mobile client one
   day needs aggregated endpoints Postgres cannot express efficiently,
   that is precisely FastAPI trigger #4 (§8), and §5 makes the migration
   incremental.

---

## 11. Planned feature: locations & maps

Status: **designed, not implemented.** No map SDK, no API keys, no browser
geolocation permission requests exist yet — and none should be added until
this feature is actually built.

### Data model (already reflected in `lib/types.ts`)

Every opportunity carries one structured, fully optional location:

| Field | Type | Purpose |
|---|---|---|
| `venueName` | string \| null | Display name, e.g. "Costech Building" |
| `address` | string \| null | Street-level address |
| `city` | string \| null | Filter target |
| `region` | string \| null | Tanzanian region; filter target |
| `country` | string | Defaults to Tanzania for this platform |
| `latitude` | number \| null | WGS84 decimal degrees |
| `longitude` | number \| null | Paired with latitude |

`location` itself is `null` for online events or records that have not been
geocoded yet. Coordinates are stored as plain WGS84 decimal degrees:
every mapping provider consumes them, and none of them owns them.

### How each future capability will be served

1. **Map on an opportunity's detail page** → render its lat/lng through a
   map adapter (candidate providers: Leaflet/OpenStreetMap, Mapbox, Google
   Maps — decided at build time).
2. **"Get Directions"** → build a universal deep link from the coordinates
   (Google Maps / Apple Maps / OSM direction URLs). Works with zero API
   keys and zero SDKs.
3. **Filter by location** → plain indexed `city`/`region` columns queried
   through `lib/data/`.
4. **"Near me"** → Supabase's PostGIS extension on PostgreSQL (included in
   the platform ⚠️ verify availability when we connect): a geography point
   plus radius queries (`ST_DWithin`). The browser geolocation prompt and
   its privacy notice get added only then.
5. **Multiple opportunities on one map** → same single listing query;
   pins rendered client-side.

### Abstraction rule (anti-lock-in)

Store only neutral primitives — never provider IDs, embed codes, or
provider-specific formats. When map UI is built, all provider-specific code
lives behind a single adapter module (future `components/maps/`) exposing
exactly two operations: *render coordinates* and *build a directions URL*.
Swapping providers later touches one file.

Geocoding (turning venue/address text into coordinates) will happen
**offline** in the Phase-2 Python pipeline during ingestion — never inside
page requests.

---

## 12. Decision log

| Date | Decision | Reason |
|---|---|---|
| 2026-08-25 | Architecture A (Next.js + Supabase) over B (separate FastAPI) | No MVP requirement needs a second backend; A reaches users fastest and migrates cheaply |
| 2026-08-25 | Keep folder name `events finder`; npm package named `techopportunity-tanzania` | Owner's choice of folder name; npm requires valid package names |
| 2026-08-25 | Data access restricted to `lib/data/` | Enables future FastAPI swap without frontend rewrite |
| 2026-08-25 | Tailwind CSS v4 included from starter | Styling foundation ships with create-next-app; avoids ad-hoc CSS decisions later |
| 2026-08-25 | No Supabase SDK installed yet | Dependency added only when the staging project exists |
| 2026-08-25 | Web-first confirmed: responsive website only; no native-mobile frameworks | Owner direction; responsive Tailwind UI covers all devices; a future mobile app would reuse Supabase directly (§10) |
| 2026-08-25 | Temporary sample records isolated in `lib/data/mock-opportunities.ts` | Verifies list rendering before the DB exists; mocks never mix with the real data layer and vanish when Supabase connects |
| 2026-08-25 | Location modeled as structured nullable `OpportunityLocation` (venue/address/city/region/country/lat/lng), replacing a flat string | Supports maps, directions, filtering and near-me without schema churn once the database exists; online events simply have `location: null` |
| 2026-08-25 | Mapping provider abstracted away: only raw coordinates + address parts are stored; rendering deferred behind a single future adapter | Avoids lock-in to Google Maps/Mapbox/etc.; no SDKs or API keys until the feature is built |
| 2026-08-25 | RLS hardening: `(select is_staff())` initplan wrapping and explicit `to anon/authenticated` role targets | Standard Postgres performance practice; makes each policy's audience explicit without changing logic |
| 2026-08-26 | Connected to `tto-staging`; reads use ONLY the anon key through `lib/data/` | RLS stays authoritative for public reads; service-role key remains unwired until a trusted server-side need exists |
| 2026-08-26 | Home page uses ISR (`revalidate = 60`) | Discovered during verification: Next reused the cached prerender, serving listings that ignored new database rows; revalidation keeps public pages fresh within 60s without per-request DB load |
