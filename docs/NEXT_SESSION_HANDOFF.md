# Next-Session Handoff — End-of-Day Checkpoint

Freeze note for resuming work. Not a redesign document. Verified against
the live repository and live database on 2026-08-29; every number below
came from a behavior probe or test run in that session, not from memory
or earlier reports.

---

## A. Current project purpose

TechOpportunity Tanzania should discover trustworthy, actionable
opportunities for Tanzanians — in Tanzania and worldwide, regardless of
where the opportunity originates — while keeping human moderation as the
only publication boundary. Categories, search, filters, and (later) an AI
assistant exist to make real opportunities findable; nothing may fabricate
deadlines, locations, organizers, categories, or eligibility to look
complete.

## B. Current architecture (as deployed)

- Next.js 16 App Router on Vercel; Supabase (Postgres + PostgREST + Auth)
  as the only datastore. No custom backend, no queue, no vector store.
- RLS is the security authority: anon sees only published opportunities
  (plus organizations for display); registry, audit, pending, and rejected
  rows are invisible to anon — re-verified live with an anon probe.
- All data access flows through `lib/data/` (server components + one
  server action for moderation decisions). UI never talks to Supabase
  directly; the only `createClient` outside scripts is the anon server
  client in `lib/data/supabase-client.ts`.
- Service-role keys exist only in `scripts/discovery/*` (CI worker +
  retained read-only analysis tools) — never in `app/`, `components/`,
  `lib/`, or the browser.
- Discovery runs as a GitHub Actions workflow gated by install → tests →
  typecheck → lint; it inserts only `status: "pending"` rows.
- Assistant: one API route that executes a validated filter plan against
  the same published-only queries as the browse UI. Runtime is disabled
  until a provider credential exists (see G).

## C. Current discovery pipeline

`opportunity_sources` registry (29 rows, 18 active) → acquisition
(`scripts/discovery/fetch.ts`, the single SSRF choke point: scheme +
private-range + `.internal`/`.local` blocks) → adapter sniffing (4
implemented families: JSON-LD pages, RSS, Atom, HTML links/roundups) →
extraction (one-hop roundup decomposition with evidence chain) →
normalization (`normalize.ts`; country stays null without evidence) →
validation (`validate.ts`; URL guard, date rules — event dates never
become deadlines) → noise gate (nav/footer/junk titles rejected, real
announcement titles preserved) → dedupe (URL + title similarity) →
**pending** (loud skip + counter when a category seed is missing) →
moderation (staff-only decision; pending-guarded UPDATE; enrichment
audit best-effort) → publication → search/category/region/deadline
filters → AI (disabled; see G).

## D. Opportunity categories that ACTUALLY exist in the live database

Seeded and usable: `hackathon`, `competition`, `scholarship`,
`conference`, `workshop`, `internship`, `fellowship`, `grant`,
`tech-event`, `other` (10 rows in `categories`).

**Do not treat as existing:** `admissions` and `jobs` are referenced by
app types and planned migrations 0004/0010, but their seed rows are NOT
in the live database. Every admissions/jobs discovery candidate is
currently skipped (warn + counter) — measured: 7 candidates per recent
dry-run. The browse UI honestly shows "Nothing found" for those filters.

## E. Current data state (verified 2026-08-29)

- 185 opportunity rows total: **170 pending / 10 published / 5 rejected**.
- Published detail: of the 10 published rows, ~5 are regression/test
  artifacts (`regression-alpha`, `regression-bravo`, `hackkka`, `hack`,
  `production-link-test-delete-me`). Removing them is an owner/moderator
  data decision, deliberately not taken tonight.
- Category spread: `other` = 160 (86.5%); fellowship 7, scholarship 6,
  grant 3, competition 3, hackathon 2, internship 2, conference 2.
- Metadata coverage on all 185 rows: deadline 5, city 5, region 3,
  venue 3, organizer 2. Country coverage is unreliable because the DB
  still force-defaults `'Tanzania'` (see F).
- Enrichment audit rows written so far: 0. Registry rows: 29. Duplicate
  URL pairs: 1 (test rows only).
- Heuristic classes of the 170 pending titles — **estimates from regex
  inspection, explicitly NOT ground truth**: ~18 action-like, ~4
  news-like, ~148 ambiguous. Ambiguity is why automatic triage was
  refused (see the do-not-do list).

## F. Worldwide status — exactly what is supported

- **Tanzania**: full path works (discovery → moderation → publish →
  filters → detail). Region filter offers the 31 canonical Tanzanian
  regions.
- **Other countries / worldwide**: partially supported and honest in the
  UI only after human correction. The `country` column is still
  `not null default 'Tanzania'` because migration 0008 is NOT applied —
  any inserted row without explicit country is silently stored as
  Tanzania. A moderator CAN set a real country (parser and action
  support it and never overwrite with a default when null is omitted).
- **Online opportunities**: representable (null location fields render as
  unknown, never claimed); no dedicated "online" flag exists yet
  (migration 0006 column is absent — confirmed by probe).
- **Eligibility**: not stored anywhere, by design. Never inferred from
  domain, institution, or title. Blocked behind 0005/0007 columns and a
  future evidence-backed design.

## G. Current AI status

- Scaffold: complete and tested (plan parser, grounded executor that
  returns exactly the executed published rows, boundary detection for
  off-product questions, in-memory rate limiter, `mode:disabled` JSON on
  POST, 405 on GET).
- Provider decision: none made; code is provider-independent behind
  `lib/assistant/provider.ts`.
- Runtime: **disabled**. `isProviderConfigured()` checks
  `ASSISTANT_PROVIDER_API_KEY`; no `ASSISTANT_*` variable exists in
  `.env.example` or `.env.local`.
- Kill switch: absence of the credential itself — provider calls throw
  `ProviderNotConfiguredError`; production POST returns the honest
  disabled message (verified live).
- Next activation requirement: owner supplies a provider credential and
  makes the provider decision. Do not activate before moderation
  throughput and taxonomy gates are cleared.

## H. Owner gates (every action requiring the owner)

1. Apply migration **0004** (admissions seed) and **0010** (jobs seed) —
   stops the measured silent skipping of every admissions/jobs candidate.
2. Apply migration **0008** (drop the `'Tanzania'` country default) —
   completes country honesty at the DB layer.
3. Apply **0009** (moderator decision attribution) — precondition for
   any bulk-action feature.
4. Decide on **0005 / 0006 / 0007** (references, online flag, eligibility
   columns) — all confirmed absent by probe.
5. Provide `ASSISTANT_*` provider credential if AI should be activated.
6. Confirm Supabase Auth staff accounts for moderators (login exists;
   account provisioning is owner-side).
7. Decide removal of the ~5 test rows currently published.
8. GitHub Actions secret rotation / Vercel env changes, if ever needed.
9. Real-device QA of the UI (no mobile/desktop device pass has been
   done).

## I. Known technical limitations

- 170-row moderation backlog with <4% metadata coverage; published set
  is tiny (and partly test rows), so the public product is currently
  thin despite the pipeline.
- Queue loads max 500 pending rows without pagination (deferred until
  the queue approaches the cap; 170 is well under it).
- Dedupe is URL- and title-based; distinct URLs for the same underlying
  opportunity are not merged.
- Enrichment audit is best-effort and has never run in production (0
  rows written).
- PostgREST does not expose `information_schema`, so schema truth
  requires behavior probes — use `scripts/discovery/inspect-live.ts`.
- Windows dev-shell quirks (quote stripping in the fallback shell) make
  inline `node -e` / `findstr` pipelines unreliable; prefer script files
  and the Grep tool.
- Heuristic title classification cannot separate actionable from news
  reliably (148/170 ambiguous) — no automatic triage may build on it.

## J. Next highest-value milestone (one)

**"Migration Day + Backlog Triage":** the owner applies 0004, 0010, and
0008 (H1–H2), then a single moderation session works the 170-row backlog
with the new next-in-queue navigation, re-running discovery afterwards so
admissions/jobs candidates stop being dropped.

Why this one: every other candidate milestone multiplies off it. It ends
measured silent data loss (7 candidates per run), makes country claims
true at the storage layer, converts the dormant backlog into real
published opportunities, and directly moves the product metric —
trustworthy actionable opportunities per unit of moderator effort —
whereas new sources, AI, or pagination would add surface to an empty
shop.

## K. Do-not-do list (architectural boundaries, preserved)

- No uncontrolled social scraping.
- No autonomous publishing — human moderation is the only gate.
- No eligibility guessing from domain, institution, or title.
- No fabricated deadlines, locations, or organizers.
- No crawler framework without evidence of need.
- No premature vector database.
- No unnecessary backend.
- No mobile implementation before web product maturity.
- No architecture rewrite without concrete evidence.
- No applying owner-gated migrations from application code or scripts.
- No presenting heuristic classification as ground truth.

---

## Git checkpoint record

- Date: 2026-08-29 (end of day)
- Branch: `main`, synchronized with `origin/main`
- Latest milestone commit: `a0b37e0` — "docs: Milestone 2 record — live
  schema truth and measured dispositions" (Milestone 2: Data Integrity +
  Moderation Throughput + Opportunity Taxonomy). This handoff note itself
  is committed as the end-of-day checkpoint commit immediately after it.
- Tests: 176/176 passing (fixtures 93, review 21, assistant 21,
  lifecycle 11, acquisition 30)
- Lint / typecheck: clean
- Build: clean (Next.js 16.3.2)
- Security: L3 deep review 0 findings before the Milestone 2 push; anon
  RLS probes re-confirmed; no secrets or temp artifacts tracked
- Production verification: full surface probed live on
  https://techopportunity-tanzania.vercel.app (home, search, category /
  region / deadline filters, published detail 200, pending detail 404,
  /moderation 307 → login, /submit 200, assistant disabled)
- Architecture score: 9.7/10 (held, not inflated)
- Current milestone name: Milestone 2 — CLOSED. Repository frozen; next
  session starts at section J.
