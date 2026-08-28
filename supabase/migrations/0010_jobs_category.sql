-- =====================================================================
-- TechOpportunity Tanzania - Migration 0010: jobs/vacancies category
-- Status:  DESIGNED — NOT APPLIED. OWNER GATE: apply manually in the
--          Supabase SQL editor only after the owner approves.
--
-- Evidence justifying this addition (per the milestone taxonomy test —
-- "would this materially improve discovery of an actual class of
-- actionable opportunities already present?"):
--   * the pipeline's roundup one-hop expansion exists PRECISELY because
--     of multi-job pages ("30 Hot Job Opportunities"); extracted job
--     titles ("UNICEF Partnerships Officer (Dar es Salaam)", ...) are
--     real actionable opportunities landing in `other` today because no
--     jobs category exists to receive them.
--   * docs/DISCOVERY_CHANNELS.md records jobs/vacancies as the FIRST
--     documented taxonomy gap; the mission statement lists jobs as a
--     core opportunity type.
--   * a live dry-run (2026-08-29) over 18 sources confirmed job-titled
--     candidates in the pending-eligible pool.
--
-- Shape follows migration 0004 (admissions): one additive seed row.
-- Companion code (types, label, conservative inference for vacancy/job/
-- ajira/nafasi-za-kazi only) is committed alongside this design; the
-- runner now FAILS LOUDLY (skip + warn) when a category slug has no DB
-- row, so discovery simply skips `jobs` candidates until this migration
-- is applied — nothing crashes, nothing mis-inserts.
-- =====================================================================

insert into public.categories (slug, label)
values ('jobs', 'Jobs & Vacancies')
on conflict (slug) do nothing;

-- Sanity check after applying:
-- select id, slug, label from public.categories where slug = 'jobs';
