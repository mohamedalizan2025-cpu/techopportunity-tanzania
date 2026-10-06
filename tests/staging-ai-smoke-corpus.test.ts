/**
 * Staging AI smoke corpus gate proof (docs/test-only, no product change).
 *
 * Mirrors the exact payloads in docs/STAGING_AI_SMOKE_CORPUS.md and proves
 * deterministically, through the real `isAiSearchableOpportunity()` gate:
 * National / International / no-deadline pass, unknown-eligibility fails
 * (panel withheld = PASS). If this file and that doc ever disagree, fix the
 * doc payloads — never weaken the gate.
 */
import assert from "node:assert/strict";
import {
  isAiSearchableOpportunity,
  isTestOrPlaceholderOpportunity,
  M31_QUALIFICATION_RULE_VERSION,
  publicQualityBand,
} from "../lib/opportunity-trust";
import { geographyOf } from "../lib/taxonomy";
import type { Opportunity } from "../lib/types";

let passed = 0;
function test(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
}

const RELEVANCE_EVIDENCE =
  "Staging smoke: synthetic record admitted for authenticated AI interface verification; relevance assigned by the smoke author.";
const ELIGIBILITY_EVIDENCE =
  "Staging smoke: eligibility assigned for interface verification; Tanzanian applicants are treated as eligible in this synthetic record.";

function base(slug: string, title: string, description: string): Opportunity {
  return {
    id: "00000000-0000-4000-8000-000000000000",
    slug,
    title,
    category: "fellowship",
    organization: null,
    organizationId: null,
    sourceName: null,
    sourceUrl: null,
    discoveredAt: null,
    discoveryMethod: null,
    description,
    url: `https://staging-smoke.example.invalid/${slug}`,
    deadline: null,
    deadlinePrecision: "unknown",
    deadlineEvidence: null,
    location: null,
    imageUrl: null,
    status: "published",
    createdAt: "2026-10-06T00:00:00.000Z",
    trust: {
      relevanceDecision: "relevant",
      relevanceEvidence: RELEVANCE_EVIDENCE,
      eligibilityDecision: "tanzanians_eligible",
      eligibilityEvidence: ELIGIBILITY_EVIDENCE,
      qualificationRuleVersion: M31_QUALIFICATION_RULE_VERSION,
      countryVerification: "unknown",
      countryEvidence: null,
      lastVerifiedAt: "2026-10-06T00:00:00.000Z",
      decidedBy: "11111111-1111-4111-8111-111111111111",
      decidedAt: "2026-10-06T00:00:00.000Z",
      canonicalEvidenceUrl: `https://staging-smoke.example.invalid/${slug}`,
    },
  };
}

const NATIONAL: Opportunity = {
  ...base(
    "staging-smoke-national-fellowship-2026",
    "[STAGING SMOKE] National fellowship illustration — Dar es Salaam",
    "Synthetic staging record for authenticated AI interface verification. It describes an imaginary fellowship-style opportunity for learners based in Dar es Salaam, Tanzania. There is no real programme, no real organizer, and no application to submit."
  ),
  deadline: "2027-11-30T12:00:00.000Z",
  deadlinePrecision: "date",
  deadlineEvidence:
    "Staging smoke: synthetic deadline assigned for interface verification (30 November 2027).",
  location: {
    venueName: null,
    address: null,
    city: "Dar es Salaam",
    region: "Dar es Salaam",
    country: "Tanzania",
    latitude: null,
    longitude: null,
  },
  trust: {
    ...(base("", "", "").trust!),
    countryVerification: "verified_tanzania",
    countryEvidence:
      "Staging smoke: country value assigned for interface verification (Dar es Salaam, Tanzania).",
  },
};

const INTERNATIONAL: Opportunity = {
  ...base(
    "staging-smoke-international-fellowship-2026",
    "[STAGING SMOKE] International fellowship illustration — Nairobi access",
    "Synthetic staging record for authenticated AI interface verification. It describes an imaginary fellowship-style opportunity hosted in Nairobi, Kenya, explicitly open to Tanzanian applicants in this fiction. There is no real programme, no real organizer, and no application to submit."
  ),
  deadline: "2027-09-30T12:00:00.000Z",
  deadlinePrecision: "date",
  deadlineEvidence:
    "Staging smoke: synthetic deadline assigned for interface verification (30 September 2027).",
  location: {
    venueName: null,
    address: null,
    city: "Nairobi",
    region: null,
    country: "Kenya",
    latitude: null,
    longitude: null,
  },
  trust: {
    ...(base("", "", "").trust!),
    countryVerification: "verified_other",
    countryEvidence:
      "Staging smoke: country value assigned for interface verification (Nairobi, Kenya).",
  },
};

const NO_DEADLINE: Opportunity = {
  ...base(
    "staging-smoke-no-deadline-grant-2026",
    "[STAGING SMOKE] Open-ended grant illustration — no deadline",
    "Synthetic staging record for authenticated AI interface verification. It describes an imaginary grant-style opportunity for Tanzanian learners with no deadline in this fiction. There is no real programme, no real organizer, and no application to submit."
  ),
  category: "grant",
  deadline: null,
  deadlinePrecision: "unknown",
  deadlineEvidence: null,
  location: {
    venueName: null,
    address: null,
    city: "Dar es Salaam",
    region: "Dar es Salaam",
    country: "Tanzania",
    latitude: null,
    longitude: null,
  },
  trust: {
    ...(base("", "", "").trust!),
    countryVerification: "verified_tanzania",
    countryEvidence:
      "Staging smoke: country value assigned for interface verification (Dar es Salaam, Tanzania).",
  },
};

const UNKNOWN_ELIGIBILITY: Opportunity = {
  ...base(
    "staging-smoke-unknown-eligibility-2026",
    "[STAGING SMOKE] Eligibility-unverified illustration — withheld insight",
    "Synthetic staging record for authenticated AI interface verification. Eligibility is deliberately left unknown in this fiction, so Opportunity Insight must stay withheld. There is no real programme, no real organizer, and no application to submit."
  ),
  deadline: "2027-08-31T12:00:00.000Z",
  deadlinePrecision: "date",
  deadlineEvidence:
    "Staging smoke: synthetic deadline assigned for interface verification (31 August 2027).",
  location: null,
  trust: {
    ...(base("", "", "").trust!),
    eligibilityDecision: "unknown",
    eligibilityEvidence: null,
    countryVerification: "unknown",
    countryEvidence: null,
  },
};

const CASES: Array<{ label: string; opportunity: Opportunity; searchable: boolean }> = [
  { label: "national", opportunity: NATIONAL, searchable: true },
  { label: "international", opportunity: INTERNATIONAL, searchable: true },
  { label: "no-deadline", opportunity: NO_DEADLINE, searchable: true },
  { label: "unknown-eligibility", opportunity: UNKNOWN_ELIGIBILITY, searchable: false },
];

test("corpus slugs are unique, staging-marked, and unresolvable by design", () => {
  const slugs = CASES.map((entry) => entry.opportunity.slug);
  assert.equal(new Set(slugs).size, 4);
  for (const slug of slugs) {
    assert.match(slug, /^staging-smoke-/);
  }
  for (const entry of CASES) {
    const host = new URL(entry.opportunity.url).hostname;
    assert.equal(host, "staging-smoke.example.invalid");
    assert.equal(entry.opportunity.organization, null);
  }
});

test("corpus titles evade no contamination guard yet stay unmistakably synthetic", () => {
  for (const entry of CASES) {
    assert.match(entry.opportunity.title, /^\[STAGING SMOKE\]/);
    assert.equal(isTestOrPlaceholderOpportunity(entry.opportunity), false);
  }
});

test("national / international / no-deadline are AI-searchable; unknown-eligibility is not", () => {
  const now = new Date("2026-10-06T00:00:00.000Z");
  for (const entry of CASES) {
    assert.equal(
      isAiSearchableOpportunity(entry.opportunity, now),
      entry.searchable,
      entry.label
    );
  }
});

test("geography classifies national vs international as the runbook expects", () => {
  assert.equal(geographyOf(NATIONAL), "national");
  assert.equal(geographyOf(INTERNATIONAL), "international");
});

test("public band is trusted x3 and reviewable (visible, no insight) x1", () => {
  const now = new Date("2026-10-06T00:00:00.000Z");
  assert.equal(publicQualityBand(NATIONAL, now), "trusted");
  assert.equal(publicQualityBand(INTERNATIONAL, now), "trusted");
  assert.equal(publicQualityBand(NO_DEADLINE, now), "trusted");
  assert.equal(publicQualityBand(UNKNOWN_ELIGIBILITY, now), "reviewable");
});

test("descriptions are meaningful (>=80 chars) and never equal the title", () => {
  for (const entry of CASES) {
    assert.ok(entry.opportunity.description.length >= 80, entry.label);
    assert.notEqual(entry.opportunity.description, entry.opportunity.title);
  }
});

console.log(`\n${passed} staging AI smoke corpus gate proofs passed.`);
