-- =====================================================================
-- Tech Opportunity - Migration 0020: provider campaign pilot (internal)
-- Status: DESIGNED - NOT APPLIED. OWNER GATE: review and apply explicitly
--         in staging first, then production, before enabling the internal
--         campaign pilot. Staging proof + exact environment verification +
--         recovery evidence + RLS/security verification + zero-unrelated-
--         drift checks are required before any production promotion.
--
-- INTERNAL staff-only pilot (no public provider signup, no payments, no
-- institution dashboards, no monetization). A campaign links ONE verified
-- (published) opportunity to staff-entered targeting notes so the team can
-- rehearse the commercial story: Verified Opportunity -> Relevant Audience
-- -> Engagement Funnel.
--
-- Privacy boundary (permanent): this pilot NEVER touches private talent
-- data. There is deliberately no reference here to talent_profiles,
-- saved_opportunities, talent_opportunity_activity, user_alert_preferences,
-- or deadline_alert_events. "Relevant Audience" is sized from the PUBLIC
-- published corpus (staff-visible inventory), and the "Engagement Funnel"
-- counts the pilot's own campaign pipeline (draft/active/paused/completed).
-- Per-talent engagement analytics remain NOT BUILT: they require a future
-- consent + threshold-suppression design and their own bounded authorization.
-- =====================================================================

create table public.provider_campaigns (
  id             uuid primary key default gen_random_uuid(),
  name           text not null
    check (char_length(name) between 3 and 120),
  opportunity_id uuid not null references public.opportunities (id) on delete restrict,
  status         text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'completed')),
  geography      text
    check (geography is null or geography in ('national', 'international')),
  sector         text
    check (sector is null or char_length(sector) between 1 and 60),
  opportunity_type text
    check (opportunity_type is null or char_length(opportunity_type) between 1 and 60),
  goal_text      text
    check (goal_text is null or char_length(goal_text) <= 500),
  created_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_provider_campaigns_status_created
  on public.provider_campaigns (status, created_at desc);

create index idx_provider_campaigns_opportunity
  on public.provider_campaigns (opportunity_id);

create trigger provider_campaigns_set_updated_at
  before update on public.provider_campaigns
  for each row execute function public.set_updated_at();

alter table public.provider_campaigns enable row level security;

-- Staff-only: every policy requires public.is_staff(). Ordinary
-- authenticated users and anonymous callers see and change nothing.
create policy "staff read campaigns"
  on public.provider_campaigns
  for select
  to authenticated
  using ((select public.is_staff()));

create policy "staff create campaigns for published opportunities"
  on public.provider_campaigns
  for insert
  to authenticated
  with check (
    (select public.is_staff())
    and exists (
      select 1
      from public.opportunities opportunity
      where opportunity.id = provider_campaigns.opportunity_id
        and opportunity.status = 'published'
    )
  );

create policy "staff update campaigns on published opportunities"
  on public.provider_campaigns
  for update
  to authenticated
  using ((select public.is_staff()))
  with check (
    (select public.is_staff())
    and exists (
      select 1
      from public.opportunities opportunity
      where opportunity.id = provider_campaigns.opportunity_id
        and opportunity.status = 'published'
    )
  );

create policy "staff remove campaigns"
  on public.provider_campaigns
  for delete
  to authenticated
  using ((select public.is_staff()));

-- Least privilege: no anonymous access; authenticated keeps the four
-- staff-scoped operations only (RLS still confines them to staff).
revoke all on table public.provider_campaigns from anon;
revoke all on table public.provider_campaigns from authenticated;
grant select, insert, update, delete on table public.provider_campaigns to authenticated;

-- Reversal, if explicitly approved before pilot data matters:
-- drop table public.provider_campaigns;
