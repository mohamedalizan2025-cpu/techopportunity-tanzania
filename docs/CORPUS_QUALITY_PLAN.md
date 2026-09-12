# Corpus quality and cleanup plan

Status: planning baseline, Batch 1 test-artifact quarantine, read-only Batch 2A
legacy-publication triage, and the attributable published re-review blocker
resolution and smallest production promotion are completed through 2026-09-12.
The new path is verified on isolated staging and deployed to production. No
Batch 2A/2B1 corpus row was changed; no production row was deleted and no
source-registry, schedule, schema, migration, or infrastructure-configuration change
was performed.

This is the execution plan for Product Quality & Differentiation. Permanent
direction remains in [PRODUCT_ROADMAP.md](PRODUCT_ROADMAP.md); all execution must
follow [ENGINEERING_RULES.md](ENGINEERING_RULES.md).

## Audit boundary and method

The baseline used a target-guarded, SELECT-only production audit against Supabase
ref `jltuufukcwztugvojwjd`, the existing M31 plan-only remediation classifier, the
repository's qualification/trust/dedupe functions, the exact production workflow,
one completed-run GitHub Actions query, and a read-only production homepage check.
No private row content is recorded here.

The audit covered every opportunity, category, registry source, and M31 reference.
Heuristic and deterministic-rule classifications are planning signals, not human
moderation decisions. In particular, a count labelled `reject_noise` is not
permission to mutate all matching rows automatically.

## Verified corpus baseline

Observed at `2026-09-11T19:21:21Z`:

| Measure | Result |
|---|---:|
| Opportunities | 271 |
| Pending / published / rejected | 247 / 19 / 5 |
| M31 references | 501 |
| Registry sources | 29 (18 active, 11 inactive) |
| Discovery method | 145 HTML, 119 RSS, 7 manual/unknown |
| Test/placeholder artifacts | 10: 3 pending, 5 published, 2 rejected |
| Known passed deadlines | 6, including 2 published |
| Meaningful-description failures | 194, including 16 published |
| Known deadlines lacking deadline evidence | 29 |
| Rows older than 30 days by stored discovery/creation time | 0 |

The public application returned successfully and did not render the known test
markers on its homepage because the application contamination guard filters them.
The five test rows with `published` database status are therefore a data-integrity
problem, not a currently observed homepage leak.

All 271 rows have exactly one canonical M31 reference. That is a healthy invariant
and must remain unchanged during cleanup.

### Pending disposition signals

The existing plan-only M31 classifier and the independent audit agreed exactly:

| Signal | Pending rows | Meaning |
|---|---:|---|
| `reject_noise` | 192 | Test, currently non-relevant, or explicitly ineligible under current deterministic rules |
| `review_required` | 21 | Insufficient actionable/evidence shape for automatic prioritization |
| `potentially_qualifying` | 34 | Relevant enough for priority human review; eligibility may still be unknown |

No one-step bulk rejection of 192 rows is approved. The cohort spans historical
rules and must be frozen, reason-coded, and reviewed in bounded source/reason batches.

### Published trust gap

All 19 published rows predate the M31 trust contract:

- 19 are `relevance_decision = unreviewed`;
- 19 have unknown eligibility and country verification;
- 19 lack qualification version, decision attribution, and last verification;
- 16 fail the current meaningful-description threshold;
- 2 have passed deadlines;
- 5 are deterministic test artifacts; and
- the remaining 14 are the legitimate legacy-publication re-review cohort.

Do not run the existing all-legacy requeue path wholesale: moving all 14 legitimate
rows to pending at once would remove the entire non-test public inventory. Re-review
must be sequential and keep a useful public product online.

### Duplicate signals

Among non-rejected rows, the audit found one canonical-URL cluster of five rows, two
exact normalized-title clusters (sizes four and two), and three conservative
cross-source title/year pairs. These are review cohorts, not proof that records are
interchangeable. Preserve distinct opportunities and their references unless a
moderator verifies identity.

## Category and taxonomy findings

The live single-category distribution is:

| Existing category | Total | Pending | Published | Rejected |
|---|---:|---:|---:|---:|
| Other | 196 | 185 | 8 | 3 |
| Fellowship | 35 | 34 | 1 | 0 |
| Grant | 17 | 17 | 0 | 0 |
| Scholarship | 9 | 5 | 2 | 2 |
| Competition | 5 | 1 | 4 | 0 |
| Conference | 4 | 2 | 2 | 0 |
| Internship | 3 | 3 | 0 | 0 |
| Hackathon | 2 | 0 | 2 | 0 |
| Workshop / tech event | 0 | 0 | 0 | 0 |

`other` holds 72% of the corpus, so the current taxonomy cannot support a
differentiated browse experience. Multi-label keyword signals found material themes
for research (39), fellowship (37), grants/funding (25), conference/summit (21),
workshop/training (18), entrepreneurship (15), scholarships (10), accelerators or
incubators (5), internships (4), and hackathons (3). These overlap and are discovery
signals only.

Recommended product model:

- Keep one required **opportunity type** based on user intent: Hackathon; Challenge
  or Competition; Fellowship; Scholarship; Grant or Funding; Internship; Selected
  Technology Job; Research Opportunity; Accelerator or Incubator; Conference or
  Tech Event; Workshop or Training; Developer Program; Entrepreneurship Program.
- Treat AI/Data, climate innovation, startup/innovation, health, agriculture, and
  similar concepts as optional **themes**, not competing top-level types.
- Keep `other` as an internal triage fallback, not a desirable public category.
- Do not add empty categories merely from the roadmap. Validate mappings against the
  55 potentially useful/review-required pending rows and 14 legitimate publications
  before proposing schema or UI work.

## National / International semantics

There must be exactly two top-level geographic groups:

- **National**: primarily Tanzania-based or Tanzania-focused, supported by explicit
  opportunity evidence and a moderator decision.
- **International**: foreign, regional, or global, with explicit evidence that
  Tanzanians can participate or apply.

City and region remain metadata/filter dimensions. Organizer location, source
country, the word “international,” or a historical `country = Tanzania` value is not
classification evidence.

The present corpus cannot safely power these groups: 261 rows contain the historical
Tanzania string and 10 contain no country, but all 271 have
`country_verification = unknown`; only three rows have explicit Tanzanian-eligibility
evidence. Therefore no geographic backfill is approved.

Before implementation, evaluate the smallest explicit moderator-owned
`geographic_scope` plus evidence contract. Existing country and eligibility fields
remain separate; a global/online opportunity cannot be represented honestly by
country alone.

## Source credibility findings and model

The two aggregators, OpportunitiesForAfricans and OpportunityDesk, account for 103
stored rows. Their pending cohorts contain 33 of the 34 potentially qualifying rows,
all 21 review-required rows, and 44 reject-noise signals. They are useful discovery
leads, not publication authority.

The other 16 active sources are Tanzanian institutional sources. In the latest
scheduled run, only the aggregators produced qualified candidates; several
institutional sources produced candidates that current rules rejected, while most
produced zero candidates. One stored DIT row is the only non-aggregator pending row
currently classified potentially qualifying. This does not justify automatic
deactivation: official sources may be authoritative but sparse.

Use two independent dimensions:

1. **Evidence authority**
   - A: organizer/program/application page directly supports the claim.
   - B: official government, university, company, NGO, or partner announcement
     supports only the facts it explicitly states.
   - C: aggregator, platform, social post, or roundup is a discovery lead that must
     resolve to A/B evidence before publication.
   - D: unverified, inaccessible, prohibited, or contradictory evidence; do not
     publish from it.
2. **Operational source state**
   - productive, sparse/watch, degraded, or inactive, based on measured qualified
     yield, freshness, reachability, duplicate rate, and extraction reliability.

Do not collapse these dimensions: a sparse official site can be authoritative, and
a productive aggregator can still be discovery-only. Never use unauthorized social
scraping.

## Discovery cadence decision

Keep the current six-hour schedule during cleanup.

The latest completed scheduled run on production code SHA
`45283545f466a0a4470d5cc9fc6e03e0f38cdbec` reached 17 of 18 sources in about 68
seconds, produced 51 candidates/77 structurally valid items, rejected 65 for
relevance and one for eligibility, and yielded 11 qualified candidates. Source
health was degraded by one source failure, not a whole-run failure.

The established 23-observation scheduled baseline averages 50.6 candidates, an
82.8% relevance-rejection rate, and 6.5 qualified candidates per run. Its insertion
average is not representative of the now-active M31 production gate. The first
post-activation manual run added 10 pending rows; no post-activation scheduled
window had completed when this plan closed. Do not poll for it.

Evaluate a two-hour or source-specific pilot only after:

- deterministic cleanup and source classification are complete;
- the moderator queue is within demonstrated review capacity;
- enough post-activation scheduled observations exist to measure unique insertions
  by source and time slot;
- source publication/update times show a user-relevant freshness loss at six hours;
- duplicate rate, runtime/Actions use, rate limits, and source terms remain safe; and
- the change has explicit owner approval and a rollback threshold.

Faster polling is not a substitute for useful sources or moderator capacity.

## Reversible execution sequence

### Batch 1 — deterministic test-artifact quarantine (completed)

The owner authorized exactly eight non-rejected deterministic test artifacts. A
fresh production-ref guard matched 271 opportunities, 501 references, status counts
247/19/5, and the expected 3-pending/5-published cohort. No Discovery Sync was
active. A protected manifest was created before the writes, and each update required
the exact ID, original status, and original `updated_at` value.

| ID | Title | Transition |
|---|---|---|
| `24f4731b-ffd6-4bb6-9f11-b73d09a27e09` | hack | published → rejected |
| `3f88a89f-a9d6-4821-9772-6f217792d301` | REGRESSION Bravo - Scholarship rolling | published → rejected |
| `47a4cc61-5515-4949-bb0f-7d5b160d6853` | Institution | pending → rejected |
| `566c4c88-9b68-4b05-a8c6-c113f282f245` | PRODUCTION LINK TEST — DELETE ME | published → rejected |
| `5d81461a-eb3e-4d81-b1db-3636747c75c5` | E-Mrejesho | pending → rejected |
| `95ad7a97-8717-4cc5-aa20-c879fde571ac` | hackkka | published → rejected |
| `9d39f04d-d1f9-4797-8c7c-2f106cbfddd1` | Noticeboard | pending → rejected |
| `f1d24fc8-e5d5-442f-be5a-6feac14aa49a` | REGRESSION Alpha - Hackathon fixed deadline | published → rejected |

Verified post-state: 271 opportunities; 244 pending, 14 published, 13 rejected;
501 references; all 10 deterministic test artifacts rejected. The opportunity-ID,
non-status/non-automatic-`updated_at` field, complete-reference-row, and non-target
status hashes match the pre-change state. Production returned HTTP 200 and none of
the quarantined markers rendered on the homepage.

Protected evidence is outside Git at
`C:\Users\hp\.tech-opportunity-backups\20260911T194524Z-pqd-batch1\`.
Input SHA-256: `9721ae8deda4b1b3ba559d901f1468c6284534ffb869ea47864598fbf5bdd58f`.
Artifact SHA-256 values:

- `pre_change_manifest.json`: `f664eee8275093f8e9db1d0968fe6c0a949a6fbd795b93691d036ad828eebc56`
- `post_change_result.json`: `5681f6455e5f46868f9c5daa0c31c9e685a2d2c349d322197e299b8b6b5891b0`
- `post_change_verification.json`: `e52e64c50689873a62f7ca7b396d20b63d0e7a0ca89ae1e2f9274fc7d58384d9`

The first post-change result recorded `verified:false` because its non-target hash
mistakenly derived the exclusion set from the post-state, where no non-rejected
targets remained. It is retained rather than rewritten. The corrected read-only
verification uses the immutable target IDs from the protected pre-change manifest
and records `verified:true`; every substantive before/after invariant also matched
in the first result.

### Batch 2A — legitimate published re-review triage (completed read-only)

At 2026-09-12, a target-guarded anonymous SELECT confirmed exactly 14 published
rows in production ref `jltuufukcwztugvojwjd`. All remain `unreviewed`, with
unknown stored eligibility and country verification, null qualification version,
null last verification, no M31 decision attribution, and no stored deadline
evidence. Existing references, current organizer pages, official evidence
documents, and official application destinations were inspected without changing
production.

The closure snapshot observed 246 pending / 14 published / 13 rejected = 273
opportunities and 503 references. This is two additional pending rows and two
additional references since Batch 1, consistent with independent discovery growth;
the published cohort stayed at the same 14 exact IDs with the same 27 references
and unchanged legacy trust state. Batch 2A used SELECT operations only.

Evidence confidence measures confidence in the recommendation, not permission to
publish or mutate. **High** means direct organizer/official evidence or a decisive
non-opportunity shape; **medium** still depends on incomplete or discovery-only
evidence. Source authority follows the A-D model above. `Supported` eligibility
requires explicit evidence encompassing Tanzanians; organizer location and generic
global language were not used as substitutes.

| ID / title | Reality, fit, and Tanzania eligibility | Evidence and application trust | Recommendation / confidence | Exact missing evidence |
|---|---|---|---|---|
| `156b20a2-2cb4-4783-ac9b-518225890ee3` — Sahara CodeSwitch Africa Challenge 2026 | Real, current, high-value voice-AI builder challenge. **Supported**: Intron explicitly opens it to builders across Africa and the diaspora. | Stored Opportunity Desk page is C; linked [Intron organizer page](https://www.intron.io/compete/) is A, links registration, and gives a 15 September 2026 deadline. | **Re-review first** / high. | Meaningful description; organizer canonical URL; exact relevance, eligibility, deadline, application and scope evidence; moderator attribution. |
| `ef8defbb-80ea-483a-94a3-194d2637177b` — 16th AAS Biennial Scientific Conference 2026 | Real, current science/technology conference and call for abstracts in Dar es Salaam. **Supported**: official evidence includes Africa-based student delegates and broad researcher/innovator participation. | SUZA partner page and [official circular](https://suza.ac.tz/wp-content/uploads/2026/08/16AAS-Conference-Second-Circur_fin-1.pdf) are B/A; the circular names official AAS/COSTECH routes, a 30 September abstract deadline, and 15–18 December conference dates. | **Re-review first** / high. | Meaningful description; actionable deadline/evidence; organizer/application canonical URL; exact scope evidence; moderator attribution. |
| `01042eca-d009-44b2-b86a-16d1cc3901dd` — YSP Global Policy Brief Competition 2026 | Plausible and research/policy relevant, but organizer identity is unconfirmed. **Unsupported**: inspected text gives ages 16–30 only; “global” is not Tanzania evidence. | Opportunity Desk is C; both information and application lead to one Google Form. The 15 October deadline is not independently organizer-verified. | **Withhold pending stronger evidence** / medium. | Organizer-owned identity/page, rules, accountable contact, explicit eligible geography/nationalities, and proof the form belongs to the organizer. |
| `21dae9a3-991b-48a6-8ab4-7448d1bdc883` — VETA long-course intake January 2027 | Real VETA intake, but one record mixes technical and non-technical courses. **Unknown**: official Tanzanian provenance and Swahili wording do not prove applicant eligibility. | Official VETA page is A and trustworthy; the stored row has no direct application destination, deadline, or deadline evidence. | **Withhold pending stronger evidence** / medium. | Current advert/application document, closing date, applicant rules, one specific technical course/cohort, location, and direct application route. |
| `22222c92-9790-4cc6-8f11-66a18d50038e` — Master of Innovation and Entrepreneurship Management | Real accredited NM-AIST programme, but a standing course page rather than a current bounded call. **Unsupported**: the page does not establish current Tanzanian applicant eligibility. | NM-AIST page/prospectus are A; trustworthy programme information, but no verified current application path or intake deadline. | **Withhold pending stronger evidence** / high. | Current intake notice, application window/link, eligibility, deadline evidence, and justification that general degree admission belongs in product scope. |
| `a6855dd9-1748-4a47-b794-91ec5fe2fae3` — ERASMUS GLOBAL CALL FOR APPLICATIONS | Real SUZA-hosted call, but the stored 15 July 2026 deadline is passed and technology scope is absent. **Unknown**: the available page shell does not expose participant rules. | SUZA is A/B authority; its page delegates facts to a download. The stored deadline has no M31 evidence. | **Withhold** / medium. | Exact call document, disciplines, SUZA/Tanzanian criteria, official application route, and deadline evidence; a future cohort must be open. |
| `e0c271f4-75df-424f-bcd6-49228c0bd7d9` — Twaweza website design consultancy | Real and technology relevant. **Unsupported**: the official page has experience requirements but no applicant geography; East African operations are not eligibility evidence. | [Official Twaweza page](https://twaweza.org/consultancy-opportunity-website-design-and-development/) is A and uses official-domain email; its 12 July 2026 deadline is passed. | **Withhold** / high. | No evidence can make this call current; a new call needs explicit eligibility and a new deadline. |
| `fdfe3e70-848a-4ceb-a1b8-4cb949826aca` — Ogilvy South Africa 2027 graduate programme | Real, but closed and unavailable to Tanzanians. **Excluded** by South African applicant criteria. | Stored Opportunities For Africans page is C; Ogilvy's official application site corroborated the programme and 7 September 2026 deadline, now passed. | **Withhold** / high. | None: exclusion and expiry are decisive. |
| `9d967b53-ed32-49f8-a7c5-46f389299d78` — AIJC Francophone Fellowships 2026 | Real journalism fellowship, but not technology-focused and closed. **Excluded**: exact eligible-country list omits Tanzania. | Stored aggregator is C; [AIJC organizer evidence](https://aijc.africa/) corroborates it. The 4 September deadline is passed. | **Withhold** / high. | None: scope failure, exclusion, and expiry are decisive. |
| `14c76d7b-8d70-4a4a-9131-0ab91697e2c9` — ERASMUS+ KA171 SUZA nominations | Real student mobility call, but closed and not explicitly technology-scoped. **Supported, restricted** to current SUZA students. | [Official SUZA notice](https://suza.ac.tz/?p=19005) is A/B, gives an official coordinator route and 24 April 2026 deadline, now passed. | **Withhold** / high. | No evidence can make this cohort current; a future call must also show technology/research relevance. |
| `98559cb8-183e-482f-972e-ad3b7b3636ba` — SUZA minister inspects HEET projects | Genuine official news, not an application opportunity. **Unsupported**: no applicant cohort exists. | [Official SUZA article](https://suza.ac.tz/?p=19692) is credible reporting, not an application URL, and has no applicant deadline. | **Withhold** / high. | None: institutional news is not an opportunity candidate. |
| `f6a0f5eb-5fcb-4692-a3b0-f9d621013d73` — UNIVERSITY OF DAR ES SALAAM | Genuine institution homepage, not a discrete opportunity. **Unsupported** for this record: no applicant cohort is identified. | Official UDSM domain is A and trustworthy, but neither a specific opportunity nor its application route; no record-level deadline. | **Withhold** / high. | None; separately discovered UDSM calls require their own records and evidence. |
| `1b3649a0-b694-4475-8ed8-2ce0582482e6` — 30 Hot Job Opportunities roundup | Real aggregator article, but 30 unrelated jobs are not one opportunity. **Unsupported**: eligibility varies per job. | Opportunity Desk is C; no single organizer, application URL, or deadline applies to the stored row. | **Withhold** / high. | None for the aggregate; qualifying jobs require separate organizer-level records. |
| `3710047a-e8b9-4a9f-a17d-cf39e304ee89` — Digital Financial Services and Financial Technology in Tanzania | Real, credible fintech analysis, not an application opportunity. **Unsupported**: no applicant cohort exists. | [Official FSD Tanzania article](https://www.fsdt.or.tz/2024/11/29/digital-financial-services-and-financial-technology-in-tanzania/) is A/B research content, not an application action, and has no deadline. | **Withhold** / high. | None: evergreen sector analysis is not an opportunity candidate. |

Triage totals: zero untouched rows meet the complete M31 publication contract; two
are high-confidence current re-review candidates and twelve should be withheld
unless/until their stated evidence gap is resolved. Eligibility is supported for
three, excluded for two, unsupported for seven, and unknown for two. Recommendation
confidence is high for 11 and medium for three. These are planning findings only;
all 14 remained published at Batch 2A close.

No conservative duplicate identity was established among the 14. Shared aggregator
or institutional base URLs are source overlap, not duplicate proof.

### Batch 2B1 pre-write execution gate — stopped fail-closed

At `2026-09-12T03:30:12Z`, the exact two-ID authorization was received and a
read-only preflight was completed against production ref
`jltuufukcwztugvojwjd`. The URL host and service JWT independently matched that
ref, the service credential carried the `service_role` claim, and an anonymous
query independently returned both exact targets as published. Production held 273
opportunities (246 pending / 14 published / 13 rejected / 0 expired) and 503
references. Exactly one staff profile had the `moderator` role and none had the
`admin` role.

Both target rows still had their Batch 2A legacy state: published, unreviewed,
eligibility unknown, country verification unknown, null qualification and last
verification values, no M31 decision attribution, and no deadline evidence. Sahara
had two references and AAS had two references. The opportunity-ID-set hash was
`e83809e7c360328e848afb145064f3ab4ea12c2a976fd6d28110278da1c98b12`, the
reference-ID-set hash was
`1c2c6ced28ac653ce6b8767c487d68672fafe9e5f87e9a928e92f1b0fa0c339a`, and the
271-row non-target snapshot hash was
`831736c7c61dec1415c401b983fafe3af797267bf623ef06a047edeec7c01f02`.

Fresh evidence still supports both proposed re-reviews:

- Sahara's [official Intron challenge page](https://www.intron.io/compete/) names
  the CodeSwitch Africa Challenge, the voice-AI build/benchmark task, a USD 10,000
  prize pool, eligibility for builders across Africa and the diaspora, solo/team
  participation, and the 15 September 2026 registration/final-submission date. Its
  registration control leads from the organizer page to the application form. This
  supports technology relevance, Tanzanian eligibility, a date-precision deadline,
  and an organizer-owned canonical evidence/application route. It does not support
  the legacy fabricated Tanzania country value; country must remain evidence-labelled
  unknown with no country evidence for this online Africa-wide challenge.
- The current [official AAS event site](https://events.aasciences.africa/) confirms
  the 16th conference, 15–18 December 2026 in Dar es Salaam, its science,
  technology and innovation focus, and official registration and abstract controls.
  The [official SUZA-hosted conference circular](https://suza.ac.tz/wp-content/uploads/2026/08/16AAS-Conference-Second-Circur_fin-1.pdf)
  gives the JNICC/Shaaban Robert Street venue, a 30 September 2026 abstract deadline,
  broad researcher/innovator participation, an Africa-based student category, and
  the official COSTECH abstract route. Together these support relevance, Tanzanian
  eligibility, verified Tanzania location, a date-precision deadline, and trusted
  application routes.

No write was attempted. Source truth exposed a hard execution conflict: the current
protected published-management action performs `published → rejected` and writes
status only, while the M31 approval action accepts only `pending` rows. Therefore the
documented `published → pending → approve` sequence does not exist. The in-app
browser reported no available browser, Windows Computer Use could not connect to its
native helper, and no authenticated Moderator session or credential is present in
the repository environment. A service-role update attributed to the sole Moderator
would impersonate a human decision and bypass the required Moderator boundary, so it
was deliberately refused.

Consequently both rows and all references are unchanged, neither row yet satisfies
the M31 publication contract, and Batch 2B1 is not complete. No rollback manifest was
needed because the write gate never opened; the established recovery baseline remains
untouched. Temporary preflight tooling must be removed before closure. Batch 2B1 may
resume only after a controlled authenticated production Moderator session and a
tested, explicitly authorized published-record re-review transition are available.
Do not reinterpret the current reject-only unpublish action as a pending requeue and
do not substitute service-role impersonation.

### Published re-review capability — blocker resolved on staging

Root cause was an application transition gap, not a schema defect. The pending
decision action selected and updated only `pending` rows, while published management
offered only the protected status-only `published → rejected` action. Consequently
there was no authenticated, attributable way to refresh evidence on a row that still
qualified and should remain published.

Staging commit `558e41d` extends the existing architecture rather than adding a new
one:

- the existing M31 parser, category/organization checks, evidence payload, field
  audit generation, Auth/RLS staff context, and public publication predicate are
  reused;
- published mode loads one exact `published` ID and exposes the same review form
  without a reject button;
- before any write, the exact proposed post-review record must pass
  `isAiSearchableOpportunity`; then the update requires the same ID, current
  `published` status, and unchanged previous `decided_at` value;
- `status` remains `published`, authenticated `staff.userId` becomes `decided_by`,
  and one timestamp is used for `decided_at` and `last_verified_at`; and
- references, discovery provenance, source attribution, submission attribution, and
  other unrelated fields are absent from the update payload.

No migration, schema/RLS change, role change, dependency, service credential, or
generic workflow abstraction was required. Pending approval and protected unpublish
remain independent actions.

The exact commit reached Ready on isolated staging deployment
`dpl_HDB1kESr5Wbir5JgcjGmJoLb2tsX`. Three disposable local-domain identities
(User A, User B, Moderator) and five tagged opportunities proved the live boundary:

- Moderator re-review access 200; anonymous access 307 to sign-in; ordinary user
  access restricted; ordinary and anonymous action submissions made no change;
- incomplete eligibility evidence made no change;
- evidence-complete re-review kept the row published and persisted relevance,
  eligibility, geography, deadline/application evidence, M31 rule version, exact
  Moderator attribution, and paired timestamps;
- six applicable enrichment audit rows persisted and the canonical reference count
  was unchanged;
- pending approval still produced an attributed publication;
- User A/User B save isolation and ordinary/anonymous opportunity-update denial
  remained intact; and an unrelated sentinel did not change;
- published management remained staff-only; its existing unpublish payload and live
  Moderator RLS transition changed only status (plus automatic `updated_at`) and
  retained audit data. The 43-assertion protected-unpublish suite also remained green.

All disposable data and Auth identities were deleted after verification. Staging
returned to 6 opportunities, 9 references, and zero Auth users/profiles/saves. The
pre/post opportunity hash was `ab054f0594a72fce6eea4823feb3625a`; the pre/post
reference hash was `585a8bd3bf8f39fcc11e00f67d596b3b`. No recovery rollback was
needed, and all transient scripts, credentials, link metadata, and generated files
were removed.

#### Exact future cohorts requiring explicit mutation authorization

Writes remain bounded by the recorded authorization and recovery/identity gates:

1. **Batch 2B1 — current high-value re-review:**
   `156b20a2-2cb4-4783-ac9b-518225890ee3` and
   `ef8defbb-80ea-483a-94a3-194d2637177b`. Existing authorization is limited to
   these two IDs. The transition is deployed and tested, but a controlled
   authenticated production Moderator session is still required. Process Sahara,
   verify, and then process AAS; never take both public records offline simultaneously.
2. **Decisive withhold cohort:** `98559cb8-183e-482f-972e-ad3b7b3636ba`,
   `fdfe3e70-848a-4ceb-a1b8-4cb949826aca`,
   `9d967b53-ed32-49f8-a7c5-46f389299d78`,
   `f6a0f5eb-5fcb-4692-a3b0-f9d621013d73`,
   `1b3649a0-b694-4475-8ed8-2ce0582482e6`, and
   `3710047a-e8b9-4a9f-a17d-cf39e304ee89`.
3. **Expired call cohort:** `a6855dd9-1748-4a47-b794-91ec5fe2fae3`,
   `e0c271f4-75df-424f-bcd6-49228c0bd7d9`, and
   `14c76d7b-8d70-4a4a-9131-0ab91697e2c9`.
4. **Evidence-acquisition cohort:** `01042eca-d009-44b2-b86a-16d1cc3901dd`,
   `21dae9a3-991b-48a6-8ab4-7448d1bdc883`, and
   `22222c92-9790-4cc6-8f11-66a18d50038e`. Do not request mutation until the
   missing evidence is obtained or the owner explicitly authorizes withholding
   based on insufficiency.

### Published re-review capability — production promotion (completed)

- The exact staging capability commit `558e41d` was isolated from the broader branch
  delta and cherry-picked as production runtime commit
  `070c32fb07f147a79626d9e7988767c5f476f373`.
- The promoted delta is limited to three moderation/management UI files, two shared
  moderation modules, three test/boundary files, and the `package.json` test-command
  registration. No temporary staging verifier, lockfile/dependency, migration,
  schema/RLS, workflow, source/discovery, or corpus change was included.
- Local `verify:ci`, the production build, and GitHub Milestone verification run
  `34691899295` passed. Vercel GitHub production deployment `6409251328` completed
  successfully at `2026-09-12T11:46:23Z`; the canonical alias returned HTTP 200.
- Anonymous production access to the published re-review and published-management
  routes returned 307 to sign-in. The homepage and both Batch 2B1 public details
  returned 200.
- A target-guarded anonymous SELECT bound to production ref
  `jltuufukcwztugvojwjd` confirmed Sahara and AAS remain published in their original
  legacy unreviewed/unknown/unattributed state with null M31 evidence/decision fields,
  unchanged `updated_at`, and two references each. No moderation/corpus mutation was
  attempted.
- The required `package.json` test registration matched the existing discovery
  workflow's production-sensitive push filter. Completed run `34691899256` reported
  18 sources attempted / 17 succeeded / 1 isolated failure, 10 qualified candidates,
  and `insertedPending: 0`; therefore that automatic run also left the corpus intact.
- The prior Ready Vercel deployment and protected database recovery artifacts remain
  available. Temporary production-smoke tooling was removed.

### Batch 2B1 — Sahara re-review first, then AAS (exact next milestone)

- Use the existing exact two-ID authorization and establish a controlled,
  authenticated production Moderator session. The profile's existence alone is not
  a usable or attributable session; never substitute service-role impersonation.
- Confirm the production deployment exposes the staged, tested published re-review
  path before any corpus write.
- Create a protected pre-change manifest and use the production/staging identity,
  concurrency, and no-overlap gates. Do not use the all-legacy requeue path.
- Process Sahara first and AAS second, one at a time through the validated path, with
  evidence-complete moderator review and post-change proof before touching the second
  ID.
- Preserve every reference and provenance field. If canonical URLs change, retain
  prior aggregator/partner URLs as non-canonical references.
- Stop after these two records; the other 12 require separate authorization.

### Batch 3 — salvage priority pending rows

- Review the 34 potentially qualifying rows before spending effort on likely noise.
- Then review the 21 insufficient-evidence rows for possible authoritative evidence.
- Resolve duplicate signals before publication. Never merge on fuzzy similarity.

### Batch 4 — reason-coded pending rejection

- Partition the 192 reject-noise signals by exact reason and source.
- Freeze IDs and current statuses, review the evidence for each bounded cohort, and
  update status only for confirmed noise/ineligibility/staleness.
- Report false-positive rates back into qualification/source rules before the next
  cohort. No deletion and no threshold weakening.

### Batch 5 — source, geography, and taxonomy implementation planning

- Use the cleaned corpus to finalize operational source states and field-level
  authority rules.
- Validate the National/International evidence model and opportunity-type mapping.
- Only then propose the smallest schema/UI/registry changes as separate owner-gated
  milestones.

## Recovery and verification contract for every mutation batch

Before a write:

1. verify production/staging identities independently and bind the command to the
   verified production ref;
2. confirm no overlapping discovery or moderation operation;
3. create a protected, checksummed pre-change ID/status/updated-at manifest outside
   Git, or a stronger fresh recovery artifact when the batch affects more fields;
4. record the exact input hash, cohort size, allowed fields, expected count deltas,
   and rollback transition; and
5. use exact-ID/concurrent-status guards and failure-stop behavior.

After a write, prove total/status counts, non-target immutability, reference
integrity, RLS/public behavior, affected moderation flows, application availability,
secret/dump exclusion, documentation, and clean Git state. Roll back only from the
protected pre-change manifest if a declared invariant fails.

The read-only planning milestone used the established recovery baseline. Batch 1
added the protected checksummed status manifest and post-change evidence documented
above, because production status changed. Follow
[DATABASE_RECOVERY.md](DATABASE_RECOVERY.md) for broader recovery.

## Explicit non-goals

Apart from the completed, explicitly authorized Batch 1 status transitions, this
plan does not authorize further corpus mutation or any deletion, source activation
or deactivation, schema/category change, National/International UI, schedule change,
migration-history repair, AI, infrastructure, Auth, Vercel, or Supabase
configuration change.
