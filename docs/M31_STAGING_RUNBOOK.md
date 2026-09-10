# M31 staging database migration verification

Updated: 2026-09-10. Status:

**M31 DATABASE MIGRATION VERIFIED ON STAGING**

**0013 APPLIED SUCCESSFULLY TO STAGING**

**M31 FEATURE FLAG ENABLED ON STAGING PREVIEW ONLY**

**M31 COUNTRY AUDIT FIX VERIFIED ON STAGING**

**M31 LIVE APPLICATION VERIFIED ON STAGING**

This runbook records the completed staging database migration and governs the next
isolated staging-application verification milestone. It does not authorize a
production migration, corpus work, discovery execution, or AI work.

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

Immediately before migration 0013, staging had:

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

## Migration 0013 execution

Migration file: [0013_m31_data_trust.sql](../supabase/migrations/0013_m31_data_trust.sql)

SHA-256:
`c67cd11086aecd563f04e86c9a665a476749c5877255e640efb61598d6e52306`

Immediately before execution, the hard guard reconfirmed the exact staging ref,
production exclusion, 10-table/27-column pre-M31 catalog, six fixture IDs, zero M31
columns, absent reference table/enum, absent migration history, and all protected
snapshot hashes. The existing protected pre-0013 schema and fixture dumps exactly
represented that live state and were reused. The acceptance marker was recorded at
2026-09-09 11:15:40 UTC.

The migration contains only transaction-compatible PostgreSQL DDL/DML. It has no
concurrent index, database/system command, vacuum, or other transaction-prohibited
operation. PostgreSQL 17.11 `psql` executed exactly that one unchanged file through
the hard-bound staging connection with `ON_ERROR_STOP=1`, `--single-transaction`,
no interactive fallback, and a read-only repository mount. Migrations 0001-0012
were not executed.

`DROP TRIGGER IF EXISTS` emitted the expected notice that the pre-M31 trigger did
not exist. PowerShell surfaced that stderr notice before the wrapper could retain
the native exit status. No rerun was attempted. The immediate authoritative
read-only probe established the complete committed post-state: all 10 columns, the
reference table and all rows, function and trigger existed together. A partial
commit was impossible under the single transaction. Protected evidence records the
notice and the authoritative result without credentials.

The authoritative committed-state probe completed at 2026-09-09 11:20:34 UTC.

Result: **0013 APPLIED SUCCESSFULLY TO STAGING**.

## Post-migration schema and backfill

Staging now has 11 public tables, 66 public constraints, 38 indexes, 25 public
policies, five public functions, and 12 non-internal public/Auth/Storage triggers.
All migration-added constraints and indexes are validated, valid, and ready.

`opportunities` has 37 columns. The 10 additions match the migration exactly:

- non-null `relevance_decision` defaulting to `unreviewed` and nullable
  `relevance_evidence`;
- non-null `eligibility` defaulting to `unknown` and nullable
  `eligibility_evidence`;
- nullable `qualification_rule_version`;
- non-null `country_verification` defaulting to `unknown` and nullable
  `country_evidence`;
- nullable `last_verified_at`, `decided_by`, and `decided_at`, with the Auth FK and
  paired attribution check.

`country` is now nullable and has no default. All nine M31 opportunity checks match
the file and are validated. The M31 trust listing index matches its expected
four-column definition.

`opportunity_references` has the expected eight columns, primary key, opportunity
and Auth foreign keys, URL/source-type/label checks, `(opportunity_id, url)` unique
constraint, one-canonical-per-opportunity partial unique index, and URL index. RLS
is enabled and FORCE RLS is disabled. Its two policies are the published-parent
public read and `is_staff()` management policies. Anonymous users have SELECT only;
authenticated users have SELECT/INSERT/UPDATE/DELETE subject to RLS; service and
owner grants remain platform-appropriate.

The synchronization function is SECURITY DEFINER with `search_path=public`; its
body and the AFTER INSERT/URL-update trigger match 0013. Supabase default ACLs leave
explicit function EXECUTE grants for platform roles after PUBLIC is revoked, but a
trigger-returning function cannot be invoked as an ordinary SQL function. Existing
23 policies and their earlier access boundaries were not modified.

All six opportunity IDs and their 2 published/3 pending/1 rejected statuses were
preserved. Backfill created exactly nine references: six canonical and three
secondary across all six opportunities. Types are two manual, four RSS, and three
website. The equal canonical/source URL correctly produced no secondary row; null
source URLs produced none; the shared URL across two distinct opportunities remains
valid. There are zero duplicate pairs, zero missing/multiple canonicals, zero
missing distinct source references, and zero invalid URLs.

All six rows have `unreviewed` relevance, `unknown` eligibility, `unknown` country
verification, null new evidence/attribution/version/verification timestamps, and
their original country/deadline evidence. Both known deadlines retained evidence.

## Constraint and trigger tests

Fourteen controlled invalid cases were rejected: invalid relevance and eligibility
states; missing eligibility/relevance evidence; blank relevance evidence; invalid
country state and evidence relationship; malformed attribution; qualified deadline
without evidence; empty reference URL; duplicate reference pair; second canonical;
invalid source type; and overlong label. The enclosing transaction was rolled back.
Cleanup remained six opportunities, nine references, and zero deadline-history rows.

A separate rollback-only behavior test inserted an opportunity with distinct
canonical/source URLs. The trigger created one canonical and one secondary RSS
reference. Updating its canonical URL retained exactly one current canonical and
the prior/source references as non-canonical. Rollback cleanup restored the accepted
six-opportunity/nine-reference state.

## Security verification boundary

Structural RLS, policies, grants, function security/search path, and triggers are
verified. Anonymous and authenticated-without-session role probes each saw exactly
the three references belonging to the two published opportunities. This is not a
claim of complete authenticated isolation. Real staging User-A/User-B/moderator
sessions, write persistence, cross-user denial, and staff behavior remain the next
milestone.

## Application regression verification

The focused M31 suite passed 17/17, including the Tanzania country-only regression.
The full project suite passed. TypeScript, ESLint, 29 permanent boundary checks, the
post-gate verification planner, and the Next.js 16.3.2 production build all passed.
The build's optional category/organization fetches were unavailable in the local
sandbox and failed closed; compilation, type checking, page generation, and route
output completed successfully. No test mutated production.

## Migration-history and next milestone

Direct SQL execution did not create the `supabase_migrations` schema or
`schema_migrations` table. Therefore staging now has the 0013 schema while no
repository/remote migration chain is registered. Do not use broad `db push`, replay
0001-0012, or run `migration repair` until a separate migration-history normalization
milestone is justified and explicitly authorized.

Production remained read-only and its homepage returned HTTP 200 after staging
verification. `M31_TRUST_SCHEMA_ENABLED` remains disabled; no staging application
was deployed.

## Live staging application checkpoint (2026-09-10)

The existing Vercel project was reused; no second project or custom environment was
created. Remote branch `staging` now exists. Its protected Preview is:

`https://techopportunity-tanzania-git-staging-techopportunity.vercel.app`

The Preview has four branch-only Config variables:

- `NEXT_PUBLIC_SUPABASE_URL`: staging project URL;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: staging public/anon key;
- `NEXT_PUBLIC_SITE_URL`: the stable branch Preview origin;
- `M31_TRUST_SCHEMA_ENABLED`: `true` on staging only.

The pulled branch configuration was decoded and checked without retaining or
printing secret values. Both URL and public JWT project references were
`pumzofcwfjqswkiwfqty`; the JWT role was `anon`; production ref
`jltuufukcwztugvojwjd` and `SUPABASE_SERVICE_ROLE_KEY` were absent. Existing
production environment-variable metadata was unchanged and the production M31 flag
remained absent. The deployment is protected by Vercel Authentication and returns
`X-Robots-Tag: noindex`. An authenticated CLI-generated bypass cookie was used only
for browser verification and then deleted.

Staging Supabase Auth has the exact stable Preview Site URL and exact
`/auth/callback` allow-list entry. A post-write config diff reported zero declared
updates; 11 unrelated remote-only settings were left unchanged. Production Auth was
not queried or changed.

Three tagged synthetic staging-only identities were created: User A, User B, and
Moderator. The Moderator uses the existing `profiles.role = 'moderator'` model.
No production user was copied. Four initial staging-only opportunities and one save
exercised the live paths. A fifth fresh opportunity later exercised the corrected
country audit. All five opportunities, three identities, profiles, references,
audits, saves, the test-only category, credentials, and local state were removed
after verification.

The deployed browser checks passed:

- Preview homepage HTTP 200 and noindex;
- published card/detail/source link, search and filter URL state;
- pending and rejected records hidden anonymously;
- canonical callback failure returns to the Preview origin, never production;
- User A login, cookie session after reload, save/remove/re-add persistence, logout,
  and re-login;
- User B cannot see User A's save and receives the existing moderation access denial;
- Moderator login and M31 approval through the existing review UI;
- the approved record becomes public and User A's prior save remains intact;
- zero browser page errors, console errors, or actionable request failures.

Direct authenticated staging queries independently proved that User B cannot read or
delete User A's save, insert as User A, or mutate an opportunity. Anonymous and
ordinary sessions saw only published fixture rows/references; Moderator saw all
fixture states/references. The approved row persisted `relevant`,
`tanzanians_eligible`, `verified_tanzania`, rolling-deadline evidence, qualification
rule `m31-2026-09-04-v1`, `last_verified_at`, and paired Moderator attribution. Its
canonical reference persisted. The country-only Tanzania row remained visible and
no pending/rejected fixture leaked.

### Proven defect and verified forward fix

The Moderator update succeeded, but Vercel emitted one info-level message:

`opportunity_enrichments_field_check` rejected the `country` audit row.

This is a genuine restored-schema mismatch: application moderation already includes
`country` in its existing enrichment audit, while the pre-M31 table constraint allows
only `venue_name`, `address`, `city`, `region`, and `deadline`. Authoritative M31
evidence and decision attribution are unaffected, but field-level country auditing
must not be silently lost.

[Migration 0014](../supabase/migrations/0014_m31_country_enrichment_audit.sql) is the
smallest forward-only correction: it adds only `country` to that existing check and
does not modify opportunity rows. Its reviewed SHA-256 is
`428a84738d2fa3bff2e1117f6938c2de0cc0ae7084fea2a4511837e7ad851b74`.
The owner authorized only that exact file. The hard guard confirmed branch
`staging`, clean HEAD `117fb6eee9a956ceff283b68a30b07e504b4fccf`, linked staging
project `pumzofcwfjqswkiwfqty`, unlinked production, and the expected old five-field
constraint. Explicit `BEGIN`/`COMMIT` made the two DDL statements atomic. Execution
completed successfully; migration 0013 was not rerun and no migration history was
created, repaired, or normalized.

The post-write catalog probe found one validated
`opportunity_enrichments_field_check` allowing `venue_name`, `address`, `city`,
`region`, `country`, and `deadline`. One fresh pending fixture started with country
`Kenya`. A single Moderator submission through the deployed Preview changed it to
verified `Tanzania` and returned HTTP 200 with zero browser page/console errors.
Exactly one audit row persisted with field `country`, previous value `Kenya`, new
value `Tanzania`, method `moderator-review`, and the matching canonical evidence URL.
The opportunity's `decided_by` matched the Moderator and its paired timestamp/trust
evidence persisted.

The Moderator could read the audit row. User A could not read or insert one; User B
could not update it. User A's save remained visible to User A and invisible to User
B. After the proof, explicit-ID cleanup removed all five live-test opportunities and
three tagged users. Cascaded reference, audit, save, and profile counts were zero,
and the test-only category was removed. The original protected six-opportunity
recovery baseline was not targeted.

The current Ready Preview deployment reported no error-, warning-, or info-level log
entries after the corrected action; the earlier constraint message did not recur.
Do not use broad `db push`, replay earlier migrations, or normalize migration
history.

Regression result for this checkpoint: 705 project tests passed, including 18 M31
tests and the previously completed 20 public-experience assertions, 11 lifecycle
tests, and 25 moderation-review tests. TypeScript, ESLint, all 29 permanent boundary
checks, and the post-gate migration review passed. No runtime/build input changed, so
the verification planner correctly did not select another production build.

Temporary Playwright harnesses, Supabase/Vercel link caches, response headers, the
Vercel bypass cookie, and the injected local `VERCEL_OIDC_TOKEN` line were removed.
The temporary protected test credential/state files were also deleted. No secret,
dump, backup, generated cache, or test credential is tracked by Git.

The one next action is: conduct a separate owner go/no-go review for production M31
activation using this completed staging evidence. Do not apply any production
migration or enable the production flag during that review.
