# Tech Opportunity - authoritative engineering continuity

Updated: 2026-09-11. Read this document first when continuing development. It is
the current operational checkpoint; older milestone records remain historical
evidence and do not override this file or current owner instructions.

## 1. Exact checkpoint

Production `origin/main` remains at the exact authorized code SHA
`45283545f466a0a4470d5cc9fc6e03e0f38cdbec`. The activation began from clean
`staging`/`origin/staging` SHA
`00e92569b1ce6db2a95676b607213b3a1b15ea5b`; only this continuity documentation
advances `staging`. No production code commit was created. Vercel redeployed the
existing production artifact as `dpl_DesgGyWGsQqVEF9hJiqLPRJwki8p`, which is Ready
and owns the canonical production alias.

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

**FRESH PRODUCTION RECOVERY SNAPSHOT VERIFIED**

**0013 PRODUCTION SUCCESS**

**0014 PRODUCTION SUCCESS**

**M31 PRODUCTION FLAG ENABLED**

**M31 CLOSED**

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

- Production: `jltuufukcwztugvojwjd` - M31 schema and runtime active. Future
  mutations still require their own bounded authorization.
- Staging: `pumzofcwfjqswkiwfqty` - isolated verified M31 evidence environment.
- Repository `.env.local` is production-only and must never be loaded for staging.
- Protected credentials remain outside Git under
  `C:\Users\hp\.tech-opportunity-secrets\`.
- The fresh protected production recovery/evidence set is outside Git at
  `C:\Users\hp\.tech-opportunity-backups\20260911T182628Z\`. The earlier
  `20260909T070944Z` baseline remains historical recovery evidence.

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
During the 2026-09-09 baseline, production remained strictly read-only. No
production data/schema/Auth/RLS/project, Vercel, environment, DNS, deployment, or
worker mutation occurred.

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
opportunities. At that database-only checkpoint, actual User-A/User-B/moderator
isolation and persistence were not yet verified. The subsequent live staging
checkpoint recorded above verified those paths and removed its fixtures.

## 5. M31 production activation result

[Migration 0013](../supabase/migrations/0013_m31_data_trust.sql) is unchanged with
SHA-256
`c67cd11086aecd563f04e86c9a665a476749c5877255e640efb61598d6e52306`.

Production 0013 and 0014 were applied only to the independently guarded production
ref using PostgreSQL failure-stop transactions. Migration 0014 remains unchanged at
SHA-256
`428a84738d2fa3bff2e1117f6938c2de0cc0ae7084fea2a4511837e7ad851b74`.

Production now has 11 public tables, 37 opportunity columns, 66 constraints, 38
indexes, 25 policies, five public functions, and 12 relevant non-internal triggers.
All 261 pre-migration opportunities and their statuses survived. The 0013 backfill
created 488 references: 261 canonical and 227 secondary, with zero missing canonical,
duplicate pair, invalid URL, invalid source type, or orphan violations. All
historical trust values received honest `unreviewed`/`unknown` defaults.

The validated enrichment constraint permits exactly `venue_name`, `address`,
`city`, `region`, `country`, and `deadline`. Migration history remains deliberately
absent and unnormalized; do not use broad `db push`, replay 0001-0012, or run
`migration repair` without a separate future authorization.

`M31_TRUST_SCHEMA_ENABLED` is a Production-only Vercel Config value and remains
enabled on the isolated staging Preview. The exact release deployment is Ready.
Homepage, listing, search, filters, published detail, M31 trust rendering, and
pending/rejected non-exposure passed. Login and unauthenticated saved/moderation
redirects passed. No controlled production account was safely available, so no
authenticated or Moderator production write was manufactured; the complete live
write and cross-user isolation proof remains the cleaned staging evidence.

Manual production Discovery sync run `34634893955` succeeded on the exact release
SHA after activation. It added 10 ordinary pending candidates and the M31 trigger
kept zero missing canonical references. A single bounded Vercel runtime-log review
found seven request records and zero fatal, error, warning, 5xx, or M31 security
matches.

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
discovery health, and credential-free milestone verification exist. M31 application,
database, trust-reference, and production rollout gates are active. AI scaffolding
does not authorize operational AI.

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

The immediate next phase is product quality and differentiation. Do not begin it as
part of M31 closure:

1. Clean the ambiguous/noisy corpus without manufacturing evidence.
2. Strengthen publication authority, source credibility rules, and the registry.
3. Use National / International as the primary geographic grouping, with real
   participation evidence for International opportunities.
4. Formalize a useful opportunity taxonomy.
5. Review the six-hour discovery cadence toward two hours, and later possibly one
   hour or source-specific cadence, only from measured value and infrastructure limits.
6. Claim an eligible GitHub Student Developer Pack custom-domain benefit before
   paying for a domain; keep Vercel unless a later infrastructure audit justifies a
   change.
7. Launch a trusted normal-use discovery product before personalization.
8. Add structured profiles and an optional CV, then explainable personalized AI over
   the trusted corpus.
9. Build toward commercial, institutional, hackathon, and showcase strength.

`M31_TRUST_SCHEMA_ENABLED` is active in Production and on the branch-scoped staging
Preview. M31 is closed. Corpus cleanup and AI were not started in this activation.

## 8. Permanent closure rule

Implementation + verification + repository hygiene + online verification where
relevant + documentation + clean Git state = milestone closure.

For the next session, the exact next phase is:

`BEGIN TECH OPPORTUNITY PRODUCT QUALITY & DIFFERENTIATION: corpus cleanup -> source credibility -> National/International -> taxonomy -> discovery quality/cadence.`
