-- M31 follow-up: moderator country corrections use the existing enrichment
-- audit path, so the restored pre-M31 field constraint must allow `country`.
-- Apply to staging first. This migration does not alter opportunity data.

begin;

alter table public.opportunity_enrichments
  drop constraint if exists opportunity_enrichments_field_check;

alter table public.opportunity_enrichments
  add constraint opportunity_enrichments_field_check
  check (field in ('venue_name', 'address', 'city', 'region', 'country', 'deadline'));

commit;
