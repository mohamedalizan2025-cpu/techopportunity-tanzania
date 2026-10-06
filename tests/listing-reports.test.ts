/**
 * Pre-pilot P0B: structured listing reports are human review input only.
 *
 * Guards: reason/status vocabularies, input bounds, migration RLS shape
 * (owner insert/select, staff triage, no anonymous/provider access), and
 * the no-auto-moderation rule (no report path writes opportunity rows).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  LISTING_REPORT_DETAILS_MAX,
  LISTING_REPORT_DETAILS_MIN,
  LISTING_REPORT_DUPLICATE_WINDOW_MS,
  LISTING_REPORT_RATE_MAX,
  LISTING_REPORT_REASONS,
  LISTING_REPORT_TRIAGE_STATUSES,
  cleanReportDetails,
  cleanResolutionNote,
  isListingReportReason,
  isListingReportTriageStatus,
  parseReportMutation,
} from "../lib/listing-report-state";

function read(relative: string): string {
  return readFileSync(join(process.cwd(), relative), "utf-8");
}

let passed = 0;
function test(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
}

const USER = "11111111-1111-4111-8111-111111111111";
const OPPORTUNITY = "22222222-2222-4222-8222-222222222222";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

test("report reasons are exactly the six bounded values", () => {
  assert.deepEqual([...LISTING_REPORT_REASONS], [
    "incorrect_information",
    "deadline_issue",
    "eligibility_issue",
    "broken_link",
    "suspicious",
    "other",
  ]);
  assert.equal(isListingReportReason("suspicious"), true);
  assert.equal(isListingReportReason("spam"), false);
  assert.equal(isListingReportReason(""), false);
  assert.equal(isListingReportReason(null), false);
});

test("triage statuses exclude new (forward only)", () => {
  assert.deepEqual([...LISTING_REPORT_TRIAGE_STATUSES], [
    "reviewed",
    "resolved",
    "dismissed",
  ]);
  assert.equal(isListingReportTriageStatus("resolved"), true);
  assert.equal(isListingReportTriageStatus("new"), false);
  assert.equal(isListingReportTriageStatus("escalated"), false);
});

test("details are bounded 4..1000 with control characters cleaned", () => {
  assert.equal(LISTING_REPORT_DETAILS_MIN, 4);
  assert.equal(LISTING_REPORT_DETAILS_MAX, 1000);
  assert.equal(cleanReportDetails("abc"), null);
  assert.equal(cleanReportDetails("x".repeat(1001)), null);
  assert.equal(cleanReportDetails("  Deadline passed  "), "Deadline passed");
  assert.equal(cleanReportDetails("a\u0000b  c"), "a b c");
  assert.equal(cleanReportDetails(42), null);
});

test("resolution notes are optional and bounded at 500", () => {
  assert.equal(cleanResolutionNote(null), null);
  assert.equal(cleanResolutionNote(""), null);
  assert.equal(cleanResolutionNote("Checked the source."), "Checked the source.");
  assert.equal(cleanResolutionNote("x".repeat(501)), null);
});

test("report mutation parses valid input and rejects hostile input", () => {
  const valid = parseReportMutation(
    form({ opportunityId: OPPORTUNITY, reason: "broken_link", details: "The apply link 404s." })
  );
  assert.deepEqual(valid, {
    opportunityId: OPPORTUNITY,
    reason: "broken_link",
    details: "The apply link 404s.",
  });
  assert.equal(
    parseReportMutation(form({ opportunityId: "not-a-uuid", reason: "other", details: "Something is wrong here." })),
    null
  );
  assert.equal(
    parseReportMutation(form({ opportunityId: OPPORTUNITY, reason: "invented", details: "Something is wrong here." })),
    null
  );
  assert.equal(
    parseReportMutation(form({ opportunityId: OPPORTUNITY, reason: "other", details: "bad" })),
    null
  );
  const smuggled = parseReportMutation(
    form({ opportunityId: USER, reason: "other", details: "Something is wrong here.", reporter_user_id: "attacker" })
  );
  assert.ok(
    smuggled !== null && !("reporter_user_id" in smuggled),
    "client-supplied reporter identity is ignored (server session is authoritative)"
  );
});

test("duplicate window is 24h and report rate is capped", () => {
  assert.equal(LISTING_REPORT_DUPLICATE_WINDOW_MS, 24 * 60 * 60 * 1000);
  assert.equal(LISTING_REPORT_RATE_MAX, 5);
});

const migration = read("supabase/migrations/0023_listing_reports.sql");

test("migration enables RLS with owner insert/select on published rows", () => {
  assert.match(migration, /enable row level security/);
  assert.match(migration, /for insert\s+to authenticated/);
  assert.match(migration, /\(select auth\.uid\(\)\) = reporter_user_id/);
  assert.match(migration, /opportunity\.status = 'published'/);
  assert.match(migration, /for select\s+to authenticated/);
});

test("migration grants staff triage and denies anonymous/provider access", () => {
  assert.match(migration, /for update\s+to authenticated/);
  assert.match(migration, /\(select public\.is_staff\(\)\)/);
  assert.doesNotMatch(migration, /for (insert|select|update|delete)\s+to anon/);
  assert.match(
    migration,
    /revoke all on table public\.listing_reports\s+from public, anon, authenticated, service_role/
  );
  assert.match(migration, /grant select, insert on table public\.listing_reports to authenticated/);
  assert.match(migration, /grant update on table public\.listing_reports to authenticated/);
  assert.doesNotMatch(migration, /grant delete on table/);
});

test("baseline grant contract covers the new table", () => {
  const baseline = read("supabase/migrations/0021_explicit_data_api_grants.sql");
  assert.match(
    baseline,
    /revoke all on table public\.listing_reports\s+from public, anon, authenticated, service_role/
  );
  assert.match(
    baseline,
    /grant select, insert, update on table public\.listing_reports to authenticated/
  );
});

test("migration constrains reason/status and preserves reports across lifecycle edits", () => {
  assert.match(migration, /'incorrect_information',\s*\n?\s*'deadline_issue'/);
  assert.match(migration, /'new', 'reviewed', 'resolved', 'dismissed'/);
  assert.match(migration, /references public\.opportunities \(id\) on delete cascade/);
  assert.match(migration, /references auth\.users \(id\) on delete cascade/);
  assert.match(migration, /reviewed_by.*references auth\.users \(id\) on delete set null/);
  assert.doesNotMatch(migration, /update public\.opportunities|delete from public\.opportunities/);
});

const actions = read("lib/data/listing-report-actions.ts");

test("submit path requires auth, validates, rate-limits, and checks published status", () => {
  assert.match(actions, /getAuthenticatedUser/);
  assert.match(actions, /redirect\(`\/login\?next=/);
  assert.match(actions, /parseReportMutation/);
  assert.match(actions, /checkOpportunityInsightRateLimit/);
  assert.match(actions, /\.eq\("status", "published"\)/);
});

test("report actions never write opportunity rows (no auto-moderation)", () => {
  assert.doesNotMatch(actions, /\.from\("opportunities"\)\s*\.\s*(update|delete|insert)/);
  assert.match(actions, /\.from\("listing_reports"\)\.insert/);
  assert.match(actions, /\.from\("listing_reports"\)\s*\.\s*update/);
  const opportunityWrites = actions.match(/\.from\("opportunities"\)/g) ?? [];
  assert.equal(opportunityWrites.length, 1, "exactly one opportunities read (published check)");
});

test("staff list and triage stay behind the moderation gate", () => {
  assert.match(actions, /getModerationAccess/);
  assert.match(actions, /reviewed_by: access\.staff\.userId/);
  assert.match(actions, /reviewed_at/);
});

const detail = read("components/opportunity-detail.tsx");
const reportControl = read("components/report-opportunity-control.tsx");

test("detail carries a restrained report action with anonymous fallback", () => {
  assert.match(detail, /ReportOpportunityControl/);
  assert.match(reportControl, /Report a problem/);
  assert.match(reportControl, /Reporting never changes a listing/);
  assert.match(reportControl, /Sign in to report a problem/);
  assert.match(reportControl, /wa\.me\/255624295705/);
  assert.match(reportControl, /Do not include passwords or sensitive personal information/);
  assert.doesNotMatch(reportControl, /\.insert\(/, "component performs no DB writes");
  assert.doesNotMatch(reportControl, /useEffect/, "no automatic invocation");
});

const reportsPage = read("app/reports/page.tsx");

test("staff queue triages without touching listings", () => {
  assert.match(reportsPage, /getModerationAccess/);
  assert.match(reportsPage, /listListingReportsForStaff/);
  assert.match(reportsPage, /never changes the listing/);
  assert.match(reportsPage, /Open in review queue/);
  assert.match(reportsPage, /\/moderation\/\$\{entry\.opportunity\.id\}/);
  assert.doesNotMatch(reportsPage, /unpublish|Unpublish/, "queue never unpublishes directly");
});

console.log(`\n${passed} listing-report contract tests passed.`);
