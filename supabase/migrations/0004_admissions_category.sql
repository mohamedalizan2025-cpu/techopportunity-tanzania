-- =====================================================================
-- TechOpportunity Tanzania - Migration 0004: admissions category
-- Purpose: add a distinct category for admissions/programme-intake and
--          application-call opportunities (e.g. DIT/VETA joining forms,
--          "TANGAZO LA UDAHILI", application windows), which currently
--          land in "other" and hide from category browsing.
-- Additive only: one seed row, no schema change, no RLS change, no data
-- rewriting. Categories are world-readable by existing 0001 policy.
-- Status: DRAFT - apply to tto-staging via SQL Editor
-- =====================================================================

insert into public.categories (slug, label)
values ('admissions', 'Admissions & Programmes')
on conflict (slug) do nothing;

-- Sanity check:
-- select id, slug from public.categories where slug = 'admissions';
