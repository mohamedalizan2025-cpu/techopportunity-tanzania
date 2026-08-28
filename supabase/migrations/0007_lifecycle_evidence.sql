-- =====================================================================
-- TechOpportunity Tanzania - Migration 0007: lifecycle evidence
-- Status:  DESIGNED — NOT APPLIED. OWNER GATE: apply manually in the
--          Supabase SQL editor only after the owner approves.
--
-- Purpose: give freshness a stored EVIDENCE column while keeping the
--          lifecycle STATE derived (lib/lifecycle.ts). Stored state
--          flags drift out of sync with deadlines; evidence columns do
--          not.
--
-- Design rules (binding):
--   * freshness is derived from deadline + clock (lib/lifecycle.ts);
--     this migration adds NO stored state column.
--   * last_verified_at records the last human verification (approval,
--     enrichment, or a deliberate "still live" check). Nothing writes
--     it automatically today; the moderation action becomes the first
--     writer when this is approved.
--   * expired opportunities are NEVER auto-deleted and never
--     auto-unpublished by this migration. Any future sweep job is a
--     separate owner-gated decision and must honor rolling/null
--     deadlines (they never expire by clock).
--   * discovered_at already covers "when we found it"; source
--     published_at is deliberately NOT stored (not reliably present
--     in evidence; never fabricated).
-- =====================================================================

alter table public.opportunities
  add column last_verified_at timestamptz;

-- Supports the future owner-gated sweep ("published rows whose deadline
-- passed N days ago") without sequential scans.
create index idx_opportunities_deadline_sweep
  on public.opportunities (deadline)
  where status = 'published' and deadline is not null;

-- Sanity check after applying:
-- select count(*) from public.opportunities where last_verified_at is not null; -- 0
