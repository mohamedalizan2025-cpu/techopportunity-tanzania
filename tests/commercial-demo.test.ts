/** Commercial demo integration: talent journey + staff demo chain. UI links only. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

let passed = 0;
function test(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
}

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

const home = read("app/(home)/page.tsx");
const forYou = read("app/for-you/page.tsx");
const saved = read("app/saved/page.tsx");
const activity = read("app/activity/page.tsx");
const moderation = read("app/moderation/page.tsx");
const campaigns = read("app/campaigns/page.tsx");
const campaignDetail = read("app/campaigns/[id]/page.tsx");
const header = read("components/site-header.tsx");

// --- Talent journey: Explore -> For You -> Activity -----------------------------

test("Explore shows an authenticated-only journey strip", () => {
  assert.match(home, /aria-label="Your journey"/);
  assert.match(home, /href="\/for-you"/);
  assert.match(home, /href="\/activity"/);
  // Authenticated-only: anonymous Explore is byte-for-byte the old experience.
  assert.match(home, /\{user \? \(/);
});

test("Explore corpus is never gated by the journey strip", () => {
  assert.match(home, /getPublicBrowseData\(\{ category, sort, q, city, region, deadline, geography, sector \}\)/);
  assert.doesNotMatch(home, /getPublicBrowseData\(\{[^}]*user/);
  assert.match(home, /const visibleOpportunities = opportunities\.slice\(0, page \* PAGE_SIZE\)/);
});

test("For You continues to Activity and Saved", () => {
  assert.match(forYou, /href="\/activity"/);
  assert.match(forYou, /Track progress in your activity/);
  assert.match(forYou, /href="\/saved"/);
  // For You still links back to Explore and never hides it.
  assert.match(forYou, /href="\/\#opportunities"/);
});

test("Saved continues to Activity and For You", () => {
  assert.match(saved, /href="\/activity"/);
  assert.match(saved, /Track progress in your activity/);
  assert.match(saved, /href="\/for-you"/);
  assert.match(saved, /Personalized For You/);
});

test("Activity links the full journey", () => {
  assert.match(activity, /href="\/#opportunities"/);
  assert.match(activity, /href="\/for-you"/);
  assert.match(activity, /href="\/saved"/);
});

test("journey links expose no private counts on Explore", () => {
  const strip = home.slice(home.indexOf('aria-label="Your journey"'), home.indexOf('id="opportunities"'));
  assert.doesNotMatch(strip, /entries\.length|trackedTotal|savedIds\.size/);
});

// --- Staff demo: Verified Opportunity -> Relevant Audience -> Engagement Funnel ---

test("moderation links the staff campaign pilot", () => {
  assert.match(moderation, /href="\/campaigns"/);
  assert.match(moderation, /Campaign pilot/);
});

test("campaign index shows the aggregate engagement funnel", () => {
  assert.match(campaigns, /Engagement funnel \(aggregate\)/);
  assert.match(campaigns, /summarizeFunnel\(campaigns\.campaigns\)/);
});

test("campaign detail walks Verified Opportunity to real aggregates", () => {
  assert.match(campaignDetail, /1 · Verified opportunity/);
  assert.match(campaignDetail, /2 · Relevant audience \(talent\)/);
  assert.match(campaignDetail, /3 · Engagement funnel \(real activity\)/);
  assert.match(campaignDetail, /getCampaignEngagement\(access\.staff\.client/);
  assert.match(campaignDetail, /getCampaignAudience\(access\.staff\.client/);
  // Opportunity counts must never masquerade as talent audience.
  assert.doesNotMatch(campaignDetail, /Relevant audience \(public corpus\)/);
  assert.doesNotMatch(campaignDetail, /estimateAudience/);
});

test("staff navigation exposes the pilot behind the staff guard", () => {
  assert.match(header, /\{isStaff \? \(/);
  assert.match(header, /href="\/campaigns"/);
});

test("demo integration adds no schema and weakens no gate", () => {
  assert.match(home, /getAuthenticatedUser\(\)/);
  assert.match(forYou, /if \(!user\) redirect\("\/login\?next=%2Ffor-you"\)/);
  assert.match(saved, /if \(!user\) redirect\("\/login\?next=%2Fsaved"\)/);
  assert.match(activity, /if \(!user\) redirect\("\/login\?next=%2Factivity"\)/);
  assert.match(campaigns, /getModerationAccess\(\)/);
  assert.match(campaignDetail, /getModerationAccess\(\)/);
});

console.log(`\n${passed} commercial-demo tests passed.`);
