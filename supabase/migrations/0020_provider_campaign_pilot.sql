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
-- Privacy boundary (permanent): aggregate counts ONLY, derived from REAL
-- stored activity. Two SECURITY DEFINER RPCs below are the SMALLEST
-- privileged boundary: each requires public.is_staff() as its first
-- statement, takes only a campaign id, and returns ONLY integers — never
-- user ids, names, emails, profile rows, or per-user lists. Owner-only RLS
-- on talent_profiles, saved_opportunities, and talent_opportunity_activity
-- is NOT weakened: no staff/organization read policy is added to those
-- tables, and ordinary talent callers are rejected inside the RPC before
-- any count runs. Per-talent (row-level) engagement analytics remain
-- NOT BUILT.
--
-- Metric semantics (deterministic, zero means zero):
--   get_campaign_engagement -> Saved / Interested / Applying / Applied
--     counts of REAL rows for the campaign's opportunity, counting only
--     rows whose opportunity is currently published (exactly matching the
--     talent UI, which suppresses non-published content). Saved comes from
--     saved_opportunities; the three funnel states from
--     talent_opportunity_activity. One talent may appear in Saved AND one
--     funnel stage (bookmark vs progress are independent signals).
--   get_campaign_audience -> count of REAL core-complete talent profiles
--     whose sector/type focus overlaps the campaign targeting (a null
--     targeting dimension matches all). Geography targeting stays
--     descriptive (shown as targeting context, never mapped from free-text
--     regions). 0 is valid: no completed profiles means no audience yet.
-- =====================================================================

begin;

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

-- Staff-only aggregate engagement: REAL Saved/Interested/Applying/Applied
-- counts for one campaign's opportunity. Counts only; no identities.
create or replace function public.get_campaign_engagement(p_campaign_id uuid)
returns table (
  saved bigint,
  interested bigint,
  applying bigint,
  applied bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  target uuid;
begin
  if actor is null or not public.is_staff() then
    raise insufficient_privilege using
      message = 'Campaign analytics require an authenticated staff member.';
  end if;

  select opportunity_id into target
  from public.provider_campaigns
  where id = p_campaign_id;

  if target is null then
    saved := 0; interested := 0; applying := 0; applied := 0;
    return next;
    return;
  end if;

  select count(*) into saved
  from public.saved_opportunities as activity
  join public.opportunities as opportunity
    on opportunity.id = activity.opportunity_id
  where activity.opportunity_id = target
    and opportunity.status = 'published';

  select count(*) into interested
  from public.talent_opportunity_activity as activity
  join public.opportunities as opportunity
    on opportunity.id = activity.opportunity_id
  where activity.opportunity_id = target
    and activity.status = 'interested'
    and opportunity.status = 'published';

  select count(*) into applying
  from public.talent_opportunity_activity as activity
  join public.opportunities as opportunity
    on opportunity.id = activity.opportunity_id
  where activity.opportunity_id = target
    and activity.status = 'applying'
    and opportunity.status = 'published';

  select count(*) into applied
  from public.talent_opportunity_activity as activity
  join public.opportunities as opportunity
    on opportunity.id = activity.opportunity_id
  where activity.opportunity_id = target
    and activity.status = 'applied'
    and opportunity.status = 'published';

  return next;
end;
$$;

revoke all on function public.get_campaign_engagement(uuid)
  from public, anon, service_role;
grant execute on function public.get_campaign_engagement(uuid)
  to authenticated;

-- Staff-only aggregate audience: REAL count of core-complete talent
-- profiles whose sector/type focus overlaps the campaign targeting.
-- Single integer; no profile rows, no identities. 0 is valid.
create or replace function public.get_campaign_audience(p_campaign_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  target_sector text;
  target_type text;
  audience integer := 0;
begin
  if actor is null or not public.is_staff() then
    raise insufficient_privilege using
      message = 'Campaign analytics require an authenticated staff member.';
  end if;

  select sector, opportunity_type into target_sector, target_type
  from public.provider_campaigns
  where id = p_campaign_id;

  if not found then
    return 0;
  end if;

  select count(*) into audience
  from public.talent_profiles as profile
  where (
    profile.career_level is not null
    or profile.field_discipline is not null
    or profile.sectors <> '{}'
    or profile.preferred_types <> '{}'
  )
  and (target_sector is null or target_sector = any (profile.sectors))
  and (target_type is null or target_type = any (profile.preferred_types));

  return audience;
end;
$$;

revoke all on function public.get_campaign_audience(uuid)
  from public, anon, service_role;
grant execute on function public.get_campaign_audience(uuid)
  to authenticated;

commit;

-- Reversal, if explicitly approved before pilot data matters:
-- drop function public.get_campaign_audience(uuid);
-- drop function public.get_campaign_engagement(uuid);
-- drop table public.provider_campaigns;
