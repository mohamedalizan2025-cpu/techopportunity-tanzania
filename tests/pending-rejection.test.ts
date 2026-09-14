import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  MODERATION_REASON_MAX_LENGTH,
  MODERATION_REASON_MIN_LENGTH,
  normalizeModerationReason,
} from "../lib/staff-form-state";

const root = process.cwd();
const actions = readFileSync(join(root, "lib/data/moderation-actions.ts"), "utf8");
const form = readFileSync(join(root, "app/moderation/decision-form.tsx"), "utf8");
const migration = readFileSync(
  join(root, "supabase/migrations/0016_pending_rejection_attribution.sql"),
  "utf8"
);
const unpublishMigration = readFileSync(
  join(root, "supabase/migrations/0015_published_unpublish_attribution.sql"),
  "utf8"
);

test("rejection reasons are trimmed, bounded, and fail closed", () => {
  const reason = "Official eligibility excludes Tanzanian applicants.";
  assert.equal(normalizeModerationReason(`  ${reason}  `), reason);
  assert.equal(normalizeModerationReason(null), null);
  assert.equal(normalizeModerationReason(" ".repeat(20)), null);
  assert.equal(normalizeModerationReason("x".repeat(MODERATION_REASON_MIN_LENGTH - 1)), null);
  assert.equal(normalizeModerationReason("x".repeat(MODERATION_REASON_MAX_LENGTH + 1)), null);
});

test("the pending form makes the reason visible without blocking approval", () => {
  assert.match(form, /name="rejectionReason"/);
  assert.match(form, /maxLength=\{MODERATION_REASON_MAX_LENGTH\}/);
  assert.doesNotMatch(form, /name="rejectionReason"[\s\S]{0,250}\b(?:required|minLength)\b/);
});

test("the application rejection path uses the authenticated client and exact RPC shape", () => {
  assert.match(actions, /const access = await getModerationAccess\(\)/);
  assert.match(actions, /getPendingOpportunityById\(rawId\)/);
  assert.match(actions, /normalizeModerationReason\(formData\.get\("rejectionReason"\)\)/);
  assert.match(actions, /access\.staff\.client\s*\.rpc\("reject_pending_opportunity"/);
  assert.match(actions, /target_opportunity_id: rawId,[\s\S]*decision_reason: rejectionReason/);
  assert.doesNotMatch(actions, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(actions, /actor_id:\s*access\.staff\.userId/);
});

test("the database owns actor, decision time, status transition, and audit atomically", () => {
  assert.match(migration, /language plpgsql\s+security invoker/);
  assert.match(migration, /actor uuid := auth\.uid\(\)/);
  assert.match(migration, /decision_time timestamptz := statement_timestamp\(\)/);
  assert.match(migration, /set status = 'rejected',[\s\S]*decided_by = actor,[\s\S]*decided_at = decision_time/);
  assert.match(migration, /old\.status = 'pending' and new\.status = 'rejected'/);
  assert.match(migration, /new\.decided_by is distinct from actor/);
  assert.match(migration, /new\.decided_at is distinct from statement_timestamp\(\)/);
  assert.match(migration, /new\.id,[\s\S]*old\.status::text,[\s\S]*new\.status::text,[\s\S]*actor,[\s\S]*decision_reason,[\s\S]*new\.decided_at/);
  assert.match(migration, /after update of status on public\.opportunities/);
});

test("anonymous, ordinary users, and service-role impersonation are denied", () => {
  assert.match(migration, /actor is null or not public\.is_staff\(\)/);
  assert.match(migration, /revoke all on function public\.reject_pending_opportunity\(uuid, text\)\s+from public, anon, service_role/);
  assert.match(migration, /grant execute on function public\.reject_pending_opportunity\(uuid, text\)\s+to authenticated/);
});

test("the RPC can change only one exact pending target", () => {
  assert.match(migration, /where opportunity\.id = target_opportunity_id\s+and opportunity\.status = 'pending'/);
  assert.doesNotMatch(migration, /delete\s+from public\.opportunities/i);
});

test("approval, re-review, and published unpublish contracts remain separate", () => {
  assert.match(actions, /expectedStatus: "pending"/);
  assert.match(actions, /expectedStatus: "published"/);
  assert.match(actions, /\.rpc\("unpublish_published_opportunity"/);
  assert.match(unpublishMigration, /old\.status = 'published' and new\.status = 'rejected'/);
  assert.match(unpublishMigration, /'moderator-unpublish'/);
  assert.doesNotMatch(migration, /create or replace function public\.unpublish_published_opportunity/);
});
