# Data API grant contract

Updated: 2026-09-24

Status: **0021 + 0022 APPLIED TO STAGING AND PRODUCTION (COMMITTED)**

Supabase will stop automatically exposing newly created `public` tables to the
Data API on 2026-10-30. Grants and RLS are separate controls: a grant decides
whether a role can reach an object at all; RLS decides which rows that role can
reach. The upstream notice and current security guidance are:

- <https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically>
- <https://supabase.com/docs/guides/api/securing-your-api#default-privileges>

Migration `0021_explicit_data_api_grants.sql` is the forward-only current-object
contract. It does not edit or replay an applied migration. It closes every current
table, sequence, and routine first, then grants only the operations below. Live
staging verification found that its future-sequence default revoke omitted the
independent PostgreSQL `UPDATE` sequence privilege. Applied `0021` is immutable;
additive migration `0022_close_future_sequence_update_grants.sql` closes that
remaining future-object default without reopening any current object. `0022` is
now committed on staging and production (evidence below).

PostgreSQL's built-in future `PUBLIC EXECUTE` for functions is a global creator-
role default, so that one revoke cannot be schema-local; exposed public routines
are still granted individually.

Prepared SHA-256 values (recompute and match immediately before any apply):

- migration `0021`: `EC83AD93A912BB0D77319BB76C549D62CFA52BFD80FB994897CA64733424CFA4`
- additive migration `0022`: `5EC4F35B157B2EB0A7536DA5E49EA2419EA63286C9CC366FD4514B159617BAB7`
- rollback-only role test: `D00A2D5A4678EC5AB7CA236931DC29E4D9735E674D482A6C57BB1A35F8DA3AE7`

## Table permission matrix

An em dash means no table privilege. RLS remains enabled on all 14 tables and is
still required even where a role has an object privilege.

| Table | `anon` | `authenticated` | `service_role` | Reason |
|---|---|---|---|---|
| `categories` | SELECT | SELECT | SELECT | Public taxonomy; moderation and workers resolve slugs. |
| `organizations` | SELECT | SELECT, INSERT, UPDATE, DELETE | — | Public organization data; mutations remain staff-only through RLS. |
| `profiles` | — | SELECT | — | Own profile and staff-access checks only; Auth trigger writes as function owner. |
| `opportunities` | SELECT, INSERT | SELECT, INSERT, UPDATE, DELETE | SELECT, INSERT, UPDATE, DELETE | Published reads and pending-only submission; authenticated moderation is RLS-gated. Service INSERT/DELETE is retained for the guarded reversible schema probe; normal Discovery inserts through `anon`. |
| `opportunity_sources` | SELECT | SELECT, INSERT, UPDATE, DELETE | SELECT, UPDATE | The anonymous grant intentionally returns zero rows under RLS but permits the public opportunity projection and security probe. Staff management and worker health updates remain isolated. |
| `opportunity_enrichments` | — | SELECT, INSERT | SELECT, INSERT | Staff audit reads/writes and controlled worker enrichment only. |
| `opportunity_references` | SELECT | SELECT, INSERT, UPDATE, DELETE | SELECT | Published provenance is public through RLS; staff manages it; worker deduplication reads it. Trigger-owned writes do not need caller INSERT. |
| `saved_opportunities` | — | SELECT, INSERT, DELETE | SELECT | Owner-only bookmarks; alert worker reads them. No UPDATE exists. |
| `opportunity_deadline_changes` | — | SELECT | SELECT | Staff audit read and alert-worker read; the trigger function owns inserts. |
| `user_alert_preferences` | — | SELECT, INSERT, UPDATE | SELECT | Owner-only preference; alert worker reads enabled users. |
| `deadline_alert_events` | — | SELECT | SELECT, INSERT, DELETE | Owner reads; alert worker generates, deduplicates, and prunes. |
| `talent_profiles` | — | SELECT, INSERT, UPDATE | — | Owner-only personalization. No staff, anonymous, or service-role data path. |
| `talent_opportunity_activity` | — | SELECT, INSERT, UPDATE, DELETE | — | Owner-only activity. Aggregate campaign RPCs read as function owner. |
| `provider_campaigns` | — | SELECT, INSERT, UPDATE, DELETE | — | Staff-only administration through RLS; no public or direct service path. |

The authenticated CRUD-looking entries are not grants to every signed-in user.
They make the operation available to the role; existing owner/staff RLS policies
still reject ordinary users where required.

## Routine and sequence contract

`authenticated` alone receives EXECUTE on:

- `is_staff()` because authenticated RLS policies call it;
- `reject_pending_opportunity(uuid, text)`;
- `unpublish_published_opportunity(uuid, text)`;
- `get_campaign_engagement(uuid)`; and
- `get_campaign_audience(uuid)`.

No Data API role receives direct EXECUTE on trigger-only routines
(`handle_new_user`, `set_updated_at`, deadline/reference synchronization, or
moderation audit triggers). Trigger execution was exercised after those revokes.
`categories_id_seq` has no Data API grant because category rows are migration
seeds, not runtime writes. Migration `0022` additionally revokes `USAGE`,
`SELECT`, and `UPDATE` from the `postgres` public-schema default for all future
sequences. All three privileges matter: `UPDATE` independently permits sequence
mutation even when `USAGE` and `SELECT` are absent.

## Caller audit

- Public browse/detail reads `opportunities` with category, organization, source,
  and published references; anonymous submission reads category/organization and
  inserts pending opportunities.
- Authenticated user paths read their profile, saved rows, alert preference/events,
  talent profile, and opportunity activity. They never use `service_role`.
- Moderator paths use the authenticated client for pending/published reads,
  organization/category validation, opportunity updates, enrichment audit writes,
  staff-only campaign CRUD, and the four authenticated RPCs.
- Discovery uses service credentials for category/source/reference/deduplication
  reads and source health updates, but uses the anonymous client for the RLS-bound
  pending insert. Enrichment and controlled repair/probe scripts account for the
  remaining service operations.
- Deadline alerts use service credentials to read preferences, saves and deadline
  history, then insert/deduplicate/prune generated events.
- No current application, worker, health check, or RPC directly reads private
  talent or campaign tables as `service_role`.

## Verification evidence

### Static and future-migration check

`npm run test:data-api-grants` inventories every `CREATE TABLE` and
`CREATE FUNCTION` across the migration directory. It currently proves closed-first
coverage for 14 tables and 11 functions, rejects `GRANT ALL`/bulk grants, checks
the category sequence, and requires every later migration that creates a public
object to include its own explicit revoke. A later migration may then add only
the operations its reviewed caller/RLS contract needs; intentionally private
objects receive no grant.

### Restrictive local proof

Two independent PostgreSQL 17 disposable databases passed
`supabase/tests/data_api_grants.sql`:

1. a fresh isolated restore of the protected production schema-only baseline,
   with Supabase's future restrictive defaults applied before the remaining
   additive migrations `0018`–`0021`; and
2. a schema-only, no-data, no-ACL read-only copy of exact staging
   `pumzofcwztugvojwjd`, with `0021` applied only to the disposable copy.

The test uses real `SET ROLE anon`, `SET ROLE authenticated`, and
`SET ROLE service_role` sessions. It verifies exact catalog privileges, published-
only anonymous reads, zero-row anonymous source access, pending-only anonymous
insert, owner-only profile/save/preference/activity paths, staff-only campaign
administration/RPCs, service worker operations, denied private service reads,
trigger behavior after routine revokes, no sequence access, and a newly created
table/function/sequence receiving no automatic Data API privilege. All fixtures
and probes run inside one transaction and roll back.

The repository's full historical `0001`–`0020` replay is deliberately not used as
the recovery path. It is already documented as prohibited: unapplied legacy design
`0006` creates an enum-backed references table, while forward migration `0013`
matches the real production/staging history where `0006` was absent and creates a
text-backed table. A trial replay failed at that exact known collision. Applied
migrations remain immutable; the authoritative schema-only recovery baseline plus
forward migrations is the proven equivalent fresh-schema path.

### Live staging read-only audit

The guarded 2026-09-24 audit used only the protected staging credential, exact ref
`pumzofcwfjqswkiwfqty`, TLS session pooler, and a `READ ONLY` transaction:

- 14 public tables, all 14 with RLS; 11 public functions;
- actual `anon` role: 2 published opportunities, 0 non-published, 0 sources;
- actual `authenticated` role without a claim: 2 published opportunities and 0
  profiles;
- actual `service_role`: all 6 synthetic opportunities and 1 source;
- current legacy table grants remain broader than this contract (`anon` has
  SELECT/INSERT/UPDATE/DELETE on six tables; `service_role` has all four operations
  on all 14); all three roles still have category-sequence access; and
- both `postgres` and `supabase_admin` have legacy public-schema default ACL rows.

Those results prove current RLS still protects rows, but also prove why explicit
object-level tightening is necessary. The live staging database was not changed.

### Live staging application and verification

On 2026-09-24, owner-authorized migration `0021` was applied only to exact staging
ref `pumzofcwfjqswkiwfqty` through the TLS session pooler. The input SHA-256 was
recomputed as `EC83AD93...CFA4`, exact target and production-exclusion guards
passed, and `psql -v ON_ERROR_STOP=1 -f` executed only the migration's own
`BEGIN`/`COMMIT`. Production ref `jltuufukcwztugvojwjd` was not used.

Before the apply, a fresh schema-only, no-data recovery set was written outside
Git at
`C:\Users\hp\.tech-opportunity-backups\20260924T081503Z-0021-data-api-grants-staging`.
It contains custom and plain PostgreSQL 17 schema exports, a parsed archive list,
the exact migration and test inputs, and a checksum manifest. Inheritance is
disabled; only the owner, `SYSTEM`, and Administrators have access. The manifest
SHA-256 is `B340B40EF5FB976F5015F616E9C6DD03ECCA986AAF9136D4E52EA3877488843C`.

Post-apply proof established:

- all 14 public tables still have RLS, with 11 public functions, 12 application
  triggers, and 36 policies;
- the no-ACL pre/post schema archive comparison has zero lines of structural
  drift; only the intended ACL/default-ACL change occurred;
- all 14 table counts, Auth user count, and category sequence state remained at
  the exact baseline (`2,1,0,6,1,0,9,0,0,0,0,0,0,0`; Auth `0`; sequence `6`);
- live-safe rollback fixtures left zero rows and did not advance the sequence;
- current-object role/RLS behavior passed for anonymous published-only access,
  authenticated ownership, staff campaign/moderation paths, service operations,
  RPCs, and triggers; and
- staging-health run
  [`35975661578`](https://github.com/mohamedalizan2025-cpu/techopportunity-tanzania/actions/runs/35975661578)
  succeeded on commit `08a6e92`, reporting exact staging ref, HTTP 200, two
  published and zero non-published anonymous rows, HTTP 401 for private talent
  profiles, and `readOnly: true`.

The strengthened future-object probe then correctly failed on a newly created
sequence: legacy default ACLs still granted `UPDATE` to `anon`, `authenticated`,
and `service_role`. Current `categories_id_seq` has none of `USAGE`, `SELECT`, or
`UPDATE`; the gap affects only future `postgres`-owned public sequences. The exact
`0022` correction plus the full actual-role test passed on the live staging schema
inside one outer transaction and rolled back. A post-test catalog check confirms
`0022` did not persist and all fixtures remain absent. Therefore `0021` is applied
and useful, but the complete future-default contract is not operationally proven
until `0022` receives separate staging authorization and is committed there.

### Live staging committed `0022` apply (2026-09-24)

On 2026-09-24, owner-authorized migration `0022` was applied only to exact staging
ref `pumzofcwfjqswkiwfqty` through the TLS session pooler. The input SHA-256 was
recomputed as `5EC4F35B...17BAB7`, exact target and production-exclusion guards
passed, and `psql -v ON_ERROR_STOP=1` executed only the migration's own
`BEGIN`/`COMMIT`. No broad `db push`, reset, replay, or unrelated migration ran.
Production ref `jltuufukcwztugvojwjd` was not used.

Pre-apply read-only proof confirmed `0021` active and `0022` absent: the
`postgres`-owned public sequence default ACL was
`{postgres=rwU,anon=w,authenticated=w,service_role=w}` (UPDATE still granted),
with 14 RLS tables, 11 functions, 12 triggers, 36 policies, row counts
`2,1,0,6,1,0,9,0,0,0,0,0,0,0`, Auth `0`, and category sequence `6`/called.

Before the apply, a fresh schema-only, no-data recovery set was written outside
Git at
`C:\Users\hp\.tech-opportunity-backups\20260924T101201Z-0022-data-api-grants-staging`.
It contains custom and plain PostgreSQL 17 schema exports, a parsed archive list,
the exact migration and test inputs, and a checksum manifest. Inheritance is
disabled; only the owner, `SYSTEM`, and Administrators have access. The manifest
SHA-256 is `7D099C4CDDD85D2DA8F1C9F4F61DFEAE8B2AAF442D3782A8C6A3135924B4CB55`.

Post-apply proof established:

- the `postgres`-owned public sequence default ACL is now exactly
  `{postgres=rwU/postgres}`: `USAGE`, `SELECT`, and `UPDATE` are denied by
  default to `anon`, `authenticated`, and `service_role` for all future
  sequences; table and function defaults are unchanged;
- the full live actual-role test `supabase/tests/data_api_grants.sql`
  (SHA-256 `D00A2D5A...35F8DA3AE7`) PASSED on the committed schema with no
  outer rollback correction: exact catalog matrix, published-only anonymous
  reads, zero-row anonymous source access, pending-only anonymous insert,
  owner-only profile/save/preference/activity paths, staff-only campaign
  administration/RPCs, service worker operations, denied private service reads,
  trigger behavior after routine revokes, no sequence access, and a newly
  created table/function/sequence receiving no automatic Data API privilege
  (fixtures rolled back);
- all 14 public tables still have RLS, with 11 public functions, 12 application
  triggers, and 36 policies;
- the no-ACL pre/post schema archive comparison has zero lines of structural
  drift; the raw diff shows only the intended removal of the three
  `GRANT UPDATE ON SEQUENCES` default-privilege lines;
- all 14 table counts, Auth user count, and category sequence state remained at
  the exact baseline (`2,1,0,6,1,0,9,0,0,0,0,0,0,0`; Auth `0`; sequence `6`);
- live-safe fixtures left zero rows, zero probe objects, and did not advance
  the sequence;
- local staging smoke is healthy (HTTP 200, 2 published / 0 non-published,
  talent profiles 401, read-only); and
- staging-health run
  [`35986286349`](https://github.com/mohamedalizan2025-cpu/techopportunity-tanzania/actions/runs/35986286349)
  succeeded on commit `838dbdc` via `workflow_dispatch`, reporting exact staging
  ref, HTTP 200, two published and zero non-published anonymous rows, HTTP 401
  for private talent profiles, and `readOnly: true`.

Post-apply schema archives (`staging_public_schema_post_0022.dump` 98,071 B
`3F4FF63E…`, `.sql` 71,307 B `E6E55861…`, `.list` 15,645 B `51745153…`) and the
machine-readable `application-evidence.json` are retained in the same protected
directory.

### Live production `0021` then `0022` apply (2026-09-24)

On 2026-09-24, owner-authorized migrations `0021` then `0022` were applied in
order, each in its own transaction, only to exact production ref
`jltuufukcwztugvojwjd` through the TLS session pooler. Both input SHA-256
values were recomputed (`0021 EC83AD93...CFA4`, `0022 5EC4F35B...17BAB7`),
exact target and staging-exclusion guards passed, and
`psql -v ON_ERROR_STOP=1` executed only each migration's own `BEGIN`/`COMMIT`.
No broad `db push`, reset, replay, history repair, or unrelated migration ran.
Staging ref `pumzofcwfjqswkiwfqty` was not contacted during the write phase.

Pre-apply read-only proof confirmed neither migration's effects were present:
legacy `postgres` + `supabase_admin` default ACLs still granted full future
table/sequence/function access to all three Data API roles. Live baseline: 14
public tables (all 14 RLS), 11 functions, 12 triggers, 36 policies, categories
13, opportunities 309 (215 pending / 8 published / 86 rejected), 548
references, 75 enrichments, 31 sources, 3 profiles, 3 Auth users, category
sequence `16`/called, zero probe residue.

Before the apply, a fresh schema-only, no-data recovery set was written outside
Git at
`C:\Users\hp\.tech-opportunity-backups\20260924T102906Z-0021-0022-data-api-grants-production`.
It contains custom and plain PostgreSQL 17 schema exports, a parsed archive
list, both exact migration inputs plus the test input, and a checksum manifest.
Inheritance is disabled; only the owner, `SYSTEM`, and Administrators have
access. The manifest SHA-256 is
`042F6D9E0E7477536281B47BBE867892FC67B18F42EA97C40D96CAE7CC7D8E52`.

After `0021` committed and before `0022`, the expected current-object changes
were verified: future-table defaults narrowed to non-data privileges, future-
sequence defaults to `UPDATE`-only for the three roles, future-function
defaults cleared, `anon`/`service_role` routine EXECUTE revoked while
authenticated `is_staff()` EXECUTE remained, private service reads revoked
while worker reads remained, and all counts/sequence/Auth state identical.

Post-`0022` proof established:

- the `postgres`-owned public sequence default ACL is exactly
  `{postgres=rwU/postgres}`: future sequences deny `USAGE`, `SELECT`, and
  `UPDATE` to `anon`, `authenticated`, and `service_role`;
- the full live actual-role test `supabase/tests/data_api_grants.sql`
  (SHA-256 `D00A2D5A...35F8DA3AE7`) PASSED on production inside one rolled-back
  transaction: exact catalog matrix, published-only anonymous reads over the
  real corpus, zero-row anonymous source access, owner/staff/service paths,
  RPCs, triggers, and future-object deny-by-default; zero residue and the
  category sequence unchanged at `16`/called;
- all 14 public tables still have RLS, with 11 functions, 12 triggers, and 36
  policies;
- the no-ACL pre/post schema archive comparison has zero lines of structural
  drift; the raw diff (86 ACL lines) replaces only legacy `GRANT ALL` lines
  with the exact reviewed least-privilege matrix plus the default-privilege
  closures;
- all table counts, opportunity statuses (215/8/86), Auth users (3), and the
  category sequence remained at the exact baseline (no Discovery interleaving
  in the window);
- production application smoke is green: home HTTP 200 rendering opportunities,
  `/login` 200, `/activity` and `/moderation` 307 to login (guards intact); and
- staging, Cloudflare, Discovery, Gemini, and Groq were not modified.

Post-apply schema archives (`production_public_schema_post_0022.dump` 98,071 B
`062BE34F…`, `.sql` 71,307 B `07682DB1…`, `.list` 15,645 B `7ABDC7E3…`) and the
machine-readable `application-evidence.json` are retained in the same protected
directory. IMPLEMENTED in code, APPLIED to staging and production, VERIFIED on
both live environments: the platform is OPERATIONALLY READY for the 2026-10-30
Supabase permission change.

## Activation and rollback gates

1. **Completed:** staging-only `0021` apply, protected recovery, current-object
   role/RLS proof, zero unrelated structural/data drift, and staging-health smoke.
2. **Completed:** staging-only `0022` apply (hash `5EC4F35B...17BAB7`),
   protected recovery, committed future-default proof with the strengthened
   actual-role/future-object test passing without any temporary outer
   correction, zero unrelated structural/data drift, and staging-health smoke.
3. If a committed migration needs reversal, use a separately reviewed forward
   migration based on the protected recovery evidence; never restore broad
   automatic defaults or improvise destructive rollback.
4. **Completed:** production `0021` then `0022` apply (identical hashes, each
   in its own transaction), fresh production recovery export, committed
   current-object and future-default proof with the full actual-role test
   passing inside a rolled-back transaction, zero unrelated structural/data
   drift, production smoke green, and staging/Cloudflare/Discovery/AI
   isolation confirmed; no broad `db push`.

Status is **October 30 OPERATIONALLY READY on staging and production**.
Existing tables keep their current grants under Supabase's change, but no
future migration may depend on legacy defaults.
