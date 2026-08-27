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

## Taxonomy gap (documented, owner decision)

"Vacancies/jobs" appeared repeatedly in the opportunity-first requirements
but has NO category in the current taxonomy (`hackathon…other`). Affected
rows today: several VETA/DIT/HESLB admission and recruitment items. Adding a
`vacancies` (or `jobs`) category requires a categories-table seed migration —
an OWNER STOP GATE per the current rules. Not implemented.
