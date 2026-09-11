# Current engineering handoff

Updated: 2026-09-11. Read [ENGINEERING_RULES.md](ENGINEERING_RULES.md) before acting.

## Current verified state

- Production code remains `45283545f466a0a4470d5cc9fc6e03e0f38cdbec`
  (`main`/`origin/main`). Product planning documentation is on `staging`.
- Production Supabase: `jltuufukcwztugvojwjd`; isolated staging Supabase:
  `pumzofcwfjqswkiwfqty`.
- M31 is closed; migrations 0013/0014 and the M31 flag are active in production and
  staging. Do not restart M31 without a specific regression/recovery task.
- AI remains operationally disabled.
- The Product Quality & Differentiation corpus audit and cleanup plan is complete.
  It made no database, registry, schedule, schema, environment, or provider change.

## Verified corpus checkpoint

At `2026-09-11T19:21:21Z`, a production-target-guarded SELECT-only audit found:

- 271 opportunities: 247 pending, 19 published, five rejected;
- 501 M31 references, with exactly one canonical reference per opportunity;
- 10 deterministic test artifacts: three pending, five published, two rejected;
- pending signals: 192 reject-noise, 21 review-required, 34 potentially qualifying;
- all 19 published rows predate M31 trust decisions; five are test artifacts and 14
  are the legitimate legacy re-review cohort;
- 29 sources: 18 active and 11 inactive; the two aggregators provide 33/34
  potentially qualifying pending rows and all 21 review-required rows;
- all 271 country-verification values are unknown, so National/International cannot
  be honestly backfilled; and
- `other` contains 196/271 rows, so taxonomy refinement is justified after cleanup.

The six-hour schedule remains unchanged. The mature pre-activation baseline has a
high relevance-rejection rate and the first post-activation manual run added 10
pending rows; collect natural post-activation scheduled evidence instead of polling
or increasing cadence now.

Full findings, semantics, batches, and verification rules:
[CORPUS_QUALITY_PLAN.md](CORPUS_QUALITY_PLAN.md).

## Exact next milestone

**Product Quality & Differentiation — Corpus Cleanup Batch 1: Deterministic
Test-Artifact Quarantine**

Expected fresh-preflight scope: keep all 271 rows and 501 references; change only
the status of the three pending and five published deterministic test artifacts to
`rejected`. Delete nothing and do not alter trust/evidence/source fields or unrelated
rows. Expected status counts are 244 pending, 14 published, and 13 rejected if the
baseline has not changed.

This is a production mutation and is blocked until the owner explicitly authorizes
that exact bounded status-only cohort. Re-audit immediately before execution and
fail closed if IDs/counts/statuses differ. Create a protected checksummed pre-change
status manifest outside Git and retain a precise rollback transition.

Do not begin legacy-publication re-review, pending-noise cleanup, source changes,
geography/taxonomy implementation, or cadence work in Batch 1.

## Continuing constraints

- Repository `.env.local` is production-only and must never be used for staging.
- Protected credentials and recovery artifacts remain outside Git. Recovery details
  are authoritative in [DATABASE_RECOVERY.md](DATABASE_RECOVERY.md).
- Production migration history remains deliberately unnormalized; do not use broad
  `db push`, replay 0001–0012, or migration repair.
- No controlled production Moderator account was available during M31 activation.
- The read-only audit exposed a tooling hazard: `scripts/discovery/inspect-live.ts`
  claims to be read-only but performs a reversible insert/delete probe. Do not use
  it for a no-write audit until that behavior or label is corrected in a separately
  scoped change.
