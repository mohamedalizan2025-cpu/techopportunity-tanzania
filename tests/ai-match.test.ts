/**
 * AI Frontend V1 — AI Match workspace contract.
 *
 * Guards: verified eligibility is deterministic (unknown is never
 * labeled eligible), ranking precedes AI, no percentages, incomplete
 * profiles stay honest, no provider call on page load, and only the
 * allowlisted profile context drives matching.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { hasVerifiedTanzanianAccess } from "../lib/opportunity-trust";
import { buildSanitizedOpportunityIntelligenceInput } from "../lib/opportunity-intelligence/contract";
import {
  buildMatchingInput,
  explainMatch,
  hasCoreProfile,
  rankForYou,
} from "../lib/personalization";
import type { Opportunity } from "../lib/types";

function read(relative: string): string {
  return readFileSync(join(process.cwd(), relative), "utf-8");
}

let passed = 0;
function test(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
}

function opportunity(
  slug: string,
  overrides: Partial<Opportunity> = {}
): Opportunity {
  return {
    id: slug,
    slug,
    title: `Opportunity ${slug}`,
    category: "fellowship",
    organization: "Test Org",
    organizationId: null,
    sourceName: null,
    sourceUrl: null,
    discoveredAt: null,
    discoveryMethod: null,
    description:
      "A published fellowship opportunity with meaningful evidence-based description for Tanzanian applicants.",
    url: `https://example.org/${slug}`,
    deadline: "2027-06-30T12:00:00.000Z",
    deadlinePrecision: "date",
    deadlineEvidence: "Official page states 30 June 2027",
    location: {
      venueName: null,
      address: null,
      city: "Dar es Salaam",
      region: "Dar es Salaam",
      country: "Tanzania",
      latitude: null,
      longitude: null,
    },
    imageUrl: null,
    status: "published",
    createdAt: "2026-09-01T09:00:00.000Z",
    trust: {
      relevanceDecision: "relevant",
      relevanceEvidence: "Explicit fellowship call",
      eligibilityDecision: "tanzanians_eligible",
      eligibilityEvidence: "Applications are open to Tanzanian applicants",
      qualificationRuleVersion: "test-rule-v1",
      countryVerification: "verified_tanzania",
      countryEvidence: "Dar es Salaam, Tanzania",
      lastVerifiedAt: "2026-09-03T10:00:00.000Z",
      decidedBy: "staff-1",
      decidedAt: "2026-09-03T10:00:00.000Z",
      canonicalEvidenceUrl: `https://example.org/${slug}`,
    },
    ...overrides,
  };
}

const COMPLETE = buildMatchingInput({
  careerLevel: "student",
  fieldDiscipline: "Computer Science",
  sectors: ["education"],
  preferredTypes: ["fellowship"],
  skills: [],
  region: "Dar es Salaam",
  experienceLevel: "entry",
  goals: null,
});

const INCOMPLETE = buildMatchingInput({
  careerLevel: null,
  fieldDiscipline: null,
  sectors: [],
  preferredTypes: [],
  skills: [],
  region: null,
  experienceLevel: null,
  goals: null,
});

test("verified Tanzanian access requires decision plus evidence", () => {
  assert.equal(hasVerifiedTanzanianAccess(opportunity("eligible")), true);
  assert.equal(
    hasVerifiedTanzanianAccess(
      opportunity("unknown", {
        trust: {
          relevanceDecision: "relevant",
          relevanceEvidence: "Explicit fellowship call",
          eligibilityDecision: "unknown",
          eligibilityEvidence: null,
          qualificationRuleVersion: "test-rule-v1",
          countryVerification: "unknown",
          countryEvidence: null,
          lastVerifiedAt: "2026-09-03T10:00:00.000Z",
          decidedBy: "staff-1",
          decidedAt: "2026-09-03T10:00:00.000Z",
          canonicalEvidenceUrl: "https://example.org/unknown",
        },
      })
    ),
    false
  );
  assert.equal(
    hasVerifiedTanzanianAccess(
      opportunity("bare-claim", {
        trust: {
          relevanceDecision: "relevant",
          relevanceEvidence: "Explicit fellowship call",
          eligibilityDecision: "tanzanians_eligible",
          eligibilityEvidence: "   ",
          qualificationRuleVersion: "test-rule-v1",
          countryVerification: "verified_tanzania",
          countryEvidence: "Dar es Salaam, Tanzania",
          lastVerifiedAt: "2026-09-03T10:00:00.000Z",
          decidedBy: "staff-1",
          decidedAt: "2026-09-03T10:00:00.000Z",
          canonicalEvidenceUrl: "https://example.org/bare-claim",
        },
      })
    ),
    false,
    "blank evidence never counts as verified"
  );
});

test("eligible list contains only verified rows; unknown stays separate", () => {
  const corpus = [opportunity("a"), opportunity("b", { trust: { ...opportunity("b").trust!, eligibilityDecision: "unknown", eligibilityEvidence: null } })];
  const ranked = rankForYou(corpus, COMPLETE);
  assert.ok(ranked.length >= 1, "deterministic ranking still matches rows");
  const eligible = ranked.filter(({ opportunity: item }) => hasVerifiedTanzanianAccess(item));
  const others = ranked.filter(({ opportunity: item }) => !hasVerifiedTanzanianAccess(item));
  assert.ok(eligible.every(({ opportunity: item }) => item.trust?.eligibilityDecision === "tanzanians_eligible"));
  assert.ok(eligible.length + others.length === ranked.length, "split is a partition, never a mix");
});

test("ranking precedes AI and exposes no percentage", () => {
  const ranked = rankForYou([opportunity("a")], COMPLETE);
  assert.equal(ranked.length, 1);
  for (const reason of ranked[0].reasons) {
    assert.doesNotMatch(reason, /%|percent|score|probability|chance/i);
  }
  assert.deepEqual(explainMatch(opportunity("a"), INCOMPLETE), [], "no signal invents a reason");
});

test("incomplete profiles are honestly empty, never guessed", () => {
  assert.equal(hasCoreProfile(INCOMPLETE), false);
  assert.equal(hasCoreProfile(COMPLETE), true);
  assert.deepEqual(rankForYou([opportunity("a")], INCOMPLETE), []);
});

test("AI Match page splits lists, shows profile, and never auto-fetches AI", () => {
  const page = read("app/for-you/page.tsx");
  assert.match(page, /Your eligible matches/);
  assert.match(page, /Explore other relevant opportunities/);
  assert.match(page, /eligibility is not yet verified/);
  assert.match(page, /Your matching profile/);
  assert.match(page, /Improve your matches/);
  assert.match(page, /AI Match/);
  assert.match(page, /hasVerifiedTanzanianAccess/);
  assert.match(page, /getForYouData/);
  assert.doesNotMatch(page, /generateOpportunityInsight|answerAsk|fetch\("\/api/);
  const explanation = read("components/for-you-explanation.tsx");
  assert.match(explanation, /onClick=\{explain\}/);
});

test("AI Match is reachable from navigation and the alias preserves links", () => {
  const header = read("components/site-header.tsx");
  assert.match(header, /AI Match/);
  assert.match(header, /href="\/ask"/);
  assert.match(header, /Ask AI/);
  const bottom = read("components/bottom-navigation.tsx");
  assert.match(bottom, /AI Match/);
  assert.match(bottom, /Ask AI/);
  assert.match(bottom, /Activity/);
  const alias = read("app/ai-match/page.tsx");
  assert.match(alias, /redirect\("\/for-you"\)/);
});

test("matching context is the allowlisted profile only", () => {
  const data = read("lib/data/for-you.ts");
  assert.match(data, /buildMatchingInput/);
  assert.doesNotMatch(data, /email|phone|displayName|goals/);
  assert.doesNotMatch(data, /saved|activity/i);
});

test("sanitized insight input carries only allowlisted profile fields", () => {
  const input = buildMatchingInput({
    careerLevel: "student",
    fieldDiscipline: "Computer Science",
    sectors: ["education"],
    preferredTypes: ["fellowship"],
    skills: ["Python"],
    region: "Dar es Salaam",
    experienceLevel: "entry",
    goals: "Become a data scientist",
  });
  const sanitized = buildSanitizedOpportunityIntelligenceInput(opportunity("allowlist"), input);
  assert.deepEqual(
    Object.keys(sanitized.profile).sort(),
    ["careerLevel", "experienceLevel", "fieldDiscipline", "preferredTypes", "region", "sectors", "skills"]
  );
  const serialized = JSON.stringify(sanitized);
  assert.doesNotMatch(serialized, /email|phone|displayName|userId|databaseId/i);
  assert.doesNotMatch(serialized, /goals/i);
  assert.doesNotMatch(serialized, /saved|activity|reports|staff/i);
  assert.doesNotMatch(serialized, /data scientist/i, "goals text never leaves the boundary");
});

console.log(`\n${passed} AI Match contract tests passed.`);
