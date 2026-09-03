import assert from "node:assert/strict";
import { classifyChanges } from "../scripts/verification/contract";

let passed = 0;
function test(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
}

const selected = (files: string[]) => classifyChanges(files).changeTriggeredGates.filter((gate) => gate.selected).map((gate) => gate.id);

test("no changes keeps every invariant gate and skips every change gate", () => {
  const plan = classifyChanges([]);
  assert.equal(plan.alwaysGates.length, 4);
  assert.equal(plan.changeTriggeredGates.every((gate) => !gate.selected && gate.skippedReason), true);
  assert.equal(plan.productionEvidence.required, false);
});

test("runtime UI changes select a build", () => {
  assert.deepEqual(selected(["app/page.tsx"]), ["build"]);
});

test("qualification changes select discovery and qualification coverage", () => {
  assert.deepEqual(selected(["scripts/discovery/qualification.ts"]), ["discovery-regression", "qualification-regression"]);
});

test("fetch changes select acquisition security and production evidence", () => {
  const plan = classifyChanges(["scripts\\discovery\\fetch.ts"]);
  assert.deepEqual(selected(["scripts/discovery/fetch.ts"]), ["discovery-regression", "acquisition-security"]);
  assert.equal(plan.productionEvidence.required, true);
});

test("migration changes require review, production evidence, and owner approval", () => {
  const plan = classifyChanges(["supabase/migrations/0012_example.sql"]);
  assert.deepEqual(selected(plan.changedFiles), ["migration-review"]);
  assert.equal(plan.productionEvidence.required, true);
  assert.equal(plan.ownerActions.length, 1);
});

test("M30 migration selects deadline alerts and migration review", () => {
  const plan = classifyChanges(["supabase/migrations/0012_deadline_alerts.sql"]);
  assert.deepEqual(selected(plan.changedFiles), ["deadline-alerts", "migration-review"]);
  assert.equal(plan.productionEvidence.required, true);
});

test("source seed changes require explicit live-mutation approval", () => {
  const plan = classifyChanges(["supabase/seeds/0002_pilot_sources.sql"]);
  assert.deepEqual(selected(plan.changedFiles), ["source-registry-review"]);
  assert.equal(plan.ownerActions.length, 1);
});

test("moderation changes select build and security coverage", () => {
  const gates = selected(["app/moderation/page.tsx"]);
  assert.deepEqual(gates, ["build", "moderation-auth"]);
  assert.equal(classifyChanges(["app/moderation/page.tsx"]).productionEvidence.required, true);
});

test("saved-account changes select build and auth security coverage", () => {
  const plan = classifyChanges(["app/saved/page.tsx"]);
  assert.deepEqual(selected(plan.changedFiles), ["build", "moderation-auth", "deadline-alerts"]);
  assert.equal(plan.productionEvidence.required, true);
});

test("alert runner selects focused coverage without discovery regression", () => {
  const plan = classifyChanges(["scripts/alerts/runner.ts"]);
  assert.deepEqual(selected(plan.changedFiles), ["deadline-alerts"]);
  assert.equal(plan.classifications.discovery.length, 0);
  assert.equal(plan.productionEvidence.required, true);
});

test("alert workflow selects focused coverage and workflow review", () => {
  assert.deepEqual(selected([".github/workflows/deadline-alerts.yml"]), ["deadline-alerts", "workflow-review"]);
});

test("assistant changes select build and kill-switch coverage", () => {
  assert.deepEqual(selected(["app/api/assistant/ask/route.ts"]), ["build", "assistant-kill-switch"]);
});

test("workflow changes select workflow review", () => {
  assert.deepEqual(selected([".github/workflows/verification.yml"]), ["workflow-review"]);
});

test("discovery workflow changes require exact-head production evidence", () => {
  const plan = classifyChanges([".github/workflows/discovery.yml"]);
  assert.equal(plan.productionEvidence.required, true);
  assert.deepEqual(selected(plan.changedFiles), ["discovery-health", "workflow-review"]);
});

test("health model changes select discovery and focused health regressions", () => {
  assert.deepEqual(selected(["scripts/discovery/health.ts"]), ["discovery-regression", "discovery-health"]);
});

test("dependency changes require build and integrated production evidence", () => {
  const plan = classifyChanges(["package-lock.json"]);
  assert.deepEqual(selected(plan.changedFiles), ["build"]);
  assert.equal(plan.productionEvidence.required, true);
  assert.equal(plan.productionEvidence.reasons.some((reason) => reason.startsWith("Discovery")), false);
});

test("ordinary docs changes do not invent production work", () => {
  const plan = classifyChanges(["docs/architecture.md"]);
  assert.equal(plan.changeTriggeredGates.every((gate) => !gate.selected), true);
  assert.equal(plan.productionEvidence.required, false);
  assert.equal(plan.ownerActions.length, 0);
});

test("classification is normalized, unique, and deterministic", () => {
  assert.deepEqual(classifyChanges(["app\\page.tsx", "app/page.tsx"]).changedFiles, ["app/page.tsx"]);
});

console.log(`\n${passed} verification contract tests passed.`);
