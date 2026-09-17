/** Internal Provider Campaign Pilot: staff-gated, aggregate-only, privacy-safe. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { estimateAudience, summarizeFunnel } from "../lib/campaign-analytics";
import {
  CAMPAIGN_STATUSES,
  isCampaignId,
  parseCampaignForm,
  parseCampaignStatus,
  sanitizeCampaignGoal,
  sanitizeCampaignName,
} from "../lib/provider-campaign-state";
import { mapProviderCampaignRow } from "../lib/data/provider-campaigns";
import type { Opportunity } from "../lib/types";

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

function opportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: OPPORTUNITY_ID,
    slug: "example-ai-fellowship",
    title: "Example AI Fellowship",
    description: "A machine learning fellowship for data scientists in Tanzania.",
    category: "fellowship",
    organization: "Example Org",
    url: "https://example.org/opportunity",
    location: {
      venueName: null,
      address: null,
      city: "Dar es Salaam",
      region: "Dar es Salaam",
      country: "Tanzania",
      latitude: null,
      longitude: null,
    },
    deadline: null,
    deadlinePrecision: "unknown",
    deadlineEvidence: null,
    sourceName: "Example Source",
    discoveredAt: "2026-09-01T00:00:00Z",
    discoveryMethod: "test",
    createdAt: "2026-09-01T00:00:00Z",
    status: "published",
    trust: {
      relevanceDecision: "relevant",
      relevanceEvidence: "Official page describes an AI fellowship.",
      eligibilityDecision: "tanzanians_eligible",
      eligibilityEvidence: "Official page opens the call to Tanzanian applicants.",
      qualificationRuleVersion: "m31-2026-09-04-v1",
      countryVerification: "verified_tanzania",
      countryEvidence: "Official programme location: Tanzania.",
      lastVerifiedAt: "2026-09-01T00:00:00Z",
      decidedBy: "11111111-1111-4111-8111-111111111111",
      decidedAt: "2026-09-01T00:00:00Z",
      canonicalEvidenceUrl: "https://example.org/opportunity",
    },
    ...overrides,
  } as Opportunity;
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

// --- Aggregate analytics (public corpus only) ----------------------------------

test("audience sizing counts matching public inventory", () => {
  const corpus = [opportunity(), opportunity({ category: "grant", title: "Climate grant for farmers growing maize" })];
  const estimate = estimateAudience(corpus, {
    geography: "national",
    sector: null,
    opportunityType: "fellowship",
  });
  assert.equal(estimate.corpusSize, 2);
  assert.equal(estimate.matched, 1);
  assert.equal(estimate.matchedNational, 1);
  assert.equal(estimate.matchedInternational, 0);
});

test("empty targeting matches the whole corpus", () => {
  const estimate = estimateAudience([opportunity()], {
    geography: null,
    sector: null,
    opportunityType: null,
  });
  assert.equal(estimate.matched, 1);
});

test("empty corpus yields honest zeros", () => {
  const estimate = estimateAudience([], {
    geography: "national",
    sector: "ai-data",
    opportunityType: null,
  });
  assert.deepEqual(estimate, {
    corpusSize: 0,
    matched: 0,
    matchedNational: 0,
    matchedInternational: 0,
  });
});

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

test("analytics module never touches private talent data", () => {
  const source = readFileSync(
    join(process.cwd(), "lib/campaign-analytics.ts"),
    "utf8"
  );
  for (const forbidden of [
    "talent_profiles",
    "saved_opportunities",
    "talent_opportunity_activity",
    "user_alert_preferences",
    "deadline_alert_events",
    "supabase",
    "auth.uid",
  ]) {
    assert.doesNotMatch(source, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
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

test("campaign migration never references private talent tables", () => {
  // Strip SQL comments: the header names the forbidden tables to declare the
  // negative, but no DDL statement may touch them.
  const ddl = migration
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
  assert.match(campaignDetail, /never[\s\S]*?from talent profiles or private activity/);
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
