-- Published-record unpublish attribution.
-- Apply to isolated staging first. This migration changes no opportunity row.
-- It extends the existing staff-only enrichment audit and makes one authenticated
-- RPC the only supported published -> rejected path.

begin;

alter table public.opportunity_enrichments
  add column actor_id uuid,
  add column reason text;

alter table public.opportunity_enrichments
  drop constraint if exists opportunity_enrichments_field_check;

alter table public.opportunity_enrichments
  add constraint opportunity_enrichments_field_check
  check (field in ('venue_name', 'address', 'city', 'region', 'country', 'deadline', 'status'));

alter table public.opportunity_enrichments
  add constraint opportunity_enrichments_reason_valid
  check (
    reason is null
    or char_length(trim(reason)) between 10 and 1000
  ),
  add constraint opportunity_enrichments_unpublish_complete
  check (
    field <> 'status'
    or (
      previous_value = 'published'
      and new_value = 'rejected'
      and method = 'moderator-unpublish'
      and actor_id is not null
      and reason is not null
    )
  );

create or replace function public.audit_published_unpublish()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  decision_reason text := nullif(trim(current_setting('tech_opportunity.unpublish_reason', true)), '');
begin
  if old.status = 'published' and new.status = 'rejected' then
    if actor is null or not public.is_staff() then
      raise insufficient_privilege using
        message = 'Published unpublish requires an authenticated moderator.';
    end if;
    if decision_reason is null
       or char_length(decision_reason) not between 10 and 1000 then
      raise invalid_parameter_value using
        message = 'Published unpublish requires a reason between 10 and 1000 characters.';
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
      'moderator-unpublish',
      actor,
      decision_reason,
      statement_timestamp()
    );
  end if;

  return new;
end;
$$;

revoke all on function public.audit_published_unpublish() from public, anon, authenticated, service_role;

drop trigger if exists opportunities_audit_published_unpublish on public.opportunities;
create trigger opportunities_audit_published_unpublish
  after update of status on public.opportunities
  for each row execute function public.audit_published_unpublish();

create or replace function public.unpublish_published_opportunity(
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
begin
  if actor is null or not public.is_staff() then
    raise insufficient_privilege using
      message = 'Published unpublish requires an authenticated moderator.';
  end if;
  if normalized_reason is null
     or char_length(normalized_reason) not between 10 and 1000 then
    raise invalid_parameter_value using
      message = 'Published unpublish requires a reason between 10 and 1000 characters.';
  end if;

  perform set_config('tech_opportunity.unpublish_reason', normalized_reason, true);

  return query
    update public.opportunities as opportunity
      set status = 'rejected'
      where opportunity.id = target_opportunity_id
        and opportunity.status = 'published'
      returning opportunity.id, opportunity.title, opportunity.slug;
end;
$$;

revoke all on function public.unpublish_published_opportunity(uuid, text)
  from public, anon, service_role;
grant execute on function public.unpublish_published_opportunity(uuid, text)
  to authenticated;

commit;
