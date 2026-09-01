# Milestone 16 - Opportunity quality and Tanzania accessibility

Date: 2026-09-01  
Scope: product-quality execution only; architecture audit remains closed.

## 1. Current inventory quality

Read-only live census: **213 total / 191 pending / 17 published / 5 rejected / 0 expired**.

| Dimension | Live result |
|---|---:|
| Category | other 169; fellowship 25; scholarship 6; competition 4; grant 3; internship 2; hackathon 2; conference 2 |
| Discovery method | HTML 145; RSS 61; manual/none 7 |
| Country | Tanzania 213 (legacy schema default, not eligibility or verified location) |
| Region | unknown 210; Mjini Magharibi 2; Kusini Unguja 1 |
| City | unknown 208; Zanzibar 3; Arusha 2 |
| Deadline | unknown 208; future 3; past 2 |
| Exact URL duplicates among non-rejected | 0 |

A conservative title/description census produced these measurement-only
classes: actionable-looking 51 (23.9%), institutional/news 20 (9.4%),
explicit wrong nationality 9 (4.2%), ambiguous 128 (60.1%), test/manual
artifacts 5 (2.3%). The 51 is an upper bound, not a verified count: it
includes false positives such as a news headline containing the word "jobs."

The implemented deterministic model classifies the same historical set as
36 relevant / 146 ambiguous / 31 not relevant, and 1 explicitly eligible /
206 eligibility unknown / 6 explicitly excluded. It does not rewrite these
historical rows.

## 2. Exact sources of irrelevant or ambiguous content

- NM-AIST: 37 rows; 34 ambiguous course/research/project pages, 2 clear
  institutional programme indexes, and the only superficially actionable
  title is actually a graduation/news headline.
- FSDT: 13/13 ambiguous content pages.
- Ifakara Health Institute: 11/11 ambiguous content pages.
- Sokoine University: 10 rows, including navigation, newsletters, maps and
  generic university material; no clearly actionable title in the census.
- Bank of Tanzania: 8 rows, including Financial Sector Supervision and an
  Advertisements/tender landing page; no clearly actionable opportunity.
- SUZA: useful calls exist, but the same feed contributes awards/news,
  cooperation stories and project updates.
- DIT: real applications coexist with ministry links, regulator links,
  timetables, project links and event news.
- OpportunitiesForAfricans: useful density but current roundup expansion
  followed related/navigation links into 2013-2018 historical opportunities
  and national programmes for Kenya, Nigeria and South Africa.
- OpportunityDesk: useful density and explicit deadlines on article pages,
  but the feed summaries omit the deadline/eligibility text and include
  country- or institution-restricted opportunities.

## 3. Tanzania accessibility problem

The live schema has no `eligibility` or `eligibility_evidence` columns;
migration 0005 is designed but not applied. Every live row still has
`country = Tanzania` from the legacy default, including global and explicitly
foreign-only opportunities. Therefore country, source country, organizer,
URL and location cannot answer whether Tanzanians may apply.

Current explicit wrong-nationality examples include:

- Kenya AI Accelerator for Kenyan startups and innovators.
- KPMG and Sanlam graduate programmes for young South African graduates.
- Ogilvy Giants for young South Africans (currently published).
- Sasol programme for young South Africans.
- Heirs Holdings programme for young Nigerian graduates.
- She Leads Africa BoostHer for young Nigerian women entrepreneurs.
- Fuller Fellowship for young Asian changemakers.

## 4. Qualification model and implemented boundary

`scripts/discovery/qualification.ts` has three independent dimensions:

1. relevance: `relevant | ambiguous | not_relevant`;
2. Tanzania accessibility: `tanzanians_eligible | unknown | tanzanians_not_eligible`;
3. evidence quality: `explicit | limited | none`.

It emits the matched evidence text and no aggregate score. Clearly
not-relevant or explicitly excluded candidates stop before dedupe/insert.
Ambiguous relevance and unknown eligibility continue to pending moderation.
The model never consumes source country, organizer, URL, language, physical
location, or the bare words "international" and "global" as eligibility.

Post-change read-only dry-run: 18 active sources, 24 successful fetches,
164 structurally valid candidates -> 26 relevance rejects + 1 explicit
eligibility reject + 137 moderation survivors. All 137 survivors retain
eligibility unknown; 0 have deadline or location evidence. This is a
measurable noise reduction without deleting uncertainty.

## 5. Best Tanzania and Zanzibar source candidates

| Source | Evidence and acquisition assessment | Decision |
|---|---|---|
| [COSTECH MAKISATU](https://makisatu.costech.or.tz/costech/makisatu) | Official public HTML; individual annual application; explicitly all Tanzanians, Mainland and Zanzibar; technical/financial support; application path; detail PDF. High trust and relevance, low volume. | Probe as a stable annual source; do not activate until recurrence/robots are verified. |
| [ICT Commission national hackathons](https://tanzaniastartups.ictc.go.tz/acceleration-programs/national-ict-hackathons) | Official public HTML; strong Tanzania tech audience; says nationwide/all Tanzanian innovators, but currently a programme description without a live call or deadline. | Monitor, not inventory. |
| [Zanzibar Technology and Business Incubator application](https://ztbi.go.tz/online-application/) | Official public page and downloadable application form; direct entrepreneurship path, but no deadline or current cohort evidence on the page. | Candidate for manual verification; eligibility/deadline unknown. |
| [Silicon Zanzibar](https://siliconzanzibar.or.tz/about) | Public ecosystem/event directory backed by local ecosystem organizations; mixed stories/events and user submissions; no proven high-density individual opportunity feed. | Discovery lead only. |
| SUZA | Some real calls/conferences and Zanzibar relevance, but high news/institutional noise. | Keep only behind qualification; seek a calls-only endpoint. |
| DIT | Real scholarship/admission calls coexist with substantial navigation noise. | Keep behind qualification; prefer news/calls detail feed if available. |

## 6. Best global and African source classes

| Source | Why it is useful | Required caution |
|---|---|---|
| [Africa's Business Heroes](https://www.africabusinessheroes.org/en/) | Official annual prize, individual application, all 54 African countries, explicit deadline and rules. | Low frequency; verify current call state. |
| [GSMA Innovation Fund](https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-for-development/gsma-innovation-fund/the-gsma-innovation-fund-for-impactful-ai-faqs/) | Official fund pages name Tanzania in eligible-country lists and provide call-specific rules. | Calls change; ingest individual call pages only. |
| [Zindi rules](https://zindi.world/rules) | Public AI/data-science competitions with individual rules; platform baseline is public participation. | Some competitions have geographic restrictions; qualify every item. |
| [Kaggle competitions](https://www.kaggle.com/competitions) | High-density AI/ML competitions; individual rules and timelines; global baseline with explicit exceptions. | Per-competition restrictions and terms; no assumed API entitlement. |
| [MLH season schedule](https://www.mlh.com/seasons/2027/events) | Public, dense, individual event pages, dates and digital/worldwide labels. | Most events are in-person and item eligibility differs; schedule location is not eligibility. |
| Devpost | Public individual hackathon pages and mandatory rules; some explicitly say worldwide. | Organizer-specific eligibility; no headless scraping or assumed public API. |
| [Google Summer of Code](https://summerofcode.withgoogle.com/get-started) | Official annual developer programme with explicit contributor conditions. | "Non-embargoed country" must be resolved from authoritative evidence, not assumed. |
| [TWAS fellowships](https://twas.org/opportunities/fellowships) | Official individual PhD/postdoc pages with open/close dates; some programmes explicitly name Tanzania. | Programme-specific nationality and host-country rules. |
| [UNICEF internships](https://www.unicef.org/careers/internships) | Official high-density portal, item pages and deadlines. | Many positions are national/resident-only; item-level qualification is mandatory. |
| [NeurIPS calls](https://neurips.cc/Conferences/2026/CallForCompetitions) | Official research/AI calls with a central dates page. | Low volume and different applicant types; not a generic events feed. |

## 7. Permitted social-source options

- Instagram: the official API is for connected professional Business/Creator
  accounts and cannot read arbitrary consumer accounts. Organization opt-in
  via OAuth is permitted; general opportunity scraping is not.
- Facebook: use an approved Graph API permission for pages the owner/admin
  authorizes. Meta states automation without permission violates its terms.
- LinkedIn: Community Management is a vetted product; reading organization
  posts is restricted to organizations where the authenticated member has an
  authorized page role. `r_member_social` is closed/restricted. No general
  LinkedIn scraping.
- TikTok: the Research API is for qualified non-commercial researchers in
  limited regions and is not a product-discovery channel for this Tanzania
  service.
- Compliant alternatives: organization websites, public RSS/Atom feeds,
  official newsletters, public APIs, event calendars, and organization-
  submitted links/forms.

## 8. University/admission findings

Genuine: DIT WISE Scholarship, DIT 2026/27 engineering/diploma application,
SUZA Erasmus calls, VETA 2026/27 application form. Potentially useful but
ambiguous: individual NM-AIST technology graduate programmes without a
current application/deadline. Generic notice: programme indexes, generic
online application, selected-student lists. Institutional/news: university
homepages, timetables, awards, cooperation stories, newsletters and quick
links. The implementation rejects only the clear classes; ambiguous course
and programme pages remain for human review.

## 9. International opportunity test

| Opportunity | Result for queue |
|---|---|
| COSTECH MAKISATU | Relevant + explicitly Tanzanians eligible -> yes. |
| Africa's Business Heroes | Relevant + all 54 African countries -> yes. |
| Cybersafe x SANS AI Security Fellowship | Relevant + African resident evidence -> yes. |
| GSMA Impactful AI Fund | Relevant + Tanzania named -> yes when call is open. |
| Devpost Work-a-thon | Relevant + explicitly open all over the world -> yes when live. |
| Kaggle global competition | Relevant + worldwide with closed exception list -> yes when Tanzania is not excluded by item rules. |
| Defra R&D Fellowship | Relevant, but UK/right-to-work conditions make Tanzania accessibility conditional/unknown -> keep pending, never label eligible automatically. |
| Anita Hill Scholarship | Relevant, but requires enrollment in a US law school and has no Tanzania statement -> eligibility unknown. |
| Kenya AI Accelerator / South African graduate programmes / Nigerian BoostHer | Relevant + explicit exclusion -> no queue entry. |

## 10. Deadline evidence census

High-value eight-page sample:

- A, explicit parseable deadline: 4 (Cybersafe September 10; Defra September
  14; Anita Hill September 22; WCSJ October 23).
- B, explicit but ambiguous: 0.
- C, explicit rolling/no fixed date: 0.
- D, no deadline found: 3 (DIT WISE summary, SUZA conference page, complete
  four-page VETA application PDF).
- E, unreachable: 1 (YUNA Stanbic internship page).
- F, deadline only in attachment: 0 confirmed.

This justifies a focused article-detail acquisition + explicit label parser,
not a date guesser. Publication dates, event dates, URL dates and feed dates
remain forbidden deadline substitutes.

## 11. Six-hour readiness

Current workflow cron is daily at `0 3 * * *`. Observed local dry-run is
about 53 seconds for 18 sources / 24 fetches; the last recorded full
validation run was about 49 seconds and 177/215 candidates were duplicates
(82%). Four runs/day is modest at observed load, but the system is **not
operationally ready**:

1. the two newest scheduled GitHub runs now check out current HEAD and pass
   install/tests/typecheck/lint, but the worker fails in about one second;
   the public annotation exposes only exit code 1, so the owner must inspect
   the private log/secret state;
2. the latest `schedule` event started around 08:09 UTC despite the 03:00 UTC
   cron, so recurrence timing is not yet demonstrated;
3. current survivors have 0 deadline evidence and 137/137 eligibility
   unknown in the post-change dry-run.

After one green manual run and deadline-detail acquisition proof, change the
cron to `0 */6 * * *`. Do not change it before those gates.

## 12. A/B/C/D disposition

- **A - implement now:** deterministic three-dimension qualification;
  relevance/exclusion counters; dry-run measurement; tests; documentation.
- **B - design / owner gate:** apply migrations 0005 (eligibility), 0008
  (country honesty), 0009 (moderation attribution), plus existing 0004/0010;
  inspect GitHub discovery-step log and secrets; run one manual workflow;
  owner moderation of historical wrong/test/news rows.
- **C - defer:** item-detail acquisition and explicit deadline/eligibility
  parsers; qualified source additions; six-hour cron; staff UX verification;
  assistant activation.
- **D - reject:** social scraping bypasses, fake accounts/cookies, headless
  restricted-platform scraping, location-based eligibility, an opaque score,
  LLM classification, embeddings/vector DB, auto-publication, historical
  bulk rewriting.

## 13. Security, production, git and architecture

- Acquisition remains public allow-listed HTTP only; no social bypass added.
- Service role remains server/workflow-only; candidate inserts still use the
  anon client and pending-only RLS path.
- Moderation remains authoritative; provenance fields are unchanged; no DDL,
  RLS, public write path, secret, AI provider or database row changed.
- Implementation commit `1a60598` was pushed to `origin/main`. Post-push
  production checks returned 200 for homepage, search, category/deadline
  filters and a published detail; pending and rejected details returned 404;
  `/moderation` redirected to login; and the assistant API returned its
  explicit disabled response. No signed-in staff UX claim is made.
- Verification passed: 319 tests, ESLint and `tsc --noEmit`. The single
  permitted production-build attempt reached Next.js compilation and then
  failed because this sandbox could not fetch Google-hosted Geist font files;
  it did not report an application code or client/server boundary failure.
- New architectural defect: none. Qualification fits the existing boundary
  between validation and dedupe. Architecture score remains **9.7/10**.

## 14. Highest-value next milestone

Build bounded **individual-detail acquisition for the best source families**
(starting with OpportunityDesk/OFA articles and one official Tanzania call
source), extract only explicit deadline and eligibility statements, preserve
the exact evidence URL/text, and prove the result in a dry-run before any
schema activation or six-hour schedule change.
