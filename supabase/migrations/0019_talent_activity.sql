-- =====================================================================
-- Tech Opportunity - Migration 0019: unified talent activity
-- Status: DESIGNED - NOT APPLIED. OWNER GATE: review and apply explicitly
--         in staging first, then production, before enabling Activity
--         tracking. Staging proof + exact environment verification +
--         recovery evidence + RLS/security verification + zero-unrelated-
--         drift checks are required before any production promotion.
--
-- Talent-side application-progress tracking (docs/PLATFORM_ARCHITECTURE.md):
-- saved stays the private bookmark in public.saved_opportunities (untouched);
-- this table adds the three designed-for funnel states (interested, applying,
-- applied) as ONE row per user+opportunity with an owner-mutable status.
--
-- Privacy boundary (permanent): OWNER-ONLY, exactly like saved/profiles.
-- No staff, organization, or anonymous read. Identity comes from
-- authenticated claims in the server action; RLS confines every row to its
-- owner. Only published opportunities can be tracked (insert/update guard),
-- and reads suppress anything not currently published. Aggregate commercial
-- analytics later must use privacy-safe counts only, never these rows.
-- =====================================================================

begin;

create table public.talent_opportunity_activity (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  status         text not null
    check (status in ('interested', 'applying', 'applied')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint talent_activity_user_opportunity_unique
    unique (user_id, opportunity_id)
);

create index idx_talent_activity_user_status_created
  on public.talent_opportunity_activity (user_id, status, created_at desc);

create index idx_talent_activity_opportunity
  on public.talent_opportunity_activity (opportunity_id);

create trigger talent_activity_set_updated_at
  before update on public.talent_opportunity_activity
  for each row execute function public.set_updated_at();

alter table public.talent_opportunity_activity enable row level security;

create policy "users read own activity"
  on public.talent_opportunity_activity
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users track published opportunities for themselves"
  on public.talent_opportunity_activity
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.opportunities opportunity
      where opportunity.id = talent_opportunity_activity.opportunity_id
        and opportunity.status = 'published'
    )
  );

create policy "users update own activity on published opportunities"
  on public.talent_opportunity_activity
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.opportunities opportunity
      where opportunity.id = talent_opportunity_activity.opportunity_id
        and opportunity.status = 'published'
    )
  );

create policy "users remove own activity"
  on public.talent_opportunity_activity
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Declare least privilege explicitly: no anonymous access; authenticated
-- keeps only the four owner-scoped operations (select/insert/update/delete).
revoke all on table public.talent_opportunity_activity from anon;
revoke all on table public.talent_opportunity_activity from authenticated;
grant select, insert, update, delete on table public.talent_opportunity_activity to authenticated;

commit;

-- Reversal, if explicitly approved before user activity data matters:
-- drop table public.talent_opportunity_activity;
