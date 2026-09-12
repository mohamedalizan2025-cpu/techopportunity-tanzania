import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const actions = readFileSync(join(root, "lib/data/moderation-actions.ts"), "utf8");
const access = readFileSync(join(root, "lib/data/moderation.ts"), "utf8");
const reviewPage = readFileSync(join(root, "app/moderation/[id]/page.tsx"), "utf8");
const decisionForm = readFileSync(join(root, "app/moderation/decision-form.tsx"), "utf8");
const publishedPage = readFileSync(join(root, "app/published-management/page.tsx"), "utf8");

test("published re-review is an authenticated staff-only application action", () => {
  assert.match(actions, /export async function rereviewPublishedOpportunityAction/);
  assert.match(actions, /const access = await getModerationAccess\(\)/);
  assert.match(access, /user\.role !== "moderator" && user\.role !== "admin"/);
  assert.match(reviewPage, /redirect\(`\/login\?next=/);
  assert.match(reviewPage, /Your account does not have moderation permissions/);
  assert.doesNotMatch(actions, /SUPABASE_SERVICE_ROLE_KEY|service_role/);
});

test("published re-review is exact-target, status and concurrency guarded", () => {
  assert.match(actions, /getPublishedOpportunityById\(rawId\)/);
  assert.match(actions, /expectedStatus: "published"/);
  assert.match(actions, /expectedDecisionAt: current\.trust\?\.decidedAt \?\? null/);
  assert.match(actions, /\.eq\("id", current\.id\)[\s\S]*\.eq\("status", expectedStatus\)/);
  assert.match(actions, /request\.is\("decided_at", null\)/);
  assert.match(actions, /request\.eq\("decided_at", expectedDecisionAt\)/);
});

test("published re-review fails closed through the current M31 contract", () => {
  assert.match(actions, /satisfiesPublishedReviewContract/);
  assert.match(actions, /does not satisfy the current publication contract/);
  assert.match(decisionForm, /Save verified re-review/);
  assert.match(publishedPage, /Re-review evidence/);
  assert.match(reviewPage, /mode=published/);
});

test("pending approval and protected unpublish remain separate guarded paths", () => {
  assert.match(actions, /expectedStatus: "pending"/);
  assert.match(actions, /\.eq\("id", rawId\)\s*\.eq\("status", "pending"\)/);
  assert.match(actions, /unpublishUpdatePayload\(\)[\s\S]*\.eq\("id", rawId\)[\s\S]*\.eq\("status", "published"\)/);
  assert.match(actions, /reviewAuditRows\(current, review\)/);
});
