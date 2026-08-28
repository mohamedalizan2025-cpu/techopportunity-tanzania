-- =====================================================================
-- TechOpportunity Tanzania - Migration 0009: moderation attribution
-- Status:  DESIGNED — NOT APPLIED. OWNER GATE: apply manually in the
--          Supabase SQL editor only after the owner approves.
--
-- Purpose: answer "WHO decided and WHEN" for every approve/reject.
--          Provenance currently records where a row came from and what
--          moderators enriched, but not the identity/time of the
--          publication decision itself.
--
-- Design rules (binding):
--   * additive columns only; existing rows keep decided_by/decided_at
--     as NULL (= decided before attribution existed — honest).
--   * written ONLY by the moderation decision action, using the
--     authenticated staff identity (auth.uid()) at decision time.
--   * discovery NEVER writes these columns (it only ever inserts
--     pending rows; RLS already confines it).
--   * these columns extend provenance; they never mutate the immutable
--     discovery fields (source_id, source_url, discovered_at,
--     discovery_method, submitted_by).
--   * no RLS change: the existing staff-only UPDATE policies govern
--     writes; anon reads of published rows gain two audit columns, which
--     is acceptable transparency (WHO approved this), not a leak.
--
-- Companion code is staged to start writing these columns ONLY after
-- this migration is applied (writing a missing column would hard-fail
-- every moderation decision).
-- =====================================================================

alter table public.opportunities
  add column decided_by uuid references auth.users (id) on delete set null,
  add column decided_at timestamptz;

-- Consistency guard: the two travel together.
alter table public.opportunities
  add constraint decision_attribution_paired
  check (
    (decided_by is null and decided_at is null)
    or (decided_by is not null and decided_at is not null)
  );

-- Sanity check after applying:
-- select count(*) from public.opportunities where decided_by is not null; -- 0
