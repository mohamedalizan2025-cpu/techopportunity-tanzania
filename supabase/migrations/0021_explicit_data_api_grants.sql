-- =====================================================================
-- Tech Opportunity - Migration 0021: explicit Data API grants
--
-- Supabase stops applying automatic Data API grants to newly created
-- public-schema objects on 2026-10-30. This migration makes the final API
-- surface explicit and opts future postgres-owned objects into deny-by-
-- default privileges. RLS remains the row boundary; grants are the object
-- boundary. Apply to isolated staging and prove the role matrix before any
-- separately approved production promotion.
-- =====================================================================

begin;

-- Match Supabase's new restrictive defaults. These statements affect only
-- objects created later; the per-object revokes and grants below define the
-- complete access contract for every existing application object.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables
  from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences
  from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions
  from anon, authenticated, service_role;
-- PostgreSQL's built-in PUBLIC EXECUTE is a global default. A schema-local
-- revoke cannot subtract a global default, so this one creator-role default
-- must be global; every exposed public routine is still granted individually.
alter default privileges for role postgres
  revoke execute on functions from public;

-- Start every table from a closed Data API surface. Grants below are the
-- audited minimum for public browsing/submission, owner-scoped features,
-- staff moderation/campaign administration, and operational workers.
revoke all on table public.categories
  from public, anon, authenticated, service_role;
revoke all on table public.organizations
  from public, anon, authenticated, service_role;
revoke all on table public.profiles
  from public, anon, authenticated, service_role;
revoke all on table public.opportunities
  from public, anon, authenticated, service_role;
revoke all on table public.opportunity_sources
  from public, anon, authenticated, service_role;
revoke all on table public.opportunity_enrichments
  from public, anon, authenticated, service_role;
revoke all on table public.opportunity_references
  from public, anon, authenticated, service_role;
revoke all on table public.saved_opportunities
  from public, anon, authenticated, service_role;
revoke all on table public.opportunity_deadline_changes
  from public, anon, authenticated, service_role;
revoke all on table public.user_alert_preferences
  from public, anon, authenticated, service_role;
revoke all on table public.deadline_alert_events
  from public, anon, authenticated, service_role;
revoke all on table public.talent_profiles
  from public, anon, authenticated, service_role;
revoke all on table public.talent_opportunity_activity
  from public, anon, authenticated, service_role;
revoke all on table public.provider_campaigns
  from public, anon, authenticated, service_role;

-- Anonymous product surface. opportunity_sources SELECT is intentionally
-- grantable but returns zero rows under RLS; public opportunity projections
-- embed that relationship and the M31 security probe verifies the zero-row
-- boundary. Anonymous Discovery inserts remain pending-only under RLS.
grant select on table public.categories to anon;
grant select on table public.organizations to anon;
grant select, insert on table public.opportunities to anon;
grant select on table public.opportunity_sources to anon;
grant select on table public.opportunity_references to anon;

-- Authenticated product surface. Staff-capable CRUD matches existing RLS
-- policies; ordinary users still cannot cross those policies. Owner-private
-- tables retain only the operations implemented by their owner workflows.
grant select on table public.categories to authenticated;
grant select, insert, update, delete on table public.organizations to authenticated;
grant select on table public.profiles to authenticated;
grant select, insert, update, delete on table public.opportunities to authenticated;
grant select, insert, update, delete on table public.opportunity_sources to authenticated;
grant select, insert on table public.opportunity_enrichments to authenticated;
grant select, insert, update, delete on table public.opportunity_references to authenticated;
grant select, insert, delete on table public.saved_opportunities to authenticated;
grant select on table public.opportunity_deadline_changes to authenticated;
grant select, insert, update on table public.user_alert_preferences to authenticated;
grant select on table public.deadline_alert_events to authenticated;
grant select, insert, update on table public.talent_profiles to authenticated;
grant select, insert, update, delete on table public.talent_opportunity_activity to authenticated;
grant select, insert, update, delete on table public.provider_campaigns to authenticated;

-- Operational service clients. There is deliberately no blanket service-role
-- grant. DELETE/INSERT on opportunities is retained only for the existing
-- guarded reversible schema probe; Discovery itself inserts with anon and
-- writes pending rows only. Private talent/campaign rows have no direct
-- service-role caller and therefore receive no service_role grant.
grant select on table public.categories to service_role;
grant select, insert, update, delete on table public.opportunities to service_role;
grant select, update on table public.opportunity_sources to service_role;
grant select, insert on table public.opportunity_enrichments to service_role;
grant select on table public.opportunity_references to service_role;
grant select on table public.saved_opportunities to service_role;
grant select on table public.opportunity_deadline_changes to service_role;
grant select on table public.user_alert_preferences to service_role;
grant select, insert, delete on table public.deadline_alert_events to service_role;

-- categories is the only application-owned sequence. Runtime category writes
-- do not exist, so no Data API role needs sequence privileges.
revoke all on sequence public.categories_id_seq
  from public, anon, authenticated, service_role;

-- Close every routine first, including PostgreSQL's default PUBLIC EXECUTE,
-- then expose only the authenticated functions that are real API contracts.
revoke all on function public.handle_new_user()
  from public, anon, authenticated, service_role;
revoke all on function public.is_staff()
  from public, anon, authenticated, service_role;
revoke all on function public.set_updated_at()
  from public, anon, authenticated, service_role;
revoke all on function public.record_opportunity_deadline_change()
  from public, anon, authenticated, service_role;
revoke all on function public.sync_opportunity_canonical_references()
  from public, anon, authenticated, service_role;
revoke all on function public.audit_published_unpublish()
  from public, anon, authenticated, service_role;
revoke all on function public.unpublish_published_opportunity(uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function public.audit_pending_rejection()
  from public, anon, authenticated, service_role;
revoke all on function public.reject_pending_opportunity(uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function public.get_campaign_engagement(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.get_campaign_audience(uuid)
  from public, anon, authenticated, service_role;

grant execute on function public.is_staff() to authenticated;
grant execute on function public.unpublish_published_opportunity(uuid, text)
  to authenticated;
grant execute on function public.reject_pending_opportunity(uuid, text)
  to authenticated;
grant execute on function public.get_campaign_engagement(uuid)
  to authenticated;
grant execute on function public.get_campaign_audience(uuid)
  to authenticated;

commit;
