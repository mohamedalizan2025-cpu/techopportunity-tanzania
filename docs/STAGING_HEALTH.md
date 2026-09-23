# Staging Supabase health

Status: **HEALTHY NOW; AUTOMATION PREPARED, OWNER-DISABLED**.

## Environment boundary

- Production: `jltuufukcwztugvojwjd` — never used by this check.
- Staging: `pumzofcwfjqswkiwfqty` — the only permitted target.
- Repository `.env.local` is production-only and is never loaded.
- Local database inspection uses only the protected staging credential file at
  `C:\Users\hp\.tech-opportunity-secrets\staging-db.env` after exact-ref,
  expected-key, no-production-marker, and inherited-environment guards.

## 2026-09-23 evidence

At `2026-09-23T19:00Z`, Supabase Dashboard identified **Tech Opportunity
Staging**, exact URL ref `pumzofcwfjqswkiwfqty`, on the Free organization, with
Nano compute in `eu-central-1` and project status **Healthy**. The project
overview showed no inactivity-warning banner. The owner's warning email remains
real external evidence; absence of a dashboard banner does not revoke it.

A TLS session-pooler connection on port 5432 used staging-only protected
credentials and an explicit `BEGIN READ ONLY`. PostgreSQL 17.6 reported
`transaction_read_only=on`. Aggregate staging state was unchanged from the
documented synthetic baseline: 6 opportunities (2 published, 3 pending, 1
rejected), and zero talent profiles, saved opportunities, talent activity, or
provider campaigns. No row contents were read or recorded.

Runtime RLS proof under database role `anon` returned exactly the 2 published
opportunities and zero non-published rows. Catalog/access proof found RLS enabled
on `opportunities` and `talent_profiles`, no anonymous SELECT privilege on
`talent_profiles`, authenticated SELECT present, and the expected 3 profile
policies. The transaction ended with `ROLLBACK`; no user data, schema, policy,
or configuration changed.

## Prepared maintenance

`.github/workflows/staging-health.yml` is a small daily Free GitHub Actions job.
It is disabled unless repository variable
`STAGING_SUPABASE_HEALTH_ENABLED=true`. When enabled, it uses only encrypted
secret `STAGING_SUPABASE_ANON_KEY`, fixes the target to the exact staging URL,
performs two HTTP `GET` requests, verifies published-only opportunity visibility
and anonymous denial on private `talent_profiles`, and uploads a 30-day JSON
health artifact. It has no production secret, database password, write request,
Discovery code path, schema operation, or synthetic-data creation.

Supabase documents that Free projects with low activity over seven days may be
paused, that a few user database requests each day are typically enough, and
that visiting the project or API activity can prevent an announced pause. This
workflow records meaningful connectivity/RLS evidence, but **does not guarantee
exemption from pausing**. See [Supabase project pausing](https://supabase.com/docs/guides/platform/free-project-pausing).

## Activation and rollback

Activation remains owner-controlled because GitHub's passkey verification is
still pending:

1. complete GitHub passkey verification;
2. store the existing staging project's anonymous/publishable API key as the
   repository secret `STAGING_SUPABASE_ANON_KEY` (never paste it into chat);
3. set repository variable `STAGING_SUPABASE_HEALTH_ENABLED=true`;
4. manually dispatch `Staging Supabase health` once and verify a healthy artifact.

Rollback is to set the enable variable to `false` or delete it, then delete the
staging-only secret if the workflow is retired. No production action is needed.
