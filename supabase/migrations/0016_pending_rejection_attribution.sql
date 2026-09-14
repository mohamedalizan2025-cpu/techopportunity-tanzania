-- Pending-record rejection attribution.
-- Apply to isolated staging first. This migration changes no opportunity row.
-- It extends the existing moderation audit and keeps one authenticated RPC as
-- the only supported pending -> rejected path.

begin;

alter table public.opportunity_enrichments
  drop constraint if exists opportunity_enrichments_unpublish_complete;

alter table public.opportunity_enrichments
  add constraint opportunity_enrichments_status_decision_complete
  check (
    field <> 'status'
    or (
      previous_value = 'published'
      and new_value = 'rejected'
      and method = 'moderator-unpublish'
      and actor_id is not null
      and reason is not null
    )
    or (
      previous_value = 'pending'
      and new_value = 'rejected'
      and method = 'moderator-rejection'
      and actor_id is not null
      and reason is not null
    )
  ) not valid;

alter table public.opportunity_enrichments
  validate constraint opportunity_enrichments_status_decision_complete;

create or replace function public.audit_pending_rejection()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  decision_reason text := nullif(trim(current_setting('tech_opportunity.rejection_reason', true)), '');
begin
  if old.status = 'pending' and new.status = 'rejected' then
    if actor is null or not public.is_staff() then
      raise insufficient_privilege using
        message = 'Pending rejection requires an authenticated moderator.';
    end if;
    if decision_reason is null
       or char_length(decision_reason) not between 10 and 1000 then
      raise invalid_parameter_value using
        message = 'Pending rejection requires a reason between 10 and 1000 characters.';
    end if;
    if new.decided_by is distinct from actor
       or new.decided_at is distinct from statement_timestamp() then
      raise invalid_parameter_value using
        message = 'Pending rejection attribution must match the authenticated decision.';
    end if;

    insert into public.opportunity_enrichments (
      opportunity_id,
      field,
      previous_value,
      new_value,
      evidence_url,
      method,
      actor_id,
      reason,
      created_at
    ) values (
      new.id,
      'status',
      old.status::text,
      new.status::text,
      old.url,
      'moderator-rejection',
      actor,
      decision_reason,
      new.decided_at
    );
  end if;

  return new;
end;
$$;

revoke all on function public.audit_pending_rejection()
  from public, anon, authenticated, service_role;

drop trigger if exists opportunities_audit_pending_rejection on public.opportunities;
create trigger opportunities_audit_pending_rejection
  after update of status on public.opportunities
  for each row execute function public.audit_pending_rejection();

create or replace function public.reject_pending_opportunity(
  target_opportunity_id uuid,
  decision_reason text
)
returns table (
  opportunity_id uuid,
  opportunity_title text,
  opportunity_slug text
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  normalized_reason text := nullif(trim(decision_reason), '');
  decision_time timestamptz := statement_timestamp();
begin
  if actor is null or not public.is_staff() then
    raise insufficient_privilege using
      message = 'Pending rejection requires an authenticated moderator.';
  end if;
  if normalized_reason is null
     or char_length(normalized_reason) not between 10 and 1000 then
    raise invalid_parameter_value using
      message = 'Pending rejection requires a reason between 10 and 1000 characters.';
  end if;

  perform set_config('tech_opportunity.rejection_reason', normalized_reason, true);

  return query
    update public.opportunities as opportunity
      set status = 'rejected',
          decided_by = actor,
          decided_at = decision_time
      where opportunity.id = target_opportunity_id
        and opportunity.status = 'pending'
      returning opportunity.id, opportunity.title, opportunity.slug;
end;
$$;

revoke all on function public.reject_pending_opportunity(uuid, text)
  from public, anon, service_role;
grant execute on function public.reject_pending_opportunity(uuid, text)
  to authenticated;

commit;
