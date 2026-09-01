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

const foreignLocationOnly = qualifyOpportunity(candidate(
  "Intuit IDEAS Program 2026 for Small Businesses",
  "Eligibility: The program is open to small businesses located in: Atlanta, GA; Charlotte, NC; Chicago, IL; Dallas/Fort Worth, TX; Los Angeles, CA; New York City, NY; Philadelphia, PA; San Diego, CA; and West Virginia."
));
assert("explicit foreign operating-location restriction is excluded", foreignLocationOnly.tanzaniaAccessibility === "tanzanians_not_eligible");
assert("foreign operating-location exclusion stays out of moderation", !shouldEnterModerationQueue(foreignLocationOnly));

const venueOnly = qualifyOpportunity(candidate(
  "Open Source Conference 2026",
  "Applications are open. The conference takes place in Toronto, Canada."
));
assert("foreign venue alone never becomes eligibility", venueOnly.tanzaniaAccessibility === "unknown");

const tanzaniaBusinessLocation = qualifyOpportunity(candidate(
  "Small Business Innovation Program 2026",
  "Eligibility: The program is open to small businesses located in Tanzania."
));
assert("Tanzania operating location alone never proves applicant eligibility", tanzaniaBusinessLocation.tanzaniaAccessibility === "unknown");

const globalWordOnly = qualifyOpportunity(candidate("Global AI Developer Challenge 2026"));
assert("bare global wording never proves eligibility", globalWordOnly.tanzaniaAccessibility === "unknown");
assert("unknown eligibility remains pending", shouldEnterModerationQueue(globalWordOnly));

const worldwide = qualifyOpportunity(candidate(
  "Open Source Hackathon 2026",
  "Applications are open to developers from all countries worldwide."
));
assert("explicit worldwide access includes Tanzanians", worldwide.tanzaniaAccessibility === "tanzanians_eligible");

const allNationalities = qualifyOpportunity(candidate(
  "Global Research Fellowship 2027",
  "People of all nationalities are welcome to apply."
));
assert("explicit all-nationalities access includes Tanzanians", allNationalities.tanzaniaAccessibility === "tanzanians_eligible");

const worldBankMember = qualifyOpportunity(candidate(
  "World Bank Group Young Professionals Program 2027",
  "Nationality: Applicants must hold the nationality of a World Bank Group member country."
));
assert("explicit WBG member-country nationality includes Tanzanians", worldBankMember.tanzaniaAccessibility === "tanzanians_eligible");
assert("WBG eligibility preserves the measured evidence text", Boolean(worldBankMember.eligibilityEvidence?.match(/World Bank Group member country/i)));
const genericMemberCountry = qualifyOpportunity(candidate(
  "Research Fellowship 2027",
  "Applicants must hold the nationality of a member country."
));
assert("generic member-country wording remains unknown", genericMemberCountry.tanzaniaAccessibility === "unknown");

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
const priorCohort = qualifyOpportunity(candidate("Innovation Fellowship 2025"), new Date("2026-09-01T00:00:00Z"));
assert("prior-year-only cohort is not actionable", priorCohort.relevance === "not_relevant");
const crossYearCohort = qualifyOpportunity(candidate("Innovation Fellowship 2025/2026"), new Date("2026-09-01T00:00:00Z"));
assert("cross-year cohort containing current year is not stale", crossYearCohort.relevance === "relevant");

const admissionCandidate = candidate("APPLICATION FOR BACHELOR OF ENGINEERING 2026/2027");
admissionCandidate.category = "admissions";
const admission = qualifyOpportunity(admissionCandidate);
assert("university admission remains outside product scope", admission.relevance === "not_relevant");
assert("admission eligibility stays unknown without evidence", admission.tanzaniaAccessibility === "unknown");

const genericScholarship = qualifyOpportunity(candidate("Leadership Scholarship 2027 Applications Open"));
assert("generic scholarship without technology or research evidence is rejected", genericScholarship.relevance === "not_relevant");
const researchScholarship = qualifyOpportunity(candidate("Data Science Research Scholarship 2027 Applications Open"));
assert("technology research scholarship remains relevant", researchScholarship.relevance === "relevant");
const genericInternship = qualifyOpportunity(candidate("Bank Internship Opportunities 2027"));
assert("generic internship without product-scope evidence is rejected", genericInternship.relevance === "not_relevant");
const softwareInternship = qualifyOpportunity(candidate("Software Engineering Internship Opportunities 2027"));
assert("software internship remains relevant", softwareInternship.relevance === "relevant");

const vague = qualifyOpportunity(candidate("Digital Transformation Programme"));
assert("vague programme remains ambiguous", vague.relevance === "ambiguous");
assert("ambiguous record is preserved for humans", shouldEnterModerationQueue(vague));
assert("ambiguous record has no invented evidence", vague.evidenceQuality === "none");

const institutionalVague = qualifyOpportunity(
  candidate("Master of Mobile Computing"),
  new Date("2026-09-01T00:00:00Z"),
  { sourceType: "university" },
);
assert("institutional course title without opportunity evidence is rejected", institutionalVague.relevance === "not_relevant");
assert("institutional ambiguity does not enter moderation", !shouldEnterModerationQueue(institutionalVague));
const aggregatorVague = qualifyOpportunity(
  candidate("Visiting Research Scholars Programme 2027"),
  new Date("2026-09-01T00:00:00Z"),
  { sourceType: "other" },
);
assert("aggregator ambiguity remains available to moderators", aggregatorVague.relevance === "ambiguous");
const institutionalExplicit = qualifyOpportunity(
  candidate("Call for Applications: AI Innovation Challenge 2027"),
  new Date("2026-09-01T00:00:00Z"),
  { sourceType: "ngo" },
);
assert("institutional candidate with explicit opportunity evidence survives", institutionalExplicit.relevance === "relevant");

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
