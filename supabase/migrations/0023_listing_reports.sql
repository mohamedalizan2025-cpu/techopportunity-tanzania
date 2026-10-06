-- =====================================================================
-- Tech Opportunity - Migration 0023: structured listing reports
-- Status: DESIGNED - NOT APPLIED. OWNER GATE: review and apply explicitly
--         in staging first (pre-pilot P0B), then production only with the
--         release, before any user-facing reporting goes live. Staging
--         proof + exact environment verification + RLS/security
--         verification + zero-unrelated-drift checks are required before
--         any production promotion.
--
-- Authenticated talent users may report a problem with a published
-- listing (wrong information, deadline, eligibility, broken link,
-- suspicious content). Reports are HUMAN REVIEW INPUT ONLY: no report,
-- status change, or automation in this migration can publish, unpublish,
-- reject, approve, or modify any opportunity row, trust decision,
-- deadline, eligibility, or source. Moderators triage reports through
-- the existing authorized moderation flow when a listing needs action.
--
-- Privacy boundary: reporters read only their own reports; staff read
-- and triage all reports via the existing moderator/admin check. No
-- anonymous, provider, or cross-user access. Reporter identity never
-- leaves the staff surface. No IP, phone, age, DOB, address, or
-- demographic columns exist — details text is bounded and reporters are
-- warned against sensitive personal information in the form.
-- =====================================================================

begin;

create table public.listing_reports (
  id               uuid primary key default gen_random_uuid(),
  opportunity_id   uuid not null references public.opportunities (id) on delete cascade,
  reporter_user_id uuid not null references auth.users (id) on delete cascade,
  reason           text not null
    check (reason in (
      'incorrect_information',
      'deadline_issue',
      'eligibility_issue',
      'broken_link',
      'suspicious',
      'other'
    )),
  details          text not null
    check (char_length(details) between 4 and 1000),
  status           text not null default 'new'
    check (status in ('new', 'reviewed', 'resolved', 'dismissed')),
  created_at       timestamptz not null default now(),
  reviewed_by      uuid references auth.users (id) on delete set null,
  reviewed_at      timestamptz,
  resolution_note  text
    check (resolution_note is null or char_length(resolution_note) <= 500)
);

create index idx_listing_reports_status_created
  on public.listing_reports (status, created_at desc);

create index idx_listing_reports_opportunity
  on public.listing_reports (opportunity_id);

create index idx_listing_reports_reporter
  on public.listing_reports (reporter_user_id);

alter table public.listing_reports enable row level security;

-- Reporters insert only their own reports against published listings.
create policy "users report published listings for themselves"
  on public.listing_reports
  for insert
  to authenticated
  with check (
    (select auth.uid()) = reporter_user_id
    and exists (
      select 1
      from public.opportunities opportunity
      where opportunity.id = listing_reports.opportunity_id
        and opportunity.status = 'published'
    )
  );

-- Reporters read only their own reports. No update/delete: reports are
-- immutable once sent (triage is staff-only below).
create policy "users read own reports"
  on public.listing_reports
  for select
  to authenticated
  using ((select auth.uid()) = reporter_user_id);

-- Staff triage: moderators/admins read all reports.
create policy "staff read listing reports"
  on public.listing_reports
  for select
  to authenticated
  using ((select public.is_staff()));

-- Staff triage: moderators/admins update status/review metadata only.
-- The policy confines updates to triage columns through the application
-- layer; no report update can touch opportunity rows (separate table,
-- and no trigger or function here writes outside listing_reports).
create policy "staff triage listing reports"
  on public.listing_reports
  for update
  to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- Declare least privilege explicitly, in the same closed-first form as the
-- 0021 contract: no anonymous access; authenticated keeps owner
-- insert/select plus staff-gated select/update. No delete grant to any
-- interactive role (report history is preserved).
revoke all on table public.listing_reports
  from public, anon, authenticated, service_role;
grant select, insert on table public.listing_reports to authenticated;
grant update on table public.listing_reports to authenticated;

commit;

-- Reversal, if explicitly approved before report data matters:
-- drop table public.listing_reports;
