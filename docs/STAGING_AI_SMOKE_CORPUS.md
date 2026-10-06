# Staging AI smoke corpus (owner-executed, staging Supabase only)

Status 2026-10-06: **PREPARED — NOT YET INSERTED.** No agent in this
environment holds staging credentials or handles the staging database, so no
row has been created from here. Insertion is an explicit owner action in the
staging Supabase dashboard. Nothing in this file touches production, and no
product code was changed for this corpus.

Purpose: give Astra four clearly synthetic, published staging records so the
authenticated browser smoke in
[STAGING_AI_SMOKE_RUNBOOK.md](STAGING_AI_SMOKE_RUNBOOK.md) can exercise the
*existing* AI UI. The live staging shelf otherwise carries unknown
eligibility, for which the product correctly withholds Opportunity Insight
(`isAiSearchableOpportunity()` false) — that behavior is the D-3 PASS
condition, not a defect. Do NOT weaken the gate to make the smoke pass.

## Non-negotiable guards

1. Dashboard project selector must read the **staging** project
   (`pumzofcwfjqswkiwfqty`). Production is `jltuufukcwztugvojwjd`. If the
   selector does not prove staging, STOP — fail closed, insert nothing.
2. Run Step 0 first. It must return `existing_smoke_rows = 0`. If it does
   not, STOP (a previous corpus is still present — clean up first, §Cleanup).
3. Replace `<OWNER_STAGING_USER_UUID>` with the UUID of a **staging-only**
   identity (the owner's staging identity, never a production identity).
   Step 1 echoes that row back — confirm it is the intended staging
   identity before proceeding.
4. Never copy production identities, profiles, saves, or private rows into
   these records. All evidence strings below are synthetic by construction.
5. These rows are staging-only. They must never be exported, promoted, or
   replayed into production. Titles carry `[STAGING SMOKE]` and every URL
   uses the reserved `.invalid` TLD (RFC 2606 — unresolvable by design, no
   real organizer, no real application).

Why `.invalid` is safe here: the AI-searchable gate only requires an
HTTP(S)-shaped canonical evidence URL (`validEvidenceUrl`), and the
test/placeholder guard only special-cases `example.org` hostnames combined
with test-marked titles. `staging-smoke.example.invalid` with `[STAGING
SMOKE]` titles passes the gate without matching any contamination pattern
(proven by `tests/staging-ai-smoke-corpus.test.ts`).

## Step 0 — pre-insert guards (read-only)

```sql
select count(*) as existing_smoke_rows
from public.opportunities
where slug like 'staging-smoke-%';
-- REQUIRED RESULT: 0. Any other value: STOP, run §Cleanup first.

select id, email as owner_confirm_email_is_staging_only
from auth.users
where id = '<OWNER_STAGING_USER_UUID>';
-- REQUIRED RESULT: exactly one row, and the address must be a staging-only
-- identity. Zero rows: STOP (fix the UUID). A production address: STOP.
```

## Step 1 — insert (one transaction, staging only)

Category and actor resolve dynamically; nothing is hard-coded except the
synthetic payloads. If the category CTE finds no row, the INSERT fails
closed (null violation) instead of guessing.

```sql
begin;

with actor as (
  select '<OWNER_STAGING_USER_UUID>'::uuid as id
),
cat as (
  select coalesce(
    (select id from public.categories
     where slug in ('fellowship','grant','scholarship','internship',
                    'competition','hackathon','conference','workshop',
                    'tech-event','other')
     order by array_position(
       array['fellowship','grant','scholarship','internship',
             'competition','hackathon','conference','workshop',
             'tech-event','other'], slug)
     limit 1),
    (select min(id) from public.categories)
  ) as id
)
insert into public.opportunities (
  slug, title, description, category_id, organization_id,
  url, source_url, deadline, deadline_precision, deadline_evidence,
  status, city, region, country,
  relevance_decision, relevance_evidence,
  eligibility, eligibility_evidence,
  qualification_rule_version, country_verification, country_evidence,
  last_verified_at, decided_by, decided_at
)
select
  v.slug, v.title, v.description, (select id from cat), null,
  v.url, null, v.deadline, v.deadline_precision, v.deadline_evidence,
  'published', v.city, v.region, v.country,
  'relevant', v.relevance_evidence,
  v.eligibility, v.eligibility_evidence,
  'm31-2026-09-04-v1', v.country_verification, v.country_evidence,
  now(), (select id from actor), now()
from (values
  (
    'staging-smoke-national-fellowship-2026',
    '[STAGING SMOKE] National fellowship illustration — Dar es Salaam',
    'Synthetic staging record for authenticated AI interface verification. It describes an imaginary fellowship-style opportunity for learners based in Dar es Salaam, Tanzania. There is no real programme, no real organizer, and no application to submit.',
    'https://staging-smoke.example.invalid/staging-smoke-national-fellowship-2026',
    '2027-11-30T12:00:00Z', 'date',
    'Staging smoke: synthetic deadline assigned for interface verification (30 November 2027).',
    'Dar es Salaam', 'Dar es Salaam', 'Tanzania',
    'Staging smoke: synthetic record admitted for authenticated AI interface verification; relevance assigned by the smoke author.',
    'tanzanians_eligible',
    'Staging smoke: eligibility assigned for interface verification; Tanzanian applicants are treated as eligible in this synthetic record.',
    'verified_tanzania',
    'Staging smoke: country value assigned for interface verification (Dar es Salaam, Tanzania).'
  ),
  (
    'staging-smoke-international-fellowship-2026',
    '[STAGING SMOKE] International fellowship illustration — Nairobi access',
    'Synthetic staging record for authenticated AI interface verification. It describes an imaginary fellowship-style opportunity hosted in Nairobi, Kenya, explicitly open to Tanzanian applicants in this fiction. There is no real programme, no real organizer, and no application to submit.',
    'https://staging-smoke.example.invalid/staging-smoke-international-fellowship-2026',
    '2027-09-30T12:00:00Z', 'date',
    'Staging smoke: synthetic deadline assigned for interface verification (30 September 2027).',
    'Nairobi', null, 'Kenya',
    'Staging smoke: synthetic record admitted for authenticated AI interface verification; relevance assigned by the smoke author.',
    'tanzanians_eligible',
    'Staging smoke: eligibility assigned for interface verification; Tanzanian applicants are treated as eligible in this synthetic record.',
    'verified_other',
    'Staging smoke: country value assigned for interface verification (Nairobi, Kenya).'
  ),
  (
    'staging-smoke-no-deadline-grant-2026',
    '[STAGING SMOKE] Open-ended grant illustration — no deadline',
    'Synthetic staging record for authenticated AI interface verification. It describes an imaginary grant-style opportunity for Tanzanian learners with no deadline in this fiction. There is no real programme, no real organizer, and no application to submit.',
    'https://staging-smoke.example.invalid/staging-smoke-no-deadline-grant-2026',
    null, 'unknown', null,
    'Dar es Salaam', 'Dar es Salaam', 'Tanzania',
    'Staging smoke: synthetic record admitted for authenticated AI interface verification; relevance assigned by the smoke author.',
    'tanzanians_eligible',
    'Staging smoke: eligibility assigned for interface verification; Tanzanian applicants are treated as eligible in this synthetic record.',
    'verified_tanzania',
    'Staging smoke: country value assigned for interface verification (Dar es Salaam, Tanzania).'
  ),
  (
    'staging-smoke-unknown-eligibility-2026',
    '[STAGING SMOKE] Eligibility-unverified illustration — withheld insight',
    'Synthetic staging record for authenticated AI interface verification. Eligibility is deliberately left unknown in this fiction, so Opportunity Insight must stay withheld. There is no real programme, no real organizer, and no application to submit.',
    'https://staging-smoke.example.invalid/staging-smoke-unknown-eligibility-2026',
    '2027-08-31T12:00:00Z', 'date',
    'Staging smoke: synthetic deadline assigned for interface verification (31 August 2027).',
    null, null, null,
    'Staging smoke: synthetic record admitted for authenticated AI interface verification; relevance assigned by the smoke author.',
    'unknown', null,
    'unknown', null
  )
) as v(slug, title, description, url, deadline, deadline_precision,
       deadline_evidence, city, region, country, relevance_evidence,
       eligibility, eligibility_evidence, country_verification,
       country_evidence);

-- REQUIRED: 4 rows inserted. Any constraint error rolls back the whole
-- transaction on `commit` failure — fix the input, never the constraints.
```

The `sync_opportunity_canonical_references` trigger attaches each row's
`url` as its canonical evidence reference automatically (the
`canonicalEvidenceUrl` the AI gate reads).

## Step 2 — post-insert verification (still staging, read-only)

```sql
select slug, status, eligibility, country_verification, deadline_precision,
       deadline_evidence is not null as has_deadline_evidence,
       char_length(description) as description_chars
from public.opportunities
where slug like 'staging-smoke-%'
order by slug;
-- REQUIRED: 4 rows, all status = 'published'; description_chars >= 80.

select o.slug, r.url, r.is_canonical
from public.opportunity_references r
join public.opportunities o on o.id = r.opportunity_id
where o.slug like 'staging-smoke-%' and r.is_canonical;
-- REQUIRED: 4 rows, each url = the row's https .invalid URL, all canonical.

select slug, status
from public.opportunities
where slug like 'staging-smoke-%'
  and status <> 'published';
-- REQUIRED: 0 rows.
```

Then, in the Preview as the synthetic authenticated staging user, open each
detail page and confirm the §Expected browser behavior below. The three
trusted records must render through the normal application reads (public
detail + authenticated insight); the unknown-eligibility record must render
its detail with the insight panel withheld.

## Expected browser behavior

| # | Slug | `isAiSearchableOpportunity` | Detail page |
|---|---|---|---|
| 1 | `staging-smoke-national-fellowship-2026` | **true** | Insight panel offered ("Get Opportunity Insight"); brief labeled AI-assisted, National geography, real synthetic deadline |
| 2 | `staging-smoke-international-fellowship-2026` | **true** | Same; classified International with Tanzanian access stated |
| 3 | `staging-smoke-no-deadline-grant-2026` | **true** | Same; deadline honestly unknown, no date invented |
| 4 | `staging-smoke-unknown-eligibility-2026` | **false** | **No `#ai-opportunity-insight` section at all**; "Who can apply?" shows the honest unknown fallback. This is a PASS, not a defect. The API route independently refuses this slug. |

## Cleanup procedure after smoke

Run in the staging dashboard only, after the runbook is filled and signed
off. Verify Step 0 returns 0 afterwards. Production is never touched by
this statement (slugs cannot exist there — they were never inserted there).

```sql
delete from public.opportunities
where slug like 'staging-smoke-%';
-- Canonical/secondary references cascade via the opportunity_references FK.
-- REQUIRED afterward: Step 0 guard returns existing_smoke_rows = 0.
```

Note: the daily staging-health check reports anonymous-visible counts but
fails only when anon can see *non-published* rows or private profiles, so
these four published rows keep it green; run cleanup promptly anyway so the
staging shelf returns to its real shape.
