-- =====================================================================
-- Tech Opportunity - Migration 0018: talent profile (personalization)
-- Status: DESIGNED - NOT APPLIED. OWNER GATE: review and apply explicitly
--         in staging, then production, before enabling For You.
--
-- The smallest structured talent profile needed for future explainable
-- matching (docs/PLATFORM_ARCHITECTURE.md). Additive and owner-scoped:
--   - one row per authenticated talent user, 1:1 with auth.users;
--   - every field optional/nullable so profiling is progressive and a
--     user can skip it entirely and keep using Explore;
--   - stores NO copied opportunity content and NO identifier beyond the
--     user's own uuid;
--   - reuses the existing taxonomy vocabularies as bounded text arrays
--     (sectors -> lib/taxonomy SECTORS, preferred_types -> categories).
--
-- Privacy boundary (permanent): this table is OWNER-ONLY. Staff moderation
-- does NOT read talent profiles, and personal user data is never exposed to
-- organizations. There is deliberately no staff or organization read policy
-- here: the only policies above are bound to the row owner's own uuid.
-- =====================================================================

create table public.talent_profiles (
  user_id          uuid primary key references auth.users (id) on delete cascade,

  -- Core (progressive; each optional).
  career_level     text
    check (career_level is null or career_level in (
      'student', 'recent-graduate', 'early-career', 'mid-career',
      'senior', 'researcher', 'founder', 'other')),
  field_discipline text
    check (field_discipline is null or char_length(field_discipline) between 2 and 80),
  sectors          text[] not null default '{}',
  preferred_types  text[] not null default '{}',

  -- Optional / progressive.
  skills           text[] not null default '{}',
  region           text
    check (region is null or char_length(region) between 2 and 80),
  experience_level text
    check (experience_level is null or experience_level in (
      'none', 'entry', 'some', 'experienced', 'expert')),
  goals            text
    check (goals is null or char_length(goals) <= 500),

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- Bounded arrays keep the row small and the matching input deterministic.
  constraint talent_profiles_sectors_bounded
    check (array_length(sectors, 1) is null or array_length(sectors, 1) <= 13),
  constraint talent_profiles_preferred_types_bounded
    check (array_length(preferred_types, 1) is null or array_length(preferred_types, 1) <= 20),
  constraint talent_profiles_skills_bounded
    check (array_length(skills, 1) is null or array_length(skills, 1) <= 30)
);

create trigger talent_profiles_set_updated_at
  before update on public.talent_profiles
  for each row execute function public.set_updated_at();

alter table public.talent_profiles enable row level security;

create policy "users read own talent profile"
  on public.talent_profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users create own talent profile"
  on public.talent_profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users update own talent profile"
  on public.talent_profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Declare least privilege explicitly. No anonymous access; no delete (a user
-- clears their profile by saving empty fields, preserving the single row).
revoke all on table public.talent_profiles from anon;
grant select, insert, update on table public.talent_profiles to authenticated;

-- Reversal, if explicitly approved before user profile data matters:
-- drop table public.talent_profiles;
