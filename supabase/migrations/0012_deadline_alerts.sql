-- =====================================================================
-- TechOpportunity Tanzania - Migration 0012: deadline intelligence/alerts
-- Status: DESIGNED - NOT APPLIED. OWNER GATE: review and apply explicitly
--         in staging, then production, before enabling the alert workflow.
--
-- Three deliberately separate concerns:
--   A. opportunity truth + immutable deadline-change history
--   B. one owner-scoped user preference
--   C. private, generated-only alert events (no delivery claim)
-- =====================================================================

-- Existing timestamps do not reveal whether the source supplied a date,
-- date-time, or timezone. Backfill them as "unspecified", never fabricated.
alter table public.opportunities
  add column deadline_precision text not null default 'unspecified'
    check (deadline_precision in ('unknown', 'date', 'date_time', 'rolling', 'unspecified')),
  add column deadline_timezone text
    check (deadline_timezone is null or char_length(deadline_timezone) between 1 and 100),
  add column deadline_evidence text
    check (deadline_evidence is null or char_length(deadline_evidence) <= 1000);

alter table public.opportunities
  add constraint opportunity_deadline_semantics_consistent
  check (
    (deadline_precision in ('unknown', 'rolling') and deadline is null and deadline_timezone is null)
    or (deadline_precision = 'date' and deadline is not null and deadline_timezone is null)
    or (deadline_precision = 'date_time' and deadline is not null)
    or deadline_precision = 'unspecified'
  );

create table public.opportunity_deadline_changes (
  id                    uuid primary key default gen_random_uuid(),
  opportunity_id        uuid not null references public.opportunities (id) on delete cascade,
  previous_deadline     timestamptz,
  deadline              timestamptz,
  previous_precision    text not null
    check (previous_precision in ('unknown', 'date', 'date_time', 'rolling', 'unspecified')),
  deadline_precision    text not null
    check (deadline_precision in ('unknown', 'date', 'date_time', 'rolling', 'unspecified')),
  previous_timezone     text,
  deadline_timezone     text,
  previous_evidence     text,
  deadline_evidence     text,
  transition            text not null
    check (transition in ('became_known', 'became_unknown', 'became_rolling', 'extended', 'shortened', 'changed')),
  changed_by            uuid references auth.users (id) on delete set null,
  changed_at            timestamptz not null default now()
);

create index idx_opportunity_deadline_changes_opportunity_created
  on public.opportunity_deadline_changes (opportunity_id, changed_at desc);

create index idx_opportunity_deadline_changes_recent
  on public.opportunity_deadline_changes (changed_at desc);

create or replace function public.record_opportunity_deadline_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  change_kind text;
begin
  if row(old.deadline, old.deadline_precision, old.deadline_timezone, old.deadline_evidence)
     is not distinct from
     row(new.deadline, new.deadline_precision, new.deadline_timezone, new.deadline_evidence) then
    return new;
  end if;

  change_kind := case
    when new.deadline_precision = 'rolling' and old.deadline_precision <> 'rolling'
      then 'became_rolling'
    when old.deadline is null and new.deadline is not null
      then 'became_known'
    when old.deadline is not null and new.deadline is null
      then 'became_unknown'
    when new.deadline > old.deadline
      then 'extended'
    when new.deadline < old.deadline
      then 'shortened'
    else 'changed'
  end;

  insert into public.opportunity_deadline_changes (
    opportunity_id,
    previous_deadline,
    deadline,
    previous_precision,
    deadline_precision,
    previous_timezone,
    deadline_timezone,
    previous_evidence,
    deadline_evidence,
    transition,
    changed_by
  ) values (
    new.id,
    old.deadline,
    new.deadline,
    old.deadline_precision,
    new.deadline_precision,
    old.deadline_timezone,
    new.deadline_timezone,
    old.deadline_evidence,
    new.deadline_evidence,
    change_kind,
    auth.uid()
  );
  return new;
end;
$$;

revoke all on function public.record_opportunity_deadline_change() from public;

create trigger opportunities_record_deadline_change
  after update of deadline, deadline_precision, deadline_timezone, deadline_evidence
  on public.opportunities
  for each row execute function public.record_opportunity_deadline_change();

create table public.user_alert_preferences (
  user_id                  uuid primary key references auth.users (id) on delete cascade,
  deadline_alerts_enabled  boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create trigger user_alert_preferences_set_updated_at
  before update on public.user_alert_preferences
  for each row execute function public.set_updated_at();

create table public.deadline_alert_events (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  opportunity_id      uuid not null references public.opportunities (id) on delete cascade,
  deadline_change_id  uuid references public.opportunity_deadline_changes (id) on delete set null,
  event_type          text not null check (event_type in (
    'deadline_approaching',
    'deadline_became_known',
    'deadline_extended',
    'deadline_shortened',
    'deadline_changed',
    'deadline_became_rolling'
  )),
  event_fingerprint   text not null check (char_length(event_fingerprint) between 1 and 200),
  previous_deadline   timestamptz,
  deadline            timestamptz,
  deadline_precision  text not null
    check (deadline_precision in ('unknown', 'date', 'date_time', 'rolling', 'unspecified')),
  state               text not null default 'generated' check (state = 'generated'),
  generated_at        timestamptz not null default now(),
  constraint deadline_alert_events_idempotent
    unique (user_id, opportunity_id, event_type, event_fingerprint)
);

create index idx_deadline_alert_events_user_generated
  on public.deadline_alert_events (user_id, generated_at desc);

create index idx_deadline_alert_events_retention
  on public.deadline_alert_events (generated_at);

alter table public.opportunity_deadline_changes enable row level security;
alter table public.user_alert_preferences enable row level security;
alter table public.deadline_alert_events enable row level security;

create policy "staff read deadline change history"
  on public.opportunity_deadline_changes
  for select
  to authenticated
  using ((select public.is_staff()));

create policy "users read own alert preference"
  on public.user_alert_preferences
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users create own alert preference"
  on public.user_alert_preferences
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users update own alert preference"
  on public.user_alert_preferences
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "users read own generated deadline alerts"
  on public.deadline_alert_events
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Default public-schema grants differ by project; declare least privilege.
revoke all on table public.opportunity_deadline_changes from anon, authenticated;
revoke all on table public.user_alert_preferences from anon, authenticated;
revoke all on table public.deadline_alert_events from anon, authenticated;
grant select on table public.opportunity_deadline_changes to authenticated;
grant select, insert, update on table public.user_alert_preferences to authenticated;
grant select on table public.deadline_alert_events to authenticated;

-- Retention contract: generated in-app alert events are pruned by the worker
-- after 180 days. Deadline truth/history remains because it explains changes.
-- No queued/sent/failed state exists until a real delivery provider exists.

-- Reversal (owner-approved only, before relying on M30 data): drop the alert
-- tables/trigger/function, then the three additive opportunity columns.
