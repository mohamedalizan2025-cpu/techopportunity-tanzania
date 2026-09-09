# M31 pre-migration staging baseline

Updated: 2026-09-09. Status:

**STAGING PRE-M31 BASELINE ESTABLISHED**

**READY TO APPLY 0013 TO STAGING**

**0013 NOT APPLIED**

This runbook governs the next database milestone. It does not authorize a
production migration, feature-flag activation, corpus work, discovery execution,
or AI work.

## Immutable environment boundary

- Production, read-only: `jltuufukcwztugvojwjd`
- Staging, the only remote mutation target: `pumzofcwfjqswkiwfqty`
- Protected production credentials:
  `C:\Users\hp\.tech-opportunity-secrets\production-db.env`
- Protected staging credentials:
  `C:\Users\hp\.tech-opportunity-secrets\staging-db.env`

Repository `.env.local` is production-only and must never be used for staging.
Do not print passwords or complete credential-bearing connection strings.

Before every staging restore, migration, seed, history operation, worker run, or
configuration write, fail closed unless all of these are true:

1. The protected credential file has exactly the expected keys and its project
   ref equals `pumzofcwfjqswkiwfqty`.
2. That ref differs from `jltuufukcwztugvojwjd` and every other known production
   project marker.
3. The session-pooler username suffix is the staging ref and the reviewed endpoint
   is the staging endpoint.
4. No inherited `PG*`, `DATABASE*`, or `SUPABASE*` variable supplies an ambiguous
   connection target, and repository `.env.local` is not loaded.
5. A TLS read-only probe succeeds first and the expected staging catalog state is
   observed.
6. The exact reviewed input hash is recorded with target ref, UTC time, action,
   and result, but no credential.

Identity validation does not itself authorize a migration. Bind the following
operation to the same validated parameters and repeat the guard if anything changes.

## Verified tools and connectivity

- Supabase CLI 2.117.0
- Docker client/server 29.7.2
- PostgreSQL client tools 17.11 in `postgres:17-bookworm`
- Production and staging PostgreSQL server 17.6
- TLS Session Pooler connectivity through the independently verified
  `eu-central-1` endpoint

Direct database hosts are IPv6-only and were unreachable from this machine. That
network limitation does not change project identity or permit fallback to an
ambiguous target.

## Production read-only audit

The owner explicitly authorized protected local recovery exports and detailed
security-catalog inspection. Production remained read-only throughout. No DDL,
DML, migration, Auth change, RLS change, project setting, environment setting,
deployment, DNS change, or worker operation targeted production.

At the audited snapshot:

- There are 10 public application tables: `categories`, `organizations`,
  `profiles`, `opportunities`, `opportunity_sources`,
  `opportunity_enrichments`, `saved_opportunities`,
  `opportunity_deadline_changes`, `user_alert_preferences`, and
  `deadline_alert_events`.
- All 10 have RLS enabled and FORCE RLS disabled.
- `opportunities` has 27 pre-M31 columns. `country` is NOT NULL with the historical
  `Tanzania` default. No M31-added trust column exists.
- `public.opportunity_references` and the historical
  `public.reference_source_type` enum are absent. This closes the migration `0006`
  collision concern: migration 0013 will create its intended text-backed table,
  rather than inheriting an incompatible enum-backed object.
- There are 49 public constraints, 33 indexes, 23 public policies, four public
  functions, and 11 non-internal public/Auth/Storage triggers.
- `auth.uid()`, `public.is_staff()`, and `gen_random_uuid()` exist.
- `supabase_migrations.schema_migrations` is absent. Do not create or repair it as
  part of a preview.

### Security definitions

All 23 public policies and their commands, roles, `USING`, and `WITH CHECK`
expressions were inspected in the protected catalog. They implement world-readable
categories, organizations and published opportunities; submitter/staff opportunity
visibility; staff-managed organizations/sources; staff-read enrichment and deadline
history; and owner-scoped profiles, saves, preferences, and alert events.

The four public function definitions were inspected. `handle_new_user()` inserts
the matching profile, `is_staff()` checks the calling Auth identity's profile role,
`record_opportunity_deadline_change()` records relevant changes, and
`set_updated_at()` maintains timestamps. Security-definer and search-path settings
match the restored staging definitions. The custom `auth.users` profile trigger,
six public triggers, and four managed Storage triggers were inspected.

Effective table and column grants were captured for `anon`, `authenticated`,
`service_role`, and administrative owners. M30 private tables have narrower grants:
authenticated users receive only the privileges required by their RLS-protected
operations; anonymous users have none. Raw policy/function/trigger/grant definitions
remain only in the protected audit directory.

### Production data compatibility census

The read-only snapshot observed 261 opportunities: 237 pending, 19 published,
five rejected, and zero expired. There were 232 null deadlines and 29 known
deadlines. Relevant conflict counts were all zero for:

- null/empty/overlong canonical URLs and invalid source URL lengths;
- blank or overlong non-null deadline evidence and invalid M30 deadline semantics;
- source and submitter FK orphans;
- blank/null country under the current pre-M31 contract;
- same-named M31 columns, constraints, indexes, policies, function, trigger, table,
  and enum;
- the exact new default trust/evidence combinations modeled by 0013.

One URL is shared across two distinct opportunities, producing one excess row in
a global URL grouping. This does not conflict with 0013's per-opportunity
`(opportunity_id, url)` uniqueness. Twenty-seven rows have `source_url = url` and
will correctly skip the secondary-reference backfill. Derived canonical reference
types are 109 RSS, seven manual, and 145 website. No private row values were
reported or copied to staging.

## Protected recovery gate

**RECOVERY BASELINE ESTABLISHED**

The protected recovery/audit directory is
`C:\Users\hp\.tech-opportunity-backups\20260909T070944Z\`. It is outside Git with
ACL inheritance disabled and Full Control limited to the owner, `SYSTEM`, and local
`Administrators`. Roles, schema, data, custom Auth integration, the absent migration
history marker, raw catalogs, custom archive lists, staging baseline artifacts,
checksums, and audit logs are present. See
[DATABASE_RECOVERY.md](DATABASE_RECOVERY.md) for the exact inventory, validation,
restore ordering, and exclusions.

Both production custom archives and both staging custom archives parse with
PostgreSQL 17.11 `pg_restore --list`. The production application schema was
rehearsed on staging. A full private production-data restore was deliberately not
performed; staging must remain synthetic.

## Staging baseline method and result

The accepted method is actual reviewed production application schema, not replay of
historical migrations 0005-0009.

1. The exact staging ref was guarded and the project proved empty: no public
   tables, no Auth users, and no migration history.
2. The reviewed production application schema was applied transactionally while
   preserving staging's managed Auth/Storage/platform internals.
3. The first attempt included the immutable custom Auth trigger definition and
   failed because its function name was unqualified after dump search-path reset.
   The single transaction rolled back completely; staging remained empty.
4. A staging-only derivative changed only that call to
   `public.handle_new_user()`. The immutable recovery original was preserved. The
   guarded retry committed successfully.
5. Catalog comparison found four M30 private tables had inherited broad new-project
   default grants. A staging-only transaction revoked those extras and granted the
   exact production privilege sets. Effective table and column grants then matched.
6. A separately guarded transaction loaded only synthetic fixtures.

Current staging state:

- 10 public tables, all 10 with RLS; 49 constraints; 33 indexes; 23 public
  policies; four public functions; six public triggers plus the custom Auth trigger.
- Zero M31 columns, no `opportunity_references`, no historical reference enum, and
  no migration-history table.
- One synthetic category, one synthetic organization, one inactive synthetic
  source, and six synthetic opportunities.
- Opportunity statuses: two published, three pending, one rejected.
- Deadline shapes: one date, one date-time, two unknown, one rolling, one legacy
  unspecified; both non-null deadlines have evidence.
- URL shapes: two null source URLs, one source URL equal to canonical, three
  distinct source URLs, and one duplicate-risk canonical URL shared by two distinct
  opportunity IDs.
- Location shapes include Tanzania country-only, foreign country, and no-locality
  records. Pre-M31 `country` is NOT NULL, so an entirely null country cannot be an
  accepted baseline fixture; the no-locality legacy case retains the historical
  Tanzania default shape without treating it as verified evidence.
- Zero Auth users, profiles, saves, deadline-history rows, alert preferences, and
  alert events. No staging test identity was needed.
- The synthetic source is inactive, and no discovery worker was run.

## Production/staging structural equivalence

Normalized protected catalog exports have identical row sets for all columns,
constraints, indexes, policies, functions, triggers, effective table grants,
effective column grants, default ACLs, schema ACLs, enums, extensions, views, and
publications. Public/Auth/Storage table and sequence inventories match.

The only raw relation-row mismatch is ACL array ordering on
`saved_opportunities`; both sides contain the same three ACL items and effective
grant rows are exactly equal. This is not a privilege difference.

Intentional differences are:

- production contains real operational/private data; staging contains only six
  synthetic opportunities and no private identities or user data;
- staging fixture source is inactive;
- the staging Auth trigger file has the necessary schema-qualified function call;
- environment-specific managed project identities, settings, and secrets are not
  cloned.

## Migration 0013 compatibility and preview

Migration file: [0013_m31_data_trust.sql](../supabase/migrations/0013_m31_data_trust.sql)

SHA-256:
`c67cd11086aecd563f04e86c9a665a476749c5877255e640efb61598d6e52306`

Static review and both data audits confirm:

- all required pre-M31 columns and dependencies have compatible types;
- no named constraint, index, policy, function, trigger, table, or enum collision
  exists;
- the historical 0006 enum/table objects are absent;
- the new defaults satisfy every new trust/evidence check for existing production
  and staging rows;
- canonical and secondary reference inputs meet length and FK requirements;
- cross-opportunity duplicate URLs do not violate the per-opportunity arbiter;
- source/submission orphans are zero;
- RLS will remain enabled, public reference reads remain limited to published
  opportunities, staff management continues through `is_staff()`, and the explicit
  reference-table revoke/grant sequence avoids inherited-default drift;
- staging's six rows model six canonical reference inserts and three distinct
  secondary reference inserts. One equal source URL is intentionally skipped.

Supabase CLI 2.117.0 exposes `db push --dry-run`, but the official CLI contract also
states that the first `db push` creates `supabase_migrations.schema_migrations`.
Because both audited databases lack that table, the runbook's fail-closed rule
forbids using `db push` merely as a preview: it cannot prove only 0013 is pending
without initializing or repairing history. A credential-bearing `--db-url` was
also not placed in process arguments. No execute-and-rollback simulation was used.
The strongest safe preview here is the unchanged-file hash, exact normalized catalog
comparison, named-object audit, dependency/type review, and row-level backfill/
constraint modeling above. See the official
[Supabase CLI reference](https://supabase.com/docs/reference/cli/su).

**READY TO APPLY 0013 TO STAGING** means the next milestone may execute exactly the
unchanged 0013 SQL against the guarded staging connection using failure-stop and
transactional handling appropriate to that file. It does not authorize older
migrations, migration-history fabrication, or production execution.

## Next staging milestone

The next operator must perform exactly one action: apply the unchanged
`0013_m31_data_trust.sql` file to the hard-guarded staging project.

Immediately before execution, recheck the staging ref, production exclusion,
connection inputs, current 10-table pre-M31 state, zero M31 objects, six fixture IDs,
and the migration SHA-256 above. Do not replay 0005-0009 and do not use the whole
migration directory. After the single migration commits, stop and verify row/ID
preservation, columns/defaults/nullability, constraints/indexes, reference backfill,
RLS/grants, A-versus-B isolation with staging-only identities, moderator behavior,
and application trust-field round trips before any production decision.

Production remains read-only. `M31_TRUST_SCHEMA_ENABLED` remains unactivated for
this rollout. Corpus cleanup and AI remain out of scope.
