-- =====================================================================
-- TechOpportunity Tanzania - Bounded first-party listing adapters (owner-gated)
-- =====================================================================
-- Adds two Tanzania first-party sources that publish REAL, current,
-- actionable opportunities on a DEDICATED listing page. These rows are the
-- ONLY trigger for the narrow, fixture-backed source-specific adapters in
-- scripts/discovery/source-adapters.ts, which are keyed to these EXACT
-- base_urls.
--
-- OWNER-GATED BY DESIGN
--   * These base_urls are deliberately DISTINCT from the already-active site
--     homepage rows (https://www.udsm.ac.tz and https://nm-aist.ac.tz). The
--     homepage rows stay inert for generic HTML (institutional sources are
--     blocked by source-policy.ts) and trigger NO adapter, so this seed does
--     not change what the live 2-hour cadence already collects.
--   * Nothing here is applied automatically. This is a FORWARD migration
--     file only; it takes effect when the owner applies it to a target
--     database. Until then the worker's loadActiveSources() never sees these
--     rows and the adapters never run.
--   * active = true follows the pilot-seed convention (verified rows ship
--     active once applied). The gate to production is applying this file, not
--     a flag flip.
--
-- Evidence (worker-representative, unchanged admission gate, 2026-09):
--   UDSM   /announcement  -> 6 detail cards extracted, 3 actionable tech/
--                              research calls admitted (AI/climate
--                              scholarships, CS/data-engineering PhD,
--                              energy/digital-innovation grants); news,
--                              undergraduate-admissions and stale calls
--                              rejected.
--   NM-AIST /event/       -> 4 event cards extracted, 2 admitted (Samia
--                              Data-Science/AI scholarship, Applied-AI
--                              MSc/PhD call); stale/non-opportunity rejected.
-- Both sources have representative fixtures + tests in the repo
-- (scripts/discovery/fixtures/*-listing.html, tests/source-adapters.test.ts).
--
-- Idempotent: unique index idx_opportunity_sources_base_url makes re-running
-- this script a no-op.
-- =====================================================================

insert into public.opportunity_sources (name, base_url, source_type, country, region, active) values
  ('University of Dar es Salaam - Announcements Listing',
   'https://www.udsm.ac.tz/announcement', 'university', 'Tanzania', 'Dar es Salaam', true),
  ('Nelson Mandela African Institution of Science and Technology - Events Listing',
   'https://nm-aist.ac.tz/event/', 'university', 'Tanzania', 'Arusha', true)
  on conflict (base_url) do nothing;

-- Sanity check after seeding:
-- select name, base_url, source_type, active
--   from public.opportunity_sources
--  where base_url in ('https://www.udsm.ac.tz/announcement', 'https://nm-aist.ac.tz/event/');
