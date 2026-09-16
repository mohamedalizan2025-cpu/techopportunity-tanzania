/**
 * Milestone — National / International classification + opportunity taxonomy.
 *
 * Pure unit tests for lib/taxonomy.ts, the single deterministic classifier that
 * powers public browse, the Moderator queue and discovery logging. Three
 * orthogonal dimensions are pinned here:
 *
 *   1. TYPE      — the existing OPPORTUNITY_CATEGORIES lookup (reused, never
 *                  duplicated). Requirement 2's minimum type list must exist.
 *   2. GEOGRAPHY — EXACTLY two top-level groups (national / international);
 *                  cities/regions stay metadata, never a group. Unknown fails
 *                  safe to null — never an "Ambiguous" workflow.
 *   3. SECTOR    — classified separately from type; unknown stays null.
 *
 * Country honesty (ENGINEERING_RULES data-integrity rule 4) is under test: a
 * foreign country, a source domain, or the bare words "international"/"global"/
 * "worldwide" alone must NEVER produce a group.
 */
import {
  GEOGRAPHY_GROUPS,
  GEOGRAPHY_HINTS,
  GEOGRAPHY_LABELS,
  SECTORS,
  SECTOR_LABELS,
  classifyOpportunity,
  deriveGeography,
  geographyOf,
  hasDeterminateGeography,
  inferSector,
  isTanzaniaPlace,
  parseGeography,
  parseSector,
  sectorOf,
} from "../lib/taxonomy";
import { OPPORTUNITY_CATEGORIES } from "../lib/types";
import type { Opportunity, OpportunityLocation } from "../lib/types";
import { CATEGORY_LABELS } from "../lib/category-labels";
import type { OpportunityTrust } from "../lib/opportunity-trust";

let passed = 0;
let failed = 0;
function assert(name: string, condition: boolean, detail = ""): void {
  if (condition) { passed += 1; console.log(`PASS  ${name}`); }
  else { failed += 1; console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`); }
}

function location(overrides: Partial<OpportunityLocation> = {}): OpportunityLocation {
  return {
    venueName: null, address: null, city: null, region: null,
    country: null, latitude: null, longitude: null,
    ...overrides,
  };
}

function trust(overrides: Partial<OpportunityTrust> = {}): OpportunityTrust {
  return {
    relevanceDecision: "relevant",
    relevanceEvidence: "call for applications",
    eligibilityDecision: "unknown",
    eligibilityEvidence: null,
    qualificationRuleVersion: "m31-test",
    countryVerification: "unknown",
    countryEvidence: null,
    lastVerifiedAt: null,
    decidedBy: null,
    decidedAt: null,
    canonicalEvidenceUrl: null,
    ...overrides,
  };
}

function opportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: "o", slug: "o", title: "Example", category: "other",
    description: "", url: "https://example.com", deadline: null,
    location: null, imageUrl: null, status: "pending",
    createdAt: "2026-09-16T00:00:00.000Z", organization: null,
    ...overrides,
  };
}

// --- 1. Geography: exactly two top-level groups (requirement 1) --------------

assert("geo: exactly two top-level groups", GEOGRAPHY_GROUPS.length === 2);
assert(
  "geo: groups are national + international",
  GEOGRAPHY_GROUPS.includes("national") && GEOGRAPHY_GROUPS.includes("international")
);
assert(
  "geo: cities/regions are NOT top-level groups (stay metadata)",
  (["zanzibar", "dar es salaam", "arusha", "mwanza", "dodoma"] as const).every(
    (place) => !(GEOGRAPHY_GROUPS as readonly string[]).includes(place)
  )
);
assert(
  "geo: every group has a non-empty label and hint",
  GEOGRAPHY_GROUPS.every(
    (g) => GEOGRAPHY_LABELS[g].length > 0 && GEOGRAPHY_HINTS[g].length > 0
  )
);

// --- 2. deriveGeography: national on positive Tanzania evidence --------------

assert(
  "geo: verified_tanzania → national",
  deriveGeography({ countryVerification: "verified_tanzania" }) === "national"
);
assert(
  "geo: structured country 'Tanzania' → national",
  deriveGeography({ country: "Tanzania" }) === "national"
);
assert(
  "geo: country evidence is trimmed + case-folded, not invented",
  deriveGeography({ country: "  tAnZaNiA  " }) === "national"
);
assert(
  "geo: Tanzania-focused eligibility ('open to all Tanzanians') → national",
  deriveGeography({ eligibility: "tanzanians_eligible", eligibilityEvidence: "open to all Tanzanians" }) === "national"
);
assert(
  "geo: Tanzania-focused eligibility ('Tanzanian citizens may apply') → national",
  deriveGeography({ eligibility: "tanzanians_eligible", eligibilityEvidence: "Tanzanian citizens may apply" }) === "national"
);

// --- 3. deriveGeography: international on evidenced access, NOT TZ-based -----

assert(
  "geo: Africa-wide access (no Tanzania token) → international",
  deriveGeography({ eligibility: "tanzanians_eligible", eligibilityEvidence: "open to applicants from all African countries" }) === "international"
);
assert(
  "geo: worldwide access (no Tanzania token) → international",
  deriveGeography({ eligibility: "tanzanians_eligible", eligibilityEvidence: "open to applicants worldwide regardless of nationality" }) === "international"
);
assert(
  "geo: WBG-member-country access → international",
  deriveGeography({ eligibility: "tanzanians_eligible", eligibilityEvidence: "applicants must hold the nationality of a World Bank Group member country" }) === "international"
);
assert(
  "geo: foreign country + evidenced access → international (never national)",
  deriveGeography({
    country: "Kenya",
    countryVerification: "verified_other",
    eligibility: "tanzanians_eligible",
    eligibilityEvidence: "open to all African nationals",
  }) === "international"
);

// --- 4. deriveGeography: country honesty — unknown fails safe to null --------

assert("geo: empty evidence → null", deriveGeography({}) === null);
assert(
  "geo: foreign country alone never infers a group",
  deriveGeography({ country: "Kenya", countryVerification: "verified_other" }) === null
);
assert(
  "geo: tanzanians_not_eligible → null (no group, no ambiguous workflow)",
  deriveGeography({ eligibility: "tanzanians_not_eligible", eligibilityEvidence: "open to Kenyans only" }) === null
);
assert(
  "geo: bare 'global'/'worldwide' wording never infers international",
  deriveGeography({ eligibility: "unknown", eligibilityEvidence: "A global programme open worldwide" }) === null
);
assert(
  "geo: the bare word 'international' never infers a group",
  deriveGeography({ eligibilityEvidence: "international conference" }) === null
);
assert(
  "geo: classifier never returns an 'ambiguous' group",
  ([
    {},
    { country: "Kenya" },
    { eligibility: "tanzanians_not_eligible" },
    { eligibility: "tanzanians_eligible", eligibilityEvidence: "worldwide" },
    { countryVerification: "verified_tanzania" },
  ] as const)
    .map((evidence) => deriveGeography(evidence))
    .every((result) => result === null || result === "national" || result === "international")
);

// --- 5. Sector: practical, extensible, independent from type (requirement 3) -

assert("sector: 13 practical sectors", SECTORS.length === 13);
assert(
  "sector: every sector has a unique non-empty label",
  SECTORS.every((s) => SECTOR_LABELS[s].trim().length > 0) &&
    new Set(SECTORS.map((s) => SECTOR_LABELS[s])).size === SECTORS.length
);
assert(
  "sector: no ambiguous/unknown/other catch-all (fails safe to null instead)",
  (["ambiguous", "unknown", "other"] as const).every(
    (bad) => !(SECTORS as readonly string[]).includes(bad)
  )
);

// One representative, ordered match per sector (first distinctive signal wins).
const sectorCases: ReadonlyArray<[string, string]> = [
  ["Cybersecurity Awareness Training", "cybersecurity"],
  ["Machine Learning Bootcamp", "ai-data"],
  ["Sustainable Fisheries Programme", "blue-economy"],
  ["Mining Engineering Scholarship", "mining"],
  ["Solar Energy Innovation Challenge", "energy"],
  ["Climate Change Adaptation Grant", "climate-environment"],
  ["Agribusiness Investment Opportunity", "agriculture"],
  ["Public Health Research Fellowship", "health"],
  ["Civil Engineering Internship", "engineering"],
  ["Fintech Startup Funding", "finance"],
  ["Wildlife Tourism Venture", "tourism"],
  ["Teacher Training in Digital Literacy", "education"],
  ["Startup Accelerator Programme", "entrepreneurship"],
];
for (const [text, expected] of sectorCases) {
  assert(`sector: '${text}' → ${expected}`, inferSector([text]) === expected, `got ${inferSector([text])}`);
}

// Ordering: an earlier distinctive signal beats a later broad one.
assert(
  "sector: 'Data Science for Health' → ai-data (ai-data ordered before health)",
  inferSector(["Data Science for Health"]) === "ai-data"
);
assert(
  "sector: mining ordered before engineering",
  inferSector(["Mining Engineering Scholarship"]) === "mining"
);

// Unknown / empty fails safe.
assert("sector: no signal → null", inferSector(["General Call for Applications"]) === null);
assert("sector: empty + nullish text → null", inferSector([null, "", undefined]) === null);

// --- 6. Convenience wrappers over an Opportunity -----------------------------

assert(
  "geographyOf: reads location.country when trust is absent",
  geographyOf({ location: location({ country: "Tanzania" }) }) === "national"
);
assert(
  "geographyOf: foreign verified_other + unknown eligibility → null",
  geographyOf({
    location: location({ country: "Kenya" }),
    trust: trust({ countryVerification: "verified_other", eligibilityDecision: "unknown" }),
  }) === null
);
assert(
  "geographyOf: verified_tanzania in trust → national",
  geographyOf({ location: null, trust: trust({ countryVerification: "verified_tanzania" }) }) === "national"
);
assert(
  "geographyOf: no location and no trust → null",
  geographyOf({ location: null }) === null
);
assert(
  "sectorOf: infers from title + description",
  sectorOf({ title: "National AI Olympiad", description: "" }) === "ai-data"
);

const classified = classifyOpportunity(
  opportunity({
    category: "scholarship",
    title: "Machine Learning Scholarship",
    description: "Study AI in Tanzania",
    location: location({ country: "Tanzania" }),
  })
);
assert(
  "classifyOpportunity: returns all three dimensions (type reused from category)",
  classified.type === "scholarship" && classified.geography === "national" && classified.sector === "ai-data",
  JSON.stringify(classified)
);

// --- 7. Hostile-input-safe query-param parsers -------------------------------

assert("parse: geography 'national' accepted", parseGeography("national") === "national");
assert("parse: geography 'international' accepted", parseGeography("international") === "international");
assert("parse: geography is case-sensitive (uppercase rejected)", parseGeography("NATIONAL") === null);
assert("parse: geography null/undefined/empty rejected", parseGeography(null) === null && parseGeography(undefined) === null && parseGeography("") === null);
assert("parse: geography injection rejected", parseGeography("international; DROP TABLE opportunities") === null);
assert("parse: sector 'ai-data' accepted", parseSector("ai-data") === "ai-data");
assert("parse: sector 'health' accepted", parseSector("health") === "health");
assert("parse: unknown sector rejected", parseSector("not-a-sector") === null);
assert("parse: sector null/empty rejected", parseSector(null) === null && parseSector("") === null);
assert("parse: prototype keys are not sectors", parseSector("__proto__") === null && parseSector("constructor") === null);

// --- 8. Type taxonomy covers requirement 2's minimum list --------------------

const requiredTypes = [
  "scholarship", "fellowship", "internship", "jobs", "hackathon",
  "competition", "grant", "accelerator", "conference", "tech-event",
  "workshop", "research-call", "public-challenge",
] as const;
for (const slug of requiredTypes) {
  assert(
    `type: '${slug}' is in the taxonomy`,
    (OPPORTUNITY_CATEGORIES as readonly string[]).includes(slug)
  );
}
assert(
  "type: the three new TYPE slugs have non-empty labels",
  (["accelerator", "research-call", "public-challenge"] as const).every(
    (slug) => CATEGORY_LABELS[slug].trim().length > 0
  )
);

// --- 9. Focus: classification follows the OPPORTUNITY, not the organizer -----
// Required cases: foreign organizer + Zanzibar event = National; Tanzania call
// = National; global call open to Tanzanians = International; insufficient
// evidence = not publishable/classifiable (never Ambiguous).

// (a) Foreign organizer running an event/challenge in Zanzibar → National.
const zanzibarByForeignOrganizer = opportunity({
  title: "Blue Economy Innovation Challenge",
  location: location({ city: "Zanzibar", country: "Germany" }),
  trust: trust({
    countryVerification: "verified_other",
    eligibilityDecision: "tanzanians_eligible",
    eligibilityEvidence: "open to all African nationals",
  }),
});
assert(
  "focus: foreign organizer + Zanzibar city → national (follows the opportunity)",
  geographyOf(zanzibarByForeignOrganizer) === "national"
);
assert(
  "focus: foreign organizer + canonical Zanzibar region → national",
  deriveGeography({
    country: "United Kingdom",
    countryVerification: "verified_other",
    region: "Mjini Magharibi",
    eligibility: "tanzanians_eligible",
    eligibilityEvidence: "open to applicants worldwide",
  }) === "national"
);
assert(
  "focus: foreign organizer + mainland region (Arusha) → national",
  deriveGeography({ country: "United States", countryVerification: "verified_other", region: "Arusha" }) === "national"
);
assert(
  "focus: a Zanzibar opportunity is determinate (publishable)",
  hasDeterminateGeography(zanzibarByForeignOrganizer) === true
);

// (b) A Tanzania ministry/university/company call → National.
assert(
  "focus: Tanzania-specific call (verified_tanzania) → national",
  deriveGeography({
    country: "Tanzania",
    countryVerification: "verified_tanzania",
    eligibility: "tanzanians_eligible",
    eligibilityEvidence: "open to Tanzanian citizens",
  }) === "national"
);
assert(
  "focus: Tanzania-focused eligibility wording alone → national",
  deriveGeography({ eligibility: "tanzanians_eligible", eligibilityEvidence: "Tanzanian applicants are encouraged to apply" }) === "national"
);

// (c) A global/foreign opportunity genuinely open to Tanzanians → International.
assert(
  "focus: global call open to Tanzanians (worldwide wording, no TZ token) → international",
  deriveGeography({ eligibility: "tanzanians_eligible", eligibilityEvidence: "open to applicants from any country worldwide" }) === "international"
);
assert(
  "focus: foreign opportunity with evidenced access → international",
  deriveGeography({
    country: "Netherlands",
    countryVerification: "verified_other",
    eligibility: "tanzanians_eligible",
    eligibilityEvidence: "open to early-career researchers worldwide",
  }) === "international"
);
assert(
  "focus: an international opportunity is determinate (publishable)",
  hasDeterminateGeography(
    opportunity({ trust: trust({ eligibilityDecision: "tanzanians_eligible", eligibilityEvidence: "open worldwide" }) })
  ) === true
);

// (d) Insufficient geographic evidence → not publishable/classifiable, never Ambiguous.
const insufficientEvidence = opportunity({
  title: "Call for Applications",
  location: null,
  trust: trust({ eligibilityDecision: "unknown", eligibilityEvidence: null }),
});
assert("focus: insufficient evidence → null geography", geographyOf(insufficientEvidence) === null);
assert(
  "focus: insufficient evidence → NOT determinate (held out of the publishable corpus)",
  hasDeterminateGeography(insufficientEvidence) === false
);
assert(
  "focus: a foreign country alone is insufficient (never guessed to a group)",
  hasDeterminateGeography(
    opportunity({ location: location({ country: "Kenya" }), trust: trust({ countryVerification: "verified_other" }) })
  ) === false
);

// isTanzaniaPlace reads real location evidence: exact whole-value only, never a substring.
assert("focus: isTanzaniaPlace canonical region (Arusha) → true", isTanzaniaPlace("Arusha") === true);
assert("focus: isTanzaniaPlace case-insensitive (mjini magharibi) → true", isTanzaniaPlace("mjini magharibi") === true);
assert(
  "focus: isTanzaniaPlace Zanzibar/Unguja/Pemba/Stone Town aliases → true",
  isTanzaniaPlace("Zanzibar") && isTanzaniaPlace("Unguja") && isTanzaniaPlace("Pemba") && isTanzaniaPlace("Stone Town")
);
assert("focus: isTanzaniaPlace foreign city (Nairobi) → false", isTanzaniaPlace("Nairobi") === false);
assert(
  "focus: isTanzaniaPlace null/empty/whitespace → false",
  isTanzaniaPlace(null) === false && isTanzaniaPlace("") === false && isTanzaniaPlace("   ") === false
);
assert("focus: isTanzaniaPlace is exact whole-value, never a substring", isTanzaniaPlace("Zanzibar International Airport") === false);

// ------------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
