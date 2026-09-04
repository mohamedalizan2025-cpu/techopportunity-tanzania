-- =====================================================================
-- TechOpportunity Tanzania - Migration 0013: M31 forward data trust
-- Status: DESIGNED - NOT APPLIED. OWNER GATE: backup, staging, verify,
--         then apply explicitly in production. Do not replay 0005-0009.
--
-- Safe against the observed production state where 0012 is live while
-- several earlier design migrations are not. Existing rows and provenance
-- are retained. Historical country strings remain present but are labelled
-- unknown; future rows receive no fabricated Tanzania default.
-- =====================================================================

alter table public.opportunities
  add column if not exists relevance_decision text not null default 'unreviewed',
  add column if not exists relevance_evidence text,
  add column if not exists eligibility text not null default 'unknown',
  add column if not exists eligibility_evidence text,
  add column if not exists qualification_rule_version text,
  add column if not exists country_verification text not null default 'unknown',
  add column if not exists country_evidence text,
  add column if not exists last_verified_at timestamptz,
  add column if not exists decided_by uuid references auth.users (id) on delete set null,
  add column if not exists decided_at timestamptz;

-- The old default is not evidence. No historical value is rewritten.
alter table public.opportunities alter column country drop default;
alter table public.opportunities alter column country drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.opportunities'::regclass
      and conname = 'm31_relevance_decision_valid'
  ) then
    alter table public.opportunities
      add constraint m31_relevance_decision_valid
      check (relevance_decision in ('unreviewed', 'relevant', 'ambiguous', 'not_relevant'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.opportunities'::regclass
      and conname = 'm31_relevance_evidence_consistent'
  ) then
    alter table public.opportunities
      add constraint m31_relevance_evidence_consistent
      check (
        relevance_evidence is null
        or char_length(trim(relevance_evidence)) between 1 and 1000
      ) not valid;
    alter table public.opportunities
      validate constraint m31_relevance_evidence_consistent;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.opportunities'::regclass
      and conname = 'm31_relevance_decision_has_evidence'
  ) then
    alter table public.opportunities
      add constraint m31_relevance_decision_has_evidence
      check (relevance_decision = 'unreviewed' or relevance_evidence is not null);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.opportunities'::regclass
      and conname = 'm31_eligibility_valid'
  ) then
    alter table public.opportunities
      add constraint m31_eligibility_valid
      check (eligibility in ('unknown', 'tanzanians_eligible', 'tanzanians_not_eligible'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.opportunities'::regclass
      and conname = 'm31_eligibility_evidence_consistent'
  ) then
    alter table public.opportunities
      add constraint m31_eligibility_evidence_consistent
      check (
        (eligibility = 'unknown' and eligibility_evidence is null)
        or (
          eligibility <> 'unknown'
          and eligibility_evidence is not null
          and char_length(trim(eligibility_evidence)) between 1 and 1000
        )
      );
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.opportunities'::regclass
      and conname = 'm31_country_verification_valid'
  ) then
    alter table public.opportunities
      add constraint m31_country_verification_valid
      check (country_verification in ('unknown', 'verified_tanzania', 'verified_other'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.opportunities'::regclass
      and conname = 'm31_country_evidence_consistent'
  ) then
    alter table public.opportunities
      add constraint m31_country_evidence_consistent
      check (
        (country_verification = 'unknown' and country_evidence is null)
        or (
          country_verification = 'verified_tanzania'
          and country is not null
          and lower(country) = 'tanzania'
          and country_evidence is not null
          and char_length(trim(country_evidence)) between 1 and 1000
        )
        or (
          country_verification = 'verified_other'
          and country is not null
          and lower(country) <> 'tanzania'
          and country_evidence is not null
          and char_length(trim(country_evidence)) between 1 and 1000
        )
      );
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.opportunities'::regclass
      and conname = 'm31_decision_attribution_paired'
  ) then
    alter table public.opportunities
      add constraint m31_decision_attribution_paired
      check (
        (decided_by is null and decided_at is null)
        or (decided_by is not null and decided_at is not null)
      );
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.opportunities'::regclass
      and conname = 'm31_qualified_deadline_has_evidence'
  ) then
    alter table public.opportunities
      add constraint m31_qualified_deadline_has_evidence
      check (
        qualification_rule_version is null
        or deadline is null
        or (
          deadline_evidence is not null
          and char_length(trim(deadline_evidence)) between 1 and 1000
        )
      );
  end if;
end
$$;

create index if not exists idx_opportunities_m31_public_trust
  on public.opportunities (status, relevance_decision, eligibility, last_verified_at desc);

create table if not exists public.opportunity_references (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid not null references public.opportunities (id) on delete cascade,
  url             text not null check (char_length(url) between 1 and 2000),
  source_type     text not null default 'website'
    check (source_type in ('website', 'rss', 'atom', 'aggregator', 'social', 'api', 'manual')),
  label           text check (label is null or char_length(label) <= 200),
  is_canonical    boolean not null default false,
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users (id) on delete set null,
  unique (opportunity_id, url)
);

create unique index if not exists idx_opportunity_references_one_canonical
  on public.opportunity_references (opportunity_id)
  where is_canonical;

create index if not exists idx_opportunity_references_url
  on public.opportunity_references (url);

alter table public.opportunity_references enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'opportunity_references'
      and policyname = 'public read references for published opportunities'
  ) then
    create policy "public read references for published opportunities"
      on public.opportunity_references for select to anon, authenticated
      using (exists (
        select 1 from public.opportunities
        where opportunities.id = opportunity_references.opportunity_id
          and opportunities.status = 'published'
      ));
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'opportunity_references'
      and policyname = 'staff manage opportunity references m31'
  ) then
    create policy "staff manage opportunity references m31"
      on public.opportunity_references for all to authenticated
      using ((select public.is_staff()))
      with check ((select public.is_staff()));
  end if;
end
$$;

revoke all on table public.opportunity_references from anon, authenticated;
grant select on table public.opportunity_references to anon, authenticated;
grant insert, update, delete on table public.opportunity_references to authenticated;

create or replace function public.sync_opportunity_canonical_references()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reference_type text;
begin
  reference_type := case
    when new.source_id is null then 'manual'
    when new.discovery_method = 'rss' then 'rss'
    else 'website'
  end;

  update public.opportunity_references
    set is_canonical = false
    where opportunity_id = new.id and is_canonical;

  insert into public.opportunity_references (
    opportunity_id, url, source_type, label, is_canonical, created_by
  ) values (
    new.id, new.url, reference_type, 'canonical opportunity page', true, auth.uid()
  )
  on conflict (opportunity_id, url) do update
    set is_canonical = true,
        label = excluded.label;

  if new.source_url is not null and new.source_url <> new.url then
    insert into public.opportunity_references (
      opportunity_id, url, source_type, label, is_canonical, created_by
    ) values (
      new.id, new.source_url, reference_type, 'discovery evidence document', false, auth.uid()
    )
    on conflict (opportunity_id, url) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_opportunity_canonical_references() from public;

drop trigger if exists opportunities_sync_canonical_references on public.opportunities;
create trigger opportunities_sync_canonical_references
  after insert or update of url, source_url on public.opportunities
  for each row execute function public.sync_opportunity_canonical_references();

-- Idempotent backfill: preserve rows, attach their existing URLs as evidence.
insert into public.opportunity_references (
  opportunity_id, url, source_type, label, is_canonical
)
select
  id,
  url,
  case when source_id is null then 'manual'
       when discovery_method = 'rss' then 'rss'
       else 'website' end,
  'canonical opportunity page',
  true
from public.opportunities
where not exists (
  select 1 from public.opportunity_references existing
  where existing.opportunity_id = opportunities.id
    and existing.is_canonical
)
on conflict (opportunity_id, url) do update set is_canonical = true;

insert into public.opportunity_references (
  opportunity_id, url, source_type, label, is_canonical
)
select
  id,
  source_url,
  case when discovery_method = 'rss' then 'rss' else 'website' end,
  'discovery evidence document',
  false
from public.opportunities
where source_url is not null and source_url <> url
on conflict (opportunity_id, url) do nothing;

-- Verification queries (read-only after applying):
-- select column_name, is_nullable, column_default from information_schema.columns
--   where table_schema='public' and table_name='opportunities'
--   and column_name in ('eligibility','relevance_decision','qualification_rule_version',
--     'country','country_verification','last_verified_at','decided_by','decided_at');
-- select count(*) from public.opportunity_references;
-- select country_verification, count(*) from public.opportunities group by 1;
-- select count(*) from public.opportunities where country_verification <> 'unknown'; -- 0 initially
-- Anonymous probe must see references only for published opportunities.
