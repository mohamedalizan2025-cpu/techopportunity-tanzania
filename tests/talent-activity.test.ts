/** Unified talent activity: interested / applying / applied (+ saved untouched). */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { mapTalentActivityRows } from "../lib/data/talent-activities";
import {
  ACTIVITY_STATUSES,
  UNIFIED_ACTIVITY_LABELS,
  UNIFIED_ACTIVITY_STATES,
  canTrackOpportunity,
  formatActivityDate,
  hasAnyActivity,
  isActivityOpportunityId,
  isUnifiedActivityState,
  mergeUnifiedActivity,
  ownsActivityRecord,
  parseActivityMutation,
  parseActivityStatus,
} from "../lib/talent-activity-state";

let passed = 0;
function test(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
}

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const OPPORTUNITY_ID = "33333333-3333-4333-8333-333333333333";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

// --- Pure state ------------------------------------------------------------

test("exactly three funnel states, no saved duplicate", () => {
  assert.deepEqual([...ACTIVITY_STATUSES], ["interested", "applying", "applied"]);
});

test("unknown status is rejected", () => {
  assert.equal(parseActivityStatus("saved"), null);
  assert.equal(parseActivityStatus("interested "), null);
  assert.equal(parseActivityStatus("APPLIED"), null);
  assert.equal(parseActivityStatus(null), null);
  assert.equal(parseActivityStatus(""), null);
});

test("each funnel state parses", () => {
  assert.equal(parseActivityStatus("interested"), "interested");
  assert.equal(parseActivityStatus("applying"), "applying");
  assert.equal(parseActivityStatus("applied"), "applied");
});

test("mutation parses a status intent without a user id", () => {
  const mutation = parseActivityMutation(
    form({ opportunityId: OPPORTUNITY_ID, intent: "applying" })
  );
  assert.deepEqual(mutation, { opportunityId: OPPORTUNITY_ID, intent: "applying" });
});

test("mutation parses remove without a user id", () => {
  const mutation = parseActivityMutation(
    form({ opportunityId: OPPORTUNITY_ID, intent: "remove" })
  );
  assert.deepEqual(mutation, { opportunityId: OPPORTUNITY_ID, intent: "remove" });
});

test("mutation rejects hostile intents", () => {
  assert.equal(
    parseActivityMutation(form({ opportunityId: OPPORTUNITY_ID, intent: "saved" })),
    null
  );
  assert.equal(
    parseActivityMutation(form({ opportunityId: OPPORTUNITY_ID, intent: "delete" })),
    null
  );
  assert.equal(
    parseActivityMutation(form({ opportunityId: "not-a-uuid", intent: "applied" })),
    null
  );
  assert.equal(
    parseActivityMutation(form({ opportunityId: OPPORTUNITY_ID, intent: "" })),
    null
  );
});

test("client-supplied user id is ignored by the parser", () => {
  const mutation = parseActivityMutation(
    form({ opportunityId: OPPORTUNITY_ID, intent: "interested", user_id: USER_B })
  );
  assert.deepEqual(mutation, { opportunityId: OPPORTUNITY_ID, intent: "interested" });
});

test("only published opportunities can be tracked", () => {
  assert.equal(canTrackOpportunity("published"), true);
  assert.equal(canTrackOpportunity("pending"), false);
  assert.equal(canTrackOpportunity("rejected"), false);
  assert.equal(canTrackOpportunity("expired"), false);
  assert.equal(canTrackOpportunity(null), false);
});

test("ownership is exact", () => {
  assert.equal(ownsActivityRecord(USER_A, USER_A), true);
  assert.equal(ownsActivityRecord(USER_A, USER_B), false);
  assert.equal(ownsActivityRecord(null, USER_A), false);
});

test("activity date is presented, invalid stays unknown", () => {
  assert.match(String(formatActivityDate("2026-09-01T00:00:00Z")), /Updated /);
  assert.equal(formatActivityDate("not-a-date"), null);
});

test("opportunity id accepts only UUIDs", () => {
  assert.equal(isActivityOpportunityId(OPPORTUNITY_ID), true);
  assert.equal(isActivityOpportunityId("abc"), false);
  assert.equal(isActivityOpportunityId(null), false);
});

// --- Mapper ----------------------------------------------------------------

function publishedRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    opportunity_id: OPPORTUNITY_ID,
    status: "applying",
    updated_at: "2026-09-01T00:00:00Z",
    opportunity: {
      id: OPPORTUNITY_ID,
      slug: "example-opportunity",
      title: "Example AI Fellowship",
      description:
        "A detailed description of the example AI fellowship that is long enough to be meaningful for mapping purposes.",
      category: "fellowship",
      organization: "Example Org",
      url: "https://example.org/opportunity",
      venue_name: null,
      address: null,
      city: "Dar es Salaam",
      region: "Dar es Salaam",
      country: "Tanzania",
      latitude: null,
      longitude: null,
      deadline: null,
      deadline_precision: "unknown",
      deadline_timezone: null,
      deadline_evidence: null,
      relevance_decision: "relevant",
      relevance_evidence: "Official page describes an AI fellowship.",
      eligibility: "tanzanians_eligible",
      eligibility_evidence: "Official page opens the call to Tanzanian applicants.",
      qualification_rule_version: "m31-2026-09-04-v1",
      country_verification: "verified_tanzania",
      country_evidence: "Official programme location: Tanzania.",
      last_verified_at: "2026-09-01T00:00:00Z",
      decided_by: USER_A,
      decided_at: "2026-09-01T00:00:00Z",
      canonical_evidence_url: "https://example.org/opportunity",
      source_id: null,
      source_name: "Example Source",
      discovered_at: "2026-09-01T00:00:00Z",
      discovery_method: "test",
      submitted_by: null,
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-09-01T00:00:00Z",
      status: "published",
      ...overrides,
    },
  } as unknown as Parameters<typeof mapTalentActivityRows>[0][number];
}

test("mapper keeps a published tracked row", () => {
  const entries = mapTalentActivityRows([publishedRow()]);
  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.activityStatus, "applying");
  assert.equal(entries[0]?.opportunityId, OPPORTUNITY_ID);
});

test("mapper drops hostile statuses", () => {
  const hostile = {
    ...publishedRow(),
    status: "saved",
  } as unknown as Parameters<typeof mapTalentActivityRows>[0][number];
  const entries = mapTalentActivityRows([hostile]);
  assert.equal(entries.length, 0);
});

test("mapper suppresses non-published content", () => {
  const pending = mapTalentActivityRows([
    {
      ...publishedRow(),
      opportunity: {
        ...(publishedRow().opportunity as unknown as Record<string, unknown>),
        status: "pending",
      },
    } as unknown as Parameters<typeof mapTalentActivityRows>[0][number],
  ]);
  assert.equal(pending.length, 1);
  assert.equal(pending[0]?.opportunity, null);
});

// --- Migration contract -----------------------------------------------------

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/0019_talent_activity.sql"),
  "utf8"
);

test("migration is explicitly owner-gated staging-first", () => {
  assert.match(migration, /DESIGNED - NOT APPLIED\. OWNER GATE/);
  assert.match(migration, /staging first, then production/);
});

test("migration creates only the funnel table with three states", () => {
  assert.match(migration, /create table public\.talent_opportunity_activity/);
  assert.match(migration, /check \(status in \('interested', 'applying', 'applied'\)\)/);
  assert.match(migration, /unique \(user_id, opportunity_id\)/);
  assert.doesNotMatch(migration, /'saved'/);
});

test("migration references authenticated users and canonical opportunities", () => {
  assert.match(migration, /references auth\.users \(id\) on delete cascade/);
  assert.match(migration, /references public\.opportunities \(id\) on delete cascade/);
});

test("migration enables owner-only RLS with a published guard", () => {
  assert.match(
    migration,
    /alter table public\.talent_opportunity_activity enable row level security/
  );
  assert.equal((migration.match(/\(select auth\.uid\(\)\) = user_id/g) ?? []).length, 5);
  assert.match(migration, /opportunity\.status = 'published'/);
  assert.doesNotMatch(migration, /is_staff\(\)/);
});

test("migration revokes anonymous access and grants least privilege", () => {
  assert.match(
    migration,
    /revoke all on table public\.talent_opportunity_activity from anon/
  );
  assert.match(
    migration,
    /grant select, insert, update, delete on table public\.talent_opportunity_activity to authenticated/
  );
  assert.doesNotMatch(migration, /grant .* to anon/);
});

test("migration never touches saved, profiles, or opportunity history", () => {
  assert.doesNotMatch(migration, /create table public\.saved_opportunities/i);
  assert.doesNotMatch(migration, /alter table public\.saved_opportunities/i);
  assert.doesNotMatch(migration, /create table public\.talent_profiles/i);
  assert.doesNotMatch(migration, /alter table public\.talent_profiles/i);
  assert.doesNotMatch(migration, /delete\s+from\s+public\.opportunities/i);
  assert.doesNotMatch(migration, /update\s+public\.opportunities/i);
});

// --- Action + data contracts --------------------------------------------------

const actionSource = readFileSync(
  join(process.cwd(), "lib/data/talent-activity-actions.ts"),
  "utf8"
);
const dataSource = readFileSync(
  join(process.cwd(), "lib/data/talent-activities.ts"),
  "utf8"
);

test("activity action derives identity from claims, never client input", () => {
  assert.match(actionSource, /getAuthenticatedUser\(\)/);
  assert.match(actionSource, /user_id: user\.userId/);
  assert.doesNotMatch(actionSource, /formData\.get\(["']user_?id["']\)/i);
});

test("activity action guards on published status and degrades without schema", () => {
  assert.match(actionSource, /\.eq\(["']status["'], ["']published["']\)/);
  assert.match(actionSource, /missingActivitySchema\(/);
  assert.match(actionSource, /Your saved list is unaffected/);
});

test("activity action upserts one funnel row per user+opportunity", () => {
  assert.match(actionSource, /from\("talent_opportunity_activity"\)\.upsert/);
  assert.match(actionSource, /onConflict: "user_id,opportunity_id"/);
  assert.match(actionSource, /\.delete\(\)/);
  assert.match(actionSource, /\.eq\(["']user_id["'], user\.userId\)/);
});

test("activity reads are owner-scoped and published-only", () => {
  assert.match(dataSource, /\.eq\(["']user_id["'], user\.userId\)/);
  assert.match(dataSource, /\.eq\(["']opportunity\.status["'], ["']published["']\)/);
  assert.match(dataSource, /related\?\.status === ["']published["']/);
  assert.match(dataSource, /missingActivitySchema/);
});

// --- Page + control contracts ---------------------------------------------------

const activityPage = readFileSync(
  join(process.cwd(), "app/activity/page.tsx"),
  "utf8"
);
const activityControl = readFileSync(
  join(process.cwd(), "components/activity-control.tsx"),
  "utf8"
);

test("activity page is auth-gated, private, and cross-linked", () => {
  assert.match(activityPage, /if \(!user\) redirect\(["']\/login\?next=%2Factivity["']\)/);
  assert.match(activityPage, /robots: \{ index: false, follow: false \}/);
  assert.match(activityPage, /Only you can see this list/);
  assert.match(activityPage, /href="\/saved"/);
  assert.match(activityPage, /href="\/for-you"/);
});

test("activity page degrades honestly without schema", () => {
  assert.match(activityPage, /temporarily unavailable/);
  assert.match(activityPage, /Your saved list\n?\s*is unaffected/);
});

test("activity control never carries a user id", () => {
  assert.match(activityControl, /name="opportunityId"/);
  assert.match(activityControl, /name="intent"/);
  assert.doesNotMatch(activityControl, /user_?id/i);
  assert.match(activityControl, /value="remove"/);
});

// --- ONE canonical contract: Saved / Interested / Applying / Applied --------

test("unified contract covers exactly the four product states", () => {
  assert.deepEqual([...UNIFIED_ACTIVITY_STATES], [
    "saved",
    "interested",
    "applying",
    "applied",
  ]);
  assert.equal(UNIFIED_ACTIVITY_LABELS.saved, "Saved");
  assert.equal(UNIFIED_ACTIVITY_LABELS.applied, "Applied");
});

test("unified state guard accepts only the four states", () => {
  assert.equal(isUnifiedActivityState("saved"), true);
  assert.equal(isUnifiedActivityState("applied"), true);
  assert.equal(isUnifiedActivityState("archived"), false);
  assert.equal(isUnifiedActivityState(""), false);
  assert.equal(isUnifiedActivityState(null), false);
});

test("merge keeps bookmark and progress independent", () => {
  assert.deepEqual(mergeUnifiedActivity(OPPORTUNITY_ID, true, "applying"), {
    opportunityId: OPPORTUNITY_ID,
    saved: true,
    funnel: "applying",
  });
  assert.deepEqual(mergeUnifiedActivity(OPPORTUNITY_ID, false, null), {
    opportunityId: OPPORTUNITY_ID,
    saved: false,
    funnel: null,
  });
});

test("any-activity is true for a bookmark or a funnel state", () => {
  assert.equal(
    hasAnyActivity({ opportunityId: OPPORTUNITY_ID, saved: true, funnel: null }),
    true
  );
  assert.equal(
    hasAnyActivity({ opportunityId: OPPORTUNITY_ID, saved: false, funnel: "interested" }),
    true
  );
  assert.equal(
    hasAnyActivity({ opportunityId: OPPORTUNITY_ID, saved: false, funnel: null }),
    false
  );
});

test("detail and activity pages read through the unified contract", () => {
  const detailPage = readFileSync(
    join(process.cwd(), "app/opportunities/[slug]/page.tsx"),
    "utf8"
  );
  assert.match(detailPage, /getUnifiedActivity\(user\)/);
  assert.doesNotMatch(detailPage, /listSavedOpportunityIds/);
  assert.match(activityPage, /mergeUnifiedActivity\(/);
});

console.log(`\n${passed} talent-activity tests passed.`);
