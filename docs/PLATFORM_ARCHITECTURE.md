# Platform architecture (permanent)

This document records the permanent commercial and product architecture of Tech
Opportunity. It is authoritative for design direction and is meant to keep every
present-day decision compatible with the future platform. It does **not**
authorize implementing provider/institution dashboards, monetization, or paid
features now — those remain future phases gated by their own bounded
authorization (see [PRODUCT_ROADMAP.md](PRODUCT_ROADMAP.md)).

## The three-sided platform

Tech Opportunity is being built toward a three-sided platform. All three sides
share one trusted, human-moderated opportunity corpus and one privacy-safe data
model, but each side has a distinct job and a distinct value exchange.

### 1. Talent (implemented now)

Students, graduates, researchers, founders, and professionals looking for their
next opportunity.

- **Explore** — the complete trusted opportunity universe, open to everyone.
- **For You** — a personalized layer over the same trusted corpus.
- **Activity** — saved / tracked / application activity. `saved` is live;
  `interested / applying / applied` funnel tracking is code-complete
  (2026-09-17) behind owner-gated migration 0019
  (`public.talent_opportunity_activity`, owner-only RLS, published-only
  guards) with a private unified `/activity` surface; tracking degrades
  honestly until the owner applies 0019 to staging, then production.

### 2. Opportunity providers (future)

Organizers, employers, accelerators, NGOs, companies, and programme owners who
publish opportunities.

- Future verified publishing and promotion.
- Targeted opportunity distribution to relevant talent.
- Campaign analytics (aggregate, privacy-safe).
- Consensual talent connection.

### 3. Institutions (future)

Universities, hubs, NGOs, and government agencies that serve a community.

- Future dashboards.
- Student / community opportunity distribution.
- Engagement and outcome analytics (aggregate, privacy-safe).

## Current scope: talent side + internal campaign pilot

Only the **talent** side is implemented, plus one **internal staff-only**
campaign pilot (2026-09-17, code-complete behind owner-gated migration 0020):
staff rehearse Verified Opportunity → Relevant Audience → Engagement Funnel
on public corpus data with aggregate counts only. Provider/institution
dashboards, verified publishing/promotion, targeting, consent-based
connection, monetization, and paid features are explicitly **not** built now.
Per-talent engagement analytics are explicitly **not** built (they require a
future consent + suppression design). The pilot is recorded here so the
current design stays compatible with future revenue without touching private
talent data.

## Permanent talent UX

### Explore

The complete trusted opportunity universe, available to everyone — including
visitors with no account and signed-in users with no completed profile. It
covers events/expos, scholarships, fellowships, jobs, internships, hackathons,
competitions/challenges, grants, accelerators, training, research calls, and
public-sector opportunities.

**Personalization must never replace or restrict Explore.** Explore is the
unfiltered, unranked-by-profile, always-available baseline. No profile signal,
matching rule, or future commercial feature may hide, down-rank, or gate the
full corpus from any user.

### For You

A separate personalized layer built on the **same trusted corpus** as Explore.
For You never introduces new or untrusted opportunities; it only orders and
explains a subset of the already-published, already-verified corpus using the
user's own profile. For You is optional: a user who skips profiling keeps full
access to Explore.

## Progressive profiling

The smallest structured profile needed for future explainable matching,
collected progressively so a user can start with almost nothing and add more
over time. Every field is optional and skippable.

**Core**
- education / career level
- field / discipline
- sectors / interests (reuses the opportunity sector taxonomy)
- preferred opportunity types (reuses the opportunity type taxonomy)

**Optional / progressive**
- skills
- location (region)
- experience level
- career / research / startup goals

A user can skip profile setup entirely and continue using Explore.

## Privacy and data model boundaries (permanent)

- Reuse the existing Supabase Auth identity and the existing opportunity
  taxonomy; do not create parallel identity or category systems.
- Preserve strong Row Level Security. The talent profile is **owner-only**: a
  user reads and writes their own profile row and nobody else's. Staff
  moderation does **not** read talent profiles.
- **Do not expose personal user data to organizations.** Providers and
  institutions never receive identifiable talent profiles.
- Future commercial value must rely on **consent-based connection** and
  **privacy-safe targeting/analytics** (aggregate, non-identifying), **never**
  on selling private user data.
- Unknown stays unknown: a profile field left blank is absent, never inferred.
  Matching never fabricates a signal from missing data.

## Matching-input contract and explainability

Personalization is built on a clean, deterministic **matching-input contract**
(`lib/personalization.ts`): the user's profile is normalized into a stable,
versioned `MatchingInput` value, and every recommendation is produced by a
deterministic function of that input and the trusted corpus. Each recommended
opportunity carries **human-readable reasons** (for example "A type you follow",
"In your field: AI / Data", "In your region: Arusha"), never a percentage,
score, or other match gimmick.

This keeps recommendations explainable today and provides the stable input
contract a future recommender (including a grounded AI layer, only after the AI
readiness contract passes) can build on without reshaping the data model.

The design also leaves room for future saved-search/digest value without
building it now; saved is live and `interested / applying / applied`
tracking is code-complete behind owner-gated migration 0019 (rollout
awaiting owner staging proof).

## How this supports future provider / institution revenue

Because Explore stays universally trusted and For You is a deterministic,
explainable layer over the same corpus, the platform can later add revenue
without compromising talent trust or privacy:

- **Providers** can pay for verified publishing, promotion, and privacy-safe
  targeted distribution — reaching relevant talent through aggregate,
  consent-based signals rather than buying identifiable user data.
- **Institutions** can pay for dashboards and aggregate engagement/outcome
  analytics over opportunities distributed to their community.
- **Talent connection** becomes a consensual, opt-in introduction flow: a user
  chooses to share a specific profile with a specific provider, so the value
  exchange is explicit and reversible.

The owner-only talent profile, the deterministic matching-input contract, and
the strict Explore/For You boundary are the load-bearing decisions that make
these revenue paths possible later while keeping private data private now.
