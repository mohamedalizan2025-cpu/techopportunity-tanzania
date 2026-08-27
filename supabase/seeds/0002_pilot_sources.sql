-- =====================================================================
-- TechOpportunity Tanzania - Pilot source registry seeds (Tanzania only)
-- Every row below was probe-verified on 2026-08-27 with the same HTTP
-- runtime used by the discovery worker (Node fetch, identical UA):
--   * reachable sources had their base_url passed through the actual
--     production HTML/RSS/JSON-LD extractors,
--   * sources whose automation suitability was unclear were registered
--     with active = false per policy.
-- Idempotent: unique index idx_opportunity_sources_base_url makes
-- re-running this script a no-op.
-- =====================================================================

insert into public.opportunity_sources (name, base_url, source_type, country, region, active) values
  ('University of Dar es Salaam', 'https://www.udsm.ac.tz', 'university', 'Tanzania', 'Dar es Salaam', true),
  ('Sokoine University of Agriculture', 'https://www.sua.ac.tz', 'university', 'Tanzania', 'Morogoro', true),
  ('University of Dodoma', 'https://www.udom.ac.tz', 'university', 'Tanzania', 'Dodoma', true),
  ('Nelson Mandela African Institution of Science and Technology', 'https://nm-aist.ac.tz', 'university', 'Tanzania', 'Arusha', true),
  ('College of Business Education', 'https://www.cbe.ac.tz', 'university', 'Tanzania', 'Dar es Salaam', true),
  ('State University of Zanzibar', 'https://suza.ac.tz', 'university', 'Tanzania', 'Zanzibar', true),
  ('Dar es Salaam Institute of Technology', 'https://www.dit.ac.tz', 'university', 'Tanzania', 'Dar es Salaam', true),
  ('Higher Education Students'' Loans Board', 'https://www.heslb.go.tz', 'scholarship_provider', 'Tanzania', 'Dodoma', true),
  ('Twaweza', 'https://www.twaweza.org', 'ngo', 'Tanzania', 'Dar es Salaam', true),

  -- Registered but NOT activated: automation suitability unverified.
  ('Ardhi University', 'https://www.aru.ac.tz', 'university', 'Tanzania', 'Dar es Salaam', false),
  ('Mbeya University of Science and Technology', 'https://www.must.ac.tz', 'university', 'Tanzania', 'Mbeya', false),
  ('Mzumbe University', 'https://www.mzumbe.ac.tz', 'university', 'Tanzania', 'Morogoro', false),
  ('Tanzania Commission for Science and Technology', 'https://www.costech.or.tz', 'government', 'Tanzania', 'Dar es Salaam', false),
  ('National Council for Technical Education', 'https://www.nactvet.go.tz', 'government', 'Tanzania', 'Dodoma', false),
  ('Buni Innovation Hub', 'https://buni.or.tz', 'innovation_hub', 'Tanzania', 'Dar es Salaam', false),
  ('Sahara Sparks', 'https://saharasparks.com', 'hackathon_platform', 'Tanzania', 'Dar es Salaam', false);

-- Sanity check after seeding:
-- select count(*) as total, count(*) filter (where active) as active
--   from public.opportunity_sources;
