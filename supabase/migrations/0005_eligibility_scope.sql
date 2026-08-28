-- =====================================================================
-- TechOpportunity Tanzania - Migration 0005: applicant eligibility
-- Status:  DESIGNED — NOT APPLIED. OWNER GATE: apply manually in the
--          Supabase SQL editor only after the owner approves.
-- Revision history: originally designed with a geographic-scope enum
--          (tanzania/east_africa/africa/international/...). Revised
--          before ever being applied: a scope enum invites moderators
--          (or future AI) to GUESS scopes from wording like
--          "international students", which is location/newsroom
--          language, not eligibility evidence. The platform has exactly
--          ONE actionable eligibility question — "may Tanzanians apply?"
--          — so the model stores that verified fact plus the evidence,
--          and nothing else.
--
-- Purpose: separate WHO MAY APPLY (eligibility) from WHERE THE
--          OPPORTUNITY HAPPENS (location). The platform serves
--          Tanzanians finding opportunities located anywhere in the
--          world (or online, or unknown), so location fields must
--          never act as a proxy for Tanzanian eligibility.
--
-- Domain model:
--   eligibility:
--     'unknown'                  no verified evidence (default; honest).
--     'tanzanians_eligible'      explicit verified evidence that
--                                Tanzanian applicants may apply.
--     'tanzanians_not_eligible'  explicit verified evidence that
--                                Tanzanians are excluded.
--   eligibility_evidence: the statement/URL a moderator relied on
--     (e.g. "Open to applicants from all African countries including
--     Tanzania — example.org/eligibility"). Broader geographic scope
--     lives inside this evidence text; it is NOT a first-class column
--     because it is descriptive, not inferable.
--
-- Design rules (binding for any code that touches this column):
--   * default is 'unknown' — eligibility is NEVER inferred from:
--     organizer country, opportunity location, source domain,
--     university name, URL structure, or wording such as
--     "international" (which is not, by itself, evidence of who may
--     apply).
--   * discovery code NEVER writes this column; only moderators set it,
--     from explicit evidence on the opportunity's own page.
--   * eligibility != 'unknown' REQUIRES eligibility_evidence (CHECK).
--   * the future AI assistant may answer eligibility questions ONLY
--     from rows where eligibility != 'unknown'; it must never derive
--     eligibility from any other field.
--   * additive and backfill-safe: existing rows receive 'unknown'
--     through the default; no historical row is rewritten.
--
-- Companion (separate owner decision, NOT in this migration):
--   * stop the fabricated country default ('Tanzania'), make
--     opportunities.country nullable/evidence-based, and add country
--     to the moderator review form (architecture.md §12.2).
--     Deliberately not bundled: country evidence and eligibility
--     semantics are independent decisions.
-- =====================================================================

create type public.eligibility_status as enum (
  'unknown',                  -- no verified evidence (default; honest)
  'tanzanians_eligible',      -- verified: Tanzanians may apply
  'tanzanians_not_eligible'   -- verified: Tanzanians are excluded
);

alter table public.opportunities
  add column eligibility public.eligibility_status not null default 'unknown',
  add column eligibility_evidence text;

alter table public.opportunities
  add constraint eligibility_evidence_required
  check (eligibility = 'unknown' or eligibility_evidence is not null);

create index idx_opportunities_eligibility
  on public.opportunities (eligibility)
  where status = 'published';

-- No RLS changes: eligibility rides on the existing opportunity policies
-- (anon INSERT lands on the 'unknown' default; staff UPDATE policies
-- already govern moderation edits).

-- Sanity check after applying:
-- select eligibility, count(*) from public.opportunities group by 1;
