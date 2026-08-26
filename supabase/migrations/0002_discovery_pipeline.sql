-- =====================================================================
-- TechOpportunity Tanzania - Migration 0002: automatic discovery pipeline
-- Status: draft implementation; safe pending-only discovery flow
-- Rules:  source registry is allow-list, publication remains moderated
-- =====================================================================

create table public.opportunity_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_url text not null,
  source_type text not null check (
    source_type in (
      'university',
      'government',
      'ngo',
      'company',
      'innovation_hub',
      'hackathon_platform',
      'scholarship_provider',
      'fellowship_provider',
      'conference',
      'other'
    )
  ),
  country text not null default 'Tanzania',
  region text,
  active boolean not null default true,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger opportunity_sources_set_updated_at
  before update on public.opportunity_sources
  for each row execute function public.set_updated_at();

alter table public.opportunities
  add column if not exists source_id uuid references public.opportunity_sources(id) on delete set null,
  add column if not exists discovered_at timestamptz,
  add column if not exists discovery_method text check (
    discovery_method in ('rss', 'json-ld', 'html', 'sitemap', 'manual')
  );

create index if not exists idx_opportunity_sources_active
  on public.opportunity_sources (active, country, source_type);

create index if not exists idx_opportunities_source_id
  on public.opportunities (source_id);

create index if not exists idx_opportunities_discovered_at
  on public.opportunities (discovered_at);

alter table public.opportunity_sources enable row level security;

create policy "staff read source registry"
  on public.opportunity_sources
  for select
  to authenticated
  using ((select public.is_staff()));

create policy "staff manage source registry"
  on public.opportunity_sources
  for all
  to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));
