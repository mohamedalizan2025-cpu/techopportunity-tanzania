-- =====================================================================
-- TechOpportunity Tanzania - Migration 0006: canonical opportunity
-- identity (evidence references)
-- Status:  DESIGNED — NOT APPLIED. OWNER GATE: apply manually in the
--          Supabase SQL editor only after the owner approves.
--
-- Purpose: evolve identity from "one URL = one opportunity" toward
--          "canonical opportunity <- multiple evidence references".
--          The same real-world opportunity will arrive from official
--          sites, aggregators, ministries, and eventually permitted
--          public/social channels; the product must be able to attach
--          duplicate evidence to ONE moderated record instead of
--          inserting duplicate rows.
--
-- Design rules (binding):
--   * references are ATTACHMENTS to an existing opportunity row; this
--     migration never merges or deletes rows.
--   * discovery still inserts one pending row per URL (existing
--     one-row-one-opportunity invariant); a moderator or a future
--     staff tool attaches later sightings as references.
--   * no fuzzy matching, no embeddings, no pgvector: identity remains
--     human-verified. Source precedence is expressed by is_canonical
--     (exactly one per opportunity), not by ranking algorithms.
--   * the pipeline's URL-based dedupe REMAINS the MVP strategy even
--     after this migration: discovery still keys on candidate URLs.
--     This table is the foundation for a LATER duplicate-evidence
--     workflow (moderator/future staff tool asks "is this URL already
--     evidence of an existing opportunity?" via idx_..._url) — it does
--     not silently replace or upgrade the pipeline's identity logic.
--   * staff-only reads/writes: references are provenance, not public
--     content, until a product decision says otherwise.
-- =====================================================================

create type public.reference_source_type as enum (
  'website',     -- official/institutional page
  'rss',         -- feed item
  'atom',        -- feed item
  'aggregator',  -- third-party listing/roundup
  'social',      -- future: owner-approved official social/API channel
  'api',         -- future: owner-approved public API
  'manual'       -- moderator-supplied evidence URL
);

create table public.opportunity_references (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid not null references public.opportunities (id)
                  on delete cascade,
  url             text not null,
  source_type     reference_source_type not null default 'website',
  label           text,            -- e.g. "also listed on OpportunityDesk"
  is_canonical    boolean not null default false,
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users (id) on delete set null,
  unique (opportunity_id, url)
);

-- Exactly one canonical reference per opportunity (official source wins).
create unique index idx_opportunity_references_one_canonical
  on public.opportunity_references (opportunity_id)
  where is_canonical;

-- Fast lookup when discovery wants to ask "have we seen this URL as
-- evidence of an existing opportunity?" (duplicate-evidence path).
create index idx_opportunity_references_url
  on public.opportunity_references (url);

alter table public.opportunity_references enable row level security;

create policy "staff read opportunity references"
  on public.opportunity_references
  for select
  to authenticated
  using ((select public.is_staff()));

create policy "staff manage opportunity references"
  on public.opportunity_references
  for insert
  to authenticated
  with check ((select public.is_staff()));

create policy "staff update opportunity references"
  on public.opportunity_references
  for update
  to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create policy "staff delete opportunity references"
  on public.opportunity_references
  for delete
  to authenticated
  using ((select public.is_staff()));

-- Sanity checks after applying:
-- select count(*) from public.opportunity_references;          -- 0
-- select anon probe: table must be invisible to the anon role.
