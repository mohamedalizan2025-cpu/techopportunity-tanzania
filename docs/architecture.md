# TechOpportunity Tanzania — Architecture

Status: **Operational MVP + discovery pipeline + AI scaffold** · Last updated: 2026-08-29

This document explains *how the system is put together and why*. It is written
for a student learning software architecture — implementation details live in
the code; this file explains the decisions behind it. It is the authoritative
source of truth for future coding agents; §12 records the architecture-
hardening decisions from the 2026-08-29 audit.

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
Android/iOS application; §10a explains how a future native client could
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
| What about a future mobile app? | It would connect to the *same* Supabase database, auth, and storage via official Supabase mobile SDKs — no backend rebuild needed. See §10a. |

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

Batch work entered the stack as **TypeScript, not Python** — the scheduled
discovery jobs (`scripts/discovery/`, run via `tsx` by GitHub Actions)
write straight into Postgres and keep the whole stack in one language.
The decision log (§13) records this supersession. Batch scripts are the
natural shape of data work and require no HTTP service.

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

## 9. Automatic opportunity discovery (implemented)

The product keeps the same moderation-first flow:

```
approved external sources  →  discovery worker  →  normalize
                                  ↓
                               deduplicate
                                  ↓
                              insert as pending
                                  ↓
                          existing moderation queue
                                  ↓
                        moderator approves/rejects
                                  ↓
                           published opportunities
```

Current implementation state: the worker is TypeScript
(`scripts/discovery/`), scheduled daily by `.github/workflows/discovery.yml`
(cron + manual dispatch). Extraction runs through a small **source-adapter
registry** (`scripts/discovery/adapters.ts`): an ordered list of pure
extractor functions (JSON-LD, RSS, Atom, HTML) with a separate feed-family
list; the runner, the dry-run tool and the tests all share this single
extraction path. Advertised feeds (`<link rel="alternate">`, max 2 per
source) and bounded one-hop roundup expansion are harvested with
failure isolation per source and per feed. Each run emits one structured
JSON summary with per-source results (candidates found, noise rejected,
duplicates, inserts, errors, duration) so a historical run can be
diagnosed from the CI log alone.

**Invariant — one row, one opportunity.** One database row represents one
actionable opportunity. A page/feed/post containing many opportunities is
decomposed into individual candidates (roundup expansion); each inner
candidate points back at its parent page through `source_url`. When
decomposition finds nothing reliable, the parent REMAINS a pending
candidate — multi-opportunity content is never silently discarded; it
reaches the human moderator instead. Formalized in
`extract.ts → roundupInnerCandidates()`, covered by fixture tests.

Important constraints:

- The discovery worker never publishes directly.
- Every discovered row enters `status = 'pending'` until a moderator reviews it.
- The source registry is an allow-list. The workflow only fetches `active = true` sources.
- A minimal relational provenance model is used instead of embedding metadata into the description.
- The current database design already rewards this pattern because published reads are restricted via RLS and moderation remains staff-only.

### Source registry

The first discovery implementation adds an allow-list registry and provenance fields:

- `public.opportunity_sources`
- `opportunities.source_id`
- `opportunities.discovered_at`
- `opportunities.discovery_method`

This lets the moderator answer: where did this come from and when was it discovered?

### Scheduler

The free, lowest-complexity scheduler is GitHub Actions. A daily cron job runs a Node-based discovery worker that fetches approved sources, normalizes candidates, deduplicates them, and inserts only pending records.

### Security model

- fetched HTML is treated as untrusted input
- no service-role key is used in browser code or Next.js public env
- any privileged workflow credential lives only in GitHub Actions secrets
- discovered rows cannot become published without a moderator decision
- candidate inserts run through the **anon client**, so the RLS INSERT
  policy (`status='pending'`, `submitted_by` null-or-own) constrains even
  the pipeline; the service-role key is used only for registry reads,
  source-health updates and the gated enrichment tool
- fetched URLs are validated to http/https; the safe-acquisition policy in
  §12 (robots/terms, no protection bypass, SSRF guards) governs any future
  expansion beyond the owner-vetted registry

### Cost

This MVP stays at $0/month if we avoid paid APIs, paid scrapers, and paid LLM services. The system is intentionally bounded to small approved public sources and deterministic parsing.

---

## 10. Future evolution

```
Phase 1  MVP            curated listings, admin moderation        ← done
Phase 2  Aggregation    nightly discovery jobs (GitHub Actions)   ← done
                        extraction → dedup → pending review
Phase 3  Users          auth, saved searches, deadline digests
                        (Supabase Auth + Edge Functions/pg_cron)
Phase 4  Intelligence   recommendation embeddings computed offline,
                        served as ordinary SQL-backed queries
Phase 5  Platform       only if a §8 trigger fires: FastAPI service
                        alongside Next.js, strangler-migrated
```

Batch pipeline code lives in `scripts/discovery/` (TypeScript, run via
`tsx`). The earlier plan of a top-level `pipeline/` Python directory was
superseded by the one-language decision (§13 decision log).

---

## 10a. Web-first today; mobile-ready tomorrow

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
| `country` | string \| null | Physical location country. No evidence = no country (NULL); the Tanzania default was removed (§12.10). Migration 0008 (OWNER GATE) drops the legacy DB default + NOT NULL |
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

## 12. Architecture hardening decisions (2026-08-29 audit)

A full-repository architecture audit was performed on 2026-08-29 (read-only
code review + green verification of typecheck, lint and all three test
suites). Verdict: **targeted hardening, not restructuring**. The
foundations — RLS-authoritative security, moderation-first publishing,
centralized `lib/data/`, immutable provenance, strict assistant query-plan
boundary — are sound and unchanged. The following additions are recorded
here so future agents implement them consistently. None of them were
implemented in code during the audit; items marked OWNER GATE need an
explicit owner decision (usually a small additive migration) first.

### 12.1 Opportunity-vs-news disposition (no silent deletion, ever)

- The dominant noise path is the HTML heading extractor on institutional
  news pages (most discovered rows land in `other`). The exact-match
  section-label gate stays as-is: it is deterministic and provably
  loss-free for real opportunities.
- Before any major source expansion, add a **deterministic, non-deleting
  relevance signal** (e.g. a computed `relevance_hint` column derived from
  category inference strength + extractor type + source type). It must
  only reorder/label the moderation queue — never drop, delete or
  auto-reject candidates. Ambiguity always reaches a human.
- The moderation queue needs pagination + filter affordances (at minimum
  by category and discovery method) before the pending queue grows much
  beyond its current size.
- The public AI boundary (`isNonOpportunityQuery`) already keeps the
  assistant opportunity-first and stays unchanged.

### 12.2 Location vs eligibility (international opportunities)

- LOCATION (venue/city/region/country) and ELIGIBILITY (who may apply)
  are distinct concepts and must never be merged. "Located in Tanzania"
  is not "open to Tanzanians"; "online" is not "open to Tanzanians".
- Discovery must stop defaulting `country` to "Tanzania" when there is no
  evidence — country stays Tanzania only when the source registry or the
  extracted evidence says so. Aggregator feeds (Africa-wide scope) make
  this mandatory, not optional.
- The moderator review form currently cannot correct `country`; adding it
  to the review parser/form is a small prerequisite for international
  ingestion (OWNER GATE).
- Eligibility has a designed (NOT applied) schema — migration
  `0005_eligibility_scope.sql`, revised in the corrective pass (§12.9):
  `eligibility` ∈ {`unknown`, `tanzanians_eligible`,
  `tanzanians_not_eligible`} plus `eligibility_evidence` (required for
  any non-unknown value). Broader geographic scope lives inside the
  evidence text, not in an enum. Discovery never writes it; only
  moderators do, from explicit on-page evidence. Eligibility must never
  be inferred from organizer country, opportunity location, source
  domain, university name, URL structure, or the word "international".

### 12.3 Provenance completion (OWNER GATE)

Current provenance answers "where did we find it" (source_id, source_url,
discovered_at, discovery_method) and "what did moderators change"
(`opportunity_enrichments`). It does NOT yet answer "who approved/rejected
this and when". Smallest justified addition: `decided_by uuid` +
`decided_at timestamptz` on `opportunities`, written by the moderation
action — one additive migration, no RLS change needed beyond existing
staff policies. Dedupe across sources remains URL-exact; cross-source
title similarity is a documented later step, not now.

### 12.4 Observability minimum

Console logging + per-source health columns (`last_checked_at`,
`last_error`) are the current floor. Before AI activation or broad source
expansion, persist a lightweight per-run summary (candidates found,
duplicates skipped, errors) — either a small `discovery_runs` table
(OWNER GATE) or a committed CI artifact. No paid observability stack.

### 12.5 Safe acquisition policy (binding for all future discovery)

- Sources enter only through the staff-managed allow-list registry.
- No authentication bypass, no CAPTCHA solving, no anti-bot evasion,
  no paywall circumvention, no private/social-content collection — ever.
- Before expanding beyond the owner-vetted institutional registry, the
  worker must gain: robots.txt/terms compliance checks, private/loopback
  hostname rejection (SSRF guard) in every fetch path including roundup
  expansion and the enrichment tool, and per-host politeness delays.
- Social platforms are reachable only through owner-approved official
  APIs with credentials (see `docs/DISCOVERY_CHANNELS.md` owner gates);
  scraping them is excluded by policy.

### 12.6 Scale guards (implement when the metric appears, not before)

Known, accepted bottlenecks and their triggers:

| Bottleneck | Trigger | Fix |
|---|---|---|
| `loadExistingRows()` loads the whole opportunities table for dedupe | ~10k+ total rows | DB-side dedupe (unique index on canonical URL) |
| `listPublishedOpportunities()` has no limit/pagination | ~1k+ published rows | keyset/offset pagination on home + assistant |
| `ilike %q%` search does sequential scans | ~100k rows | `tsvector` + GIN |
| Moderation queue renders all pending rows | queue > ~300 | pagination + filters (see 12.1) |
| Published rows stay visible after deadline passes | growing stale list | scheduled `expired` transition job (OWNER GATE) |

Also: the discovery CI workflow should run `npm run test:fixtures` before
executing the worker (current gap), and `DEFAULT_CATEGORY_IDS` in the
runner should stay synchronized when categories are added (it currently
lacks `admissions`).

### 12.7 Taxonomy gates (owner decisions, additive seeds like 0004)

Documented gaps versus the stated product scope: **jobs/vacancies**
(recorded earlier in `docs/DISCOVERY_CHANNELS.md`), **courses/short
courses/bootcamps** (currently folded into `workshop`), and **tenders**.
Each is an additive `categories` seed row + `lib/types.ts` entry when
approved. `other` remains the honest unknown bucket — never a dump to be
silently reclassified; legacy rows are never rewritten.

### 12.8 Targeted hardening pass (2026-08-29, second round)

A second, implementation-authorized pass formalized the extension points
below. Status legend: **implemented now** / **designed, not applied** /
**owner-gated**.

**Implemented now**

- Source-adapter registry (`scripts/discovery/adapters.ts`): extraction
  is an ordered list of pure `EvidenceExtractor` functions, not
  conditional logic in the runner. A future channel (public API,
  permitted feed, manually supplied evidence) joins by adding one
  adapter function; normalization/validation/dedupe/moderation are
  adapter-agnostic and stay untouched. Deliberately no classes, no
  plugin system, no crawler framework.
- One-row-one-opportunity invariant formalized (see §9) with fixture
  tests covering decomposition, evidence-chain backlinks and the
  keep-parent-on-failure rule.
- Derived lifecycle state (`lib/lifecycle.ts`): freshness is a pure
  function of deadline evidence + clock, never stored, never fabricated.
  ~~The first version mapped null/malformed deadlines to `rolling`; the
  corrective pass (§12.9) corrected this to `unknown` — absence of
  evidence is not evidence.~~ See §12.9 for the four-state model.
  Status (moderation dimension) and lifecycle (deadline-evidence
  dimension) are composed, not conflated. Covered by `tests/lifecycle.test.ts`.
- Structured per-source run summaries in the discovery JSON output
  (observability minimum pending the `discovery_runs` table decision).
- Aggregate `npm test` script wiring all four suites, closing the gap
  that CI could gate on.

**Designed, NOT applied (migration files in `supabase/migrations/`,
headers say so explicitly; OWNER GATE before applying any of them)**

- `0005_eligibility_scope.sql` — applicant eligibility. REVISED in the
  corrective pass (§12.9) from a geographic-scope enum to the single
  verifiable product fact: `eligibility_status` ∈ {`unknown`,
  `tanzanians_eligible`, `tanzanians_not_eligible`} +
  `eligibility_evidence`, default `unknown`, discovery never writes it,
  CHECK requires evidence for any non-unknown value. Separates WHO MAY
  APPLY from WHERE IT HAPPENS; Tanzania location is never a proxy for
  Tanzanian eligibility.
- `0006_opportunity_references.sql` — canonical-identity step: staff-
  only `opportunity_references` table attaching multiple evidence URLs
  (with source type incl. future `social`/`api`) to one moderated row,
  exactly-one-canonical partial index. No fuzzy matching, no embeddings.
- `0007_lifecycle_evidence.sql` — `last_verified_at` evidence column +
  sweep index; adds NO stored state column and never auto-deletes or
  auto-unpublishes expired records.

**Owner-gated decisions still required (documented, not scheduled)**

- Stop the `country` default + nullable country + review-form country
  field (§12.2) — prerequisite for international ingestion.
- `decided_by`/`decided_at` on opportunities (§12.3).
- `discovery_runs` persistence table (§12.4) — the structured JSON
  summary above is the interim floor.
- Queue pagination + non-deleting relevance hint (§12.1).
- Category additions: jobs/vacancies first, then courses/tenders (§12.7);
  `DEFAULT_CATEGORY_IDS` must gain `admissions` (or better, be deleted in
  favor of failing loudly when the category table is unreachable).
- CI test gate: `.github/workflows/discovery.yml` should run `npm test`
  before the worker.
- Expiry sweep semantics (§12.6): deadlines that are `unknown` (missing
  or invalid) never expire by clock; any transition job needs an owner
  decision.

**Social/public-internet extensibility (verified, nothing built)**

The core pipeline is already channel-agnostic: everything after
`EvidenceExtractor` consumes the same `RawCandidate` shape regardless of
origin (`discoveryMethod` is provenance metadata, not control flow).
A future permitted social/API channel = one adapter + one registry entry
+ an owner-approved source row; the opportunity domain, moderation and
RLS do not change. Social scraping remains excluded by §12.5 policy.

### 12.9 Targeted corrective pass (2026-08-29, third round)

A corrective pass fixed semantic errors left by the hardening round and
hardened the evidence model. Status legend as §12.8.

**Implemented now**

- Lifecycle corrected to FOUR distinct states (`lib/lifecycle.ts`):
  `active` (explicit future deadline), `expired` (explicit past
  deadline), `rolling` (reserved for EXPLICIT evidence — unreachable
  from deadline data alone until a schema field exists), `unknown`
  (deadline missing or invalid). Null or malformed deadlines derive
  `unknown`, never `rolling`: the public product no longer claims
  "Rolling" for records with no deadline evidence (home, detail,
  moderation queue and filter labels corrected).
- Evidence chain formalized: candidates carry `evidenceUrl` (the
  document testifying about the opportunity) and `referenceKind`
  (`source-base` vs `evidence-document`). Roundup parent suppression
  now matches on surviving children's evidence URLs — never on shared
  source-registry URLs — and only suppresses parents whose children
  actually survived validation+dedupe, so failed extraction can never
  silently delete a multi-opportunity document.
- Run-result yield counters (`validCandidates` = passed validation AND
  dedupe; `categorySkipped` = blocked only by a missing category seed;
  `insertedPending` = actionable yield) answer "which sources produce
  useful opportunities", not merely "which returned HTTP 200".
- One-row-one-opportunity invariant tests strengthened: evidence-
  document attribution, suppression-needs-a-survivor, all-invalid-links
  keeps the parent, duplicate inner collapse. Single implementation
  (runner + extract helpers); no logic duplicated elsewhere.

**Designed, NOT applied (OWNER GATE; migration files say so)**

- `0005_eligibility_scope.sql` — REVISED (see above): the single
  verifiable fact "may Tanzanians apply?" + evidence text. A geographic-
  scope enum was rejected because it invites guessing scopes from
  wording. Worldwide-opportunity + Tanzanian-eligibility is modeled as
  location fields (independent) + eligibility (independent); the two are
  never joined as proxies.
- `0006_opportunity_references.sql` — unchanged design, now explicitly
  documented: URL-based dedupe REMAINS the MVP identity strategy even
  after it applies; the table is the foundation for a later
  duplicate-evidence workflow, not a silent dedupe upgrade.

**Category architecture (verified, no taxonomy change)**

The domain was examined for "opportunity TYPE + ATTRIBUTES" versus a
finer flat taxonomy. Verdict: keep the flat, small, unambiguous
taxonomy. Historical `other` volume is a NEWS-vs-opportunity problem
(§12.1 gate), not a granularity problem, and no attribute data is
extracted or moderated today — attribute columns would be speculative.
`jobs`/`vacancies` remains the single justified addition and stays
owner-gated (§12.7); nothing was added silently.

**Honest limitation documented**

Multi-source identity is URL-exact only. The same opportunity reached
via different URLs from different channels becomes separate pending
rows that humans merge by rejecting duplicates; the references table
(0006) is the designed foundation for canonical identity. No semantic
matching, embeddings, or AI dedupe is planned before that human-in-the-
loop foundation exists.

### 12.10 Final hardening milestone (2026-08-29, fourth round)

The last broad pass before product implementation. Status legend as
§12.8. Every item here closes one of the four remaining structural
weaknesses; nothing speculative was added.

**Implemented now**

- **Country honesty (Priority 1).** The pipeline no longer fabricates
  `country`: `normalizeCandidate` keeps it null without structured
  evidence, the runner OMITS the column from the insert when null (so
  pre-migration the DB default still applies and post-migration the
  column stores honest NULL — production is safe regardless of when
  0008 is applied), public submissions store empty as NULL instead of
  defaulting "Tanzania", and moderators can set/verify country on the
  review form (bounded free text, worldwide scope). Legitimate existing
  values are preserved; nothing is backfilled. The moderation audit
  trail now tracks country changes (and its previous-value snapshot bug
  — flat keys read off a nested object, always NULL — was fixed).
  Covered by `tests/acquisition.test.ts` (C1–C4) and the review-parser
  country cases.
- **Explicit pagination (Priority 2).** No query depends on PostgREST's
  silent 1,000-row default anymore: discovery dedupe pages through
  existing rows (`range()` loop, 1000/page, short-page termination,
  100-page cap with a documented switch-to-DB-side-dedupe warning,
  §12.6); the moderation queue uses an explicit `.limit(500)` with an
  overflow warning; the published list uses an explicit `.limit(500)`
  shared by the browse UI and the AI assistant retrieval. No Redis,
  Kafka or new infra.
- **Acquisition security (Priority 3).** `scripts/discovery/fetch.ts`
  is the single hardened choke point every network read passes through:
  http/https only, deterministic SSRF hostname screen (loopback,
  private/link-local/reserved IPv4, private suffixes, IPv6), manual
  redirects capped at 3 hops with EVERY hop re-validated, 2 MB streaming
  body cap, 20 s per-hop timeout, typed `AcquisitionError` failure
  isolation. The screen is documented as necessary-but-not-sufficient;
  connection-level DNS-resolution checks remain the next gate before
  major source expansion (§12.5). Not a crawler framework. Covered by
  `tests/acquisition.test.ts` (A1–A4e).
- **CI safety gate (Priority 4).** `.github/workflows/discovery.yml`
  now runs install → test → typecheck → lint → discovery in that order;
  the worker only runs after every gate passes, and the Supabase
  secrets are attached ONLY to the worker step.
- **Taxonomy decision (evidence-based).** A live dry-run (18 sources,
  169 valid candidates, `other`-dominant, job-titled candidates
  present) confirmed `jobs`/`vacancies` as the one justified addition.
  Code (type, label, conservative inference for vacancy/job/ajira/
  nafasi-za-kazi ONLY — "position"/"career"/"officer" stay unmapped as
  news-noise terms) is committed with the seed migration; the runner
  now FAILS LOUDLY (skip + warn + `categorySkipped` counter) when a
  category slug has no DB row, so `jobs` candidates are safely skipped
  until the seed exists. `DEFAULT_CATEGORY_IDS` was deleted.
- **Test expansion.** 158 assertions across five suites: fixtures,
  review parser, assistant, lifecycle, acquisition.

**Designed, NOT applied (OWNER GATE; migration files say so)**

- `0008_country_evidence.sql` — drop the `country` default + NOT NULL.
  No backfill, no RLS change; existing rows keep their (mostly
  default-derived) values until moderators correct them one by one.
- `0009_moderation_attribution.sql` — `decided_by`/`decided_at` with a
  paired CHECK constraint. Companion code is deliberately NOT staged to
  write yet: writing a missing column would hard-fail every moderation
  decision, so the write starts only after application.
- `0010_jobs_category.sql` — additive `jobs` seed row (shape follows
  0004), justified by the dry-run evidence above.

**Verified boundaries (nothing built)**

- Adapter boundary re-verified: every network read funnels through
  `fetchPage`; `EvidenceChannel` knowledge stays inside
  `scripts/discovery/adapters.ts`; the opportunity domain, moderation
  and RLS remain channel-agnostic. A future permitted channel is still
  one adapter + one registry entry + an owner-approved source row.
- AI runtime remains disabled: no provider activated, no key wiring;
  the assistant stays plan-execute-ground (deterministic queries,
  explicit caps inherited from Priority 2).

### 12.11 Product Implementation Milestone 1 — opportunity discovery expansion (2026-08-29)

The hardened architecture (§12.1–§12.10) served as a GUARDRAIL, not a
redesign target: no broad audit, no structural change, no broken
protections. Every conclusion below was derived from the real database
and live probes, not from prior reports.

**Measured baseline (read-only, `scripts/discovery/analyze-baseline.ts`)**

- 185 rows: 170 pending / 10 published / 5 rejected; 0 duplicate URLs.
- Category quality: `other` = 160 of 185 — institutional sources
  dominate with news-shaped rows; deadline coverage ~3%, region ~2%,
  organizer ~1%.
- Every row carries `country = "Tanzania"` from the pre-0008 DB
  default; new pipeline rows omit the column (honest NULL after 0008).
- Published set contains leftover test rows (moderation-hygiene item).

**Findings disposition (implement B only, per the milestone mandate)**

- **B (fixed now):** raw HTML entities in RSS titles → deterministic
  decoder in `normalize.ts`; opaque humanized slugs ("jobdetail.ftl…",
  "detailoffre…") as roundup titles → readability rule in `extract.ts`;
  bare-URL titles → validation guard; five observed navigation labels →
  exact-match noise gate additions. All four are test-covered
  (fixtures 93/93).
- **A (kept):** adapter boundary, one-row-one-opportunity, pending-only
  inserts, exact-match noise semantics, runner funnel counters
  (`noiseRejected`/`validCandidates`/`categorySkipped`/
  `insertedPending`) — measured adequate, no metrics platform added.
- **C (documented, deferred):** relevance rejection heuristics
  (no deterministic rule justified without dropping real aggregator
  opportunities — noise gate already covers every deterministic class),
  tenders category (no evidence in queue), worldwide display polish.
- **D (owner gate, unchanged):** migrations 0008/0009/0010 remain
  designed but NOT applied.

**Expansion verdict (quality over volume)**

Zero new sources added and none reactivated: every probed candidate
(NACTE, TCU, COSTECH, DAAD, Chevening, AfterSchoolAfrica, YouthOp)
measured as 0–junk actionable yield or unreachable (§DISCOVERY_CHANNELS,
measured-baseline section). The binding constraint is moderator
throughput (170 pending), not discovery volume.

**Boundaries re-verified (nothing built)**

- Relevance: conservative deterministic signals only; no embeddings,
  vector DB, LLM classification or opaque scoring introduced.
- Roundup: one-hop, bounded, `evidenceUrl` preserved, generic titles
  rejected (readability rule).
- Worldwide honesty: country stays evidence-driven; eligibility and
  location remain separate dimensions.
- Moderation: discovery never publishes, infers approval or fabricates;
  AI runtime still disabled (no credentials configured).

### 12.12 Product Implementation Milestone 2 — data integrity + moderation throughput (2026-08-29)

Every prior-report claim was re-verified against the LIVE database this
milestone (`scripts/discovery/inspect-live.ts`, read-only except one
reversible probe row that was deleted in the same run). Findings that
contradicted earlier reports are stated plainly below.

**Live schema truth (probed, not assumed)**

- Applied: 0001, 0002, 0003 (behaviour-verified: `opportunity_sources`
  discovery columns present; `opportunity_enrichments` table exists,
  0 rows).
- NOT applied: **0004** (no `admissions` seed row), 0005, 0006, 0007,
  **0008**, 0009, **0010** (no `jobs` seed row) — each verified by
  column/table absence or seed-row absence, never by filename.
- **Country honesty status is PARTIAL, not complete.** The pipeline
  omits `country` without evidence (code honest), but 0008 is unapplied,
  so the live DB still fills `default 'Tanzania'` — proven by a
  reversible INSERT probe (field omitted → stored "Tanzania" → probe
  row deleted). Until the owner applies 0008, every discovery row
  without country evidence carries the fabricated default. Migrations
  0004–0010 remain OWNER-GATED; nothing was applied autonomously.
- Consequence measured: `admissions`/`jobs` candidates are SKIPPED by
  the runner (loud warn + `categorySkipped` counter) — a live dry-run
  this milestone produced 4 admissions + 3 jobs candidates that would
  be dropped, not mis-inserted. Nothing crashes; the loss is bounded
  and visible in run summaries.

**Measured baseline (same as Milestone 1 day, re-confirmed)**

185 rows (170 pending / 10 published / 5 rejected). Categories via
`category_id`: other=160, fellowship=7, scholarship=6, grant=3,
competition=3, hackathon=2, internship=2, conference=2. Coverage:
deadline 5, city 5, region 3, venue 3, organization_id 2; country
"Tanzania" ×185 (default-derived). Duplicates: 1 test-URL pair only;
duplicate TITLES are section-label junk ("quick links" ×4) from
pre-noise-gate runs. Audit trail: 0 rows. Heuristic queue classes
(signals, NOT truth): ~18 action-like, ~4 news-like, ~148 ambiguous.

**Findings disposition (implement B only)**

- **B (fixed now): moderation next-item navigation.** After a decision
  the success panel links straight to the next pending row in rendered
  queue order (`nextPendingAfter` pure selector, unit-tested; queue
  gains a deterministic id tie-break). No status change, no heuristic
  decision, no bulk action — human review remains the publication
  boundary; the fix removes one queue round-trip per item.
- **A (kept):** pending-only discovery, RLS staff boundary, exact-match
  noise gate, runner loud-skip on missing seeds, evidence chain,
  lifecycle derivation, assistant disabled-by-default.
- **C (deferred with measurement):** Phase 6 relevance HINT — on the
  real queue only ~18/170 titles carry a reliable action signal; the
  148-row ambiguous majority cannot be hinted without an opaque
  classifier, which the milestone forbids. Deferred; no storage change.
  Also deferred: queue pagination (queue 170 < 500 cap), bulk rejection
  (no safe authorization model without 0009 attribution).
- **D (owner gate, prepared, verified):** 0004 + 0010 are the
  highest-value owner actions — their absence silently drops every
  admissions/jobs candidate (7 measured this run). 0008 next (country
  honesty completion). 0009 then 0006/0005/0007 later. Files verified
  idempotent and architecture-compatible; code already assumes nothing
  beyond what exists.

**Boundaries re-verified (nothing built)**

No new sources (backlog is the bottleneck; Milestone 1 probes already
measured every shortlisted worldwide candidate as junk/unreachable).
AI runtime stays disabled — no `ASSISTANT_*` variable exists in the
environment template or locally; provider module still throws until a
legitimate credential lands. No DDL applied; no embeddings; no
automatic publication or rejection.

### 12.13 Milestone 3 — migration day + backlog triage + discovery recovery (2026-08-29)

Milestone 3 re-probed the live database first (`inspect-live.ts`).
Result: **no owner migration has been applied since the checkpoint** —
0004, 0008, 0009, 0010 all still unapplied (behavior probes: missing
seeds, missing `decided_by`/`decided_at`, reversible INSERT still
stores `country = 'Tanzania'`). Counts unchanged: 170 pending /
10 published / 5 rejected.

**What this milestone delivered despite the closed gate**

- Migration files 0004/0008/0009/0010 re-validated against the current
  architecture: additive, idempotent (`on conflict do nothing`), no RLS
  change, no backfill, no ordering hazards; exact owner actions are
  recorded in `docs/NEXT_SESSION_HANDOFF.md` §H.
- `scripts/discovery/triage-queue.ts` — new read-only operational tool
  that prints the 170-row pending queue in the milestone's priority
  order (buckets 1–8). Measured split: 20 actionable-looking
  (heuristic), 13 scholarship/fellowship/grant/internship,
  0 jobs, 0 admissions (seeds absent), 2 competition, 2
  conference/tech-event, 127 ambiguous, 6 news-looking. Buckets 1 and 8
  are labeled heuristic signals, never truth; the moderator remains the
  authority.
- Test-artifact census (Phase 7): 5 of the 10 published rows are
  manual test rows (`regression-alpha`, `regression-bravo`, `hackkka`,
  `hack`, `production-link-test-delete-me`). Identified, NOT deleted —
  removal is a moderator rejection or owner decision.
- Discovery BEFORE/AFTER measured honestly: dry-run (18 sources)
  yields 122 valid candidates, 28 noise-filtered, 4 fetch failures
  (ICT Commission, NM-AIST, UDSM, UDOM unreachable this run). Skipped
  candidates: admissions 4 (DIT 2, VETA 2) + jobs 1 (YUNA) = 5. Since
  no migration was applied, AFTER = BEFORE: **0 opportunities
  recovered**; recovery is blocked exactly at the owner gate.
- Quality evidence: real actionable candidates exist in the pending
  pool (DIT/VETA admission calls, ERASMUS+ nominations, KPMG graduate
  programme, funded fellowships), but the majority of institutional
  site output remains navigation/institutional junk that survives the
  noise gate — the queue, not discovery volume, is still the binding
  constraint.

**Production re-probed**: home/search/category (admissions + jobs +
scholarship)/region filters 200; admissions and jobs filters render
the honest empty state ("Nothing found"); published detail 200;
pending detail 404; `/moderation` 307 → login; assistant GET 405,
POST `{"mode":"disabled"}`. Security reconfirmed: anon sees 0
non-published rows, 0 registry rows, 0 audit rows, and anon writes are
filtered to nothing; service role remains confined to `scripts/`.

**Stopped at the true owner boundary.** Exact owner action: in the
Supabase SQL editor, apply in order `0004_admissions_category.sql`,
`0010_jobs_category.sql`, `0008_country_evidence.sql`,
`0009_moderation_attribution.sql` (each file is self-contained and
idempotent), then re-run discovery and moderate the triage order.

---

### 12.14 Milestone 4 — owner migration activation attempt (2026-08-29)

Milestone 4 ("Owner Migration Activation + Live Recovery Verification")
re-probed the live database before doing anything else (`inspect-live.ts`).
Result, measured from live behavior — NOT filenames:

- 0004 admissions: seed row ABSENT from live `categories` (10 seeds).
- 0010 jobs: seed row ABSENT.
- 0008 country: reversible INSERT probe with `country` omitted still
  stores `'Tanzania'` — the 0001 default remains live (probe row deleted).
- 0009 attribution: `decided_by`/`decided_at` both ABSENT (PostgREST
  column errors).
- 0005/0006/0007: all still absent, as expected.
- Counts unchanged: 170 pending / 10 published / 5 rejected; all 185
  rows still carry `country = 'Tanzania'` from the default.

**Conclusion: no owner action has occurred since Milestone 3.** The
milestone's activation phases (category recovery test, live discovery
run, country-integrity verification, moderation-attribution trial) are
all conditional on live migrations and therefore could NOT execute.
Per the operating rule "do not apply DDL without owner authorization",
the milestone STOPPED at the same owner boundary; the owner action is
byte-for-byte unchanged from §12.13.

**Locally-safe verification performed anyway:**

- Full battery re-run: 176/176 tests, eslint clean, `tsc --noEmit`
  clean, production build clean.
- Production re-probed: home + category=admissions/jobs/scholarship/
  hackathon + region + deadline filters all 200; admissions and jobs
  render the honest empty state ("Nothing found"); published detail
  200; pending detail 404; `/moderation` 307 → login; assistant POST
  `{"mode":"disabled"}`.
- Phase 10 honest answer: BEFORE = AFTER again. No material
  improvement was possible because nothing was activated; the measured
  cost remains 5 skipped candidates/run (4 admissions + 1 jobs).
- 0005/0006/0007 re-assessment: no new product evidence justifies
  them; they stay owner-gated and unapplied. AI remains disabled
  (no provider credential).
- Git: `github.com` remained unreachable from this machine (push of
  the two Milestone 3 commits still blocked; local state safe, no
  history rewrite, no force-push, no duplicate commits).

---

### 12.15 Milestone 7 — opportunity-first product implementation (2026-08-29)

Milestone 7 deliberately moved past the migration audit loop (owner
gates 0004/0010/0008/0009 remain open and unchanged) and implemented
product UX work that does NOT depend on them. Architecture untouched;
score holds at 9.7/10.

**What shipped**

- Opportunity-first homepage: hero now says "Find opportunities you can
  apply for"; new "Browse by type" hub and "By deadline" quick links
  give one-click discovery of type and urgency before the refinement
  filters; the assistant panel sits below the discovery surface.
- Live taxonomy mechanism (`lib/data/categories.ts`): the category hub
  renders ONLY categories with a seeded row in the live `categories`
  table (world-readable, anon client, read-only). Live probe: 10
  categories resolve; `admissions`/`jobs` are correctly absent and will
  appear automatically when 0004/0010 land — no hardcoded claim of an
  absent category survives in the UI.
- Country honesty gate (`lib/opportunity-presentation.ts`): while 0008
  is unapplied, every stored country value is the unverified schema
  default, so public cards and detail pages no longer render country at
  all. Unknown fields stay neutral ("Location not specified", no
  placeholder noise). Reintroduction point is a single function once
  evidence exists.
- Cards: category label promoted to a visible badge; meta line shows
  organizer + recorded place only when verified.
- Assistant shell copy now states its boundary ("Searches published
  opportunities only — it never invents results or shows unpublished
  records"). No provider change; still disabled in production.
- Search/filter internals untouched: same `listPublishedOpportunities()`
  path shared by browse UI and assistant; no second search engine.

**Verification**: battery grew to 188/188 (12 new presentation-honesty
tests), eslint + `tsc --noEmit` clean. `next build` remains
ENVIRONMENT-BLOCKED on this machine (Turbopack pooled-process spawn
"Access is denied", os error 5 — identical to Milestones 5–6, zero code
involvement, classified not redesigned). Production probes (current
deployment): home/category/deadline/region/search filters 200;
published detail 200; pending detail 404; `/moderation` 307; assistant
POST `{"mode":"disabled"}`; homepage HTML contains zero card meta
lines claiming country "Tanzania" (hits were brand + Zanzibar region).

**Not changed (deliberately)**: moderation, data-access architecture,
RLS, assistant provider boundary, database semantics, news policy
(pending rows stay invisible until moderated — no classifier, no news
table). GitHub push still network-blocked (5th session); local history
intact.

---

### 12.16 Milestone 8 — discovery sync reliability + taxonomy consistency (2026-08-29)

Milestone 8 is an operational-reliability pass, not a redesign. Owner
migration gates (0004/0010/0008/0009) remain open and unchanged; no DDL
applied, no GitHub secret created or modified, no failure signal
suppressed. Architecture untouched; score holds at 9.7/10.

**The three issues and what was done**

1. *Unpushed commits.* Five local commits (6f2d12e…c544477) still cannot
   reach `origin/main`: github.com and api.github.com both fail to
   connect (~21s timeout) — 7th consecutive session. No force-push, no
   history rewrite, no duplicate commits. Recovery remains a single
   `git push origin main` once connectivity returns.
2. *Failing "Discovery sync" scheduled runs.* Root cause is
   **unverifiable from this environment and is reported as such**: no
   `gh` CLI is installed, and every GitHub endpoint is unreachable, so
   no run log could be fetched (classification **I — logs unavailable**).
   What the static + reproducible evidence rules in/out: the workflow
   YAML is valid and the env contract matches exactly (all three names
   identical across workflow, `.env.example` and the runner); the
   discovery code reproduces green locally; and the ~28s failure
   duration places any real fault in the checkout → setup-node →
   `npm ci` window (locally `npm ci` alone ran ~3 min), i.e. before any
   test/typecheck/lint/discovery step — pointing at a dependency,
   runtime or Actions-infra cause (C/D/H), never at discovery logic.
3. *Submit taxonomy exposure.* Proven defect: the submission form
   rendered all 12 static categories including unseeded
   `admissions`/`jobs`, so a user could pick a category that the live
   DB then rejects. Fix: the form now renders from
   `listLiveCategories()` — the same live-taxonomy source as the
   homepage hub — via a prop, contract-tested. When 0004/0010 land the
   options appear automatically with no frontend change.

**Fixes shipped (smallest safe)**

- Whole-run health gate (`scripts/discovery/index.ts`): individual
  source/feed/roundup failures stay isolated and the run exits 0, but
  when EVERY checked source errors the scheduled run now exits non-zero
  instead of going silently green. Partial runs keep their designed
  isolation. No `|| true`, no `continue-on-error`.
- `timeout-minutes: 30` on the `discover` job so a zombie run cannot
  occupy the daily cron slot.
- Submit form live taxonomy + `tests/submit-taxonomy.test.ts` (6
  contract tests: unseeded excluded, seeded auto-appear, every offered
  option passes `validateSubmission`, options ⊆ accepted taxonomy,
  order preserved, unknown slug rejected).

**Worker validation (local, exact CI command).** A full discovery run
reproduced the scheduled job end-to-end: 18 sources checked, 14 ok, 4
fetch errors (ICT Commission, NM-AIST, UDSM, UDOM — isolated, did not
abort the run), 165 candidates → 28 valid → 28 inserted pending, 108
duplicates skipped, 0 categorySkipped. Data behavior is consistent; the
4 errored sources confirm the isolation path holds under real failure.

**Verification**: battery grew to 194/194 (6 new submit-taxonomy
tests), eslint + `tsc --noEmit` clean. `next build` remains
ENVIRONMENT-BLOCKED on this machine (Turbopack pooled-process spawn
"Access is denied", os error 5 — identical to Milestones 5–7, zero code
involvement, classified not redesigned). CI gates on test/tsc/lint, not
`next build`, so this does not affect the workflow.

**Deployment truth.** Production was probed and is the PRE-Milestone-7
build: the homepage still renders static "Admissions & Programmes" and
"Jobs & Vacancies" chips, the old hero/filters, and an enabled assistant
form. Because the M7 commits never reached `origin/main` and Vercel
deploys from origin, **Milestone 7 is NOT production-deployed**. It
becomes verifiable only after connectivity returns and the push +
deploy complete.

**Not changed (deliberately)**: per-source isolation model, pending-only
discovery, moderation authority, RLS, anon-only public reads, assistant
kill switch (disabled), migration state. GitHub push still
network-blocked (7th session).

---

### 12.17 Milestone 9 — GitHub Discovery Sync forensics + operational recovery (2026-08-30)

Milestone 9 is an operational-reliability investigation with hard
GitHub-side evidence, not an architecture audit. GitHub became reachable
from this environment for the first time in nine sessions; the push
backlog (11 commits) landed on `origin/main` and the actual failing run
was read, reproduced bit-for-bit, and fixed. Architecture untouched;
score holds at 9.7/10.

**Incident evidence (read-only GitHub REST, unauthenticated, public repo)**

- Run `33302411277` ("Discovery sync", run #3, event `schedule`,
  `head_sha ed13afe565a…`), created 2026-08-30T08:46:26Z, conclusion
  `failure`. Job `discover` ran 08:46:30Z → 08:46:55Z (≈25s, matching
  the notification email exactly).
- Step timeline from the jobs API: Set up job ✓ (1s), Checkout ✓ (1s),
  Setup Node ✓ (5s), Install dependencies ✓ (9s), Run tests ✓ (3s),
  **Typecheck ✗ (4s)**, Lint skipped, Run discovery worker skipped.
- Check-run annotations (3): the Node.js-20 action deprecation warning,
  `Process completed with exit code 2`, and the actual error —
  `app/layout.tsx:22:50 — Cannot find name 'LayoutProps'.`
- Context: runs #1 (`f1a8c21`) and #2 (`ed13afe`, identical step
  signature) failed the same way; discovery has never executed in CI.

**Root cause (classification B — application-code defect caught by the
typecheck gate, exactly as designed)**

`RootLayout` was typed `LayoutProps<"/">` — a global declared only by
`.next/types/routes.d.ts` (imported via `next-env.d.ts`). Both files
are git-ignored build artifacts: present on a developer machine after
any `next dev`/`build` (so local `tsc` passed, reinforced by a stale
`tsconfig.tsbuildinfo`), absent on a fresh CI checkout (so `tsc`
failed). The 25s duration was never the diagnostic — the annotations
were.

Reproduced bit-for-bit locally by moving `.next` aside and restoring
the `ed13afe` file: identical file, line 22, column 50, message
TS2304, exit code 2. After the fix, the same fresh-checkout typecheck
passes.

**Fixes shipped (smallest safe)**

- `app/layout.tsx`: explicit local `RootLayoutProps` interface instead
  of the build-generated global. No behavior change.
- `.github/workflows/discovery.yml`: `actions/checkout@v5` /
  `actions/setup-node@v5` and Node 22, resolving the run's Node.js-20
  deprecation annotation (Node 20 is EOL). Steps, commands, secrets
  attachment and `timeout-minutes` unchanged.
- `tsconfig.ci-check.json`: diagnostic tsconfig excluding `.next` with
  incremental disabled, so the fresh-checkout typecheck can be
  reproduced locally (full fidelity requires `.next` moved aside).

**Recovery + validation**

- Push succeeded (`ed13afe..75fbc39`): all 11 commits now on
  `origin/main`; local and remote are in sync. Pre-push L3 deep
  security review: 0 findings.
- Local battery: 194/194 tests, lint clean, `tsc --noEmit` clean,
  fresh-checkout typecheck clean. `next build` remains
  ENVIRONMENT-BLOCKED (Turbopack os error 5 — identical to Milestones
  5–8, machine-level, classified not redesigned). CI does not gate on
  `next build`.
- Discovery worker validation (exact CI command, once): 18/18 sources
  ok, 0 errors, 215 candidates, 177 duplicates skipped, 0 new pending
  inserts, ~49s wall time — well inside the 30-minute bound.
- Database correlation: in runs #1–#3 the `discover` step never
  started, so those runs wrote zero rows by design (the secrets-bearing
  step is last). No partial writes, no timestamp updates, queue
  unchanged — confirmed by pipeline ordering, not assumed.
- Env/secret contract: all three names identical across workflow,
  `.env.example` and `runner.ts`; the worker fails loudly when absent.
- Production (probed pre-push): healthy, still the PRE-Milestone-7
  build; `/moderation` still routes through staff sign-in. Vercel
  deploys from `origin/main`, so M7–M9 become live when its redeploy
  completes.

**Not yet provable (honest gate)**: a green workflow run on GitHub.
Pushes do not trigger `Discovery sync` (schedule + `workflow_dispatch`
only) and no credential exists here to dispatch. Proof arrives at the
next cron (03:00 UTC) or via one owner click on "Run workflow".

**Not changed (deliberately)**: pending-only discovery, moderation
authority, RLS, provenance immutability, adapter boundary, roundup
decomposition, source-failure isolation, assistant kill switch,
migration state. No `|| true`, no `continue-on-error`, no failure
suppression, no secret creation/modification.

---

### 12.18 Milestone 10 — moderation throughput + opportunity quality (2026-08-30)

Milestone 10 is display-layer product work only. Architecture review
remains closed (score 9.7/10). The binding constraint is human
moderation throughput: discovery is net-zero new items (18/18 sources
ok, 215 candidates, 177 duplicates, 0 inserts), so the KPI becomes
trustworthy actionable opportunities published per unit of moderator
effort. No schema, server-action, provenance, or RLS change.

**Queue (`/moderation`) — opportunity-first entry**

- Every row carries a triage bucket badge
  (`lib/triage-bucket.ts`, one-to-one port of
  `scripts/discovery/triage-queue.ts`): category-driven buckets
  (scholarship/fellowship/grant/internship = high value, jobs,
  admissions, hackathon/competition, workshop/conference/tech-event)
  plus two starred TITLE-heuristic buckets (actionable-looking /
  news-like) with a visible honesty footnote: hints, never verdicts.
- A "start with a suggested high-value record" entry link uses
  `firstSuggestedReview` (bucket priority, stable within bucket).
  The rendered queue order and next-in-queue navigation keep their
  deterministic `created_at` ordering — the suggestion only adds an
  entry point.

**Review (`/moderation/[id]`) — evidence-first layout**

- Replaced the duplicated public `OpportunityDetail` render with a
  purpose-built layout: Source evidence section (prominent official-page
  link, discovered-from / discovered-at / submitted-by provenance) with
  an honesty note, then "as discovered" facts, then the decision form.
- `getQueueNavigation` gives position + next in ONE queue read
  ("Item X of Y" pill); not-pending records skip the queue read.
- `KnownHint` marks every enrichment field as "known from source —
  verify" or "unknown — check official page" from `defaultValue` alone.
  No value is ever inferred.
- Sticky decision bar via the HTML5 `form=` attribute keeps
  Approve/Reject in reach on long records; the success panel's
  next-record link is `autoFocus`ed for Enter-driven flow. Approve and
  reject both lead to the next pending record; queue homepage return is
  never forced.

**Category decision quality — live taxonomy honesty**

- The category select is now driven by `listReviewCategoryOptions`
  (staff read of the live `categories` table) through pure
  `reviewCategoryOptions`: slugs outside `OPPORTUNITY_CATEGORIES` are
  dropped, unseeded `admissions`/`jobs` (0004/0010 pending) are never
  offered, the record's own discovered category is always reviewable,
  and an unreadable table falls back to the record's own category only.
  When 0004/0010 land, the select adopts them automatically — no code
  change needed.

**Validation + tests**

- `parseReviewInput` / `decideOpportunityAction` audited, UNCHANGED:
  invalid values rejected, optional fields stay null, provenance never
  read from the form, reject = status-only, approve = validated write,
  double pending guard intact, best-effort enrichment audit intact.
- Battery: **223/223** (194 prior + 29 new `tests/triage-bucket.test.ts`
  contract tests covering buckets, heuristic honesty, suggestion
  stability, and taxonomy honesty), lint clean, tsc clean (standard +
  ci-check). Build attempt: known Turbopack os error 5 —
  environment-blocked, not redesigned.

**Security pass**: moderation pages remain behind
`getModerationAccess()`; zero `SERVICE_ROLE` references outside
`scripts/discovery`; no new API route, write path, env var, or external
integration; decision semantics unchanged.

---

### 12.19 Milestone 11 — real moderation experience + targeted filtering (2026-08-30)

Display-layer product pass, continuing Milestone 10. Architecture review
stays closed (9.7/10). Live re-probe replaced stale estimates: 213
total / **198 pending** / 10 published / 5 rejected (sum closes);
169/213 records (79%) carry category `other`, and five sources account
for ~half the queue — so the next real friction was bulk navigation,
not more evidence display.

**Queue view filters (server-side, URL params — no second query engine)**

- Two filters, chosen from the data: **triage bucket** (`?bucket=1..8`)
  and **source** (`?source=<name>`). They are VIEW filters over the same
  deterministic staff-only pending read (`listPendingOpportunities`):
  ordering preserved, nothing hidden from other views, always clearable
  via "All", decision logic untouched.
- `parseQueueFilter` is hostile-input-safe (whitelist `^[1-8]$`,
  trimmed/length-capped source, arrays take the first value); buckets
  come from the SAME `triageBucketOf` used by badges — no second
  scoring system.
- Counts per chip are computed from the queue; empty bucket/source
  counts are not offered.

**Filter carry-forward**

- `getQueueNavigation(id, filter)` + pure `queueNavigationFromIds`
  compute position and next WITHIN the active filter: a moderator
  clearing the news-like bucket walks 8 → 8 → 8 and hits the honest
  end of batch (no fallthrough to hidden rows). "Item X of Y in this
  filter", back-to-queue and next-record links all keep the filter.
- `DecisionForm` now receives pre-built `nextHref`/`queueHref` from the
  server instead of assembling ids itself (single source of truth for
  filter state).

**Audits (no change needed, evidence recorded)**

- Country/worldwide honesty unchanged (C1–C4 acquisition + 7/11–12
  presentation tests still hold; 0008 still owner-gated).
- Historical test data: 10 published rows include loudly-titled test
  artifacts; no moderator view lists published records, and safe
  removal is a mutation decision — left to the owner deliberately.
- AI preparation: published-only structured reads untouched; assistant
  remains disabled.

**Battery**: 253/253 tests (223 prior + 30 new
`tests/queue-filter.test.ts`), lint clean, tsc clean (standard +
ci-check). Build: known Turbopack os error 5 — environment-blocked.
GitHub Discovery sync: still runs #1–#3 (all pre-fix failures) — green
proof remains pending at the next cron/dispatch; CI fix untouched by
this milestone (no app-side type surface changed).

---

## 13. Decision log

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
| 2026-08-26 | Homepage now reads URL searchParams (category filter + sort) and therefore renders dynamically per request instead of via the ISR cache | Filters and sorting must reflect live data exactly; per-request anon reads are cheap at MVP scale; a client-side or route-handler caching layer remains a documented future optimization if traffic ever requires it. Invalid parameter values are whitelisted server-side and silently fall back to All / deadline ordering |
| 2026-08-26 | Public submissions use a Next.js Server Action that calls `validateSubmission()` and then inserts through the anon client with `status` hardcoded to `'pending'` | Server-authoritative validation; the browser can never influence status, slug, or category_id; existing RLS INSERT policy is the second enforcement layer. Anonymous users cannot create organizations, so the form offers an optional dropdown of existing organizations only — moderation staff attach new organizations later |
| 2026-08-26 | Staff auth via `@supabase/ssr` cookie sessions: request-scoped server client (`lib/data/supabase-auth.ts`), token refresh in root `proxy.ts` (Next.js 16 renamed middleware), identity verified with `getClaims()` (JWT signature check, never raw session trust), role read from the existing `profiles.role` through RLS | Keeps the cached anonymous public client untouched and free of identity; no service-role key involved in moderation — RLS staff policies remain the hard backstop behind every page/action check. No migration was needed: the 0001 schema already had profiles/is_staff/staff policies and a `rejected` status. First staff account is provisioned manually in the Supabase Dashboard (Auth user + `profiles.role` update) by design; there is deliberately no self-service path to staff |
| 2026-08-29 | Discovery/pipeline language is TypeScript (`scripts/discovery/` via `tsx`), superseding the earlier Python `pipeline/` plan | One language across the whole stack; batch shape retained; §8 FastAPI triggers unchanged |
| 2026-08-29 | Architecture-hardening audit: KEEP foundations (RLS, moderation-first, lib/data, provenance immutability, assistant boundary); record additions §12.1–§12.7; no code changed, docs only | Verdict: targeted hardening, not restructuring; every addition is owner-gated or trigger-based to avoid speculative complexity |
| 2026-08-29 | Targeted hardening pass (§12.8): adapter registry + one-row-one-opportunity invariant + derived lifecycle + structured run summaries implemented; eligibility/identity/lifecycle migrations 0005–0007 designed but NOT applied | Separates extraction from orchestration, formalizes invariants with tests, and prepares worldwide-opportunity semantics without touching RLS, moderation authority or provenance immutability |
| 2026-08-29 | Corrective pass (§12.9): lifecycle corrected to four states (null/malformed deadline = `unknown`, never `rolling`); evidence chain formalized (`evidenceUrl`/`referenceKind`, evidence-keyed parent suppression); migration 0005 redesigned pre-application to the single verifiable fact "may Tanzanians apply?"; URL-dedupe limitation documented; no migration applied, no RLS change | Absence of evidence is not evidence; eligibility and location stay separate dimensions; identity readiness without speculative machinery |
| 2026-08-29 | Final hardening milestone (§12.10): country fabrication stopped (null without evidence, field omitted pre-migration), silent 1,000-row dependence removed (explicit pagination/caps on dedupe, queue, published list, assistant), acquisition hardened (scheme/SSRF/redirect/size/timeout guards in one choke point), CI gated install→test→typecheck→lint→discovery with secrets only on the worker step; migrations 0008 (country), 0009 (attribution), 0010 (jobs seed) designed but NOT applied | The four remaining structural weaknesses closed without speculative machinery; owner-gated schema changes stay reversible and honest; the pipeline is production-safe regardless of migration timing |
| 2026-08-29 | Product Milestone 1 (§12.11): real-DB baseline (185 rows, 170 pending) drove all decisions; four evidence-based extraction fixes (entity decoding, readable-slug rule, bare-URL title guard, 5 exact noise labels); zero new sources and zero reactivations — every probed candidate measured as junk/unreachable; no relevance heuristics, no metrics platform, no channel-type additions | Quality over row count: moderator throughput (170 pending) is the binding constraint, not discovery volume; every fix is deterministic, test-covered and preserves the pending-only/moderation-boundary invariants |
| 2026-08-29 | Product Milestone 2 (§12.12): live-verified migration state (0004/0010 NOT applied — admissions/jobs candidates skipped loudly, 7 measured; 0008 NOT applied — DB default 'Tanzania' still live, proven by reversible INSERT probe); added moderation next-item navigation (pure selector + tie-break ordering); relevance hint DEFERRED (148/170 ambiguous rows — unreliable without opaque classifier); no DDL applied | Prior reports reconciled against the live DB, not trusted; only the one B-finding implemented; owner-gated migrations documented with measured product cost so the owner can act on evidence |
| 2026-08-29 | Milestone 3 (§12.13): live re-probe showed ALL owner-gated migrations still unapplied; delivered read-only `triage-queue.ts` (priority-ordered 170-row backlog), test-artifact census (5 published test rows identified, not deleted), honest BEFORE=AFTER discovery measurement (0 recovered; 5 candidates/run still skipped), full battery + security + production re-verification; stopped at owner gate with exact SQL application order | No DDL without owner authorization; everything shippable without schema change was shipped; recovery math measured so the owner action's product payoff is quantified |
| 2026-08-29 | Milestone 4 (§12.14): live re-probe again showed ALL four owner-gated migrations unapplied (behavior probes, reversible INSERT included); activation phases could not run; battery 176/176 + production re-probes re-verified locally; BEFORE=AFTER unchanged; stopped at the same owner gate; GitHub push still network-blocked | Milestones cannot substitute for the owner's SQL-editor action; honest BEFORE=AFTER reported instead of fabricated recovery; no speculative work invented to fill the gap |
| 2026-08-29 | Milestone 7 (§12.15): opportunity-first product pass — live-taxonomy category hub, deadline quick links, opportunity-first hero, country display suppressed pending 0008 evidence, assistant boundary copy; battery 188/188; no data-access, RLS or provider changes | The public UI must never claim categories the live DB lacks nor present schema-default country as verified; live-taxonomy mechanism auto-picks up 0004/0010 later without frontend churn |
| 2026-08-29 | Milestone 8 (§12.16): discovery reliability + taxonomy consistency — GitHub failure classified I (logs unreachable, not inferred); whole-run health gate added (total source failure exits non-zero, partial stays isolated); `timeout-minutes: 30`; submit form switched to the same live taxonomy as the homepage; battery 194/194; no DDL, no secret changes, no failure suppression | A scheduled run must never go silently green when every source fails, and the submit form must never offer a category the live DB lacks; the exact CI failure could not be observed from this machine, so it is reported honestly rather than guessed |
| 2026-08-30 | Milestone 11 (§12.19): queue view filters — exactly two (triage bucket + source), server-side URL params over the existing single pending read, with position/next computed inside the active filter and the filter carried forward on every navigation link. 253/253 tests. No DB filter engine, no client JS state, no new access path | Live counts showed 79% of the queue is category `other` from a handful of sources — the friction is batch navigation, and the data justified only these two filters; anything more would be a dashboard platform, which the brief forbids |
| 2026-08-30 | Milestone 10 (§12.18): moderation throughput product pass — display-layer only. Triage buckets surfaced as prioritization hints (never decisions) with a suggested entry link; review page rebuilt evidence-first with known/unknown field hints, sticky decision bar, Enter-driven next-record flow; category select switched to the live taxonomy with unseeded slugs never offered. 223/223 tests. No schema/action/provenance/RLS change | Moderator time is the binding constraint now that discovery is net-zero; every improvement had to preserve the honesty contract (hints marked heuristic, unknowns never inferred, taxonomy never faked) and the moderator's authority — so no auto-decision, no bulk actions, no inferred values |
| 2026-08-30 | Milestone 9 (§12.17): Discovery Sync forensics from real run logs reclassified the failure from I to B (app-code defect): `RootLayout` used the build-generated `LayoutProps` global, which exists only in git-ignored `.next` artifacts — green locally, TS2304 on every fresh CI checkout; fixed with an explicit prop type, bumped actions to v5/Node 22, added `tsconfig.ci-check.json` fresh-checkout guard; pushed all 11 backlogged commits; no discovery-code change because the worker never ran | Evidence over inference: annotations named the exact file/line/column; the fix is the smallest change that makes local and CI typechecking see the same truth; workflow proof is held for a real GitHub run rather than claimed from local execution |
