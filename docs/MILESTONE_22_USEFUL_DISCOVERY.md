# Milestone 22 - Reliably useful discovery

Date: 2026-09-01

## A. Architecture assessment

The architecture remains intact: registry source -> guarded `fetchPage` ->
adapters -> normalization/detail -> qualification -> dedupe -> pending-only
insert -> human moderation. No service, table, migration, route, dependency,
client state, source activation, schedule, AI, or publication behavior changed.

Starting HEAD: `850f4d683fe6005b251a7e6037594ea5bc9d4e5a`, clean and equal to
`origin/main`. GitHub run
[#8](https://github.com/mohamedalizan2025-cpu/techopportunity-tanzania/actions/runs/33545030490)
independently verified that exact SHA: success, `18:40:33Z` to `18:42:14Z`.

Actual defects found:

1. `2027/2028 ... Fellowships` was parsed as a 2,028-item roundup. Run 8
   consequently inserted the real Schlumberger parent plus three unrelated or
   navigational child rows from its page.
2. Institutional homepages could send ambiguous course, article, project,
   membership and navigation headings into moderation without opportunity
   evidence.
3. A real call could be classed relevant solely because it was a scholarship,
   internship, job, conference or admission, without technology-product fit.
4. Prior-year-only cohorts remained actionable for an extra year.
5. The read-only replay omitted `source_type`, so it could not exercise a
   source-aware contract even though the production loader supplied the field.

The database after run 8 was measured read-only at 233 rows: 211 pending, 17
published, 5 rejected. No row was cleaned, rejected, merged, rewritten, or
otherwise modified in M22.

## B. Quality improvements

### Relevance and source qualification

- Every future record now needs positive technology/research/innovation scope
  evidence: technology, software/developer/coding, data/AI, digital, science or
  engineering, research, innovation/startup/entrepreneurship, fintech and
  related explicit signals. Generic opportunity wording is insufficient.
- Admissions are explicitly outside the discovery product boundary.
- Institutional source types (`university`, `government`, `ngo`, `company`,
  `scholarship_provider`) may not send an otherwise ambiguous heading to the
  queue. Explicit action or target-family evidence remains accepted.
- A title whose newest cohort year is before the current UTC year is stale;
  cross-year titles containing the current year remain reviewable.
- The run uses one fixed qualification time, avoiding a year-boundary change
  between candidates.

### Eligibility

The exact evidence “Applicants must hold the nationality of a World Bank Group
member country” now establishes Tanzanian access. This is narrowly justified:
the official [YPP requirements](https://www.worldbank.org/ext/en/careers/talent-programs/young-professionals-program)
use that exact contract and the current official [member-country list](https://www.worldbank.org/en/about/leadership/members)
lists Tanzania. Generic “member country” wording remains unknown. Geography,
organizer, `.tz`, “international”, venue and source country remain non-evidence.

### Roundup acquisition

Roundup counts must now be at least two and cannot be a 2000-2099 cohort year.
Thus `30 Scholarships ... 2027` still expands, while `1 Fellowship ...` and
`2027/2028 ... Fellowships` do not. Existing run-8 artifacts were not touched.

### Source-specific findings

| Class | Finding |
|---|---|
| Productive | OFA inserted all five run-8 rows and currently exposes the strongest detail-backed technical/research calls |
| Useful but noisy | OpportunityDesk and SUZA expose real calls but also general jobs/news or duplicated extraction |
| Weak/noisy | NM-AIST produced 33 ambiguous course/index/article survivors before the new gate; FSDT produced 22 ambiguous articles; the other institutional sources were similarly dominated by non-opportunity material |
| Failing | None: final replay acquired all 18 sources successfully |
| Redundant | FSDT duplicated articles across extraction paths; OFA/OpportunityDesk overlap remains dedupe work, not a reason for one-run deactivation |

No active source was enabled, disabled, or reprioritized in production.

Zindi, Devpost and MLH were probed through the existing guarded adapters.
Zindi yielded zero extractable records, Devpost yielded one generic navigation
record rather than hackathons, and MLH yielded no actionable event record.
They remain future adapter candidates; no speculative registry row was added.

## C. Discovery impact

Run-8 production baseline supplied by the owner and reconciled to the five live
rows:

- 216 found, 178 structurally valid, 36 relevance rejects, 6 eligibility
  rejects, 134 eligibility unknown, 129 duplicates, 7 post-dedupe candidates,
  2 category skips, and 5 pending inserts;
- all 18 sources succeeded; 10/10 detail fetches succeeded; no source-health or
  worker error occurred.

The five inserts were one WBG technical/managerial programme, the real
Schlumberger STEM fellowship, and three false roundup children. Therefore the
measured first-run precision was 2/5 for row identity/product fit. This is
measurement only; all five remain pending.

Same-live-pages, read-only replay impact (pre-dedupe):

| Stage | Before M22 source/product gates | Final M22 |
|---|---:|---:|
| Queue survivors | 124 | 8 |
| Relevance rejects | 35 | 154 |
| Eligibility rejects after relevance | 5 | 2 |
| Eligibility-unknown survivors | 121 | 5 |
| Explicit-access survivors | 3 | 3 |
| Sources acquired | 18/18 | 18/18 |
| Detail fetches | 10/10 | 10/10 |

The final eight are five OFA technical/research records, one OpportunityDesk
job roundup whose children are still independently qualified, and two SUZA
scientific-conference extraction duplicates that dedupe collapses. This is a
dry-run measurement, not a GitHub production result. Post-M22 production impact
is **NOT PROVEN** until a current-head run is correlated.

Expected effect: dramatically fewer institutional/article/admission/general
opportunity false positives; lower eligibility-unknown workload because
non-opportunities leave before accessibility review; no weakening of explicit
eligibility, detail, noise, or dedupe gates.

## D. Tests and build

- Focused extraction: 97/97 passed.
- Focused qualification: 41/41 passed.
- Complete suite: **393/393 passed**.
- `npx tsc --noEmit`: clean.
- ESLint: clean.
- Single `next build`: reached optimized compilation and failed only while
  fetching Geist and Geist Mono from Google Fonts. No application/type defect
  surfaced; the established environment network limitation remains.

## E. Security review

- `fetchPage` remains the sole discovery `fetch()` implementation.
- HTTP(S)-only, SSRF hostname screening, every-hop redirect validation,
  three-redirect limit, 2 MB response cap, 20-second hop timeout and bounded
  one-hop detail/roundup behavior are unchanged.
- No application link is fetched for extra scraping.
- No secret value was printed or persisted. Service-role references remain
  absent from public `app/`, `components/`, `lib/`, `proxy.ts` and Next config.
- The discovery insert payload remains hardcoded `status: "pending"` with no
  submitter or organization authority.
- Production probes: browse/search/filter and known published detail 200; run-8
  pending detail 404; moderation 307 to login; assistant `mode: disabled`.
- RLS, moderation authorization, public/private route separation, provenance
  and human publication authority were not changed.

Status: no new security finding.

## F. Git

The ending commit is the pushed commit containing this report; its exact SHA is
recorded in the final handoff because a commit cannot embed its own SHA. Final
handoff also records `HEAD == origin/main` and clean working-tree verification.

## G. Remaining risks

- M22 logic has no current-head GitHub production run yet: **NOT PROVEN**.
- Repeat scheduled execution is still not proven; run 8 is one manual success.
- Five final replay survivors still have unknown Tanzania accessibility and
  must remain pending for moderators.
- Detail acquisition remains measured/allowlisted only for OFA and
  OpportunityDesk.
- Zindi is a high-fit expansion candidate but needs a new bounded adapter and
  item-level eligibility proof; Devpost/MLH also need item-boundary work.
- Historical pending quality and run-8 artifacts remain unchanged by owner
  decision.
- Existing daily cron `0 3 * * *` remains unchanged. Six-hour readiness is not
  claimed.

## H. Next recommended milestone

**Milestone 23 - Post-M22 current-head production correlation.** Dispatch one
run on the pushed M22 SHA, preserve the complete JSON, correlate new pending
rows, and verify that year-prefixed single opportunities do not expand and
institutional/product-scope rejects appear per source. Then observe at least one
later independent scheduled or manual run before any six-hour schedule change.

Owner action after push: GitHub Actions -> Discovery sync -> Run workflow ->
`main`, exactly once; preserve the complete `Run discovery worker` JSON. Do not
clean the database or change the cron.
