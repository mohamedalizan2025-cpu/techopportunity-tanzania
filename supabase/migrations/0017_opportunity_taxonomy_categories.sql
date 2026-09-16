-- =====================================================================
-- TechOpportunity Tanzania - Migration 0017: opportunity-TYPE taxonomy
-- Status:  DESIGNED — NOT APPLIED. OWNER GATE: apply manually in the
--          Supabase SQL editor only after the owner approves.
--
-- Milestone: National / International classification + opportunity
-- taxonomy. This is the ONLY schema-side change the milestone needs.
--
-- The milestone classifies every opportunity on three orthogonal axes:
--   * TYPE      — the actionable kind. Reuses the existing `categories`
--                 table (no new table). The application taxonomy already
--                 covers scholarship, fellowship, internship, jobs,
--                 hackathon, competition, grant, conference, workshop,
--                 tech-event, admissions, other. Three real, recurring
--                 types present in the corpus had NO receiving row and
--                 were collapsing into `other`:
--                   - accelerator / incubator
--                   - research call
--                   - government / public-sector challenge
--   * GEOGRAPHY — National vs International. DERIVED in application code
--                 (lib/taxonomy.ts) from evidence already stored on the
--                 row (country, country_verification, eligibility,
--                 eligibility_evidence). NO new column.
--   * SECTOR    — AI/Data, Health, Agriculture, ... DERIVED in application
--                 code from title/description text. NO new column.
--
-- Why additive-only and no new columns: discovery is a live production
-- worker triggered on push. Deriving geography/sector in code (never
-- persisting new columns) means the worker's INSERT shape is unchanged,
-- so this milestone cannot break a production run. Reusing `categories`
-- for TYPE keeps one source of truth shared by discovery, the submit
-- form and the moderator review UI.
--
-- Shape follows migrations 0004 (admissions) and 0010 (jobs): additive
-- seed rows only — no schema change, no RLS change, no data rewriting.
-- Categories are world-readable by the existing 0001 policy.
--
-- Companion code (types, labels, triage buckets, conservative discovery
-- inference) is committed alongside this design. The runner FAILS LOUDLY
-- (skip + warn, never crash) when a category slug has no DB row, so
-- discovery simply skips accelerator/research-call/public-challenge
-- candidates until this migration is applied — identical to the `jobs`
-- precedent. Nothing crashes, nothing mis-inserts, and the submit/review
-- UIs never offer an unseeded slug.
-- =====================================================================

insert into public.categories (slug, label)
values
  ('accelerator', 'Accelerator / Incubator'),
  ('research-call', 'Research Call'),
  ('public-challenge', 'Government / Public-Sector Challenge')
on conflict (slug) do nothing;

-- Sanity check after applying:
-- select id, slug, label from public.categories
--   where slug in ('accelerator', 'research-call', 'public-challenge');
