-- =====================================================================
-- TechOpportunity Tanzania - Migration 0003: enrichment audit trail
-- Purpose: provable, reversible bookkeeping for the controlled legacy
--          enrichment process (structured location/deadline fields filled
--          ONLY from explicit JSON-LD evidence on the opportunity's own
--          URL, ONLY when the stored field is null).
-- Rules preserved by this migration (additive only):
--   * no change to opportunities.status / source_id / discovered_at /
--     discovery_method / submitted_by / organization_id
--   * no deletion, no data rewriting
--   * RLS: audit rows are staff-readable, service-role writable (bypasses
--     RLS by design, same trust boundary as the discovery worker),
--     invisible to anonymous visitors
-- Status: DRAFT - applied manually to tto-staging via SQL Editor
-- =====================================================================

create table public.opportunity_enrichments (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid not null references public.opportunities (id) on delete cascade,
  field           text not null check (field in ('venue_name', 'address', 'city', 'region', 'deadline')),
  previous_value  text,
  new_value       text not null,
  evidence_url    text not null,
  method          text not null default 'json-ld-extraction',
  created_at      timestamptz not null default now()
);

alter table public.opportunity_enrichments enable row level security;

create policy "staff read enrichment audit"
  on public.opportunity_enrichments
  for select
  to authenticated
  using ((select public.is_staff()));

create policy "staff insert enrichment audit"
  on public.opportunity_enrichments
  for insert
  to authenticated
  with check ((select public.is_staff()));

create index idx_opportunity_enrichments_opportunity
  on public.opportunity_enrichments (opportunity_id);

create index idx_opportunity_enrichments_created_at
  on public.opportunity_enrichments (created_at);

-- Sanity check after applying:
-- select count(*) from public.opportunity_enrichments;
