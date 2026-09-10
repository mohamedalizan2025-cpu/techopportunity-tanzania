import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { evaluateAiReadiness } from "../lib/ai-readiness";
import {
  hasConsistentCountryTruth,
  hasMeaningfulDescription,
  isAiSearchableOpportunity,
  isFeatureEligible,
  isTestOrPlaceholderOpportunity,
} from "../lib/opportunity-trust";
import type { Opportunity } from "../lib/types";
import {
  applyPublicOpportunityQuery,
  mapOpportunityRow,
  mapRowToOpportunity,
  type OpportunityRow,
} from "../lib/data/opportunities";
import { extractAllCandidates } from "../scripts/discovery/adapters";
import { sameOpportunityTitle } from "../scripts/discovery/dedupe";
import { qualifyOpportunity, shouldEnterModerationQueue } from "../scripts/discovery/qualification";
import { sourceAcquisitionPolicy } from "../scripts/discovery/source-policy";
import { buildPendingRow } from "../scripts/discovery/runner";
import type { CandidateOpportunity, SourceRecord } from "../scripts/discovery/types";

let passed = 0;
function test(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
}

function opportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: "opportunity-1", slug: "trusted-opportunity", title: "AI engineering fellowship 2027",
    category: "fellowship", organization: "Evidence Foundation", sourceName: "Official source",
    sourceUrl: "https://official.example/evidence", discoveryMethod: "rss",
    description: "Applications are invited for an AI engineering fellowship with a documented programme, selection process, and applicant requirements.",
    url: "https://official.example/fellowship", deadline: null, deadlinePrecision: "unknown",
    deadlineEvidence: null, location: null, imageUrl: null, status: "published",
    createdAt: "2026-09-04T00:00:00Z",
    trust: {
      relevanceDecision: "relevant", relevanceEvidence: "AI engineering fellowship",
      eligibilityDecision: "tanzanians_eligible", eligibilityEvidence: "Applications are open to all African nationals",
      qualificationRuleVersion: "m31-test-v1", countryVerification: "unknown", countryEvidence: null,
      lastVerifiedAt: "2026-09-04T00:00:00Z", decidedBy: "staff-1",
      decidedAt: "2026-09-04T00:00:00Z", canonicalEvidenceUrl: "https://official.example/fellowship",
    },
    ...overrides,
  };
}

function countryRow(overrides: Partial<OpportunityRow> = {}): OpportunityRow {
  return {
    id: "country-only", slug: "country-only", title: "AI engineering fellowship 2027",
    description: opportunity().description, url: "https://official.example/fellowship",
    source_url: "https://official.example/evidence", deadline: null,
    deadline_precision: "unknown", deadline_evidence: null,
    venue_name: null, address: null, city: null, region: null, country: "Tanzania",
    latitude: null, longitude: null, image_url: null, created_at: "2026-09-04T00:00:00Z",
    category: { slug: "fellowship" }, organization: null, source: { name: "Official source" },
    discovered_at: null, discovery_method: "rss",
    relevance_decision: "relevant", relevance_evidence: "Official AI engineering fellowship",
    eligibility: "tanzanians_eligible", eligibility_evidence: "Open to all African nationals",
    qualification_rule_version: "m31-test-v1", country_verification: "verified_tanzania",
    country_evidence: "Official programme location: Tanzania",
    last_verified_at: "2026-09-04T00:00:00Z", decided_by: "staff-1",
    decided_at: "2026-09-04T00:00:00Z",
    references: [{ url: "https://official.example/fellowship", is_canonical: true }],
    ...overrides,
  };
}

// Readiness uses the published-row mapper; staff/application reads also use
// the status-aware mapper. Equivalent published input must retain identical truth.
function mappedCountryRow(overrides: Partial<OpportunityRow> = {}): Opportunity {
  const row = countryRow(overrides);
  const application = mapOpportunityRow(row, "published");
  const readiness = mapRowToOpportunity(row);
  assert.deepEqual(readiness, application);
  return application;
}

test("verified Tanzania country-only rows retain location and complete trust", () => {
  const mapped = mappedCountryRow();
  assert.deepEqual(mapped.location, {
    venueName: null, address: null, city: null, region: null,
    country: "Tanzania", latitude: null, longitude: null,
  });
  assert.equal(mapped.trust?.countryVerification, "verified_tanzania");
  assert.equal(hasConsistentCountryTruth(mapped), true);
  assert.equal(isFeatureEligible(mapped), true);
  assert.equal(evaluateAiReadiness({
    published: [mapped], featured: [mapped],
    duplicateIntegrityPassed: true, securityBoundariesPassed: true,
  }).state, "READY");
});

test("verified foreign country is preserved without becoming Tanzania or granting eligibility", () => {
  const mapped = mappedCountryRow({
    country: "Kenya", country_verification: "verified_other",
    country_evidence: "Official programme location: Kenya",
    eligibility: "tanzanians_not_eligible", eligibility_evidence: "Only Kenyan citizens may apply",
  });
  assert.equal(mapped.location?.country, "Kenya");
  assert.equal(mapped.trust?.countryVerification, "verified_other");
  assert.equal(hasConsistentCountryTruth(mapped), true);
  assert.equal(isAiSearchableOpportunity(mapped), false);
  assert.equal(hasConsistentCountryTruth({
    ...mapped, trust: { ...mapped.trust!, countryVerification: "verified_tanzania" },
  }), false);
});

test("unverified Tanzania text stays unverified and cannot substitute for eligibility", () => {
  const mapped = mappedCountryRow({
    country_verification: "unknown", country_evidence: null,
    eligibility: "unknown", eligibility_evidence: null,
  });
  assert.equal(mapped.location?.country, "Tanzania");
  assert.equal(mapped.trust?.countryVerification, "unknown");
  assert.equal(mapped.trust?.countryEvidence, null);
  assert.equal(mapped.trust?.eligibilityDecision, "unknown");
  assert.equal(mapped.trust?.eligibilityEvidence, null);
  assert.equal(isFeatureEligible(mapped), false);
  assert.equal(isAiSearchableOpportunity(mapped), false);
});

test("country-only verified label still requires country evidence", () => {
  const mapped = mappedCountryRow({ country_evidence: null });
  assert.equal(mapped.location?.country, "Tanzania");
  assert.equal(hasConsistentCountryTruth(mapped), false);
  assert.equal(isAiSearchableOpportunity(mapped), false);
});

test("genuinely unknown location remains null without fabricated geography", () => {
  const mapped = mappedCountryRow({
    country: null, country_verification: "unknown", country_evidence: null,
  });
  assert.equal(mapped.location, null);
  assert.equal(mapped.trust?.countryVerification, "unknown");
  assert.equal(mapped.trust?.countryEvidence, null);
});

test("rich locations retain venue address city region country and coordinates", () => {
  const mapped = mappedCountryRow({
    venue_name: "Innovation Hub", address: "10 Example Road", city: "Dar es Salaam",
    region: "Dar es Salaam", latitude: -6.8, longitude: 39.2,
  });
  assert.deepEqual(mapped.location, {
    venueName: "Innovation Hub", address: "10 Example Road", city: "Dar es Salaam",
    region: "Dar es Salaam", country: "Tanzania", latitude: -6.8, longitude: 39.2,
  });
  assert.equal(hasConsistentCountryTruth(mapped), true);
  assert.equal(isAiSearchableOpportunity(mapped), true);
});

test("public contamination rule rejects measured manual artifacts", () => {
  for (const title of [
    "REGRESSION Alpha - Hackathon fixed deadline",
    "REGRESSION Bravo - Scholarship rolling",
    "PRODUCTION LINK TEST — DELETE ME",
    "hack",
    "hackkka",
  ]) {
    assert.equal(isTestOrPlaceholderOpportunity(opportunity({ title, description: title, sourceName: null, discoveryMethod: null, url: "https://example.org/test" })), true);
  }
  assert.equal(isTestOrPlaceholderOpportunity(opportunity({ title: "hack", description: "anyone", sourceName: null, discoveryMethod: null, url: "https://example.com/" })), true);
  assert.equal(isTestOrPlaceholderOpportunity(opportunity({ title: "hackkka", description: "cffd", sourceName: null, discoveryMethod: null, url: "http://dwew,l.hhh/" })), true);
  assert.equal(isTestOrPlaceholderOpportunity(opportunity({ title: "Regression analysis workshop", description: "A legitimate statistical training opportunity with complete application information for data researchers.", sourceName: "University", url: "https://university.example/workshop" })), false);
});

test("public browse removes test artifacts before ranking", () => {
  const testRow = opportunity({ id: "test", title: "PRODUCTION LINK TEST — DELETE ME", description: "PRODUCTION LINK TEST — DELETE ME", sourceName: null, url: "https://example.org/test" });
  assert.deepEqual(applyPublicOpportunityQuery([testRow, opportunity()], {} ).map((item) => item.id), ["opportunity-1"]);
});

test("feature and AI gates require complete explicit trust", () => {
  const trusted = opportunity();
  assert.equal(hasMeaningfulDescription(trusted), true);
  assert.equal(isFeatureEligible(trusted), true);
  assert.equal(isAiSearchableOpportunity(trusted), true);
  assert.equal(isFeatureEligible(opportunity({ trust: { ...trusted.trust!, eligibilityDecision: "unknown", eligibilityEvidence: null } })), false);
  assert.equal(isFeatureEligible(opportunity({ deadline: "2026-01-01T00:00:00Z", deadlinePrecision: "date", deadlineEvidence: "Official deadline" }), new Date("2026-09-04T00:00:00Z")), false);
});

test("quality-aware ranking puts evidenced records before newer unverified records", () => {
  const unverified = opportunity({
    id: "unverified", createdAt: "2026-09-05T00:00:00Z", trust: undefined,
  });
  assert.deepEqual(
    applyPublicOpportunityQuery([unverified, opportunity()], { sort: "newest" }, new Date("2026-09-04T00:00:00Z")).map((item) => item.id),
    ["opportunity-1", "unverified"]
  );
});

test("AI readiness fails closed and cannot pass an empty corpus", () => {
  assert.equal(evaluateAiReadiness({ published: [], featured: [], duplicateIntegrityPassed: true, securityBoundariesPassed: true }).state, "NO_GO");
  assert.equal(evaluateAiReadiness({ published: [opportunity()], featured: [opportunity()], duplicateIntegrityPassed: true, securityBoundariesPassed: true }).state, "READY");
  assert.equal(evaluateAiReadiness({ published: [opportunity()], featured: [], duplicateIntegrityPassed: false, securityBoundariesPassed: true }).state, "NO_GO");
  assert.equal(evaluateAiReadiness({
    published: [opportunity({ deadline: null, deadlinePrecision: "date" })],
    featured: [], duplicateIntegrityPassed: true, securityBoundariesPassed: true,
  }).state, "NO_GO");
  assert.equal(evaluateAiReadiness({
    published: [opportunity({
      location: { venueName: null, address: null, city: null, region: null, country: "Kenya", latitude: null, longitude: null },
      trust: { ...opportunity().trust!, countryVerification: "verified_tanzania", countryEvidence: "Source says Kenya" },
    })], featured: [], duplicateIntegrityPassed: true, securityBoundariesPassed: true,
  }).state, "NO_GO");
});

test("institutional sources cannot use generic heading extraction", () => {
  const source = { name: "NM-AIST", source_type: "university" } as Pick<SourceRecord, "name" | "source_type">;
  const policy = sourceAcquisitionPolicy(source);
  assert.equal(policy.allowGenericHtml, false);
  assert.deepEqual(extractAllCandidates("<h2><a href='/course'>Master programme</a></h2>", "source", "https://nm-aist.example", policy), []);
  assert.equal(sourceAcquisitionPolicy({ name: "OpportunityDesk", source_type: "other" }).allowGenericHtml, true);
});

test("ambiguous and generic research records no longer enter moderation", () => {
  const candidate: CandidateOpportunity = {
    title: "Young Researchers Programme 2027", description: "A programme for young researchers.",
    category: "other", organization: null, url: "https://example.test/researchers", deadline: null,
    venueName: null, address: null, city: null, region: null, country: null, sourceId: "s",
    sourceUrl: "https://example.test/feed", evidenceUrl: "https://example.test/feed",
    referenceKind: "source-base", discoveryMethod: "rss",
  };
  const qualification = qualifyOpportunity(candidate, new Date("2026-09-04T00:00:00Z"), { sourceType: "other" });
  assert.equal(qualification.relevance, "not_relevant");
  assert.equal(shouldEnterModerationQueue(qualification), false);
});

test("measured ECOWAS cross-source title variation dedupes conservatively", () => {
  assert.equal(sameOpportunityTitle(
    "ECOWAS Bank for Investment and Development (EBID) Young Professionals Programme 2026 for West African Graduates.",
    "ECOWAS Bank for Investment and Development (EBID) Young Professionals Programme 2026"
  ), true);
  assert.equal(sameOpportunityTitle("Master of Science 2027", "PhD of Science 2027"), false);
});

test("new pending rows persist qualification, country and deadline truth", () => {
  const candidate: CandidateOpportunity = {
    title: "AI Fellowship 2027", description: "A detailed AI fellowship with explicit application and eligibility evidence for applicants.",
    category: "fellowship", organization: null, url: "https://official.example/fellowship",
    deadline: "2027-01-02T00:00:00Z", venueName: null, address: null, city: null,
    region: null, country: null, sourceId: "source", sourceUrl: "https://official.example/feed",
    evidenceUrl: "https://official.example/feed", referenceKind: "source-base", discoveryMethod: "rss",
  };
  const row = buildPendingRow(candidate, 7, {
    relevance: "relevant", tanzaniaAccessibility: "tanzanians_eligible",
    evidenceQuality: "explicit", relevanceEvidence: "AI Fellowship",
    eligibilityEvidence: "Open to all African nationals",
  }, "2026-09-04T00:00:00Z");
  assert.equal(row.status, "pending");
  assert.equal(row.qualification_rule_version, "m31-2026-09-04-v1");
  assert.equal(row.eligibility, "tanzanians_eligible");
  assert.equal(row.country_verification, "unknown");
  assert.equal("country" in row, false);
  assert.match(String(row.deadline_evidence), /Structured source value/);
});

test("forward migration preserves rows and removes the unsafe country default", () => {
  const migration = readFileSync(join(process.cwd(), "supabase/migrations/0013_m31_data_trust.sql"), "utf8");
  assert.match(migration, /alter column country drop default/);
  assert.match(migration, /add column if not exists qualification_rule_version/);
  assert.match(migration, /create table if not exists public\.opportunity_references/);
  assert.match(migration, /country_verification = 'unknown'/);
  assert.doesNotMatch(migration, /delete\s+from\s+public\.opportunities/i);
  assert.doesNotMatch(migration, /update\s+public\.opportunities\s+set\s+country/i);
});

test("country moderator corrections remain compatible with enrichment auditing", () => {
  const migration = readFileSync(join(process.cwd(), "supabase/migrations/0014_m31_country_enrichment_audit.sql"), "utf8");
  assert.match(migration, /opportunity_enrichments_field_check/);
  assert.match(migration, /'country'/);
  assert.doesNotMatch(migration, /(?:insert|update|delete)\s+(?:into|from)?\s*public\.opportunities/i);
});

test("remediation apply mode is explicit, status-only, and never deletes", () => {
  const remediation = readFileSync(join(process.cwd(), "scripts/m31/remediation.ts"), "utf8");
  assert.match(remediation, /--apply-test-quarantine/);
  assert.match(remediation, /--confirm=M31-UNPUBLISH-PUBLIC-TESTS/);
  assert.match(remediation, /update\(\{ status: "rejected" \}\)/);
  assert.match(remediation, /--apply-legacy-public-requeue/);
  assert.match(remediation, /--confirm=M31-REQUEUE-LEGACY-PUBLISHED/);
  assert.match(remediation, /update\(\{ status: "pending" \}\)/);
  assert.match(remediation, /\.is\("qualification_rule_version", null\)/);
  assert.match(remediation, /Legacy requeue refused until forward migration 0013/);
  assert.doesNotMatch(remediation, /\.delete\s*\(/);
});

console.log(`\n${passed} M31 data-trust tests passed.`);
