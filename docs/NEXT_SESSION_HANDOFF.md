# Current engineering handoff

Updated: 2026-09-12. Read [ENGINEERING_RULES.md](ENGINEERING_RULES.md) before acting.

## Current verified state

- Production code remains `45283545f466a0a4470d5cc9fc6e03e0f38cdbec`
  (`main`/`origin/main`). Product-quality documentation continues on `staging`.
- Production Supabase: `jltuufukcwztugvojwjd`; isolated staging Supabase:
  `pumzofcwfjqswkiwfqty`.
- M31 is closed; migrations 0013/0014 and the M31 flag remain active. AI remains
  operationally disabled.
- Product Quality & Differentiation planning, Corpus Cleanup Batch 1, and read-only
  Batch 2A legacy-publication triage are complete.
- Sources, discovery cadence, taxonomy, geography logic, schema, migrations, Auth,
  Vercel, and infrastructure were not changed.

## Batch 1 verified result

At `2026-09-11T19:49:31Z`, the authorized deterministic test-artifact quarantine
was independently verified:

- eight exact records changed status only: three pending and five published became
  rejected;
- opportunity status counts changed from 247 pending / 19 published / 5 rejected to
  244 pending / 14 published / 13 rejected;
- all 271 opportunity IDs and all 501 complete reference rows were preserved;
- all non-status/non-automatic-`updated_at` opportunity fields were unchanged;
- all 263 non-target statuses were unchanged;
- all 10 known deterministic test artifacts are now rejected; and
- production returned HTTP 200 with no quarantined marker rendered on the homepage.

The exact IDs/titles, before/after hashes, transparent verifier correction, recovery
path, and checksums are in [CORPUS_QUALITY_PLAN.md](CORPUS_QUALITY_PLAN.md).

Protected Batch 1 evidence is outside Git at
`C:\Users\hp\.tech-opportunity-backups\20260911T194524Z-pqd-batch1\`. ACL
inheritance is disabled. The pre-change manifest supports exact status rollback;
do not copy it into Git or an unprotected location.

## Batch 2A verified read-only result

On 2026-09-12, a target-guarded anonymous production SELECT confirmed the same 14
published legacy rows. All remain `unreviewed`; stored eligibility and country
verification are unknown, qualification/verification/attribution fields are null,
and no row has M31 deadline evidence. Organizer pages, official documents,
application destinations, deadlines, and eligibility language were inspected. No
production record, status, trust field, reference, schema, or configuration changed.
The closure snapshot was 246 pending / 14 published / 13 rejected = 273
opportunities and 503 references. The two-row/two-reference increase since Batch 1
was independent discovery growth; the 14 published IDs and their 27 references
remained the same.

The exact per-ID findings and evidence links are in
[CORPUS_QUALITY_PLAN.md](CORPUS_QUALITY_PLAN.md). Summary:

- two high-confidence current candidates should be re-reviewed first: Sahara
  CodeSwitch Africa Challenge and the 16th AAS Scientific Conference;
- the other 12 should be withheld unless/until their documented evidence gaps are
  resolved: six decisive non-opportunity/excluded records, three expired calls,
  and three evidence-acquisition records;
- eligibility is supported for three, excluded for two, unsupported for seven, and
  still unknown for two;
- recommendation confidence is high for 11 and medium for three; and
- no duplicate identity was established among the 14.

These are triage recommendations, not moderation decisions. All 14 are still
published and every future write requires exact authorization.

## Exact next milestone

**Product Quality & Differentiation — Corpus Cleanup Batch 2B1: Current High-Value
Publication Re-review Execution**

This milestone is owner-gated and not yet authorized. Its only proposed targets are:

1. `156b20a2-2cb4-4783-ac9b-518225890ee3` — Sahara CodeSwitch Africa Challenge
   2026; then
2. `ef8defbb-80ea-483a-94a3-194d2637177b` — 16th AAS Biennial Scientific
   Conference 2026.

Before any write, obtain explicit exact-ID authorization and confirm a controlled
production Moderator path/account. Create protected recovery evidence, prove target
identity and no overlapping operation, and process only one row at a time:
published → pending through protected unpublish, evidence-complete moderator
approval, and post-change proof before touching the second row. Preserve every
reference/provenance field; retain prior aggregator/partner URLs as non-canonical
references if the canonical URL is corrected.

Do not run the all-legacy requeue path, touch the other 12 triaged rows, reject the
189 likely-noise pending signals, change sources/cadence/taxonomy/geography, or begin
AI. Stop after the two exact records.

## Continuing constraints

- Repository `.env.local` is production-only and must never be used for staging.
- Recovery details remain authoritative in [DATABASE_RECOVERY.md](DATABASE_RECOVERY.md).
- Production migration history remains deliberately unnormalized; no broad
  `db push`, replay 0001–0012, or migration repair.
- No controlled production Moderator account was available during M31 activation;
  Batch 2B1 must confirm one before any re-review write.
- `scripts/discovery/inspect-live.ts` performs a reversible insert/delete probe
  despite its old read-only label. Do not use it for a no-write audit.
