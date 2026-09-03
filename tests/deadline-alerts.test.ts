/** Focused M30 deadline semantics, transition, alert, ownership, and scheduler tests. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ownsAlertRecord, parseAlertPreferenceIntent } from "../lib/alert-preference-state";
import {
  evaluateAlertEligibility,
  planDeadlineAlerts,
  type AlertableSavedOpportunity,
  type DeadlineChangeRecord,
} from "../lib/deadline-alerts";
import {
  CLOSING_SOON_DAYS,
  classifyDeadlineTransition,
  evaluateDeadline,
} from "../lib/deadline-intelligence";

let passed = 0;
function test(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
}

const NOW = new Date("2026-09-03T00:00:00.000Z");
const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const OPPORTUNITY = "33333333-3333-4333-8333-333333333333";

test("closing-soon policy is centralized at fourteen days", () => {
  assert.equal(CLOSING_SOON_DAYS, 14);
});
test("null deadline is unknown", () => {
  assert.equal(evaluateDeadline({ deadline: null }, NOW).status, "unknown");
});
test("valid future deadline is upcoming", () => {
  assert.equal(evaluateDeadline({ deadline: "2026-10-03T00:00:00Z" }, NOW).status, "upcoming");
});
test("deadline inside threshold is closing soon", () => {
  assert.equal(evaluateDeadline({ deadline: "2026-09-10T00:00:00Z" }, NOW).status, "closing_soon");
});
test("threshold boundary is closing soon", () => {
  assert.equal(evaluateDeadline({ deadline: "2026-09-17T00:00:00Z" }, NOW).status, "closing_soon");
});
test("past deadline is closed", () => {
  assert.equal(evaluateDeadline({ deadline: "2026-09-02T23:59:59Z" }, NOW).status, "closed");
});
test("malformed deadline is invalid", () => {
  assert.equal(evaluateDeadline({ deadline: "not-a-date" }, NOW).status, "invalid");
});
test("valid date-only deadline closes after its calendar date", () => {
  const result = evaluateDeadline({ deadline: "2026-09-03", precision: "date" }, NOW);
  assert.equal(result.status, "closing_soon");
  assert.equal(result.effectiveAt, "2026-09-04T00:00:00.000Z");
});
test("impossible date-only deadline is invalid", () => {
  assert.equal(evaluateDeadline({ deadline: "2026-02-30", precision: "date" }, NOW).status, "invalid");
});
test("timezone-aware deadline preserves its instant", () => {
  const result = evaluateDeadline({
    deadline: "2026-09-10T12:00:00+03:00",
    precision: "date_time",
    timezone: "Africa/Dar_es_Salaam",
  }, NOW);
  assert.equal(result.effectiveAt, "2026-09-10T09:00:00.000Z");
});
test("date-time without timezone is invalid", () => {
  assert.equal(evaluateDeadline({
    deadline: "2026-09-10T12:00:00",
    precision: "date_time",
  }, NOW).status, "invalid");
});
test("explicit rolling evidence is rolling", () => {
  assert.equal(evaluateDeadline({ deadline: null, precision: "rolling" }, NOW).status, "rolling");
});
test("rolling precision with a fabricated date is invalid", () => {
  assert.equal(evaluateDeadline({ deadline: "2026-09-10", precision: "rolling" }, NOW).status, "invalid");
});

const UNKNOWN = { deadline: null, precision: "unknown" as const };
const APRIL_20 = { deadline: "2027-04-20T00:00:00Z", precision: "date_time" as const };
const APRIL_25 = { deadline: "2027-04-25T00:00:00Z", precision: "date_time" as const };
const APRIL_18 = { deadline: "2027-04-18T00:00:00Z", precision: "date_time" as const };

test("unknown to known is detected", () => {
  assert.equal(classifyDeadlineTransition(UNKNOWN, APRIL_20), "became_known");
});
test("known later deadline is extended", () => {
  assert.equal(classifyDeadlineTransition(APRIL_20, APRIL_25), "extended");
});
test("known earlier deadline is shortened", () => {
  assert.equal(classifyDeadlineTransition(APRIL_20, APRIL_18), "shortened");
});
test("known to unknown is detected", () => {
  assert.equal(classifyDeadlineTransition(APRIL_20, UNKNOWN), "became_unknown");
});
test("equal deadline evidence is unchanged", () => {
  assert.equal(classifyDeadlineTransition(APRIL_20, APRIL_20), "unchanged");
});
test("same instant with changed timezone evidence is changed", () => {
  assert.equal(classifyDeadlineTransition(
    { ...APRIL_20, timezone: "UTC" },
    { ...APRIL_20, timezone: "Africa/Dar_es_Salaam" }
  ), "changed");
});
test("known to explicit rolling is detected", () => {
  assert.equal(classifyDeadlineTransition(APRIL_20, { deadline: null, precision: "rolling" }), "became_rolling");
});

const ELIGIBLE = {
  authenticated: true,
  saved: true,
  alertsEnabled: true,
  publicationStatus: "published",
  deadline: { deadline: "2026-09-10T00:00:00Z" },
};

test("authenticated enabled saved published closing-soon record is eligible", () => {
  assert.deepEqual(evaluateAlertEligibility(ELIGIBLE, NOW), { eligible: true });
});
test("anonymous user is ineligible", () => {
  assert.equal(evaluateAlertEligibility({ ...ELIGIBLE, authenticated: false }, NOW).eligible, false);
});
test("unsaved opportunity is ineligible", () => {
  assert.equal(evaluateAlertEligibility({ ...ELIGIBLE, saved: false }, NOW).eligible, false);
});
test("disabled alerts are ineligible", () => {
  assert.equal(evaluateAlertEligibility({ ...ELIGIBLE, alertsEnabled: false }, NOW).eligible, false);
});
test("unpublished opportunity is ineligible", () => {
  assert.equal(evaluateAlertEligibility({ ...ELIGIBLE, publicationStatus: "pending" }, NOW).eligible, false);
});
test("closed opportunity is ineligible", () => {
  assert.equal(evaluateAlertEligibility({ ...ELIGIBLE, deadline: { deadline: "2026-09-01T00:00:00Z" } }, NOW).eligible, false);
});
test("unknown deadline is ineligible", () => {
  assert.equal(evaluateAlertEligibility({ ...ELIGIBLE, deadline: { deadline: null } }, NOW).eligible, false);
});
test("invalid deadline is ineligible", () => {
  assert.equal(evaluateAlertEligibility({ ...ELIGIBLE, deadline: { deadline: "bad" } }, NOW).eligible, false);
});
test("future deadline outside policy is not due", () => {
  assert.deepEqual(
    evaluateAlertEligibility({ ...ELIGIBLE, deadline: { deadline: "2026-10-10T00:00:00Z" } }, NOW),
    { eligible: false, reason: "not_due" }
  );
});

const SAVED: AlertableSavedOpportunity = {
  userId: USER_A,
  opportunityId: OPPORTUNITY,
  publicationStatus: "published",
  deadline: "2026-09-10T00:00:00Z",
  deadlinePrecision: "date_time",
  deadlineTimezone: "UTC",
};

test("approaching alert has deterministic fingerprint", () => {
  const [alert] = planDeadlineAlerts([SAVED], [], NOW);
  assert.equal(alert.event_type, "deadline_approaching");
  assert.equal(alert.event_fingerprint, "2026-09-10T00:00:00.000Z");
  assert.equal(alert.state, "generated");
});
test("duplicate saved inputs collapse to one planned event", () => {
  assert.equal(planDeadlineAlerts([SAVED, SAVED], [], NOW).length, 1);
});
test("repeated scheduled planning is deterministic", () => {
  assert.deepEqual(planDeadlineAlerts([SAVED], [], NOW), planDeadlineAlerts([SAVED], [], NOW));
});
test("unpublished saved row plans no alerts", () => {
  assert.equal(planDeadlineAlerts([{ ...SAVED, publicationStatus: "rejected" }], [], NOW).length, 0);
});

const EXTENSION: DeadlineChangeRecord = {
  id: "44444444-4444-4444-8444-444444444444",
  opportunityId: OPPORTUNITY,
  changedAt: "2026-09-02T12:00:00Z",
  previousDeadline: "2026-09-08T00:00:00Z",
  previousPrecision: "date_time",
  previousTimezone: "UTC",
  nextDeadline: SAVED.deadline,
  nextPrecision: SAVED.deadlinePrecision,
  nextTimezone: SAVED.deadlineTimezone,
};

test("matching current extension creates one change event plus approaching event", () => {
  const alerts = planDeadlineAlerts([SAVED], [EXTENSION], NOW);
  assert.deepEqual(alerts.map((row) => row.event_type), ["deadline_approaching", "deadline_extended"]);
});
test("change event fingerprint is the immutable change id", () => {
  const alert = planDeadlineAlerts([SAVED], [EXTENSION], NOW).find((row) => row.deadline_change_id);
  assert.equal(alert?.event_fingerprint, EXTENSION.id);
});
test("stale prior deadline change cannot create an alert", () => {
  const stale = { ...EXTENSION, id: "55555555-5555-4555-8555-555555555555", changedAt: "2026-09-02T13:00:00Z", nextDeadline: "2026-09-09T00:00:00Z" };
  assert.equal(planDeadlineAlerts([SAVED], [stale], NOW).filter((row) => row.deadline_change_id).length, 0);
});
test("newest change is selected regardless of query order", () => {
  const older = { ...EXTENSION, id: "55555555-5555-4555-8555-555555555555", changedAt: "2026-09-01T12:00:00Z", nextDeadline: "2026-09-09T00:00:00Z" };
  const changeAlerts = planDeadlineAlerts([SAVED], [older, EXTENSION], NOW).filter((row) => row.deadline_change_id);
  assert.equal(changeAlerts[0]?.deadline_change_id, EXTENSION.id);
});
test("unchanged deadline creates no change event", () => {
  const unchanged = { ...EXTENSION, previousDeadline: EXTENSION.nextDeadline };
  assert.equal(planDeadlineAlerts([SAVED], [unchanged], NOW).filter((row) => row.deadline_change_id).length, 0);
});

test("enable intent parses true", () => assert.equal(parseAlertPreferenceIntent("enable"), true));
test("disable intent parses false", () => assert.equal(parseAlertPreferenceIntent("disable"), false));
test("unknown preference intent is rejected", () => assert.equal(parseAlertPreferenceIntent("yes"), null));
test("user owns only their alert records", () => {
  assert.equal(ownsAlertRecord(USER_A, USER_A), true);
  assert.equal(ownsAlertRecord(USER_A, USER_B), false);
  assert.equal(ownsAlertRecord(null, USER_A), false);
});

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), "utf8");
const migration = read("supabase/migrations/0012_deadline_alerts.sql");
const action = read("lib/data/deadline-alert-actions.ts");
const data = read("lib/data/deadline-alerts.ts");
const workflow = read(".github/workflows/deadline-alerts.yml");
const runner = read("scripts/alerts/runner.ts");
const index = read("scripts/alerts/index.ts");

test("migration separates truth preference and event tables", () => {
  assert.match(migration, /opportunity_deadline_changes/);
  assert.match(migration, /user_alert_preferences/);
  assert.match(migration, /deadline_alert_events/);
});
test("database uniqueness is concurrency-safe", () => {
  assert.match(migration, /unique \(user_id, opportunity_id, event_type, event_fingerprint\)/);
  assert.match(runner, /ignoreDuplicates: true/);
});
test("deadline history trigger ignores unrelated updates", () => {
  assert.match(migration, /after update of deadline, deadline_precision, deadline_timezone, deadline_evidence/);
  assert.match(migration, /is not distinct from/);
});
test("alert preference RLS binds all writes to auth uid", () => {
  assert.match(migration, /users create own alert preference[\s\S]*auth\.uid\(\)[\s\S]*user_id/);
  assert.match(migration, /users update own alert preference[\s\S]*auth\.uid\(\)[\s\S]*user_id/);
});
test("ordinary users cannot insert arbitrary alert events", () => {
  assert.match(migration, /grant select on table public\.deadline_alert_events to authenticated/);
  assert.doesNotMatch(migration, /grant (?:[^;]*,\s*)?insert[^;]*deadline_alert_events/i);
});
test("preference action derives identity from authenticated claims", () => {
  assert.match(action, /getAuthenticatedUser\(\)/);
  assert.match(action, /user_id: user\.userId/);
  assert.doesNotMatch(action, /formData\.get\(["']user_?id["']\)/i);
});
test("private reads filter by authenticated owner and public opportunity", () => {
  assert.match(data, /\.eq\("user_id", user\.userId\)/);
  assert.match(data, /\.eq\("opportunity\.status", "published"\)/);
});
test("workflow has one bounded non-cancelling schedule", () => {
  assert.equal((workflow.match(/\bcron:/g) ?? []).length, 1);
  assert.match(workflow, /cron: '15 2 \* \* \*'/);
  assert.match(workflow, /group: deadline-alerts-production/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /timeout-minutes: 20/);
});
test("worker execution is owner-gated and service-role server-only", () => {
  assert.match(workflow, /vars\.DEADLINE_ALERTS_ENABLED == 'true'/);
  assert.match(index, /DEADLINE_ALERTS_ENABLED !== "true"/);
  assert.match(index, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(read("app/saved/page.tsx"), /SUPABASE_SERVICE_ROLE_KEY/);
});
test("workflow retains machine-readable evidence", () => {
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /alert-health\/report\.json/);
  assert.match(workflow, /retention-days: 30/);
});
test("M30 never claims an alert was delivered", () => {
  assert.match(migration, /check \(state = 'generated'\)/);
  assert.doesNotMatch(migration, /state[^\n]*(?:sent|queued|failed)/i);
  assert.match(runner, /deliveryAttempted: false/);
});

console.log(`\n${passed} M30 deadline-intelligence and alert tests passed.`);
