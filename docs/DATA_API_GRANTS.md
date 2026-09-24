# Data API grant contract

Updated: 2026-09-24

Status: **IMPLEMENTED AND PROVEN ON DISPOSABLE COPIES; NOT APPLIED TO LIVE STAGING OR PRODUCTION**

Supabase will stop automatically exposing newly created `public` tables to the
Data API on 2026-10-30. Grants and RLS are separate controls: a grant decides
whether a role can reach an object at all; RLS decides which rows that role can
reach. The upstream notice and current security guidance are:

- <https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically>
- <https://supabase.com/docs/guides/api/securing-your-api#default-privileges>

Migration `0021_explicit_data_api_grants.sql` is the one forward-only contract.
It does not edit or replay an applied migration. It closes every current table,
sequence, and routine first, then grants only the operations below. It also
removes automatic table/sequence/function privileges for future objects created
by `postgres`. PostgreSQL's built-in future `PUBLIC EXECUTE` for functions is a
global creator-role default, so that one revoke cannot be schema-local; exposed
public routines are still granted individually.

Prepared SHA-256 values (recompute and match immediately before any apply):

- migration `0021`: `EC83AD93A912BB0D77319BB76C549D62CFA52BFD80FB994897CA64733424CFA4`
- rollback-only role test: `6682B0FCF6CADAC99A612E8538602D6D5EE29E307B6B5504A3D845DB15B341EA`

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
seeds, not runtime writes.

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

## Activation and rollback gates

1. Owner explicitly authorizes **staging-only** migration `0021`.
2. Revalidate exact staging identity, take a fresh protected schema-only recovery
   export, hash-lock the migration, apply it in one failure-stopping transaction,
   and run the actual-role test plus the staging health workflow/app smoke checks.
3. Inspect zero unrelated schema/data drift. A failed test rolls back the migration
   transaction; after commit, rollback means a separately reviewed forward grant
   migration, never broad automatic defaults.
4. Production remains untouched until a separate explicit authorization after the
   staging proof. Production promotion requires its own recovery export, identical
   migration hash, role/RLS probes, application smoke checks, and staging-health
   isolation confirmation.

Until both live environments complete those gates, status is **October 30 code
ready, operational rollout pending**. Existing tables keep their current grants
under Supabase's change, but no future migration may depend on that legacy state.
