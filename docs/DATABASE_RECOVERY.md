# Tech Opportunity database recovery baseline

Status: **RECOVERY BASELINE ESTABLISHED** on 2026-09-09. This document is a
non-secret operating guide. The backup contents and raw security catalogs are not
stored in Git.

## Protected location and handling

The current recovery set is in the external local directory
`C:\Users\hp\.tech-opportunity-backups\20260909T070944Z\`. The directory is
outside the repository and outside the application environment files. Windows ACL
inheritance is disabled; only the current owner, `SYSTEM`, and local
`Administrators` have Full Control. Do not move this directory into a synced or
shared location without an owner-approved encryption and retention plan.

`manifest.json` is the authoritative per-file inventory. It contains 61 artifact
entries totaling 1,162,925 bytes, with a byte size, SHA-256 checksum, and
classification for every listed artifact. The manifest itself is 21,824 bytes with SHA-256
`49daae1ddb8674ad8d3a152cee0b01f7858eda96a5390b04b451d7eb337dd201`.
It contains metadata only, not credentials or database rows.

### Core production recovery artifacts

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `production_roles.sql` | 371 | `f993bda411d15494fb075b237966c3d985810bf1ee3792699384ab81dab77038` |
| `production_schema.sql` | 30,432 | `5b4a815110a2d54bd60c502a11177ee1eac9733f3ba44739054892d8d4628e7f` |
| `production_schema.dump` | 96,430 | `b212a295585793405ac87bed54e3d59f3e25cb9764944dd3eabce6ddc503b85f` |
| `production_schema.list` | 17,161 | `860906542dd1b44d8f6d6801c89d015d8418a587a51b2e461119439984482981` |
| `production_data.sql` | 271,698 | `30489a63f78b9501f326705eb7eaa19998a1786ab7d85463ab3d91404dffc839` |
| `production_data.dump` | 81,851 | `266680510231d0ad9d8e14d96724fc016b8400bc853180dee89b26542239e96d` |
| `production_data.list` | 3,004 | `50b9f3eee4ae1ced3f685cf3048fda9428d0c64e3e9bbde60b1bdc64cd6f9f78` |
| `production_custom_auth_integration.sql` | 113 | `f031957f1986609121d0d6559f449222a133b3a8675be9145b0ce4a424539fcb` |
| `production_migration_history.txt` | 70 | `ad89d2edd44b9de44f742a1ae66a663603adf467810c177fa8a304525d8391be` |

The protected manifest also inventories 16 production security-catalog CSVs,
their 16 staging comparison exports, staging restore/audit logs, and the staging
baseline artifacts. Raw definitions remain protected because they include the
database security model. The production data artifacts may contain private rows
and are recovery-only.

### Staging pre-M31 artifacts

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `staging_synthetic_fixtures.sql` | 4,933 | `4e73297873deaf6f119dfd1fc605e92b3edbfce2207d74314e74527dd0b30c5f` |
| `staging_pre_m31_schema.sql` | 39,904 | `1138ebd3005e19c9ba4e5c0435863285892baac49bc619826746f5ba92fa4959` |
| `staging_pre_m31_schema.dump` | 57,273 | `c3b46e8360664f8b60a6d6be351b3fcb8f280a2bca511e8022f2d46394bbe062` |
| `staging_pre_m31_schema.list` | 10,164 | `73e15a2fda60168d6f143225a84b45aab622cb13a7683a7967b5318847545f19` |
| `staging_pre_m31_fixtures.sql` | 6,547 | `1519c1e9711dbaf09b936be7179671a0d73d01006f6b048c5b129ad1ba7003f1` |
| `staging_pre_m31_fixtures.dump` | 5,722 | `db15025d2fe63ecdc69aa838624e65317f89a8403d7abaecfc4c787f08ec539d` |
| `staging_pre_m31_fixtures.list` | 1,024 | `41f395db025beefb5af1655b72b06a9467f56d1cf87070e9bfd691e1c2707d05` |

These staging data artifacts contain only reserved-domain synthetic records. They
are not substitutes for the private production recovery data.

### Staging 0013 execution evidence

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `staging_pre_0013_snapshot_reuse.audit` | 807 | `e9bb681d6df742249b6fa82f345b81066f73414aab0dc4b8f57dfd811774ba6f` |
| `staging_0013_execution.audit` | 509 | `5e94000fb57db402a3d25dc8d568b5640bbcbe8e84e63b7dabbba9d3ced3a59e` |
| `staging_0013_execution_notice.log` | 358 | `a3a69712db43bc948bdb2d30ef533372561c63ab812e5ec779cdaf10d1b2ac46` |
| `staging_0013_post_structure.txt` | 16,213 | `25cbec981353772d9e8bf42bd3f688d40d318fccb39ac0e5c46a3bcd0a4552b7` |
| `staging_0013_backfill_security.txt` | 797 | `827213ce4805731dd5add3e224be3d16e9de934fe5112c7f34e2594ce0c359b4` |
| `staging_0013_negative_tests.txt` | 433 | `5932db56d72eeffe1aa3f2c80d251de1b77cc6a346f8074c25be0a023e1c3f46` |
| `staging_0013_trigger_test.txt` | 151 | `32b8bc92d91bb4015b612430aaace2c6521fa37094e5a29c782dbb6d24d674b9` |
| `staging_0013_final_state.txt` | 111 | `bfff1e8370843e7989f1d0f75504855c726c5211c82d9008ab673b53337b8022` |

Migration 0013 was applied only to staging in one failure-stopping transaction.
These files are verification evidence; the immutable pre-0013 schema and fixture
artifacts above remain the rollback/reconstruction baseline. No production backup
artifact was replaced.

## What was validated

- PostgreSQL server 17.6 was exported and PostgreSQL 17.11 client tools created
  the dumps. Supabase CLI 2.117.0 behavior and scope were reviewed; the equivalent
  official PostgreSQL logical tools were used without putting a password in a
  process argument or connection string.
- Every core file exists and is non-empty. All 61 protected artifacts have a
  SHA-256 checksum in the manifest.
- PostgreSQL 17.11 `pg_restore --list` parses both production custom archives and
  both staging custom archives.
- The production schema archive contains all 10 public application tables. The
  production data archive contains 10 public, 22 Auth, and 7 Storage table-data
  entries. The plain data file has 39 complete COPY sections.
- The role export contains no role password statement. A targeted scan found no
  credential-bearing PostgreSQL URI, protected password variable assignment,
  service-role key assignment, or OpenAI project-key pattern in protected text
  artifacts.
- The production application schema was actually restored to the guarded staging
  project. Normalized catalog comparison then matched columns, constraints,
  indexes, RLS policies, functions, triggers, grants, default ACLs, schema ACLs,
  enums, extensions, views, and publications. Four private-table ACLs inherited
  from the empty project's defaults were explicitly narrowed on staging and
  reverified. The remaining raw relation-row difference is only ACL-array order;
  the privilege set is identical.
- Staging migration 0013 was subsequently verified at 37 opportunity columns,
  66 public constraints, 38 indexes, 25 policies, five public functions and 12
  relevant triggers. Six synthetic opportunities produced six canonical and three
  secondary references. Fourteen negative constraint cases and a synchronization
  trigger behavior test passed inside transactions that were rolled back.

This establishes a usable logical recovery baseline, but it is not a full private
data restore rehearsal. No private production data was restored to staging.

## Exact restore procedure

Use a new, explicitly owner-authorized recovery project or isolated PostgreSQL
environment. Never test this procedure against production or application staging.
Match the PostgreSQL major version and confirm the target identity independently
before every write.

1. Copy the protected directory to equally protected recovery media. Verify the
   manifest checksum and each selected artifact checksum before use. Work from a
   copy; keep the originals immutable.
2. Provision compatible Supabase-managed Auth, Storage, extensions, and platform
   roles first. Do not create or overwrite managed schemas from an indiscriminate
   cluster dump; none was created here.
3. Review `production_roles.sql` against the target's managed roles. It has role
   settings only, no passwords and no `CREATE ROLE`. Apply it only when those
   settings are compatible and desired. Role credentials and provider secrets
   must be recovered separately.
4. Restore exactly one schema format, not both. The plain path is `psql` with
   `ON_ERROR_STOP=1` and `--single-transaction` against the verified recovery
   target. The custom path is `pg_restore --exit-on-error --single-transaction`
   using `production_schema.dump`. Keep ownership mapped to the recovery target.
5. Restore the custom Auth-to-profile trigger separately after the public function
   exists. The immutable production definition uses an unqualified function name;
   the staging rehearsal proved that a target-specific reviewed derivative must
   qualify it as `public.handle_new_user()`. Do not edit the recovery original.
6. Compare target default privileges and effective table/column grants with the
   protected production catalogs. New-project defaults can add grants that a dump
   does not revoke. Reconcile only confirmed differences before loading data.
7. For a full disaster-recovery rehearsal, restore exactly one data format. The
   plain path is `production_data.sql`; the custom path is
   `production_data.dump`. Use failure-stop behavior and a protected recovery
   target. Never load either production data artifact into development or staging.
8. Treat Auth and Storage rows as version-sensitive managed data. Confirm target
   schema compatibility and required encryption/signing dependencies first.
   Storage object metadata does not include the underlying object bytes.
9. The production `supabase_migrations.schema_migrations` table was absent at
   audit time. Preserve that fact; do not fabricate, repair, or mark migration
   history during recovery. Reconcile migration tracking only through a separately
   reviewed owner-approved plan after the recovered schema is proven.
10. Re-run catalog, RLS/grant, function/trigger, row-count, FK-orphan, Auth flow,
    and application smoke checks. Verify Storage objects against a separate object
    backup. Keep the recovery environment isolated until all checks pass.

Passwords must be provided through a protected transient environment or secret
provider and cleared afterward. Never place them in shell history, command-line
arguments, manifests, logs, or this repository.

## Known exclusions and limitations

- The role, schema, and data exports were separate logical snapshots. They are not
  one cross-file transactionally consistent physical backup.
- A complete private-data restore was not rehearsed because staging must remain
  synthetic. Custom archives were parsed and the application schema was restored.
- Supabase Storage file contents are not in PostgreSQL logical dumps. Only database
  metadata is present.
- Project secrets, JWT/signing keys, external OAuth/provider settings, Edge
  Functions and their secrets, scheduled jobs outside the database, Vercel settings,
  environment variables, DNS/domain configuration, and third-party services require
  separate inventories and recovery procedures.
- Logical database artifacts are not a substitute for encrypted off-device media,
  retention testing, or a future owner-authorized full recovery drill.

The operational staging procedure and current migration gate are in
[M31_STAGING_RUNBOOK.md](M31_STAGING_RUNBOOK.md).
