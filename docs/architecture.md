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
