# Product roadmap

## Vision

Tech Opportunity evolves from trusted opportunity discovery into an Opportunity
Intelligence Platform for African talent: Tanzania first, then measured East African
and broader African expansion. It should be excellent for normal daily use, strong
enough for institutions and partners, and differentiated by evidence rather than
listing volume.

## Product principles

- Trust before growth: every public claim should be supported by visible evidence.
- Opportunity usefulness before row count: reduce noise, duplicates, stale entries,
  and ambiguous eligibility before expanding supply.
- Tanzania-first, globally connected: serve national opportunities and genuinely
  accessible international opportunities without fabricating location or access.
- Human publication authority: automation gathers and structures evidence; staff
  decide what becomes public.
- Discovery location is not publication authority. Prefer organizer, official, or
  otherwise authoritative evidence for identity, eligibility, deadline, application
  URL, and opportunity details.
- Explainable behavior: filters, trust signals, lifecycle states, and later
  recommendations must be understandable to users.
- Mobile-first responsive web: keep the core experience accessible and broadly
  available before adding native or premium layers.
- Commercial value and social impact may coexist. Keep the interface familiar and
  make the intelligence distinctive.
- The normal non-AI product must already be excellent. AI may assist users but must
  never turn uncontrolled or weak internet evidence into false certainty.
- Measure before changing cadence, sources, taxonomy, infrastructure, or AI.
- No authoritative evidence = no active opportunity record. Discovery may
  find leads anywhere on the public web, but a candidate enters the active
  Moderator queue only after verification against credible authoritative
  evidence (official organizer/programme page, government/ministry/agency,
  university, company, NGO/institution, official application portal, or
  another clearly authoritative first-party source). Unverified leads stay
  outside the active corpus as internal research candidates or are
  discarded; ambiguity is never a normal active-queue state.

## Near-term priorities

These priorities are ordered. Each is a separate milestone requiring its own
bounded authorization and verification; this roadmap does not authorize
implementation or production mutation.

1. **Pending Rejection Attribution Hardening** *(completed 2026-09-14: promoted plus both real pending records resolved with full attribution)*
2. **Bulk Moderator Actions** *(promoted to production 2026-09-15 as exact capability `1645973`; Nordic/EBID/AWARD single-record dispositions complete; furniture sweep first confirmation done (50 rows); record-by-record legacy cleanup abandoned 2026-09-16 — historical corpus stays stored, active surfaces filter lifecycle at query time)*
   - multi-select
   - select-all-visible
   - bulk reject/withhold
   - rejection reason
   - confirmation
   - per-record attribution/audit
   - safe partial-failure handling
   - view-only furniture flag (legacy ambiguous flag retired: new admission never creates ambiguous queue items)
3. **Authoritative Discovery + Active Lifecycle Hardening** *(implemented 2026-09-16, unpromoted: public active browse and moderator active queue exclude expired lifecycle via query/view filter with no status writes; discovery admits only unexpired, qualified candidates from authoritative origins or with resolved external application evidence; legacy corpus untouched; Discovery paused; one controlled real run then 2-hour cadence remain owner-gated)*
4. **Source credibility/source registry**
5. **Discovery quality review and 2-hour cadence verification** *(repo targets `0 */2 * * *`; GitHub schedule stays paused until one controlled real run proves clean)*
6. **National vs International classification**
7. **Opportunity taxonomy improvement**
8. **Showcase readiness for Sahara Sparks and Tech & AI Expo**

Published Unpublish Attribution Hardening was promoted to production on 2026-09-14.
Its bounded fail-closed
reconciliation found both automatic pending inserts unsuitable for retention: one
is a same-cohort duplicate and out of product scope; the other conflates two AWARD
programs and carries Tanzania-excluding evidence under the wrong identity. They
remain pending. The owner authorized their rejection, but execution stopped before
the first mutation because the existing pending-rejection path records actor/time
without a reason and the 0015 reason audit is intentionally restricted to published
unpublishes. The bounded pending-rejection attribution capability at exact commit
`71f4a33` plus migration 0016 was promoted to production on 2026-09-14 with a
zero-row corpus delta and no production moderation action. Both real pending
records were then rejected one at a time through the authenticated Moderator
path with exact attributable reasons (164 and 177 characters), each fully
verified before the next was touched; production is now 254 pending /
8 published / 21 rejected with 2 status audits and both references preserved.
Priority 1 is closed.
Priority 2 is implemented at exact capability commit `1645973`, verified on
isolated staging, reviewed GO, and promoted to production on 2026-09-15 with
no production moderation action. The push Discovery run inserted five pending
records (six references). Read-only reconciliation accepted the delta as
legitimate mechanical growth with no corruption and recommended rejection of
only the Tanzania-excluded Nordic row. That one record was subsequently rejected
through the authenticated production Moderator path with a 200-character reason,
exact actor/time/audit, and its reference preserved; all other 287 opportunities,
all 521 references, and the other four delta rows remained unchanged. Production
is 258 pending / 8 published / 22 rejected with 3 status audits. The exact next
milestone is bounded planning for ambiguous-queue cleanup; no broad cleanup or
later priority was implemented.

## Product Quality & Differentiation direction

1. Audit the current corpus and execute cleanup in bounded, recoverable cohorts:
   test artifacts, obvious noise, stale entries, duplicate candidates, missing
   evidence, ambiguous eligibility, and legacy publications needing re-review.
2. Define source-credibility tiers and registry criteria from measured yield,
   authority, extraction reliability, timeliness, and Tanzanian usefulness.
3. Design exactly two top-level geographic groups, National / International.
   International means Tanzanians have evidenced access; it is not inferred from a
   foreign country or worldwide wording alone. National means primarily
   Tanzania-based or Tanzania-focused; cities and regions remain metadata.
4. Improve the user-facing opportunity taxonomy from observed product needs and
   corpus evidence. Do not create unsupported categories blindly.
5. Preserve auditable before/after baselines for corpus and source quality.
6. Review the current six-hour discovery cadence against source update frequency,
   freshness value, moderator capacity, runtime reliability, and free-tier limits.
   Move toward two hours only after verification shows it is safe.

Discovery may begin from legitimate public official sites, government,
universities, companies, NGOs, innovation hubs, event/hackathon platforms,
aggregators, LinkedIn, Instagram, or other public channels.
`where discovered != source trusted for publication`: use authoritative evidence
before publishing, obey platform terms, and never use unauthorized social scraping.

## Following product phases

### Trusted everyday product

- Execute approved corpus cleanup without erasing provenance.
- Strengthen source coverage selectively, prioritizing authoritative Tanzanian and
  Africa-accessible technology, education, research, funding, and career channels.
- Make National / International, opportunity type, deadline state, and trust signals
  easy to scan and filter.
- Improve moderator throughput and source feedback loops from measured bottlenecks.
- Add a custom domain only after claiming an eligible GitHub Student Developer Pack
  benefit; keep Vercel unless evidence justifies an infrastructure change.

### Personalization

- Add structured user profiles and an optional CV with clear privacy and retention
  controls.
- Provide deterministic saved-search and digest value before generative features.
- Activate explainable recommendations only over a trusted, sufficiently complete
  corpus, with user control and evaluation against non-AI baselines.
- Add application readiness, an Opportunity Passport, application tracking, and
  carefully bounded application assistance only after the underlying profile and
  opportunity facts are trustworthy.

### Intelligence and platform growth

- Consider grounded conversational discovery after the AI readiness contract passes.
- Build institutional/B2B/B2G submission, verification, and partner workflows without
  weakening moderation or RLS; evaluate monetization only after durable user value.
- Grow hackathon, challenge, showcase, accelerator, and commercial opportunity depth.
- Expand from Tanzania into East Africa and Africa only from measured source,
  eligibility, moderation, and product capacity.
- Introduce a public API, native client, geospatial experience, paid services, or a
  separate backend only when measured demand triggers the architecture change.

## Explicitly deferred

- Operational AI provider, embeddings, vector store, or automated moderation
- Blind source expansion or protected-platform scraping
- Unmeasured discovery-frequency increases
- Migration-history normalization or broad database replay
- Native mobile frameworks, FastAPI, maps, paid infrastructure, and premature
  monetization

## Deferred technical work

These are real follow-ups, not reasons to derail the ordered near-term priorities:

- a separately reviewed migration-history normalization plan;
- encrypted off-device backup, retention, and recovery testing;
- a Storage object backup strategy before uploads or CVs become material;
- lightweight branch protection for production `main`;
- a future hosting/infrastructure benefits and limits audit;
- domain and DNS recovery documentation once a domain exists.

Product launch sequencing also retains: claim an eligible GitHub Student Developer
Pack domain benefit before paying, then establish the canonical domain, SEO/Search
Console, and a strong public beta before deeper personalization.

The future AI relationship is:

`trusted opportunities + structured user profile/CV -> explainable personalized intelligence`

It should help answer: Why does this fit me? Am I eligible? What am I missing? What
should I prioritize? It must not manufacture confidence from weak evidence.

Implementation must follow [ENGINEERING_RULES.md](ENGINEERING_RULES.md); current
environment and handoff facts live in
[NEXT_SESSION_HANDOFF.md](NEXT_SESSION_HANDOFF.md).
