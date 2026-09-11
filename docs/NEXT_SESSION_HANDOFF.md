# Current engineering handoff

Updated: 2026-09-11. Read [ENGINEERING_RULES.md](ENGINEERING_RULES.md) before acting.

## Current verified state

- Production code remains `45283545f466a0a4470d5cc9fc6e03e0f38cdbec`
  (`main`/`origin/main`). Product-quality documentation continues on `staging`.
- Production Supabase: `jltuufukcwztugvojwjd`; isolated staging Supabase:
  `pumzofcwfjqswkiwfqty`.
- M31 is closed; migrations 0013/0014 and the M31 flag remain active. AI remains
  operationally disabled.
- Product Quality & Differentiation planning and Corpus Cleanup Batch 1 are complete.
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

## Exact next milestone

**Product Quality & Differentiation — Corpus Cleanup Batch 2A: Legitimate Published
Re-review Triage**

This is read-only planning over the 14 remaining legitimate legacy publications:

1. verify organizer/official evidence, deadline state, relevance, Tanzanian
   eligibility, geography evidence, descriptions, application/canonical URLs, and
   duplicate signals;
2. rank current/high-value opportunities first;
3. define small exact-ID re-review cohorts that keep a useful public inventory
   online; and
4. select the first execution cohort and document its Moderator/authorization and
   recovery gates.

Do not change any row in Batch 2A. Do not run the existing all-legacy requeue path,
re-review all 14 at once, reject the 189 remaining likely-noise pending signals,
change sources/cadence/taxonomy/geography, or begin AI.

## Continuing constraints

- Repository `.env.local` is production-only and must never be used for staging.
- Recovery details remain authoritative in [DATABASE_RECOVERY.md](DATABASE_RECOVERY.md).
- Production migration history remains deliberately unnormalized; no broad
  `db push`, replay 0001–0012, or migration repair.
- No controlled production Moderator account was available during M31 activation;
  Batch 2A must verify the path needed for a later bounded re-review execution.
- `scripts/discovery/inspect-live.ts` performs a reversible insert/delete probe
  despite its old read-only label. Do not use it for a no-write audit.
