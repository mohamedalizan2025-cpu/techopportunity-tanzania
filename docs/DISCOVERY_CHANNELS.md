# Multi-Channel Discovery Audit (2026-02 — evidence-based, NOT implemented)

Status: **AUDIT ONLY**. No connector code was added. Every external channel
below was checked against its CURRENT official developer documentation where
reachable from this environment, per the no-stale-memory rule.

## Source authority principle (permanent — organization-first, opportunity-only)

**Tech Opportunity is organization-first and opportunity-only. Authority belongs
to the genuine organization/channel, not only to its website.** Authoritative
first-party evidence may come from: official organization/programme websites;
official application portals; government/ministry/agency channels;
universities/research institutions; companies/foundations/NGOs/hubs; verified or
demonstrably official LinkedIn, Instagram, Facebook, or X accounts; and official
forms linked by those organizations. Do NOT ingest general news. An item is an
opportunity only when it carries a concrete user action — apply, register,
compete, submit, pitch, attend, train, receive funding, research, intern, work,
exhibit, etc. Aggregators, reposts, unofficial accounts and secondary news remain
discovery leads only, never authority. This principle governs every
source-registry expansion and admission-evidence decision recorded below.

## Why this audit exists

The official-website sources yield thin opportunity volume because
most publish news streams rather than discrete opportunities. This audit
asked whether any additional PUBLIC channel could raise actionable-opportunity
yield without credentials, platform approval, paid tiers, scraping, or
architecture change. Conclusion up front: **no connector qualifies for
autonomous implementation; every viable next step sits behind an OWNER GATE.**

## Channel table

| Channel | Access method | Official API? | Auth? | Approval? | Rate limits | Cost | Verified this run | Opportunity yield | Complexity | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| Official websites (current) | HTML + RSS/Atom + JSON-LD | n/a | no | no (owner-vetted registry) | self-polite | $0 | YES (18 sources live as of 2026-08-29) | current baseline | done | KEEP |
| Opportunity-board RSS/Atom feeds | same as current RSS path | n/a (feeds) | no | owner source-vetting | self-polite | $0 | not yet — needs owner-vetted feeds | MEDIUM-HIGH (boards exist for TZ tech/ NGO jobs) | trivial (registry rows only) | **OWNER GATE: vet + add feeds** |
| Eventbrite | REST API v3 | yes | API key required | account required | token-bound | free key, paid tiers exist | docs gated 401 (auth required to read) | MEDIUM (TZ tech events: Sahara Sparks etc.) | low-medium (one adapter) | **OWNER GATE: create app + provide key** |
| Meetup | GraphQL API | yes | OAuth2 app | approval for scopes | token-bound | free tier exists | NOT verified this run | MEDIUM | medium | **OWNER GATE: app + approval** |
| YouTube Data API v3 | REST, API key | yes | API key + Google Cloud project | default 10,000 units/day quota | quota-bound | $0 within quota | YES (docs fetched; quota confirmed) | LOW (videos, not opportunity listings) | low-medium | LATER |
| GitHub REST | REST | yes | none for public read (60 req/hr unauth) | n/a | strict | $0 | YES (rate-limit docs fetched) | NEAR-ZERO for TZ opportunities | low | EXCLUDE |
| Instagram / Meta Graph API | Graph API | yes | app + account tokens | business verification; scraping prohibited | strict | $0+ | pages 404/400 — endpoint deprecated/moved | uncertain; ToS-prohibited to scrape | high | **EXCLUDE (ToS + approval)** |
| LinkedIn | partner API only | yes (gated) | OAuth + partner approval | approval required | strict | paid tiers | not fetchable this run | uncertain | high | **EXCLUDE (approval gate)** |
| Telegram public channels | no compliant read API for arbitrary channels | partial (bots own-channel only) | bot token | channel-admin required | n/a | $0 | NOT viable compliantly | — | — | **EXCLUDE (requires admin rights)** |
| Twitter/X | paid API tiers | yes | paid key | n/a | strict | PAID — fails $0 rule | pricing page not fetched; paid model is standing policy | uncertain | — | **EXCLUDE (paid)** |

## Stopping rule applied

Every channel that could materially raise opportunity yield requires at least
one OWNER ACTION: source vetting (feeds), an API key (Eventbrite, YouTube),
platform approval (Meetup, LinkedIn, Instagram), or is ToS-prohibited
(scraping social platforms). No connector may be built autonomously under the
approved rules.

## Zero-credential next step (owner decision, ~15 minutes)

Owner vets and approves 2–4 public opportunity-board/NGO RSS or Atom feeds
(e.g. Tanzania job/NGO boards that publish feeds). Adding each is a single
`opportunity_sources` row with `source_type='other'`, `active=true` — the
existing pipeline harvests item-level candidates from feeds automatically,
with full provenance (source_id + discovered_at + discovery_method='rss')
and the pending-only invariant unchanged.

## Taxonomy gap (RESOLVED AS DESIGN — owner gate)

"Vacancies/jobs" appeared repeatedly in the opportunity-first requirements
but had NO category in the taxonomy (`hackathon…other`). Resolved in the
final hardening milestone (§architecture 12.10): a live dry-run (2026-08-29,
18 sources, 169 valid candidates) confirmed job-titled candidates in the
pending-eligible pool, so `jobs` ("Jobs & Vacancies") was implemented in
code (type, label, conservative inference for vacancy/job/ajira/nafasi-za-
kazi only) together with seed migration `0010_jobs_category.sql` — designed,
NOT applied, OWNER GATE. Until the seed is applied the runner skips `jobs`
candidates loudly (skip + warn + `categorySkipped` counter); nothing
crashes and nothing mis-inserts.

## Opportunity taxonomy — three dimensions (2026-09-16, seed is owner-gated)

The National/International + opportunity-taxonomy milestone extended TYPE and
added two DERIVED dimensions, all served by one deterministic classifier in
`lib/taxonomy.ts` (no manual tagging, no per-opportunity hand-classification):

- **TYPE** reuses the existing `categories` lookup. Three slugs were added —
  `accelerator` ("Accelerator / Incubator"), `research-call` ("Research Call"),
  `public-challenge` ("Government / Public-Sector Challenge") — with
  conservative, ordered inference in `scripts/discovery/normalize.ts` (an
  "incubation" match requires a programme/hub/centre/cohort qualifier or a
  business/startup/innovation prefix, so agricultural/medical "egg incubation"
  never becomes an accelerator; `public-challenge` is matched before
  `competition` so a civic challenge is not folded into the generic word
  "challenge"; a conference CFP stays a `conference`). They follow the exact
  `jobs`/0010 precedent: seed migration
  `0017_opportunity_taxonomy_categories.sql` is additive, idempotent
  (`on conflict do nothing`) and is now **APPLIED to production** (owner-authorized,
  2026-09-16: `id=11 accelerator`, `id=12 research-call`, `id=13 public-challenge`),
  so the runner admits those types. The `jobs`/0010 fail-safe stays intact: any
  future unseeded slug is skipped loudly (skip + warn + `categorySkipped`) — nothing
  crashes and nothing mis-inserts.
- **GEOGRAPHY** is exactly two top-level groups, National / International, and is
  DERIVED (never stored, no new columns). Classification follows the OPPORTUNITY,
  not the organizer's nationality, in priority order: National on a
  verified/structured Tanzania country; National when the opportunity's OWN
  region/city is a canonical Tanzania region or an unambiguous Tanzania place
  (Zanzibar, Unguja, Pemba, Stone Town, Dar es Salaam) — this wins EVEN IF the
  organizer's country is foreign, so a foreign-run event/challenge in Zanzibar is
  National; National on eligibility evidence explicitly naming Tanzania(n)s;
  otherwise International only when NOT Tanzania-based AND Tanzanians have
  evidenced access (`eligibility=tanzanians_eligible` from an Africa-wide /
  worldwide / WBG-member statement). It is never inferred from a foreign country, a
  source domain, or the bare words "international"/"global"/"worldwide"
  (ENGINEERING_RULES data-integrity rule 4). Cities/regions stay metadata/filter
  dimensions, never a top-level group. Unknown fails safe to `null` for admission,
  but the publishable corpus is gated on determinacy: moderator approval
  (`parseReviewInput` / `satisfiesPublishedReviewContract`) requires a
  National/International classification, so an item with insufficient geographic
  evidence is held out until evidence exists — never published "Ambiguous".
- **SECTOR** is 13 practical slugs (AI/Data, Cybersecurity, Engineering, Health,
  Agriculture, Mining, Blue Economy, Climate/Environment, Tourism, Education,
  Finance, Energy, Entrepreneurship), classified independently from TYPE by a
  first-match ordered pattern over title + description.

Unknown geography or sector fails safe to `null` — it never creates an
"Ambiguous" workflow item and never blocks admission. Because both are pure
functions of evidence already on the row, every candidate is classified
systematically at discovery (the runner logs each admitted candidate's derived
type/geography/sector) and the same classifier powers public browse and the
Moderator queue filters — one taxonomy, two entry points, no divergence.

## IMPLEMENTED (2026-02): Africa-wide aggregator feeds

Two aggregator sources were adopted after live feed probing (HTTP 200,
item-level titles/links/descriptions, Africa-wide scope including Tanzanian
eligibility) and a controlled live discovery run:

| Source | Feed | Measured result |
|---|---|---|
| OpportunityDesk | https://opportunitydesk.org/feed/ | actionable calls (jobs, fellowships, research programmes) |
| OpportunitiesForAfricans | https://www.opportunitiesforafricans.com/feed/ | fellowships/scholarships/accelerators; per-item eligibility varies (some country-specific) — moderator verifies eligibility |

Live run: +20 pending rows; auto-category distribution fellowship=2,
scholarship=1, competition=1, conference=1, grant=1, other=14; all invariants
(pending-only, submitted_by null, organization_id null, method=rss) verified.
The exact-label noise gate filtered section/nav junk from these feeds
pre-moderation as designed.

## Excluded during feed probing (2026-02)

| Feed | Reason |
|---|---|
| afterschoolafrica.com/feed/ | returns 200 but 0 items (broken/empty feed) |
| scholarship-positions.com/feed | Cloudflare bot-challenge (never bypassed) |
| youthop.com/feed | connection timeout |
| weworkremotely.com RSS | works (25 items) but jobs fall outside the current category taxonomy and per-item Tanzania eligibility is unstated — deferred pending the vacancies/taxonomy owner decision |

## Source quality strategy — measured baseline (2026-08-29, Milestone 1)

Product Implementation Milestone 1 re-derived the source strategy from the
REAL database, not from prior reports (read-only analysis,
`scripts/discovery/analyze-baseline.ts`). Baseline: **185 rows — 170
pending / 10 published / 5 rejected**; category `other` dominates (160 of
185); deadline coverage ~3%, region ~2%, organizer ~1%; **0 duplicate
URLs**. Registry: 18 active + 11 inactive sources. The published set
contained test rows left over from verification ("PRODUCTION LINK TEST —
DELETE ME", "REGRESSION Alpha/Bravo", "hack") — a moderation-hygiene
item, not a pipeline defect.

### A–D classification (measured yield, not assumption)

| Class | Sources | Measured behaviour | Action |
|---|---|---|---|
| A — highest value | OpportunityDesk, OpportunitiesForAfricans | item-level actionable calls (fellowships, grants, jobs, internships); best actionable-candidate density of all sources | KEEP |
| B — viable institutional | NM-AIST, SUZA, FSDT, VETA, YUNA, DIT, IHI | real admission/vacancy/call titles mixed with nav noise | KEEP + 4 evidence-based extraction fixes (below) |
| C — low yield | SUA, UDSM, UDOM, Twaweza, ministries, BOT, HESLB, ICTC, JGI | mostly news/`other` rows | KEEP as-is; no automated action justified |
| D — remove | none | no source showed harmful or fabricated data | nothing to remove (and no auto-deletion by design) |

### Expansion verdict: ZERO new sources justified today

Live probe of every shortlisted candidate (`scripts/discovery/probe-sources.ts`):

| Candidate | Measured result |
|---|---|
| NACTE | 0 actionable candidates (already INACTIVE in registry — confirmed why) |
| TCU | fetch failed |
| COSTECH | 0 actionable candidates (already INACTIVE — confirmed why) |
| DAAD | 1 candidate, not useful |
| Chevening | 9/10 candidates navigation noise |
| AfterSchoolAfrica | junk titles |
| YouthOp | connection timeout |

The binding constraint on published-opportunity growth is moderator
throughput (170 pending rows awaiting review), not discovery volume.
Reactivating NACTE/COSTECH or adding any probed source would raise row
count, not actionable yield — rejected by the quality-over-volume rule.

### B-fixes implemented this milestone (all test-covered, 93/93 fixture assertions pass)

1. **HTML entity decoding** (`normalize.ts`): deterministic numeric +
   closed named-entity list; unknown entities preserved, never guessed.
   Evidence: RSS titles stored raw ("…Open &#8211; August 27, 2026").
2. **Opaque roundup-slug rejection** (`extract.ts`): humanized slugs are
   used as titles only when readable (≥10 chars, ≥50% letters, contains a
   space, no dot). Evidence: junk titles "jobdetail.ftl…"/"detailoffre…"
   in the pending queue; the real humanized candidate ("clean cookstoves
   challenge 2026") still passes.
3. **Bare-URL title guard** (`validate.ts`): a title that IS a URL
   carries no opportunity information — rejected at validation.
4. **Five new exact noise labels** (`validate.ts`): "our quick links",
   "subfooter menu", "social media", "upcoming events", "about the
   university" — each observed verbatim in the pending queue. Exact-match
   semantics unchanged (no substring matching, ever).

### Boundary preserved

No new channel type, no crawler, no social scraping, no headless browser,
no metrics platform, no embeddings/vector search. Every network read
still funnels through the `fetchPage` choke point; discovery still inserts
pending-only; moderation remains the sole publication boundary.

## Milestone 22 source-quality refresh (2026-09-01)

Run 8 and a same-day read-only 18-source replay changed the optimization
target from extraction volume to explicit product fit. Internal operational
classification (not a registry mutation):

| Class | Sources | Current evidence |
|---|---|---|
| Productive | OpportunitiesForAfricans | Only source that inserted product-scope records in run 8; current feed exposes technical/research calls plus bounded detail evidence |
| Useful but noisy | OpportunityDesk, SUZA | Real calls exist, but news/general jobs and duplicated HTML/feed extraction require qualification and dedupe |
| Weak/noisy for the current product boundary | BOT, DIT, FSDT, HESLB, ICTC, IHI, JGI Tanzania, Ministry of Agriculture, NM-AIST, SUA, Twaweza, UDSM, UDOM, VETA, YUNA | Current pages are dominated by articles, navigation, degree/admission pages, past cohorts, or generic institutional material; none failed acquisition |
| Failing | none | All 18 sources and all 10 bounded detail fetches succeeded in the final replay |
| Redundant evidence | FSDT extraction paths; some OFA/OpportunityDesk listings | Dedupe remains the response; no source was disabled from one observation |
| Future expansion candidate | Zindi first; Devpost/MLH later | High product fit, but the current adapters yielded zero Zindi opportunities, one generic Devpost navigation row, and no actionable MLH event row |

No source was activated or deactivated. Zindi, Devpost and MLH need a bounded,
testable item-level adapter plus per-item eligibility evidence before a registry
row is justified; adding them today would produce zero or misleading yield.

## Bounded first-party LISTING adapters (2026-09-16, ACTIVATED in production)

The Authoritative Source Registry Expansion milestone was executed via the
narrow adapter path — not by adding zero-yield registry rows to inflate the
count. `source-policy.ts` has always reserved exactly one exception for
institutional sources: "a future source-specific adapter may opt in only with
measured fixtures." That exception is now implemented in
`scripts/discovery/source-adapters.ts`: pure functions keyed to an EXACT
registry `base_url`, each backed by a representative fixture and assertions in
`tests/source-adapters.test.ts`. They are structural only (a precise
detail-page link boundary) — the admission gate, `source-policy.ts` block and
2-hour cadence are unchanged, and every emitted candidate still runs
normalize → validate → qualify → shouldAdmitCandidate.

| Source | Dedicated listing base_url | Boundary contract | Live yield (unchanged gate) |
|---|---|---|---|
| University of Dar es Salaam | `https://www.udsm.ac.tz/announcement` | intra-host `/announcement/<slug>` detail links (Drupal view; distinct from the active homepage) | 191 cards parsed, **5 admitted** (AI/climate scholarships, CS/data-engineering PhD, energy/digital-innovation grants) |
| NM-AIST | `https://nm-aist.ac.tz/event/` | intra-host `/event/<slug>/` cards, archive self-link excluded (WordPress; distinct from the active homepage) | 10 cards parsed, **1 admitted** (Samia Data-Science/AI scholarship) |

**Activation (owner-executed, 2026-09-16).** Each adapter is keyed to a LISTING
base_url added ONLY by `supabase/seeds/0003_first_party_listing_adapters.sql`.
The owner authorized and applied that forward, idempotent seed to production
(target-guarded, `ON CONFLICT (base_url) DO NOTHING`), making exactly the two
reviewed listing rows `active=true` and lifting the active registry 18 → 20. The
already-active homepage rows (`https://www.udsm.ac.tz`, `https://nm-aist.ac.tz`)
still do not match any adapter key and stay inert for generic HTML.

**Observed production evidence (closure gate).** Two live 2-hour Discovery runs
were observed. Run `35106123095`: UDSM `ok:true` — 191 cards, 186
institutional/off-scope rejected, **5 admitted**; NM-AIST `/event/` took one
transient 20 s fetch timeout (`sourcesFailed:1`, `errors:1`,
`sourceHealthFailures:0`) while its homepage fetched `ok:true` on the same host —
a path-level timeout, not host egress/geo-blocking. Run `35107041338`:
`sourcesSucceeded:20`, `sourcesFailed:0`, `errors:0`; NM-AIST fetched cleanly and
**admitted 1** Data-Science/AI scholarship item; UDSM's 5 deduped. A read-only
production query confirmed all admitted rows are real, actionable opportunities
(PhD/MSc scholarships and research-fund awards in Computer & IT Systems
Engineering, AI, and Climate-Change/Green-Development research), each `pending`
with `eligibility:unknown` for human moderation; no institutional news was
admitted. The admission gate's other dimensions and the 2-hour cadence are
UNCHANGED. The single NM-AIST item was a "50 shortlisted names" follow-up — a
selection result, not an open opportunity; that whole class is now withheld at
admission by the opportunity-only actionability guard (below), and the
already-inserted production `pending` row is left for the human Moderator.

## Opportunity-only actionability guard (2026-09-16, implemented)

The registry milestone's observed run admitted one item that should never have
reached the queue: an NM-AIST `Majina 50 Wanaotakiwa Kuomba ufadhili …` notice —
a list of already-selected names told to complete their applications. It is
topically a DS/AI award, but it is a **selection result**, not an open call:
nobody can act on it by applying. ENGINEERING_RULES rule 8 says an item is an
opportunity only when it carries a concrete user action, so this class must be
withheld before insertion rather than routed to moderation.

`scripts/discovery/qualification.ts` gained a narrow, title-only **actionability
guard** — `SELECTION_RESULT_OR_CLOSED_LIST` matched against the candidate title
and suppressed by an explicit `OPEN_CALL_OVERRIDE`. It rejects the concept class
— "shortlisted / selected / successful applicants", "list of selected names",
"selection / interview results", "award recipients / awardees / beneficiary
lists", "instructions for selected …" — plus the measured Swahili forms
(`majina … wanaotakiwa`, `orodha ya waliochaguliwa`, `waliofuzu`, `matokeo ya
…`). A title that also carries an open call ("call for applications",
"applications open", "expressions of interest", "register now", …) is never
treated as a selection artifact, so a genuine call that merely references
selection or shortlisting criteria still passes. It is a class rule, not a match
for one title.

Boundary: the guard lives inside `qualifyOpportunity`, so a match yields a
`not_relevant` verdict the runner counts as `relevanceRejected` and skips
**before** dedupe and insertion — no such row can enter the active Moderator
queue. Every other admission dimension, the 2-hour cadence, the source registry
and the legacy corpus are unchanged. Proven by focused cases in
`tests/qualification.test.ts` and by new extracted-but-withheld cards in the
UDSM and NM-AIST listing fixtures (`tests/source-adapters.test.ts`).

**Production confirmation (run `35110471270`, exact HEAD `a624d95`).** The push
ran the live worker and Milestone-verification CI (`35110471380`, both green,
`sourcesSucceeded:20`, `sourcesFailed:0`, `errors:0`). The guard withheld **7
real selection-result items across three different sources** — NM-AIST `Majina
50 Wanaotakiwa Kuomba ufadhili …` (last session's single NM-AIST admission, now
rejected with evidence `Majina 50 Wanaotakiwa`), UDSM `NOTICE TO SUCCESSFUL
APPLICANTS …`, `WRITTEN INTERVIEW RESULTS` (×4), and SUZA `TANGAZO KWA WAOMBAJI
WALIOCHAGULIWA …` — so it is demonstrably a class rule, not a fix for one title.
NM-AIST went from 9 rejected / 1 admitted to **10 rejected / 0 admitted**;
UDSM still passed its **5** legitimate opportunities unchanged (deduped against
their existing pending rows). No genuine open call was lost.

**Rejected rather than accommodated.** SUA (parses 47 anchors, 0 relevant —
agriculture/admissions, no product scope), COSTECH/ICTC (0 clean boundaries),
and NIMR/IfM/UDOM/hubs (unreachable or 0) each failed to produce a clean
actionable fixture. Consistent with the standing rule, they were dropped
instead of loosening the parser; a 3rd adapter was sought and legitimately not
found, so the batch ships at two.

