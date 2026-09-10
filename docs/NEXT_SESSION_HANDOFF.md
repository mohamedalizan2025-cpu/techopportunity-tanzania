# Tech Opportunity - authoritative engineering continuity

Updated: 2026-09-10. Read this document first when continuing development. It is
the current operational checkpoint; older milestone records remain historical
evidence and do not override this file or current owner instructions.

## 1. Exact checkpoint

Remote `main` remains at
`58e900e626021346ac0a773db3264c1b2f3a488b` (`Fix deterministic trust deadline
evaluation`). Remote `staging` now exists and contains the live-staging work above
that checkpoint. Obtain the final staging SHA from Git; do not reset to a historical
SHA in this document.

The existing Vercel project now has an ordinary protected Preview for branch
`staging` at
`https://techopportunity-tanzania-git-staging-techopportunity.vercel.app`.
Branch-only Config variables are `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, and
`M31_TRUST_SCHEMA_ENABLED`. They target staging and enable M31 only there. No
service-role key is stored in Vercel. Supabase Auth on staging has the exact Preview
Site URL and `/auth/callback` allow-list entry.

Current database status:

**RECOVERY BASELINE ESTABLISHED**

**M31 DATABASE MIGRATION VERIFIED ON STAGING**

**0013 APPLIED SUCCESSFULLY TO STAGING**

**M31 FEATURE FLAG ENABLED ON STAGING PREVIEW ONLY**

**M31 COUNTRY AUDIT FIX VERIFIED ON STAGING**

**M31 LIVE APPLICATION VERIFIED ON STAGING**

**NO PRODUCTION AVAILABILITY CHANGES**

Real staging-only User A, User B, and Moderator accounts proved Auth, callback
origin, session persistence, logout, saves, public visibility, references,
cross-user RLS denial, Moderator access, M31 trust persistence, and moderator
attribution. A final country-changing Moderator action proved the enrichment audit
path. All temporary identities, profiles, opportunities, references, audits, saves,
category fixture, credentials, and local test state were then removed. No production
identity or data was copied.

The live defect was the older `opportunity_enrichments_field_check`, which rejected
the application's existing `country` audit row. Vercel logged that exact constraint
violation while authoritative M31 evidence and `decided_by`/`decided_at` still
persisted.
[Migration 0014](../supabase/migrations/0014_m31_country_enrichment_audit.sql)
is the smallest forward fix. The owner explicitly authorized only that file; its
SHA-256 was verified as
`428a84738d2fa3bff2e1117f6938c2de0cc0ae7084fea2a4511837e7ad851b74`
and it was applied atomically only to staging. The resulting validated constraint
allows `country`. One fresh Moderator action produced exactly one
`moderator-review` audit row recording `Kenya` to `Tanzania` with matching evidence;
the opportunity's `decided_by` matched the Moderator. Migration 0013 was not edited
or rerun, and migration history was not normalized.

## 2. Immutable production/staging boundary

- Production: `jltuufukcwztugvojwjd` — read-only until a separate future owner
  authorization.
- Staging: `pumzofcwfjqswkiwfqty` — the only permitted remote database mutation
  target for the next milestone.
- Repository `.env.local` is production-only and must never be loaded for staging.
- Protected credentials remain outside Git under
  `C:\Users\hp\.tech-opportunity-secrets\`.
- Protected recovery/security artifacts remain outside Git under
  `C:\Users\hp\.tech-opportunity-backups\20260909T070944Z\`.

Before every staging write, require the exact staging ref, prove it differs from the
production ref, validate the connection inputs and endpoint, run a read-only state
probe, bind the next operation to those same parameters, and record only a non-secret
target/input-hash/result audit marker. Fail closed on ambiguity.

Never print passwords or full credential-bearing connection strings. Never copy
production data, identities, sessions, profiles, saves, preferences, or alerts to
staging.

## 3. Recovery and production security evidence

The owner explicitly authorized a protected local logical recovery backup that may
contain private production rows and protected raw security-definition exports.
Production remained strictly read-only. No production data/schema/Auth/RLS/project,
Vercel, environment, DNS, deployment, or worker mutation occurred.

The protected set includes roles, schema and data in logical formats; custom Auth
integration; an explicit absent migration-history marker; 16 production security
catalog exports; archive listings; checksums; and staging baseline evidence. Windows
ACL inheritance is disabled, with Full Control limited to the owner, `SYSTEM`, and
local `Administrators`. All custom archives parse with PostgreSQL 17.11. The
application schema restore was rehearsed on guarded staging; private production data
was not restored there.

See [DATABASE_RECOVERY.md](DATABASE_RECOVERY.md) for the artifact sizes/checksums,
restore order, security handling, and exclusions.

Production audit summary:

- 10 public application tables, all with RLS enabled and FORCE RLS disabled;
- 27 pre-M31 `opportunities` columns; historical non-null `country` with Tanzania
  default;
- 49 public constraints, 33 indexes, 23 public policies, four public functions,
  and 11 non-internal public/Auth/Storage triggers;
- actual RLS predicates/checks, grants, function bodies/search paths/security modes,
  trigger definitions, constraints, and indexes inspected in protected storage;
- `auth.uid()`, `public.is_staff()`, and `gen_random_uuid()` present;
- no M31 column/object, no `opportunity_references`, no historical reference enum,
  and no `supabase_migrations.schema_migrations` table.

The production compatibility census observed 261 opportunities: 237 pending,
19 published, five rejected, 232 null deadlines, and 29 known deadlines. All actual
0013 input/constraint conflict counts were zero. One URL is shared by two distinct
opportunities, which is compatible with per-opportunity reference uniqueness.
Twenty-seven rows have equal canonical/source URLs and will correctly skip the
secondary backfill. No private row content was reported.

## 4. Staging baseline and verified M31 database state

The selected baseline is the reviewed actual production application schema, not
historical migration replay. Migrations 0005-0009 were not replayed.

The first transactional schema attempt failed safely on an unqualified custom Auth
trigger function and rolled back completely. The successful attempt used a
staging-only derivative qualified as `public.handle_new_user()` while preserving the
immutable recovery original. Four M30 private tables initially inherited broader
new-project defaults; staging-only revokes/grants aligned them exactly with
production.

Normalized production/staging catalogs now match for columns, constraints, indexes,
RLS policies, functions, triggers, effective table/column grants, default ACLs,
schema ACLs, enums, extensions, views, publications, and relevant relation inventory.
The sole raw relation-row difference is the ordering of an equivalent three-item ACL
array on `saved_opportunities`; effective privileges are identical.

The preserved pre-0013 snapshot has:

- 10 public tables, all RLS enabled; 49 constraints; 33 indexes; 23 policies;
  four functions; six public triggers plus the custom Auth trigger;
- zero M31 columns, no reference table/enum, and no migration-history table;
- one synthetic category, one synthetic organization, one inactive source, and six
  synthetic opportunities;
- two published, three pending, and one rejected opportunity;
- date/date-time/unknown/rolling/legacy deadline cases, country-only/foreign/
  no-locality cases, source URL equal/different/null cases, and one duplicate-risk
  shared URL across distinct opportunity IDs;
- zero Auth users, profiles, saves, deadline history, alert preferences, and alert
  events.

No discovery worker ran and no staging identity was needed. The staging baseline
schema and fixture snapshots remain checksummed in protected storage.

Migration 0013 then ran as the only SQL input through PostgreSQL 17.11 `psql` with
`ON_ERROR_STOP=1` and `--single-transaction`, bound to the guarded staging ref. It
added 10 opportunity columns and `opportunity_references`; staging now has 11 public
tables, 66 constraints, 38 indexes, 25 policies, five functions and 12 relevant
triggers. `country` is nullable with no default. All new constraints/indexes and the
sync function/trigger match the migration.

All six fixture IDs and statuses survived. Backfill created six canonical and three
secondary references with zero duplicate-pair, canonical, URL or missing-reference
violations. Trust/country fields have the intended honest defaults. Fourteen invalid
constraint cases and a canonical/source synchronization behavior test passed inside
transactions that rolled back; cleanup remained six opportunities, nine references
and no deadline-history rows.

Structural RLS/policy/grant verification passed. Anonymous and authenticated roles
without a user session each saw only three references belonging to published
opportunities. Actual User-A/User-B/moderator isolation and persistence remain
explicitly unverified until the next staging-application milestone.

## 5. Migration 0013 result and remaining gate

[Migration 0013](../supabase/migrations/0013_m31_data_trust.sql) is unchanged with
SHA-256
`c67cd11086aecd563f04e86c9a665a476749c5877255e640efb61598d6e52306`.

Result: **0013 APPLIED SUCCESSFULLY TO STAGING** and
**M31 DATABASE MIGRATION VERIFIED ON STAGING**.

The direct SQL execution did not create the `supabase_migrations` schema or migration
history table. Staging therefore has the 0013 schema but no normalized 0001-0013
repository/remote history. Do not use broad `db push`, replay 0001-0012 or run
`migration repair`; history normalization is a separately justified and authorized
future infrastructure milestone.

The live staging application and country-audit correction are verified. The focused
M31 suite has 18 tests; full-verification evidence remains 705 tests, TypeScript,
ESLint, 29 boundaries, and the post-gate migration review. Production stayed
read-only, its M31 flag was not changed, and production activation remains
prohibited until a separate decision.

The next action is a separate owner go/no-go review of the documented production M31
rollout plan. Do not apply any production migration or enable its flag without that
new authorization.

See [M31_STAGING_RUNBOOK.md](M31_STAGING_RUNBOOK.md) for the reusable guard and exact
verification state.

## 6. Product architecture and established implementation

Tech Opportunity is a Next.js App Router, React, TypeScript, Tailwind, Supabase
PostgreSQL/Auth/RLS, and Vercel application. Its data boundary remains
`UI -> lib/data/* -> Supabase`.

The trusted discovery flow is:

`source -> controlled fetch -> normalize -> deterministic qualification -> evidence -> dedupe -> pending -> human moderation -> published`

Acquisition protections, source-specific extraction, qualification evidence,
pending-only discovery, moderation, public search/filter/detail UX, accounts, saved
opportunities, deadline intelligence, private in-app alert preferences/events,
discovery health, and credential-free milestone verification exist. M31 application
code and rollout gates exist, but its database migration and runtime activation do
not. AI scaffolding does not authorize operational AI.

Recent milestone anchors:

| Commit | Established work |
|---|---|
| `88373fd` | M30 deadline intelligence and alerts |
| `56e2b26` | M31 evidence-first trust implementation |
| `5ade6f1` | M31 legacy publication re-review gate |
| `fcfc514` | Country-only trust mapping fix |
| `4910d14` | UI/UX product polish |
| `32fbc85` | M31 staging preflight and owner authorization gate |

## 7. Deferred roadmap

Do not begin these during the staging activation/live-security milestone:

1. Close M31 through staging verification and a separate production decision.
2. Clean the ambiguous/noisy corpus without manufacturing evidence.
3. Strengthen the authoritative source policy and registry.
4. Formalize opportunity taxonomy.
5. Use National / International as the primary geographic grouping.
6. Review the six-hour discovery cadence toward two hours, and later possibly one
   hour or source-specific cadence, only from measured value and infrastructure limits.
7. Claim an eligible GitHub Student Developer Pack custom-domain benefit before
   paying for a domain; keep Vercel unless a later infrastructure audit justifies a
   change.
8. Launch a trusted normal-use discovery product before personalization.
9. Add structured profiles and an optional CV, then explainable personalized AI over
   the trusted corpus.
10. Build toward commercial, institutional, hackathon, and showcase strength.

`M31_TRUST_SCHEMA_ENABLED` is active only for the `staging` Preview. Production
remains live and unchanged. Corpus cleanup and AI remain NO-GO.

## 8. Permanent closure rule

Implementation + verification + repository hygiene + online verification where
relevant + documentation + clean Git state = milestone closure.

For the next session, the one safest action is: conduct a separate owner go/no-go
review for production M31 activation using the completed staging evidence. Do not
apply a production migration or flag change during that review.
