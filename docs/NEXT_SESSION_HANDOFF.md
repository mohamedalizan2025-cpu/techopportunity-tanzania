# Current engineering handoff

Updated: 2026-09-11. This is the focused continuity record. Read
[ENGINEERING_RULES.md](ENGINEERING_RULES.md) before acting.

## Current state

- M31 Data Trust is closed in staging and production.
- Production code remains `45283545f466a0a4470d5cc9fc6e03e0f38cdbec`
  (`main`/`origin/main`). The documentation consolidation continues only on
  `staging`, from base `31aa02cf1402e08c84dda52cfa0d957576179bec`.
- Production Supabase ref: `jltuufukcwztugvojwjd`.
- Isolated staging Supabase ref: `pumzofcwfjqswkiwfqty`.
- Migrations 0013 and 0014 are active in production and staging.
- `M31_TRUST_SCHEMA_ENABLED` is active in Vercel Production and in the protected
  branch-scoped staging Preview. No service-role key is stored in Vercel.
- Production contains the M31 trust/reference model. The post-activation discovery
  run preserved canonical-reference coverage.
- Staging live Auth, save, RLS isolation, moderation, trust persistence,
  attribution, and country-audit flows passed with synthetic fixtures; all temporary
  identities and rows were removed.
- AI has a disabled scaffold only. No provider, key, SDK, embeddings, or vector
  store is operational.

The closed activation evidence is in
[M31_STAGING_RUNBOOK.md](M31_STAGING_RUNBOOK.md). Do not restart that runbook unless
a specific M31 regression or recovery task is authorized.

## Environment and recovery facts

- Repository `.env.local` is production-only and must never be used for staging.
- Protected credentials remain outside Git under
  `C:\Users\hp\.tech-opportunity-secrets\`.
- The fresh protected pre-M31 production recovery set is outside Git at
  `C:\Users\hp\.tech-opportunity-backups\20260911T182628Z\`.
- The earlier `20260909T070944Z` set remains historical staging/recovery evidence.
- Production migration history is intentionally absent. Do not use broad `db push`,
  replay 0001–0012, or run migration repair without a separately reviewed plan.

Recovery inventory, limitations, and restore order are authoritative in
[DATABASE_RECOVERY.md](DATABASE_RECOVERY.md).

## Exact next task

Begin **Tech Opportunity Product Quality & Differentiation — Corpus Audit and
Cleanup Planning**.

This next task is planning and read-only audit work:

1. measure corpus noise, stale/test records, duplicates, evidence gaps, eligibility
   ambiguity, and legacy-publication risk;
2. assess source credibility and useful yield;
3. propose National / International semantics and a useful opportunity taxonomy;
4. define reversible cleanup batches, owner gates, and before/after verification;
5. assess discovery cadence only from measured freshness, source behavior,
   moderation capacity, reliability, and infrastructure constraints.

Do not clean production rows, change the registry or schedule, apply schema, enable
AI, or change infrastructure during the planning milestone. The product intent and
later phases are in [PRODUCT_ROADMAP.md](PRODUCT_ROADMAP.md).

## Genuine open constraints

- No controlled production Moderator account was available during M31 activation;
  authenticated write/isolation proof was completed on isolated staging instead.
- Database recovery is a verified logical baseline, not a full private-data restore
  rehearsal. Storage object bytes, provider secrets/settings, DNS, and off-device
  encrypted recovery remain separate gaps.
- Production migration-history normalization is deferred and must not be improvised.

There is no blocker to the read-only corpus audit and cleanup-planning milestone.
