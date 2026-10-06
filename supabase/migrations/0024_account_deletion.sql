-- =====================================================================
-- Tech Opportunity - Migration 0024: self-service account deletion
-- Status: DESIGNED - NOT APPLIED. OWNER GATE: review and apply explicitly
--         in staging first (pre-pilot P0C), then production only with the
--         release, before user-facing deletion goes live. Staging proof +
--         exact environment verification + RLS/security verification +
--         zero-unrelated-drift checks are required before any production
--         promotion.
--
-- Deleting the auth identity removes, through existing ON DELETE CASCADE
-- foreign keys, the talent profile, saved opportunities, application
-- activity, and deadline-reminder preferences/events. Listing reports
-- are preserved for trust/moderation value with the reporter anonymized
-- (SET NULL): report content stays, the deleted identity disappears.
-- Opportunity rows, trust state, and moderation history are never
-- touched by deletion.
--
-- Deletion runs ONLY through public.request_own_account_deletion(),
-- which deletes exactly auth.uid() and takes no parameters — there is
-- no target UUID for any caller to supply, and no other path in this
-- migration deletes identity rows. No service-role key is involved in
-- the product flow; the function executes with the owner's privileges
-- under a fixed search path.
-- =====================================================================

begin;

-- Reports survive account deletion with the reporter anonymized.
alter table public.listing_reports
  alter column reporter_user_id drop not null;
alter table public.listing_reports
  drop constraint listing_reports_reporter_user_id_fkey;
alter table public.listing_reports
  add constraint listing_reports_reporter_user_id_fkey
  foreign key (reporter_user_id)
  references auth.users (id)
  on delete set null;

-- The sole identity-deletion entry point. Parameterless by design:
-- the target is always the calling session, fail-closed when anonymous.
create or replace function public.request_own_account_deletion()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := (select auth.uid());
begin
  if target is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = target;
end;
$$;

revoke all on function public.request_own_account_deletion()
  from public, anon, authenticated, service_role;
grant execute on function public.request_own_account_deletion()
  to authenticated;

commit;

-- Reversal, if explicitly approved before deletion data matters:
-- drop function public.request_own_account_deletion();
-- (reporter nullability is intentionally not reversed: anonymized
-- reports must stay anonymized.)
