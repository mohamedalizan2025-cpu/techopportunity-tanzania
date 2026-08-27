-- =====================================================================
-- TechOpportunity Tanzania - Cross-sector Tanzania source pilot seeds
-- Supersedes the earlier university-heavy pilot draft.
-- Every ACTIVE row was probe-verified on 2026-08-27 with the same Node
-- runtime used by the discovery worker (identical UA):
--   1. HTTP accessibility (no login, CAPTCHA, paywall or bypass)
--   2. production-extractor simulation on the exact base_url
--   3. evidence anchors showing real application/training/call content
-- Rows marked active=false are registered future candidates whose
-- automation suitability could NOT be verified (quality rule:
-- uncertain => inactive).
-- Idempotent: unique index idx_opportunity_sources_base_url makes
-- re-running this script a no-op.
-- =====================================================================

insert into public.opportunity_sources (name, base_url, source_type, country, region, active) values

  -- ============================================================
  -- EDUCATION / ACADEMIC  (6 verified-active)
  -- ============================================================
  ('University of Dar es Salaam',
   'https://www.udsm.ac.tz', 'university', 'Tanzania', 'Dar es Salaam', true),

  ('Sokoine University of Agriculture',
   'https://www.sua.ac.tz', 'university', 'Tanzania', 'Morogoro', true),

  ('University of Dodoma',
   'https://www.udom.ac.tz', 'university', 'Tanzania', 'Dodoma', true),

  ('Nelson Mandela African Institution of Science and Technology',
   'https://nm-aist.ac.tz', 'university', 'Tanzania', 'Arusha', true),

  ('State University of Zanzibar',
   'https://suza.ac.tz', 'university', 'Tanzania', 'Zanzibar', true),

  -- Additional academic source kept active:
  ('Dar es Salaam Institute of Technology',
   'https://www.dit.ac.tz', 'university', 'Tanzania', 'Dar es Salaam', true),

  -- ============================================================
  -- GOVERNMENT / MINISTRIES / AGENCIES  (4 verified-active)
  -- ============================================================
  ('Higher Education Students'' Loans Board',
   'https://www.heslb.go.tz', 'scholarship_provider', 'Tanzania', 'Dodoma', true),

  ('Vocational Education and Training Authority',
   'https://www.veta.go.tz', 'government', 'Tanzania', 'Dodoma', true),

  ('Bank of Tanzania',
   'https://www.bot.go.tz', 'government', 'Tanzania', 'Dar es Salaam', true),

  ('ICT Commission',
   'https://www.ictc.go.tz', 'government', 'Tanzania', 'Dar es Salaam', true),

  -- ============================================================
  -- NGO / FOUNDATION / DEVELOPMENT  (5 verified-active,
  -- deliberately spanning health, finance, environment, youth)
  -- ============================================================
  ('Twaweza',
   'https://www.twaweza.org', 'ngo', 'Tanzania', 'Dar es Salaam', true),

  ('Ifakara Health Institute',
   'https://www.ihi.or.tz', 'ngo', 'Tanzania', 'Morogoro', true),

  ('Financial Sector Deepening Tanzania',
   'https://www.fsdt.or.tz', 'ngo', 'Tanzania', 'Dar es Salaam', true),

  ('Jane Goodall Institute Tanzania',
   'https://janegoodall.or.tz', 'ngo', 'Tanzania', 'Dar es Salaam', true),

  ('Youth of United Nations Association Tanzania',
   'https://yuna.or.tz', 'ngo', 'Tanzania', 'Dar es Salaam', true),

  -- ============================================================
  -- SECTOR: AGRICULTURE  (1 verified-active)
  -- ============================================================
  ('Ministry of Agriculture',
   'https://www.kilimo.go.tz', 'government', 'Tanzania', 'Dodoma', true),

  -- ============================================================
  -- REGISTERED BUT NOT ACTIVATED - future candidates whose public
  -- automation suitability could NOT be verified today.
  -- ============================================================
  ('University of Dodoma Announcements Portal',
   'https://www.udom.ac.tz/announcements/index', 'university', 'Tanzania', 'Dodoma', false),
  ('Ardhi University',
   'https://www.aru.ac.tz', 'university', 'Tanzania', 'Dar es Salaam', false),
  ('College of Business Education',
   'https://www.cbe.ac.tz', 'university', 'Tanzania', 'Dar es Salaam', false),
  ('Mbeya University of Science and Technology',
   'https://www.must.ac.tz', 'university', 'Tanzania', 'Mbeya', false),
  ('Mzumbe University',
   'https://www.mzumbe.ac.tz', 'university', 'Tanzania', 'Morogoro', false),
  ('Tanzania Commission for Science and Technology',
   'https://www.costech.or.tz', 'government', 'Tanzania', 'Dar es Salaam', false),
  ('National Council for Technical Education',
   'https://www.nactvet.go.tz', 'government', 'Tanzania', 'Dodoma', false),
  ('SIDO Training Schedule',
   'https://www.sido.go.tz/training_schedule', 'government', 'Tanzania', 'Dodoma', false),
  ('Buni Innovation Hub',
   'https://buni.or.tz', 'innovation_hub', 'Tanzania', 'Dar es Salaam', false),
  ('Sahara Sparks',
   'https://saharasparks.com', 'hackathon_platform', 'Tanzania', 'Dar es Salaam', false),
  ('Tanzania Health Promotion Support',
   'https://thps.or.tz', 'ngo', 'Tanzania', 'Dar es Salaam', false)
  on conflict (base_url) do nothing;

-- Sanity check after seeding:
-- select count(*) as total, count(*) filter (where active) as active
--   from public.opportunity_sources;
