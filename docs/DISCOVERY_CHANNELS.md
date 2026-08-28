# Multi-Channel Discovery Audit (2026-02 — evidence-based, NOT implemented)

Status: **AUDIT ONLY**. No connector code was added. Every external channel
below was checked against its CURRENT official developer documentation where
reachable from this environment, per the no-stale-memory rule.

## Why this audit exists

The 16 active official-website sources yield thin opportunity volume because
most publish news streams rather than discrete opportunities. This audit
asked whether any additional PUBLIC channel could raise actionable-opportunity
yield without credentials, platform approval, paid tiers, scraping, or
architecture change. Conclusion up front: **no connector qualifies for
autonomous implementation; every viable next step sits behind an OWNER GATE.**

## Channel table

| Channel | Access method | Official API? | Auth? | Approval? | Rate limits | Cost | Verified this run | Opportunity yield | Complexity | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| Official websites (current) | HTML + RSS/Atom + JSON-LD | n/a | no | no (owner-vetted registry) | self-polite | $0 | YES (16 sources live) | current baseline | done | KEEP |
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
