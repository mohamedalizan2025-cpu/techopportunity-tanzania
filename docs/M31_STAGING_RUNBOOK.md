# M31 pre-migration staging baseline

Updated: 2026-09-09. Status: **STAGING BASELINE NOT ESTABLISHED - OWNER ACTION REQUIRED**.
This runbook supplements [NEXT_SESSION_HANDOFF.md](NEXT_SESSION_HANDOFF.md).
M31 remains OPEN; AI remains NO-GO. Migration 0013 was NOT APPLIED.

## Immutable environment boundary

| Environment | Project reference | Authority for this task |
|---|---|---|
| PRODUCTION | `jltuufukcwztugvojwjd` | Read-only inspection and non-mutating logical export only |
| STAGING - Tech Opportunity Staging | `pumzofcwfjqswkiwfqty` | Baseline setup only after all gates succeed |

**PRODUCTION MUST NEVER RECEIVE STAGING COMMANDS.** Never migrate, reset, repair
migration history, restore, seed, change Auth/RLS/settings, or run workers against
production during this task. Do not replay migrations 0005-0009. Do not inherit
`.env.local` for staging: its project is PRODUCTION. Encountering production in a
staging command, environment, connection, or link is an immediate stop condition.
The explicitly targeted production read-only audit/export is a separate operation.

Both Free-tier identities and staging's new/isolated status were supplied by the
owner. Staging's live identity, schema and emptiness have NOT been independently
verified. No remote mutations, links, deployments, Auth changes, fixture loads,
worker dispatches, account creation or backups occurred in this session.

## Verified repository and tools

- Starting branch: `main`; HEAD and locally recorded origin/main:
  `8c80a7b9aed037156fc9484c714950578db2f6c2`.
- Starting commit: `Document current Tech Opportunity development state`.
- Working tree initially clean. Read-only `git ls-remote --heads origin main`
  independently returned the same SHA after network escalation succeeded.
- No applicable AGENTS.md found in the repository or checked ancestor paths.
- Supabase CLI, psql and pg_dump were not available on PATH; no local Supabase
  binary or cached supabase.exe was found in the inspected npm locations.
  Consequently a Supabase CLI version could not be reported.
- Docker client: 29.7.2. Server unavailable on the default Docker engine pipe;
  sandbox also denied reading Docker config. No server was started.
- No `supabase/config.toml`, `supabase/.temp/project-ref`, `.supabase/project-ref`
  or `.vercel/project.json` found. No link state was changed.
- `.env.local` contains the production API URL and application API credentials.
  Only names/presence and project ref were inspected/reported. No database password,
  database connection configuration or management token was available in inspected
  task environment configuration; the standard Supabase token file was absent.
- Existing `scripts/m31` contains remediation/readiness tools, not a backup or
  staging baseline tool. They were not run. No previous authoritative staging
  runbook existed. Historical temporary preparation files are not certified evidence.
- Tracked `.env.example` is a pre-existing placeholder template; no actual .env
  credentials are tracked. No repository backup location is defined by policy.

Migration inventory (files are design/history, NOT proof of live application):

| Version | File suffix |
|---|---|
| 0001 | initial_schema |
| 0002 | discovery_pipeline |
| 0003 | enrichment_audit |
| 0004 | admissions_category |
| 0005 | eligibility_scope |
| 0006 | opportunity_references |
| 0007 | lifecycle_evidence |
| 0008 | country_evidence |
| 0009 | moderation_attribution |
| 0010 | jobs_category |
| 0011 | saved_opportunities |
| 0012 | deadline_alerts |
| 0013 | m31_data_trust |

Seed inventory: `supabase/seeds/0002_pilot_sources.sql`; not executed.

## Production read-only evidence: 2026-09-09 05:46 UTC

The audit used GET requests to the exact production HTTPS REST endpoint, checked
the configured URL and credential project/role locally, rejected redirects, and
printed only metadata and aggregates. No SQL/RPC function was executed. The API
credential was used in request headers only, never printed or copied into a script.
The audit script was temporary and outside the repository. The findings below are
the retained evidence; future sessions must re-audit rather than rely on that file.

**This is a PARTIAL audit, not an actual PostgreSQL catalog certification.**
REST/OpenAPI schema-cache metadata does not prove indexes, complete constraints,
RLS flags/policy bodies, grants, function bodies, triggers or migration history.
An unexposed object is not proven absent from PostgreSQL.

Exposed tables: opportunities, opportunity_sources, opportunity_enrichments,
categories, organizations, profiles, saved_opportunities,
opportunity_deadline_changes, user_alert_preferences and deadline_alert_events.
`/rpc/is_staff` is advertised; its implementation/privileges were not inspected.
`opportunity_references` is not exposed in the returned metadata.

All 27 exposed opportunity columns, grouped by reported PostgreSQL format:

| Format | Columns |
|---|---|
| uuid | id, organization_id, submitted_by, source_id |
| smallint | category_id |
| text | slug, title, description, url, source_url, venue_name, address, city, region, country, image_url, discovery_method, deadline_precision, deadline_timezone, deadline_evidence |
| timestamp with time zone | deadline, created_at, updated_at, discovered_at |
| numeric | latitude, longitude |
| public.opportunity_status | status |

API-required opportunity fields: id, slug, title, description, category_id, url,
status, country, created_at, updated_at, deadline_precision. Treat this as metadata
evidence; confirm NOT NULL directly in pg_attribute before constructing baseline DDL.
Advertised defaults: id `gen_random_uuid()`, status `pending`, country `Tanzania`,
created_at/updated_at `now()`, deadline_precision `unspecified`. Advertised status
values: pending, published, rejected, expired.

None of the ten M31-added columns is exposed: relevance_decision,
relevance_evidence, eligibility, eligibility_evidence, qualification_rule_version,
country_verification, country_evidence, last_verified_at, decided_by, decided_at.

Source registry metadata includes UUID identity, name/base_url/source_type,
country/region, active and health/timestamp fields. Profile metadata includes UUID
identity, display_name, role (default user) and timestamps. Saves expose user and
opportunity UUIDs. M30 exposes deadline history, private preference and generated
event columns, including the false preference default and generated event default.
Auth users, private profiles, saves, preferences and alert records were not read.

## Production conflict evidence and its limits

The audit fetched only ID/URL/provenance/status/country/deadline/evidence fields into
process memory, computed counts and discarded rows on exit. It did not export
opportunity content. Returned rows and the API exact count both equaled 261.
Requests were paginated by ID; this is not a repeatable-read SQL snapshot.

| Check | Observed count |
|---|---:|
| Opportunities | 261 |
| Pending / published / rejected / expired | 237 / 19 / 5 / 0 |
| Known / null deadlines | 29 / 232 |
| Non-null country | 261 |
| Null canonical opportunity URL | 0 |
| Opportunity URL length outside 1-2000 characters | 0 |
| Distinct non-null source URL length outside 1-2000 | 0 |
| Duplicate opportunity URL groups | 1 |
| Excess rows within duplicate URL groups | 1 |
| Non-null deadline evidence outside trimmed 1-1000 | 0 |

The duplicate URL is a corpus observation, not by itself an 0013 failure: the
reference pair is unique by `(opportunity_id, url)`, and canonical uniqueness is
per opportunity, not global URL. No URL or row identity was retained in this report.
No row was corrected, merged, quarantined or requeued.

Reference duplicate pairs, multiple canonicals, incompatible existing reference
types/constraints and attribution foreign keys remain UNKNOWN. Eligibility,
country/relevance evidence combinations, attribution pairing and qualified-deadline
checks were NOT evaluated against missing API columns. Missing columns must be
confirmed in the catalog before applying 0013 default-value reasoning. There is
no demonstrated current code blocker, and no complete green compatibility result.

### Required catalog audit (not executed)

Use an explicitly production-scoped SQL connection with TLS and a read-only
repeatable-read transaction, statement timeout and failure-stop behavior. Record
session/server version and the externally verified project identity; `current_database()`
alone cannot distinguish Supabase projects (both may be named postgres).

```sql
begin transaction isolation level repeatable read read only;
set local statement_timeout = '30s';
select current_database(), current_user, version();
select n.nspname, c.relname, c.relkind, c.relrowsecurity, c.relforcerowsecurity,
       c.relacl, pg_get_userbyid(c.relowner) as owner
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public', 'supabase_migrations')
order by 1, 2;
select n.nspname, c.relname, a.attname,
       format_type(a.atttypid, a.atttypmod) as data_type,
       a.attnotnull, a.attidentity, a.attgenerated,
       pg_get_expr(d.adbin, d.adrelid) as default_expression
from pg_attribute a join pg_class c on c.oid = a.attrelid
join pg_namespace n on n.oid = c.relnamespace
left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
where n.nspname = 'public' and a.attnum > 0 and not a.attisdropped
order by c.relname, a.attnum;
select conrelid::regclass, conname, contype, convalidated,
       pg_get_constraintdef(oid, true)
from pg_constraint where connamespace = 'public'::regnamespace
order by 1, 2;
select i.indrelid::regclass, i.indexrelid::regclass, i.indisvalid, i.indisready,
       pg_get_indexdef(i.indexrelid)
from pg_index i join pg_class c on c.oid = i.indrelid
where c.relnamespace = 'public'::regnamespace order by 1, 2;
select * from pg_policies where schemaname in ('public', 'auth', 'storage')
order by schemaname, tablename, policyname;
select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid),
       p.prosecdef, p.proconfig, p.proacl, pg_get_userbyid(p.proowner) as owner,
       pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prokind in ('f', 'p') order by 1, 2, 3;
select t.tgrelid::regclass, t.tgname, t.tgenabled, pg_get_triggerdef(t.oid, true)
from pg_trigger t join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where not t.tgisinternal and n.nspname in ('public', 'auth', 'storage')
order by 1, 2;
select * from information_schema.role_table_grants where table_schema = 'public';
select * from information_schema.role_column_grants where table_schema = 'public';
select * from pg_default_acl;
select nspname, nspacl from pg_namespace
where nspname in ('public', 'auth', 'storage', 'supabase_migrations');
select n.nspname, t.typname, e.enumlabel, e.enumsortorder
from pg_type t join pg_namespace n on n.oid = t.typnamespace
join pg_enum e on e.enumtypid = t.oid
where n.nspname = 'public' order by 1, 2, 4;
select extname, extversion, extnamespace::regnamespace from pg_extension;
select to_regclass('supabase_migrations.schema_migrations') as migration_history,
       to_regclass('public.opportunity_references') as references_table,
       to_regprocedure('auth.uid()') as auth_uid,
       to_regprocedure('public.is_staff()') as staff_function,
       to_regprocedure('gen_random_uuid()') as uuid_function;
rollback;
```

Keep raw function definitions, trigger arguments and catalog output in restricted
external audit storage: custom SQL can contain embedded secrets. Review/redact
before recording evidence in Git. Inspect migration history only if it exists;
select versions/names without publishing stored SQL indiscriminately. Do not create
a history table or repair history to make an audit work. Also examine sequence
definitions/ACLs, views/dependencies, custom schemas, publications and scheduled
database jobs before deciding restore scope. Function bodies must prove is_staff
and profile/Auth integration; advertised function names are insufficient.

Within a new read-only snapshot, evaluate each actual 0013 CHECK expression against
existing columns using `(<expression>) IS FALSE` (PostgreSQL CHECK permits NULL).
Separately count nullable trust values that violate the intended application
contract even if SQL would permit them. Check all lengths with `char_length` and
`trim`, allowed values, paired attribution and auth FK orphans; retain counts only.
For absent columns, model the exact new defaults without ALTER/UPDATE. Inspect
existing reference column types, unique `(opportunity_id,url)` conflict arbiter,
multi-canonical groups, duplicate pairs, URL/label lengths, source_type values,
FKs, extra NOT NULL columns/defaults and row triggers. Check every same-named
constraint/index/policy/function for equivalent definition, not merely existence.
An enum-backed historical 0006 source_type is a stop for compatibility review
because 0013 inserts text expressions and does not rebuild an existing table.

## Free-tier recovery gate: OWNER-BLOCKED

Created: **no schema, data, roles, migration-history or service backup**.
Verified: **no backup hashes, restore test or recoverability evidence**.
Available: the partial audit above and a proposed procedure below, not recovery.

Owner action: securely provide existing database connection access for production
read-only catalog inspection/logical export and, separately, staging administration.
Use the respective project's Dashboard Connect panel to identify the exact host,
port, user and reference. Supply secrets through protected local/session configuration,
never chat, Git, command transcripts or shell history. An API service-role key is
not a PostgreSQL database password. Do not reset the production password or change
production settings to obtain access under this task's read-only authorization.
Alternatively, the owner can perform the production exports/audit on a trusted
machine and make the protected artifacts available locally for inspection.

After access exists, prepare pinned Supabase CLI/Docker/PostgreSQL tooling in an
isolated operations directory; record their actual versions. This tooling setup is
agent work, not an owner approval requirement. Do not install project dependencies
or initialize/link this application's Supabase directory for convenience.

Supabase recommends CLI exports and off-site storage for Free-tier projects; Storage
object bytes are not included in database backups. See the official
[database backup scope](https://supabase.com/docs/guides/platform/backups).

Proposed export sequence, NOT executed:

1. Create restricted, encrypted durable backup storage OUTSIDE the repository and
   unencrypted cloud-sync folders. Do not use temporary files as durable recovery.
2. Validate the production endpoint explicitly for the read-only export path. Run
   only dump operations; no production restore/link/migration/reset/repair.
3. Use the installed CLI's reviewed `db dump` workflow with explicit `--db-url`
   supplied securely in memory and `--file` pointing outside Git. Obtain separate
   schema, `--data-only --use-copy`, and `--role-only` artifacts. Keep credentials
   out of captured arguments/logs; restrict the process session. Do not print
   `--dry-run` dump scripts containing resolved connection secrets.
4. Export existing supabase_migrations schema/data separately if present. Inventory
   custom auth/storage SQL separately and record actual inclusion/exclusion.
5. Capture successful exit codes, byte sizes, SHA-256 hashes, source ref, tool/server
   versions, UTC start/end and scope in a nonsecret manifest. Multiple dumps are
   not automatically one consistent snapshot; document concurrent worker activity
   and arrange a supported consistent snapshot if recovery requires it, without
   changing production workers under this task.
6. Inspect locally for truncation/errors and dependency completeness. Hashes alone
   do not establish restoration. For the guarded staging schema derivative, use
   reviewed psql input with `--single-transaction`, `ON_ERROR_STOP=1` and the exact
   validated staging connection; never include production data/role dumps. Rehearse
   the sanitized schema restore on guarded
   staging and compare catalogs. A full private-data restore is a separate protected
   recovery drill, not authorized on application staging by this task.

The [official CLI backup/restore procedure](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
uses separate role/schema/data exports and a failure-stopping transactional restore.
Migration history and custom auth/storage changes require separate attention;
custom login-role passwords need independent recovery. This task does not assume
Auth users, encrypted values, provider configuration, Edge Function code/secrets,
Storage files, Vercel settings or domains are recoverable from those files.
Inventory actual scope and any encryption dependencies securely before a future
production rollout. Never transfer production passwords, sessions or root keys to
staging. A full production recovery procedure remains unverified until rehearsed
within an explicitly authorized, appropriately protected recovery environment.

## Selected baseline method and sanitization

**Option A is selected provisionally:** derive an application schema baseline from
the actual production catalog/export, review it, restore to isolated staging, then
load synthetic fixtures. Historical drift makes replay from 0001 unreliable.
Option B requires an equally complete catalog comparison plus compensating DDL;
there is no verified reconstruction here. No supported alternative was found.

Do not execute the baseline restore until the production schema/conflict audits,
recovery gate and staging target proof are satisfied. The current owner credential
block stops this session before setup even though the procedural strategy is ready.
No production-equivalent DDL or fixture SQL has been fabricated from API metadata.

Prepare a reviewed staging derivative of the schema export, separate from immutable
recovery originals. Match columns/types/defaults/constraints/indexes/RLS/policies,
function definitions/owners/security/search paths, grants/default ACLs and triggers,
including the production-specific Auth-to-profile trigger. Preserve managed staging
Auth infrastructure; identify and port only verified custom integration DDL.
Review database jobs, webhooks, FDWs and function bodies for external effects or
production endpoints. Keep them inactive or substitute staging endpoints, recording
each difference. Do not blindly restore production roles or their credentials.

Review target default privileges before restoration: a new project's defaults can
silently broaden grants. Make necessary staging-only ACL adjustments to achieve
the audited production privileges and verify effective grants afterward. The
[CLI reference](https://supabase.com/docs/reference/cli/su) documents dump scope,
default-privilege considerations and `db push --dry-run` behavior.

Load hand-authored synthetic opportunities/categories/organizations/source entries
using reserved example domains and staging UUIDs. Sources remain inactive and no
worker runs. Cover historical timestamps; known/null deadlines; country-only
location with the legacy default; source_url equal/different/null; manual/RSS/web
provenance; pending/published/rejected; and the observed shared-URL pair under two
different opportunity IDs if the audited schema permits it. Do not add M31 evidence
columns to manufacture a pre-M31 test. Model verified/unknown country states only
if the actual pre-M31 schema supports them. Keep intentional invalid reference or
evidence fixtures in a separate disposable test case, not the accepted baseline.

Do not copy production Auth users/passwords/sessions, profiles, submitter identities,
saves, private alerts/preferences, attribution identities or private opportunity
content. Production data exports belong only in protected recovery storage and must
never be loaded wholesale into staging. No production data was copied to staging.
User A, User B and moderator are future staging-only identities; none was created.
Add synthetic history/events/saves only when needed with staging-only ownership and
normal staging mechanisms; do not bypass security/attribution constraints for realism.

## Reusable staging target guard procedure

This is a mandatory operational guard, not an application runtime change. It has
not been satisfied for a live staging connection in this session.

Before EACH restore, seed, DDL, history operation, worker run or configuration write:

1. Read the immutable allowed target from this runbook: `pumzofcwfjqswkiwfqty`.
   Independently inspect the staging Dashboard project's Settings/Connect identity
   (or authenticated management project metadata); confirm the exact same ref and
   that it differs from `jltuufukcwztugvojwjd`. A remembered CLI link is insufficient.
2. Inspect the actual connection in memory without printing credentials. A direct
   database host must be exactly `db.pumzofcwfjqswkiwfqty.supabase.co`; for a session
   pooler, the verified Dashboard host/port AND user suffix
   `.pumzofcwfjqswkiwfqty` must match. Reject ambiguous aliases, unexpected URI
   options/service overrides and any production marker. The app/API URL, if used,
   must be exactly `https://pumzofcwfjqswkiwfqty.supabase.co`.
3. In an isolated operations process/directory, inspect explicit CLI arguments,
   workdir/config/link, environment files and inherited PG*/DATABASE*/SUPABASE*
   connection settings. Fail closed on production, unknown identity or conflicting
   targets. Never load this repository's production `.env.local`. A lack of link
   does not replace connection verification.
4. Open a TLS-verified read-only connection to that exact endpoint first. Check
   expected catalog state and server identity details against the independently
   verified project. Never use a self-created marker table as sole identity proof.
5. Bind the reviewed operation to those exact validated connection parameters;
   do not resolve a default link/env again between validation and execution.
   Record only target ref, action, input SHA-256, UTC and result. Repeat if anything
   changes. Redact all connection secrets in errors as well as normal output.
6. Check audit/recovery/compatibility gates separately. Identity proof alone is not
   permission to execute 0013 or to restore private production records.

For Dashboard SQL operations, recheck the project ref in the current tab URL and
project settings immediately before Run, and inspect the entire selected SQL.
Do not use a production SQL tab for staging. Production export tools must have a
separate explicit read-only path; do not weaken this guard to accommodate them.

## Baseline verification and 0013 compatibility gate

No staging baseline exists, no comparison has run, and no migration preview has run.
The API findings cannot prove production equivalence or migration readiness.

After guarded restore and fixture load, compare normalized source/target catalogs
for all relevant tables/columns/defaults/nullability, enums, validated constraints,
index definitions/validity, policies/RLS, grants/default ACLs, function bodies/owners,
search paths and triggers. Include provenance/source registry, profiles/Auth,
saves and M30 history/preferences/events. Record intentional environment/fixture
differences individually. Preserve staging fixture ID sets/counts and a baseline
schema/fixture backup with a demonstrated staging-only restore path before 0013.

Review [0013](../supabase/migrations/0013_m31_data_trust.sql) unchanged. Prove its
opportunities/provenance/country/deadline prerequisites, auth.users/auth.uid(),
public.is_staff(), UUID generator, conflict arbiter and every existing-object
definition are compatible. IF NOT EXISTS does not reconcile drift. Review possible
trigger interactions and row preservation; evidence checks/backfills need actual
database execution later, not merely a list of filenames.

Only after baseline proof, consider an isolated operations migration directory
containing exactly the unchanged 0013 file, with no seeds or earlier migration
files. First inspect existing migration history read-only and the pinned CLI's
behavior on missing history; stop if preview would initialize metadata. If safe,
use explicitly staging-targeted `db push --dry-run` to review pending files.
Never preview with this repository's whole 0001-0013 directory or use --include-all,
reset or history repair to suppress historical drift. For the handoff's explicit
SQL procedure, review the single file and catalog prerequisites instead of inventing
CLI history. A CLI preview does not execute constraints/backfills or prove they pass.
Do not execute-and-rollback 0013 as a purported read-only dry run in this task.

Current decision: **NOT READY TO APPLY 0013**. Default endpoint for a successful
future baseline session is baseline plus compatibility evidence, then STOP. Applying
0013 requires all owner-listed identity/baseline/recovery/compatibility gates and
unambiguous authority; production migration is a separate future owner decision.
Any actual code or migration blocker must be reported without fixing it here.

Future staging hosting must explicitly set a staging NEXT_PUBLIC_SITE_URL,
Supabase Site URL and /auth/callback allowlist; preserve production/staging Vercel
variable and canonical URL separation. These are continuity requirements only:
no domain, hosting, flag, Auth or worker configuration changed in this task.

## Exact next action and close

**Owner securely provisions existing production database access for read-only
catalog/export work and separate staging database access through protected local
configuration.** No secrets in chat; no production password reset under this task.
Then resume the catalog/recovery gates above, not migration 0013.

This session closes only the blocked-baseline documentation checkpoint, not M31 or
the staging-baseline milestone. Documentation-only verification: inspect diff and
links, verify secret/dump/.env hygiene and run `git diff --check`. No application,
migration, dependency, workflow or runtime configuration changes are authorized by
this close. Diff review, local documentation links and a check against actual local
secret values passed; migration files remain unchanged. `git diff --check` passed.
`npm.cmd run verify:plan -- --base 8c80a7b9aed037156fc9484c714950578db2f6c2`
classified exactly the two documentation files, selected no change-triggered gates
and required no production evidence. Full tests/typecheck/lint/build were not run
for this documentation-only close under the authoritative handoff exception; the
planner's standard gates remain planned, not passed. Its lack of path-based owner
actions does not clear the operational database-credential/recovery blocker above.
The documentation commit is identifiable by `Document M31 staging baseline`;
obtain its SHA and remote relationship from Git rather than embedding a self-reference.
