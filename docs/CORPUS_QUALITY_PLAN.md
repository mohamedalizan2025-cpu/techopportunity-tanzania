# Corpus quality and cleanup plan

Status: planning baseline completed 2026-09-11. No corpus, source-registry,
schedule, schema, environment, or infrastructure mutation was performed.

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

### Batch 1 — deterministic test-artifact quarantine (exact next milestone)

- Re-audit and freeze the exact cohort immediately before mutation.
- Expected baseline: 10 test artifacts; two already rejected; three pending and five
  published require `status -> rejected`.
- Change status only. Delete nothing and do not rewrite trust, evidence, references,
  timestamps, source links, or unrelated rows.
- Extend/reuse the guarded remediation path with an exact confirmation and
  concurrency checks; do not issue ad-hoc broad SQL.
- Requires explicit owner authorization for the bounded production mutation.

Expected post-state if the fresh preflight still matches: 271 total, 244 pending, 14
published, 13 rejected, zero non-rejected test artifacts, and 501 references.

### Batch 2 — legitimate published corpus re-review

- Review the 14 legacy publications in small per-ID batches, strongest/current
  opportunities first.
- Keep a useful public inventory online; never requeue all 14 simultaneously.
- Record relevance, Tanzanian eligibility, deadline semantics, country/scope,
  meaningful description, canonical/application evidence, decision attribution,
  and last verification before republishing.
- Passed-deadline rows are handled first and must not be republished as active.

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

The current recovery baseline is sufficient for this read-only planning milestone;
no new backup was created because no external state changed. Follow
[DATABASE_RECOVERY.md](DATABASE_RECOVERY.md) for broader recovery.

## Explicit non-goals

This plan does not authorize corpus mutation, deletion, source activation or
deactivation, schema or category changes, National/International UI, schedule
changes, migration-history repair, AI, infrastructure, Auth, Vercel, or Supabase
configuration changes.
