/** Internal Provider Campaign Pilot: staff-gated, REAL aggregates, privacy-safe. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { summarizeFunnel } from "../lib/campaign-analytics";
import {
  CAMPAIGN_STATUSES,
  isCampaignId,
  parseCampaignForm,
  parseCampaignStatus,
  sanitizeCampaignGoal,
  sanitizeCampaignName,
} from "../lib/provider-campaign-state";
import { mapProviderCampaignRow } from "../lib/data/provider-campaigns";

let passed = 0;
function test(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
}

const OPPORTUNITY_ID = "33333333-3333-4333-8333-333333333333";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

// --- Pure domain ------------------------------------------------------------

test("exactly four pipeline stages", () => {
  assert.deepEqual([...CAMPAIGN_STATUSES], ["draft", "active", "paused", "completed"]);
});

test("unknown campaign status is rejected", () => {
  assert.equal(parseCampaignStatus("archived"), null);
  assert.equal(parseCampaignStatus("ACTIVE"), null);
  assert.equal(parseCampaignStatus(""), null);
  assert.equal(parseCampaignStatus(null), null);
});

test("campaign name is bounded, blank rejected", () => {
  assert.equal(sanitizeCampaignName("AB"), null);
  assert.equal(sanitizeCampaignName("  "), null);
  assert.equal(sanitizeCampaignName("National AI push"), "National AI push");
  assert.equal(sanitizeCampaignGoal(""), null);
});

test("campaign form parses with targeting", () => {
  const parsed = parseCampaignForm(
    form({
      name: "National AI push",
      opportunityId: OPPORTUNITY_ID,
      geography: "national",
      sector: "ai-data",
      opportunityType: "fellowship",
      goal: "Learn what resonates.",
    })
  );
  assert.deepEqual(parsed, {
    name: "National AI push",
    opportunityId: OPPORTUNITY_ID,
    geography: "national",
    sector: "ai-data",
    opportunityType: "fellowship",
    goalText: "Learn what resonates.",
  });
});

test("campaign form rejects hostile geography and bad ids", () => {
  assert.equal(
    parseCampaignForm(
      form({ name: "Valid name", opportunityId: OPPORTUNITY_ID, geography: "Kenya" })
    ),
    null
  );
  assert.equal(
    parseCampaignForm(
      form({ name: "Valid name", opportunityId: "not-a-uuid" })
    ),
    null
  );
  assert.equal(
    parseCampaignForm(form({ name: "x", opportunityId: OPPORTUNITY_ID })),
    null
  );
});

test("campaign form never reads a client actor", () => {
  const parsed = parseCampaignForm(
    form({
      name: "Valid name",
      opportunityId: OPPORTUNITY_ID,
      geography: "",
      sector: "",
      opportunityType: "",
      goal: "",
    })
  );
  assert.ok(parsed && !("created_by" in parsed) && !("createdBy" in parsed));
});

test("campaign id accepts only UUIDs", () => {
  assert.equal(isCampaignId(OPPORTUNITY_ID), true);
  assert.equal(isCampaignId("abc"), false);
});

// --- Row mapping --------------------------------------------------------------

test("mapper keeps a valid campaign row", () => {
  const campaign = mapProviderCampaignRow({
    id: OPPORTUNITY_ID,
    name: "National AI push",
    opportunity_id: OPPORTUNITY_ID,
    status: "active",
    geography: "national",
    sector: "ai-data",
    opportunity_type: "fellowship",
    goal_text: null,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  });
  assert.equal(campaign?.status, "active");
  assert.equal(campaign?.opportunityId, OPPORTUNITY_ID);
});

test("mapper drops hostile statuses", () => {
  const campaign = mapProviderCampaignRow({
    id: OPPORTUNITY_ID,
    name: "Bad row",
    opportunity_id: OPPORTUNITY_ID,
    status: "archived",
    geography: null,
    sector: null,
    opportunity_type: null,
    goal_text: null,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  });
  assert.equal(campaign, null);
});

// --- Aggregate helpers (pipeline counts only) ----------------------------------

test("funnel summary counts pipeline stages only", () => {
  assert.deepEqual(
    summarizeFunnel([
      { status: "draft" },
      { status: "active" },
      { status: "active" },
      { status: "completed" },
      { status: "archived" },
    ]),
    { total: 5, draft: 1, active: 2, paused: 0, completed: 1 }
  );
});

test("analytics module contains no audience estimator and no private reads", () => {
  const source = readFileSync(
    join(process.cwd(), "lib/campaign-analytics.ts"),
    "utf8"
  );
  // Engagement + audience are REAL database aggregates (migration 0020
  // RPCs); counting opportunities here and calling the result "audience"
  // would be fabrication, so no estimator may exist.
  assert.doesNotMatch(source, /estimateAudience/);
  assert.doesNotMatch(source, /AudienceEstimate/);
  for (const forbidden of [
    "talent_profiles",
    "saved_opportunities",
    "talent_opportunity_activity",
    "user_alert_preferences",
    "deadline_alert_events",
    "supabase",
    ".rpc(",
    ".from(",
  ]) {
    assert.doesNotMatch(source, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("engagement reader calls only the staff RPCs and floors counts", () => {
  const source = readFileSync(
    join(process.cwd(), "lib/data/campaign-engagement.ts"),
    "utf8"
  );
  assert.match(source, /\.rpc\("get_campaign_engagement"/);
  assert.match(source, /\.rpc\("get_campaign_audience"/);
  // Individual private rows never load into the UI: no direct table reads.
  assert.doesNotMatch(source, /\.from\("saved_opportunities"\)/);
  assert.doesNotMatch(source, /\.from\("talent_opportunity_activity"\)/);
  assert.doesNotMatch(source, /\.from\("talent_profiles"\)/);
  // Honest unavailable state while migration 0020 is not applied.
  assert.match(source, /PGRST202/);
  assert.match(source, /42883/);
  assert.doesNotMatch(source, /user_id|email|display_name/i);
});

// --- Migration contract ---------------------------------------------------------

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/0020_provider_campaign_pilot.sql"),
  "utf8"
);

test("campaign migration is explicitly owner-gated staging-first", () => {
  assert.match(migration, /DESIGNED - NOT APPLIED\. OWNER GATE/);
  assert.match(migration, /staging first, then production/);
});

test("campaign migration creates only the pilot table", () => {
  assert.match(migration, /create table public\.provider_campaigns/);
  assert.match(migration, /check \(status in \('draft', 'active', 'paused', 'completed'\)\)/);
  assert.match(migration, /references public\.opportunities \(id\) on delete restrict/);
});

test("campaign migration is staff-only with a published guard", () => {
  assert.match(migration, /alter table public\.provider_campaigns enable row level security/);
  assert.ok((migration.match(/public\.is_staff\(\)/g) ?? []).length >= 5);
  assert.match(migration, /opportunity\.status = 'published'/);
  assert.match(migration, /revoke all on table public\.provider_campaigns from anon/);
  assert.match(
    migration,
    /grant select, insert, update, delete on table public\.provider_campaigns to authenticated/
  );
});

test("campaign table DDL never references private talent tables", () => {
  // Only the table + policy section: the aggregate RPCs below legitimately
  // COUNT private rows (never returning them), so scope this negative to
  // the DDL above the first function definition. Header comments are
  // excluded the same way.
  const ddl = migration
    .slice(0, migration.indexOf("create or replace function"))
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");
  for (const forbidden of [
    "talent_profiles",
    "saved_opportunities",
    "talent_opportunity_activity",
    "user_alert_preferences",
    "deadline_alert_events",
  ]) {
    assert.doesNotMatch(ddl, new RegExp(forbidden));
  }
  assert.doesNotMatch(ddl, /is_staff\(\)[\s\S]*talent/);
});

test("engagement RPC is staff-gated and returns counts only", () => {
  assert.match(migration, /create or replace function public\.get_campaign_engagement\(p_campaign_id uuid\)/);
  assert.match(migration, /security definer/);
  assert.match(
    migration,
    /get_campaign_engagement[\s\S]{0,800}?raise insufficient_privilege using/
  );
  // Four integer outputs — saved + three funnel states — never identities.
  assert.match(
    migration,
    /returns table \(\s*saved bigint,\s*interested bigint,\s*applying bigint,\s*applied bigint\s*\)/
  );
  assert.doesNotMatch(migration, /returns table \([^)]*user_id[^)]*\)/);
  // REAL rows: saved_opportunities + talent_opportunity_activity, counted
  // only while the opportunity is currently published (talent-UI parity).
  assert.match(migration, /from public\.saved_opportunities/);
  assert.match(migration, /from public\.talent_opportunity_activity/);
  assert.ok(
    (migration.match(/activity\.status = '(interested|applying|applied)'/g) ?? []).length === 3
  );
  // Least-privilege execution: no anon/service-role, authenticated only.
  assert.match(
    migration,
    /revoke all on function public\.get_campaign_engagement\(uuid\)\s+from public, anon, service_role/
  );
  assert.match(
    migration,
    /grant execute on function public\.get_campaign_engagement\(uuid\)\s+to authenticated/
  );
});

test("audience RPC counts real matching profiles as one integer", () => {
  assert.match(migration, /create or replace function public\.get_campaign_audience\(p_campaign_id uuid\)/);
  assert.match(migration, /returns integer/);
  assert.match(
    migration,
    /get_campaign_audience[\s\S]{0,800}?raise insufficient_privilege using/
  );
  assert.match(migration, /from public\.talent_profiles/);
  // Core-complete rule + sector/type overlap; null targeting matches all.
  assert.match(migration, /profile\.career_level is not null/);
  assert.match(migration, /target_sector is null or target_sector = any/);
  assert.match(migration, /target_type is null or target_type = any/);
  assert.match(
    migration,
    /revoke all on function public\.get_campaign_audience\(uuid\)\s+from public, anon, service_role/
  );
  assert.match(
    migration,
    /grant execute on function public\.get_campaign_audience\(uuid\)\s+to authenticated/
  );
});

test("aggregate RPCs expose no identities", () => {
  const rpc = migration.slice(migration.indexOf("create or replace function"));
  assert.doesNotMatch(rpc, /email|display_name|full_name/i);
  assert.doesNotMatch(rpc, /returning .*user_id/i);
});

// --- Action + page contracts ------------------------------------------------------

const actionSource = readFileSync(
  join(process.cwd(), "lib/data/provider-campaign-actions.ts"),
  "utf8"
);
const campaignsPage = readFileSync(
  join(process.cwd(), "app/campaigns/page.tsx"),
  "utf8"
);
const campaignDetail = readFileSync(
  join(process.cwd(), "app/campaigns/[id]/page.tsx"),
  "utf8"
);

test("campaign actions require staff access and derive the creator", () => {
  assert.match(actionSource, /getModerationAccess\(\)/);
  assert.match(actionSource, /created_by: access\.staff\.userId/);
  assert.doesNotMatch(actionSource, /formData\.get\(["'](created_by|user_id)["']\)/i);
  assert.match(actionSource, /\.eq\(["']status["'], ["']published["']\)/);
  assert.match(actionSource, /missingCampaignSchema/);
});

test("campaign pages are staff-gated, private, and aggregate-only", () => {
  for (const page of [campaignsPage, campaignDetail]) {
    assert.match(page, /getModerationAccess\(\)/);
    assert.match(page, /robots: \{ index: false, follow: false \}/);
    assert.match(page, /Access restricted/);
  }
  assert.match(campaignsPage, /talent profile[\s\S]*?is read or shown[\s\S]*?here/);
  assert.match(campaignDetail, /counts only — individual[\s\S]*?rows never leave the database/);
});

test("campaign detail shows real engagement and honest audience states", () => {
  assert.match(campaignDetail, /2 · Relevant audience \(talent\)/);
  assert.match(campaignDetail, /3 · Engagement funnel \(real activity\)/);
  assert.match(campaignDetail, /getCampaignEngagement\(access\.staff\.client/);
  assert.match(campaignDetail, /getCampaignAudience\(access\.staff\.client/);
  // Honest unavailable states while migration 0020 is not applied.
  assert.match(campaignDetail, /Audience estimate unavailable/);
  assert.match(campaignDetail, /Engagement aggregates unavailable/);
  // No opportunity-counting masquerading as talent audience.
  assert.doesNotMatch(campaignDetail, /audience\.corpusSize|audience\.matched\b/);
  assert.doesNotMatch(campaignDetail, /Relevant audience \(public corpus\)/);
  assert.doesNotMatch(campaignDetail, /estimateAudience/);
});

test("campaign UI never carries a user id or private metric", () => {
  const createForm = readFileSync(
    join(process.cwd(), "components/create-campaign-form.tsx"),
    "utf8"
  );
  assert.doesNotMatch(createForm, /user_?id/i);
  assert.doesNotMatch(campaignsPage, /talent_profiles|saved_opportunities|talent_opportunity_activity/);
  assert.doesNotMatch(campaignDetail, /talent_profiles|saved_opportunities|talent_opportunity_activity/);
});

console.log(`\n${passed} provider-campaign tests passed.`);
