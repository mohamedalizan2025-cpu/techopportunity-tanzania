# Milestone 17 - Detail-page acquisition and evidence-backed qualification

Date: 2026-09-01  
Scope: bounded product-quality execution; architecture review remains closed.

## 1. OpportunityDesk detail-page evidence

Five representative pages were fetched successfully through the existing
`fetchPage` boundary:

| Page | Actionable | Eligibility evidence | Deadline evidence | Application evidence |
|---|---|---|---|---|
| [Intuit IDEAS Program](https://opportunitydesk.org/2026/09/01/intuit-ideas-program-2026/) | Yes | Businesses in named US locations; no Tanzania proof | Explicit `Rolling Basis` | Explicit apply link |
| [Canada Small Business 100](https://opportunitydesk.org/2026/09/01/canada-small-business-100/) | Yes | Canadian registration/residency restriction | September 6, 2026 | No strict apply-label link found |
| [Finding Yourself in a Busy World](https://opportunitydesk.org/2026/09/01/finding-yourself-in-a-busy-world/) | No; editorial | None | None | None |
| [32 Hot Job Opportunities](https://opportunitydesk.org/2026/09/01/32-hot-job-opportunities-currently-open-september-1-2026/) | Multi-item roundup, not one opportunity | Item-specific | Item-specific abbreviated deadlines | Multiple explicit apply links |
| [CyberSafe x SANS Fellowship](https://opportunitydesk.org/2026/08/28/cybersafe-x-sans-ai-security-fellowship-2026/) | Yes | African woman resident in an African country | September 10, 2026 | Explicit apply link |

Detail pages materially outperform feed summaries: they distinguish a real
call from an editorial article, expose explicit rolling/date evidence and
surface participation restrictions. Roundups remain under the existing
one-row-one-opportunity decomposition; this milestone does not recursively
fetch their external children.

## 2. OpportunitiesForAfricans detail-page evidence

Five current pages were fetched successfully through `fetchPage`:

| Page | Actionable | Eligibility evidence | Deadline evidence | Application evidence |
|---|---|---|---|---|
| [AfricaCDC Youth Pre-Conference](https://www.opportunitiesforafricans.com/the-africacdc-youth-pre-conference-2026/) | Yes | Citizen of an African Union member state | September 13, 2026, 17:00 EAT | Explicit apply link |
| [DA Young Leaders](https://www.opportunitiesforafricans.com/the-democratic-alliance-da-young-leaders-programme-2027/) | Yes, but excluded | Young South African citizens | September 25, 2026 | No strict apply-label link found |
| [KAUST Global Fellowship](https://www.opportunitiesforafricans.com/the-kaust-global-fellowship-program-2027/) | Yes | Academic/experience rules; geography remains unknown | October 1, 2026 | No strict apply-label link found |
| [UNU-WIDER Visiting Scholars](https://www.opportunitiesforafricans.com/unu-wider-visiting-scholars-programme-2027/) | Yes | No direct Tanzania/worldwide proof in the bounded extraction | September 30, 2026 | No strict apply-label link found |
| [UBC Mastercard Scholars](https://www.opportunitiesforafricans.com/university-of-british-columbia-mastercard-foundation-scholars-program-2027/) | Yes | Citizen or refugee of an African country | September 6, 2026 | Multi-stage application; no strict direct-apply link |

OFA detail quality is high for deadlines and generally high for actionable
content. Geographic eligibility and direct application URLs remain
item-specific; the source name and African focus never prove accessibility.

## 3. Selected official Tanzania source

[COSTECH MAKISATU](https://makisatu.costech.or.tz/costech/makisatu) is the
strongest of the researched Tanzania candidates:

- official public HTML, reachable through `fetchPage`;
- a concrete 2026 national innovation competition;
- explicitly open to all Tanzanians, Mainland and Zanzibar;
- explicit technical/financial support and a registration link;
- no explicit application deadline on the page;
- only one current annual page was proven; no stable recurring feed or
  recurrence endpoint was demonstrated.

Decision: selected for a future source probe, **not activated** in this
milestone. Actionability and Tanzania relevance are strong, but recurrence
and deadline evidence are not yet sufficient for automated inventory.

## 4. Detail evidence quality

The implemented contract can carry canonical title, opportunity/evidence
URL, bounded description, explicit application URL, exact parsed deadline,
deadline kind/evidence, labeled location, eligibility evidence and relevance
evidence. Unknown values stay null/unknown.

Evidence is taken only from the individual article region. Related-post
content is cut off, and application URLs are recorded but never followed.
No page discovered from a detail document creates another fetch.

## 5. Tanzania eligibility evidence quality

The richer text proves three materially different outcomes:

- `tanzanians_eligible`: citizen of an African Union member state; citizen
  or refugee of an African country; African resident evidence;
- `tanzanians_not_eligible`: explicit Canadian or South African citizenship/
  residency restriction;
- `unknown`: academic requirements, "global" branding, African organizer,
  US-location conditions without an explicit nationality conclusion, or no
  geographic statement.

Location, organizer, language, source, URL and bare global/international
wording remain forbidden eligibility inputs.

## 6. Deadline evidence quality

Only a labeled `Deadline`, `Application Deadline` or `Registration Deadline`
with an explicit calendar date is parsed. Calendar dates are stored as UTC
midnight while the exact labeled text, including any time zone, remains in
the evidence description. Explicit rolling/no-fixed-deadline language is
preserved as `rolling` evidence with a null date.

Publication date, URL date, feed date, event date and an abbreviated date
without a year are never substituted.

## 7. Exact qualification impact

Read-only live dry-run, same 164 structurally valid candidates:

| Measure | Milestone 16 | With bounded detail |
|---|---:|---:|
| Relevance rejects | 26 | 29 |
| Explicit eligibility rejects | 1 | 2 |
| Moderation survivors | 137 | 133 |
| Survivors explicitly Tanzania-accessible | 0 | 1 |
| Survivors with eligibility unknown | 137 | 132 |
| Survivors with parsed deadline | 0 | 4 |

Acquisition evidence: 10/10 detail fetches succeeded; 6 pages had explicit
deadline/rolling evidence, 5 had eligibility sections and 3 had strict
application links. Two deadline-bearing pages did not survive (one explicit
foreign-only item and one non-opportunity/other gate), so four deadlines
reached the moderation-survivor set.

## 8. Sources activated

Zero new source-registry rows were activated. Detail acquisition was enabled
only for the two already-active, measured source families:

- OpportunityDesk: direct RSS item -> one WordPress article fetch;
- OpportunitiesForAfricans: direct RSS item -> one WordPress article fetch.

Each is capped at five unique detail URLs per run. Duplicate URLs share the
same result.

## 9. Sources rejected or deferred

- COSTECH MAKISATU: deferred pending recurrence/deadline proof.
- ICT Commission national hackathons: generic programme page, no current
  individual call/deadline.
- ZTBI: application path but no current cohort/deadline proof.
- Silicon Zanzibar: ecosystem directory, no proven high-density individual
  opportunity channel.
- Any additional global/African source: deferred; source count was not the
  Milestone 17 objective.

## 10. Six-hour discovery readiness

Measured live dry-run: 18 sources, 34 total fetches including 10 details,
164 structurally valid candidates, 133 survivors, zero fetch failures and
about 45 seconds wall time. At four runs/day this is approximately 136 total
public HTTP fetches/day, of which 40 are bounded detail pages (20/day per
enabled site). No paid API or provider limit is involved. The existing
30-minute job limit is ample even with the 20-second per-hop timeout.

Recommendation: **B - small operational/workflow proof required**. Load and
runtime are ready, but the current GitHub discovery worker still fails after
quality gates and its schedule timing is not proven. Keep the daily cron
until the owner inspects the private worker log/secrets and completes one
green `workflow_dispatch` on current `main`.

## 11. Implementation changes

- `detail.ts`: pure extraction contract plus source-bound, five-page,
  duplicate-cached, failure-isolated one-hop acquirer.
- `types.ts`: transient detail evidence and structured run counters.
- `runner.ts`: detail enrichment after normalization and before validation,
  qualification, dedupe and pending insert.
- `dry-run.ts`: identical bounded detail enrichment and evidence metrics.
- `qualification.ts`: consumes explicit detail evidence; adds measured
  African-union/country and Canadian restrictions; rejects successful detail
  pages that contain no action, application link or deadline.
- `detail-acquisition.test.ts`: focused detail, bound and isolation tests.

No crawler framework, browser automation, recursive acquisition, source
registry expansion, schema change, AI or auto-publication was added.

## 12. Tests, lint, typecheck and build

- `npm test`: 351/351 passed, including 32 new detail-acquisition tests.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- The single permitted `npm run build` attempt reached optimized Next.js
  compilation, then failed only because the sandbox could not fetch the
  Google-hosted Geist and Geist Mono font files. No application-code or
  client/server-boundary defect was reported; the build was not retried.

## 13. Security

- Production detail network access defaults exclusively to `fetchPage`.
- Registry name + registry base host + candidate host must all match the
  measured allowlist.
- One fetch per unique candidate URL, five per source, no recursion.
- Every URL and redirect retains `fetchPage` scheme/SSRF/redirect/size/
  timeout controls.
- Application URLs are statically screened and recorded but never fetched.
- Detail failures retain the original candidate and do not fail the source.
- No client/service-role change, secret, public mutation or social access.
- Inserts remain pending-only through the existing anon/RLS boundary.
- Detail page becomes `source_url`/evidence URL; source registry ID remains.

## 14. Production

Implementation commit `64db738` was pushed to `origin/main`. Post-push public
checks returned 200 for homepage, search, category/deadline filters and a
published detail; pending and rejected details returned 404; `/moderation`
redirected to login; and the assistant API returned its explicit disabled
response. No signed-in staff interaction is claimed. No production data was
changed by the census/dry-run, no source was activated and no pending rows
were created by this milestone.

## 15. Git

The implementation is in focused commit `64db738`; this evidence report is a
separate documentation commit immediately after it. Both are pushed to
`origin/main`; final synchronization and clean-tree state are verified after
the report push.

## 16. Owner gates

1. Inspect the private failing discovery-worker log and verify its three
   GitHub secrets; trigger one current-HEAD manual run.
2. Apply owner-approved migrations separately; no DDL was attempted here.
3. Decide whether application URL, exact deadline evidence/rolling kind and
   structured eligibility evidence require persistence beyond the current
   description + evidence URL. Migration 0005/0006 designs partially cover
   this but are not live.
4. Provide source-owner/API authorization before any future restricted social
   integration. No bypass is acceptable.

## 17. A/B/C/D findings

- **A - implemented:** bounded detail acquisition for OD/OFA, evidence
  contract, exact deadline parser, qualification integration, metrics/tests.
- **B - owner/small operational gate:** one green manual discovery workflow;
  persistence/schema decisions; COSTECH recurrence verification.
- **C - defer:** COSTECH activation, other source additions, six-hour cron,
  detail children/official-site verification, staff UX and AI.
- **D - reject:** recursive crawling, inferred deadlines/eligibility, social
  scraping, headless bypasses, unrestricted URLs, auto-publication.

## 18. New architectural findings only

Detail acquisition fits the existing acquisition/adapters boundary and
creates no new architecture defect. It exposes one already anticipated
persistence gap more concretely: exact eligibility/application/rolling
evidence exists transiently, but the live schema cannot store each field
independently. The evidence remains reviewable in the bounded description
and detail `source_url`; richer columns/references stay owner-gated.

## 19. Architecture score

**9.7/10, unchanged.** The implementation reuses the single hardened fetch
boundary, keeps the registry authoritative and preserves moderation-first
publication.

## 20. Single highest-value next product milestone

Make the recurring discovery worker **operationally trustworthy**: inspect
the private failure, complete one green manual current-HEAD run, then run a
short monitored daily period proving that detail-enriched rows arrive
pending with preserved evidence. Only after that proof should the cron move
to six-hour recurrence.
