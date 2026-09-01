import { qualifyOpportunity, shouldEnterModerationQueue } from "../scripts/discovery/qualification";
import type { CandidateOpportunity } from "../scripts/discovery/types";

let passed = 0;
let failed = 0;
function assert(name: string, condition: boolean, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`  PASS ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const candidate = (title: string, description = "A sufficiently detailed opportunity description."): CandidateOpportunity => ({
  title,
  description,
  category: "other",
  organization: null,
  url: "https://example.org/opportunity",
  deadline: null,
  venueName: null,
  address: null,
  city: null,
  region: null,
  country: null,
  sourceId: "source",
  sourceUrl: "https://example.org/feed",
  evidenceUrl: "https://example.org/opportunity",
  referenceKind: "source-base",
  discoveryMethod: "rss",
});

const africa = qualifyOpportunity(candidate(
  "AI Security Fellowship 2026",
  "Applications are open to women who are African and currently reside in an African country."
));
assert("separate dimensions: target class is relevant", africa.relevance === "relevant");
assert("Africa-wide evidence includes Tanzanians", africa.tanzaniaAccessibility === "tanzanians_eligible");
assert("explicit eligibility produces explicit evidence quality", africa.evidenceQuality === "explicit");
assert("eligible candidate enters moderation", shouldEnterModerationQueue(africa));

const kenyaOnly = qualifyOpportunity(candidate("Kenya AI Accelerator 2026 for Kenyan Startups and Innovators"));
assert("explicit other nationality is excluded", kenyaOnly.tanzaniaAccessibility === "tanzanians_not_eligible");
assert("explicit exclusion does not enter moderation", !shouldEnterModerationQueue(kenyaOnly));
assert("exclusion retains supporting text", Boolean(kenyaOnly.eligibilityEvidence?.match(/Kenyan/i)));
const southAfricansOnly = qualifyOpportunity(candidate("Graduate Programme 2027 for young South Africans"));
assert("plural other-nationality restriction is excluded", southAfricansOnly.tanzaniaAccessibility === "tanzanians_not_eligible");

const globalWordOnly = qualifyOpportunity(candidate("Global AI Developer Challenge 2026"));
assert("bare global wording never proves eligibility", globalWordOnly.tanzaniaAccessibility === "unknown");
assert("unknown eligibility remains pending", shouldEnterModerationQueue(globalWordOnly));

const worldwide = qualifyOpportunity(candidate(
  "Open Source Hackathon 2026",
  "Applications are open to developers from all countries worldwide."
));
assert("explicit worldwide access includes Tanzanians", worldwide.tanzaniaAccessibility === "tanzanians_eligible");

const located = candidate("Innovation Programme 2026");
located.country = "Tanzania";
located.city = "Dar es Salaam";
const locationUnknown = qualifyOpportunity(located);
assert("Tanzania location never becomes eligibility", locationUnknown.tanzaniaAccessibility === "unknown");

const university = qualifyOpportunity(candidate("UNIVERSITY OF DAR ES SALAAM"));
assert("generic institution page is not relevant", university.relevance === "not_relevant");
assert("generic institution page is rejected", !shouldEnterModerationQueue(university));

const report = qualifyOpportunity(candidate("ANNUAL REPORT 2024"));
assert("annual report is not relevant", report.relevance === "not_relevant");

const news = qualifyOpportunity(candidate("DIT Alliance Showcases Horizon Fellow Program at the Trade Fair"));
assert("reporting headline is not an opportunity", news.relevance === "not_relevant");
const collaborationGrant = qualifyOpportunity(candidate("Call for Research Collaboration Grants 2026"));
assert("opportunity collaboration wording is not treated as news", collaborationGrant.relevance !== "not_relevant");

const stale = qualifyOpportunity(candidate("2016 Yale World Fellows Program"), new Date("2026-09-01T00:00:00Z"));
assert("clearly stale dated listing is not actionable", stale.relevance === "not_relevant");

const admission = qualifyOpportunity(candidate("APPLICATION FOR BACHELOR OF ENGINEERING 2026/2027"));
assert("actionable admission is relevant", admission.relevance === "relevant");
assert("admission eligibility stays unknown without evidence", admission.tanzaniaAccessibility === "unknown");

const vague = qualifyOpportunity(candidate("Digital Transformation Programme"));
assert("vague programme remains ambiguous", vague.relevance === "ambiguous");
assert("ambiguous record is preserved for humans", shouldEnterModerationQueue(vague));
assert("ambiguous record has no invented evidence", vague.evidenceQuality === "none");

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
