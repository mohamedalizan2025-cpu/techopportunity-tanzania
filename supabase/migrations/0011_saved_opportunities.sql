-- =====================================================================
-- TechOpportunity Tanzania - Migration 0011: saved opportunities
-- Status: DESIGNED - NOT APPLIED. OWNER GATE: apply explicitly in the
--         Supabase SQL editor after review, staging before production.
--
-- Additive M29 relationship only. It stores no copied opportunity content
-- and no profile data. Status changes keep the relationship; a hard delete
-- cascades only because an orphaned relationship cannot identify anything.
-- =====================================================================

create table public.saved_opportunities (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  created_at     timestamptz not null default now(),
  constraint saved_opportunities_user_opportunity_unique
    unique (user_id, opportunity_id)
);

create index idx_saved_opportunities_user_created
  on public.saved_opportunities (user_id, created_at desc);

create index idx_saved_opportunities_opportunity
  on public.saved_opportunities (opportunity_id);

alter table public.saved_opportunities enable row level security;

create policy "users read own saved opportunities"
  on public.saved_opportunities
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users save published opportunities for themselves"
  on public.saved_opportunities
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.opportunities opportunity
      where opportunity.id = saved_opportunities.opportunity_id
        and opportunity.status = 'published'
    )
  );

create policy "users remove own saved opportunities"
  on public.saved_opportunities
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Supabase commonly grants public-schema privileges via default grants.
-- Make the intended API surface explicit: no anonymous access and no UPDATE.
revoke all on table public.saved_opportunities from anon;
revoke update on table public.saved_opportunities from authenticated;
grant select, insert, delete on table public.saved_opportunities to authenticated;

-- Reversal, if explicitly approved before user data matters:
-- drop table public.saved_opportunities;
