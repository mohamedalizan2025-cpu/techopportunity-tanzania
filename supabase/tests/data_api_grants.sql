\set ON_ERROR_STOP 1

-- Run only against a disposable, empty PostgreSQL/Supabase-compatible
-- database after the application schema and migration 0021 are present.
-- Every fixture and probe is rolled back.

begin;

create function pg_temp.assert_true(ok boolean, message text)
returns void
language plpgsql
as $$
begin
  if not ok then
    raise exception 'grant assertion failed: %', message;
  end if;
end;
$$;

-- Catalog-level exact matrix. This is deliberately operation-specific.
do $$
declare
  item record;
  operation text;
  actual boolean;
begin
  for item in
    select * from (values
      ('anon', 'categories', array['SELECT']),
      ('anon', 'organizations', array['SELECT']),
      ('anon', 'profiles', array[]::text[]),
      ('anon', 'opportunities', array['SELECT', 'INSERT']),
      ('anon', 'opportunity_sources', array['SELECT']),
      ('anon', 'opportunity_enrichments', array[]::text[]),
      ('anon', 'opportunity_references', array['SELECT']),
      ('anon', 'saved_opportunities', array[]::text[]),
      ('anon', 'opportunity_deadline_changes', array[]::text[]),
      ('anon', 'user_alert_preferences', array[]::text[]),
      ('anon', 'deadline_alert_events', array[]::text[]),
      ('anon', 'talent_profiles', array[]::text[]),
      ('anon', 'talent_opportunity_activity', array[]::text[]),
      ('anon', 'provider_campaigns', array[]::text[]),

      ('authenticated', 'categories', array['SELECT']),
      ('authenticated', 'organizations', array['SELECT', 'INSERT', 'UPDATE', 'DELETE']),
      ('authenticated', 'profiles', array['SELECT']),
      ('authenticated', 'opportunities', array['SELECT', 'INSERT', 'UPDATE', 'DELETE']),
      ('authenticated', 'opportunity_sources', array['SELECT', 'INSERT', 'UPDATE', 'DELETE']),
      ('authenticated', 'opportunity_enrichments', array['SELECT', 'INSERT']),
      ('authenticated', 'opportunity_references', array['SELECT', 'INSERT', 'UPDATE', 'DELETE']),
      ('authenticated', 'saved_opportunities', array['SELECT', 'INSERT', 'DELETE']),
      ('authenticated', 'opportunity_deadline_changes', array['SELECT']),
      ('authenticated', 'user_alert_preferences', array['SELECT', 'INSERT', 'UPDATE']),
      ('authenticated', 'deadline_alert_events', array['SELECT']),
      ('authenticated', 'talent_profiles', array['SELECT', 'INSERT', 'UPDATE']),
      ('authenticated', 'talent_opportunity_activity', array['SELECT', 'INSERT', 'UPDATE', 'DELETE']),
      ('authenticated', 'provider_campaigns', array['SELECT', 'INSERT', 'UPDATE', 'DELETE']),

      ('service_role', 'categories', array['SELECT']),
      ('service_role', 'organizations', array[]::text[]),
      ('service_role', 'profiles', array[]::text[]),
      ('service_role', 'opportunities', array['SELECT', 'INSERT', 'UPDATE', 'DELETE']),
      ('service_role', 'opportunity_sources', array['SELECT', 'UPDATE']),
      ('service_role', 'opportunity_enrichments', array['SELECT', 'INSERT']),
      ('service_role', 'opportunity_references', array['SELECT']),
      ('service_role', 'saved_opportunities', array['SELECT']),
      ('service_role', 'opportunity_deadline_changes', array['SELECT']),
      ('service_role', 'user_alert_preferences', array['SELECT']),
      ('service_role', 'deadline_alert_events', array['SELECT', 'INSERT', 'DELETE']),
      ('service_role', 'talent_profiles', array[]::text[]),
      ('service_role', 'talent_opportunity_activity', array[]::text[]),
      ('service_role', 'provider_campaigns', array[]::text[])
    ) as expected(role_name, table_name, operations)
  loop
    foreach operation in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE'] loop
      actual := has_table_privilege(
        item.role_name,
        format('public.%I', item.table_name),
        operation
      );
      if actual <> (operation = any(item.operations)) then
        raise exception 'unexpected %.% % privilege: %',
          item.role_name, item.table_name, operation, actual;
      end if;
    end loop;
  end loop;
end;
$$;

do $$
declare
  item record;
  expected_execute boolean;
begin
  for item in
    select * from (values
      ('public.handle_new_user()', false),
      ('public.is_staff()', true),
      ('public.set_updated_at()', false),
      ('public.record_opportunity_deadline_change()', false),
      ('public.sync_opportunity_canonical_references()', false),
      ('public.audit_published_unpublish()', false),
      ('public.unpublish_published_opportunity(uuid,text)', true),
      ('public.audit_pending_rejection()', false),
      ('public.reject_pending_opportunity(uuid,text)', true),
      ('public.get_campaign_engagement(uuid)', true),
      ('public.get_campaign_audience(uuid)', true)
    ) as expected(signature, authenticated_execute)
  loop
    expected_execute := item.authenticated_execute;
    if has_function_privilege('authenticated', item.signature, 'EXECUTE') <> expected_execute then
      raise exception 'unexpected authenticated EXECUTE on %', item.signature;
    end if;
    if has_function_privilege('anon', item.signature, 'EXECUTE') then
      raise exception 'unexpected anon EXECUTE on %', item.signature;
    end if;
    if has_function_privilege('service_role', item.signature, 'EXECUTE') then
      raise exception 'unexpected service_role EXECUTE on %', item.signature;
    end if;
  end loop;
end;
$$;

select pg_temp.assert_true(
  not has_sequence_privilege('anon', 'public.categories_id_seq', 'USAGE')
  and not has_sequence_privilege('authenticated', 'public.categories_id_seq', 'USAGE')
  and not has_sequence_privilege('service_role', 'public.categories_id_seq', 'USAGE'),
  'categories sequence must stay outside the Data API'
);

-- Prove future objects inherit no Data API exposure after 0021.
create table public.data_api_future_table_probe (id bigint);
create sequence public.data_api_future_sequence_probe;
create function public.data_api_future_function_probe()
returns integer language sql as $$ select 1 $$;

do $$
declare
  role_name text;
begin
  foreach role_name in array array['anon', 'authenticated', 'service_role'] loop
    if has_table_privilege(role_name, 'public.data_api_future_table_probe', 'SELECT')
       or has_table_privilege(role_name, 'public.data_api_future_table_probe', 'INSERT')
       or has_sequence_privilege(role_name, 'public.data_api_future_sequence_probe', 'USAGE')
       or has_function_privilege(role_name, 'public.data_api_future_function_probe()', 'EXECUTE') then
      raise exception 'future object leaked to %', role_name;
    end if;
  end loop;
end;
$$;

drop function public.data_api_future_function_probe();
drop sequence public.data_api_future_sequence_probe;
drop table public.data_api_future_table_probe;

-- Synthetic fixtures for actual SET ROLE + RLS behavior. No production data is
-- used, and the outer transaction removes every row.
insert into public.categories (slug, label)
values ('scholarship', 'Scholarship');

insert into auth.users (id, raw_user_meta_data) values
  ('10000000-0000-0000-0000-000000000001', '{}'),
  ('10000000-0000-0000-0000-000000000002', '{}'),
  ('10000000-0000-0000-0000-000000000003', '{}');
-- A managed Supabase project creates these through the Auth trigger. The local
-- schema-only restore intentionally excludes managed-schema triggers, so this
-- idempotent insert supplies the same fixture rows in either environment.
insert into public.profiles (id, display_name)
select id, 'Grant proof user'
from auth.users
where id in (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003'
)
on conflict (id) do nothing;
update public.profiles
set role = 'moderator'
where id = '10000000-0000-0000-0000-000000000003';

insert into public.organizations (id, slug, name) values
  ('20000000-0000-0000-0000-000000000001', 'grant-proof-org', 'Grant Proof Org');
insert into public.opportunity_sources (id, name, base_url, source_type) values
  ('30000000-0000-0000-0000-000000000001', 'Grant proof source', 'https://source.example.invalid', 'other');
insert into public.opportunities (
  id, slug, title, description, category_id, organization_id, url, status,
  country, source_id
) values (
  '40000000-0000-0000-0000-000000000001',
  'grant-proof-published',
  'Grant proof published opportunity',
  'Synthetic published row for the local grant test.',
  (select id from public.categories where slug = 'scholarship'),
  '20000000-0000-0000-0000-000000000001',
  'https://opportunity.example.invalid/published',
  'published',
  'Tanzania',
  '30000000-0000-0000-0000-000000000001'
);

set local role anon;
do $$
begin
  if (select count(*) from public.opportunities) <> 1 then
    raise exception 'anon must read only the published opportunity';
  end if;
  if (select count(*) from public.opportunity_sources) <> 0 then
    raise exception 'anon source registry must remain zero-row under RLS';
  end if;
  if (select count(*) from public.opportunity_references) <> 1 then
    raise exception 'anon must read only the published canonical reference';
  end if;

  insert into public.opportunities (
    slug, title, description, category_id, url, status, country
  ) values (
    'anon-pending-proof', 'Anonymous pending proof', 'Synthetic anonymous submission.',
    (select id from public.categories where slug = 'scholarship'),
    'https://opportunity.example.invalid/anon', 'pending', null
  );

  begin
    insert into public.opportunities (
      slug, title, description, category_id, url, status
    ) values (
      'anon-published-denied', 'Anonymous published denied', 'Must fail.',
      (select id from public.categories where slug = 'scholarship'),
      'https://opportunity.example.invalid/anon-published', 'published'
    );
    raise exception 'anon published insert unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;

  begin
    perform * from public.saved_opportunities;
    raise exception 'anon private saved read unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

set local "request.jwt.claim.sub" = '10000000-0000-0000-0000-000000000001';
set local role authenticated;
do $$
begin
  if public.is_staff() then
    raise exception 'ordinary authenticated user reported as staff';
  end if;
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'authenticated profile read crossed owner boundary';
  end if;

  insert into public.saved_opportunities (user_id, opportunity_id)
  values (
    auth.uid(),
    '40000000-0000-0000-0000-000000000001'
  );
  insert into public.user_alert_preferences (user_id, deadline_alerts_enabled)
  values (auth.uid(), true);
  update public.user_alert_preferences
  set deadline_alerts_enabled = false
  where user_id = auth.uid();
  insert into public.talent_profiles (user_id, career_level)
  values (auth.uid(), 'student');
  update public.talent_profiles set region = 'Arusha' where user_id = auth.uid();
  insert into public.talent_opportunity_activity (user_id, opportunity_id, status)
  values (auth.uid(), '40000000-0000-0000-0000-000000000001', 'interested');
  update public.talent_opportunity_activity
  set status = 'applying'
  where user_id = auth.uid();

  begin
    insert into public.provider_campaigns (name, opportunity_id, created_by)
    values ('Denied ordinary campaign', '40000000-0000-0000-0000-000000000001', auth.uid());
    raise exception 'ordinary user campaign insert unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.get_campaign_audience('90000000-0000-0000-0000-000000000001');
    raise exception 'ordinary user campaign RPC unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

set local "request.jwt.claim.sub" = '10000000-0000-0000-0000-000000000003';
set local role authenticated;
do $$
declare
  campaign_id uuid;
begin
  if not public.is_staff() then
    raise exception 'moderator was not recognized as staff';
  end if;

  insert into public.opportunity_sources (name, base_url, source_type)
  values ('Staff source', 'https://staff-source.example.invalid', 'other');
  update public.opportunity_sources
  set last_checked_at = now()
  where base_url = 'https://staff-source.example.invalid';
  delete from public.opportunity_sources
  where base_url = 'https://staff-source.example.invalid';

  insert into public.opportunity_enrichments (
    opportunity_id, field, previous_value, new_value, evidence_url, method
  ) values (
    '40000000-0000-0000-0000-000000000001', 'city', null, 'Arusha',
    'https://opportunity.example.invalid/published', 'moderator-review'
  );

  insert into public.provider_campaigns (name, opportunity_id, created_by)
  values (
    'Staff grant proof',
    '40000000-0000-0000-0000-000000000001',
    auth.uid()
  ) returning id into campaign_id;
  update public.provider_campaigns set status = 'active' where id = campaign_id;
  perform public.get_campaign_engagement(campaign_id);
  perform public.get_campaign_audience(campaign_id);
  delete from public.provider_campaigns where id = campaign_id;
end;
$$;
reset role;

reset "request.jwt.claim.sub";
set local role service_role;
do $$
declare
  service_opportunity uuid := '40000000-0000-0000-0000-000000000002';
  alert_event uuid;
begin
  perform * from public.categories;
  perform * from public.opportunities;
  update public.opportunity_sources
  set last_checked_at = now()
  where id = '30000000-0000-0000-0000-000000000001';

  insert into public.opportunities (
    id, slug, title, description, category_id, url, status
  ) values (
    service_opportunity, 'service-probe', 'Service role probe', 'Synthetic reversible probe.',
    (select id from public.categories where slug = 'scholarship'),
    'https://opportunity.example.invalid/service', 'pending'
  );
  update public.opportunities set title = 'Service role probe updated'
  where id = service_opportunity;
  delete from public.opportunities where id = service_opportunity;

  insert into public.opportunity_enrichments (
    opportunity_id, field, previous_value, new_value, evidence_url, method
  ) values (
    '40000000-0000-0000-0000-000000000001', 'region', null, 'Arusha',
    'https://opportunity.example.invalid/published', 'json-ld-extraction'
  );
  perform * from public.opportunity_references;
  perform * from public.saved_opportunities;
  perform * from public.opportunity_deadline_changes;
  perform * from public.user_alert_preferences;

  insert into public.deadline_alert_events (
    user_id, opportunity_id, event_type, event_fingerprint, deadline_precision
  ) values (
    '10000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'deadline_changed', 'service-role-grant-proof', 'unspecified'
  ) returning id into alert_event;
  insert into public.deadline_alert_events (
    user_id, opportunity_id, event_type, event_fingerprint, deadline_precision
  ) values (
    '10000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'deadline_changed', 'service-role-grant-proof', 'unspecified'
  ) on conflict (user_id, opportunity_id, event_type, event_fingerprint)
    do nothing;
  delete from public.deadline_alert_events where id = alert_event;

  begin
    perform * from public.talent_profiles;
    raise exception 'service role private talent read unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.is_staff();
    raise exception 'service role is_staff execute unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

rollback;

select 'PASS actual anon/authenticated/service_role grants, RLS, RPCs, triggers, and restrictive future defaults';
