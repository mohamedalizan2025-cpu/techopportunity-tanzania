-- =====================================================================
-- DATA API FUTURE-SEQUENCE DEFAULT CORRECTION
-- =====================================================================
-- Migration 0021 removed USAGE and SELECT from the legacy public-schema
-- sequence defaults. PostgreSQL sequence UPDATE is independent and also
-- permits nextval/setval behavior, so it must be revoked explicitly.
-- Existing application sequences were already closed with REVOKE ALL in
-- 0021; this additive migration changes only postgres-owned future defaults.
-- =====================================================================

begin;

alter default privileges for role postgres in schema public
  revoke usage, select, update on sequences
  from anon, authenticated, service_role;

commit;
