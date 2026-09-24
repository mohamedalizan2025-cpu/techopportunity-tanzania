# Staging Supabase health

Status: **HEALTHY NOW; STAGING-ONLY AUTOMATION ACTIVATED**.

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

At `2026-09-23T20:04:14Z`, owner-approved GitHub Actions run
[`35913439505`](https://github.com/mohamedalizan2025-cpu/techopportunity-tanzania/actions/runs/35913439505)
completed successfully on commit `f6e08ae`. Its non-secret `report.json`
identified only staging ref `pumzofcwfjqswkiwfqty`, recorded HTTP 200,
`readOnly: true`, 2 public opportunities, 0 non-published opportunities, and
anonymous private-profile denial with HTTP 401. The report contains no key,
database password, row contents, production ref, or user data.

On 2026-09-24 after staging-only Data API grant migration `0021`, controlled
workflow run
[`35975661578`](https://github.com/mohamedalizan2025-cpu/techopportunity-tanzania/actions/runs/35975661578)
succeeded on commit `08a6e92`. Its report again bound only to
`pumzofcwfjqswkiwfqty`, returned HTTP 200, exposed 2 published and 0 non-published
opportunities, denied anonymous `talent_profiles` with HTTP 401, and remained
read-only. This is application/API connectivity and RLS smoke evidence; it does
not guarantee Free Plan pause exemption.

## Active maintenance

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

The owner approved activation on 2026-09-23. The existing staging project's
publishable key is stored only as encrypted repository secret
`STAGING_SUPABASE_ANON_KEY`; repository variable
`STAGING_SUPABASE_HEALTH_ENABLED=true` enables the daily check. The first
controlled manual run is the verified run above. This is connectivity and RLS
evidence, not proof that Supabase will exempt the Free project from pausing.

Rollback is to set the enable variable to `false` or delete it, then delete the
staging-only secret if the workflow is retired. No production action is needed.
