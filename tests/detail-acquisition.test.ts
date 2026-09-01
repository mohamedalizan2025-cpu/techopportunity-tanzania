import {
  MAX_DETAIL_FETCHES_PER_SOURCE,
  applyDetailEvidence,
  createBoundedDetailAcquirer,
  extractDetailEvidence,
  supportsDetailAcquisition,
} from "../scripts/discovery/detail";
import { qualifyOpportunity, shouldEnterModerationQueue } from "../scripts/discovery/qualification";
import type { CandidateOpportunity, SourceRecord } from "../scripts/discovery/types";

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

const source = (name = "OpportunityDesk", baseUrl = "https://opportunitydesk.org/feed/"): SourceRecord => ({
  id: "source-1",
  name,
  base_url: baseUrl,
  source_type: "other",
  country: "Global",
  region: null,
  active: true,
  last_checked_at: null,
  last_success_at: null,
  last_error: null,
});

const candidate = (url = "https://opportunitydesk.org/2026/09/01/example-program/"): CandidateOpportunity => ({
  title: "Example Fellowship 2026",
  description: "Feed summary without eligibility or deadline evidence.",
  category: "fellowship",
  organization: "Unknown organization",
  url,
  deadline: null,
  venueName: null,
  address: null,
  city: null,
  region: null,
  country: null,
  sourceId: "source-1",
  sourceUrl: "https://opportunitydesk.org/feed/",
  evidenceUrl: "https://opportunitydesk.org/feed/",
  referenceKind: "source-base",
  discoveryMethod: "rss",
});

const africaHtml = `
  <html><body><article>
    <h1>Exact Africa Technology Fellowship 2026</h1>
    <p>Application Deadline: 13 September 2026, 17:00 EAT</p>
    <p>Applications are now open for the fellowship.</p>
    <h2>Requirements</h2>
    <p>Be a citizen of an African Union Member State. Applicants must have two years of experience.</p>
    <h2>Application</h2>
    <a href="https://apply.example.org/africa-fellowship">Apply Now</a>
  </article></body></html>`;

const africa = extractDetailEvidence(africaHtml, candidate().url);
assert("canonical detail title extracted", africa.canonicalTitle === "Exact Africa Technology Fellowship 2026");
assert("explicit application deadline parsed", africa.deadline === "2026-09-13T00:00:00.000Z", String(africa.deadline));
assert("deadline text preserved exactly", africa.deadlineEvidence === "Application Deadline: 13 September 2026, 17:00 EAT");
assert("application URL extracted without fetching it", africa.applicationUrl === "https://apply.example.org/africa-fellowship");
assert("eligibility section preserved", Boolean(africa.eligibilityEvidence?.includes("African Union Member State")));
assert("relevance action preserved", Boolean(africa.relevanceEvidence?.match(/Applications are now open/i)));

const enrichedAfrica = applyDetailEvidence(candidate(), africa);
const africaQualification = qualifyOpportunity(enrichedAfrica);
assert("detail title replaces imprecise feed title", enrichedAfrica.title === africa.canonicalTitle);
assert("detail page becomes evidence URL", enrichedAfrica.evidenceUrl === candidate().url && enrichedAfrica.sourceUrl === candidate().url);
assert("Africa-wide evidence includes Tanzanians", africaQualification.tanzaniaAccessibility === "tanzanians_eligible");
assert("Africa-wide opportunity remains pending", shouldEnterModerationQueue(africaQualification));

const canadaHtml = `<article><h1>Canada Small Business 100</h1><p>Deadline: September 6, 2026</p><p>Nominations are now open.</p><h2>Eligibility</h2><p>The primary executive must be a Canadian resident.</p><h2>Application</h2></article>`;
const canadaQualification = qualifyOpportunity(applyDetailEvidence(candidate(), extractDetailEvidence(canadaHtml, candidate().url)));
assert("explicit Canadian-only detail is rejected", canadaQualification.tanzaniaAccessibility === "tanzanians_not_eligible");
assert("foreign-only detail does not enter moderation", !shouldEnterModerationQueue(canadaQualification));

const foreignLocationHtml = `<article><h1>Small Business Support Program</h1><p>Applications are open.</p><h2>Eligibility</h2><p>The program is open to small businesses located in: Atlanta, GA; Charlotte, NC; Chicago, IL; Dallas/Fort Worth, TX; Los Angeles, CA; New York City, NY; Philadelphia, PA; San Diego, CA; and West Virginia.</p><h2>Application</h2></article>`;
const foreignLocationQualification = qualifyOpportunity(applyDetailEvidence(candidate(), extractDetailEvidence(foreignLocationHtml, candidate().url)));
assert("explicit foreign operating-location detail is rejected", foreignLocationQualification.tanzaniaAccessibility === "tanzanians_not_eligible");
assert("foreign operating-location detail stays out of moderation", !shouldEnterModerationQueue(foreignLocationQualification));

const unknownHtml = `<article><h1>Research Fellowship 2027</h1><p>Deadline: October 1, 2026</p><p>Applications are open for researchers.</p><h2>Eligibility</h2><p>Applicants must hold a PhD awarded after January 2023.</p><h2>Application</h2></article>`;
const unknown = applyDetailEvidence(candidate(), extractDetailEvidence(unknownHtml, candidate().url));
assert("non-geographic requirements leave eligibility unknown", qualifyOpportunity(unknown).tanzaniaAccessibility === "unknown");

const missingDeadlineHtml = `<article><h1>Open Source Fellowship</h1><p>Applications are open for developers.</p><h2>Eligibility</h2><p>Applicants need one year of experience.</p></article>`;
const missingDeadline = extractDetailEvidence(missingDeadlineHtml, candidate().url);
assert("missing deadline stays unknown", missingDeadline.deadline === null && missingDeadline.deadlineKind === "unknown" && missingDeadline.deadlineEvidence === null);

const rollingHtml = `<article><h1>Small Business Support Program</h1><p>Deadline: Rolling Basis</p><p>Applications are open for small businesses.</p></article>`;
const rolling = extractDetailEvidence(rollingHtml, candidate().url);
assert("explicit rolling evidence preserved", rolling.deadline === null && rolling.deadlineKind === "rolling" && rolling.deadlineEvidence === "Deadline: Rolling Basis");
assert("rolling is not fabricated as a date", applyDetailEvidence({ ...candidate(), deadline: "2026-12-01T00:00:00.000Z" }, rolling).deadline === null);

const editorialHtml = `<article><h1>Finding Yourself in a Busy World</h1><p>A reflective essay about attention, priorities and personal growth.</p></article>`;
const editorial = applyDetailEvidence(candidate(), extractDetailEvidence(editorialHtml, candidate().url));
assert("generic editorial detail is not relevant", qualifyOpportunity(editorial).relevance === "not_relevant");
assert("generic editorial detail is rejected", !shouldEnterModerationQueue(qualifyOpportunity(editorial)));

const locationHtml = `<article><h1>Developer Conference 2026</h1><p>Applications are open.</p><p>Location: Dar es Salaam Innovation Hub.</p></article>`;
assert("explicit labeled location preserved", extractDetailEvidence(locationHtml, candidate().url).location === "Dar es Salaam Innovation Hub");

assert("measured OpportunityDesk item is supported", supportsDetailAcquisition(source(), candidate()));
assert("unregistered source is outside detail boundary", !supportsDetailAcquisition(source("Example", "https://example.org/feed"), candidate("https://example.org/item")));
assert("roundup child is outside detail boundary", !supportsDetailAcquisition(source(), { ...candidate(), referenceKind: "evidence-document" }));
assert("foreign item host is outside source boundary", !supportsDetailAcquisition(source(), candidate("https://example.org/item")));

async function asyncTests() {
  let duplicateCalls = 0;
  const duplicateAcquirer = createBoundedDetailAcquirer(source(), async () => {
    duplicateCalls += 1;
    return africaHtml;
  });
  const duplicateCandidate = candidate();
  const [first, second] = await Promise.all([
    duplicateAcquirer.enrich(duplicateCandidate),
    duplicateAcquirer.enrich({ ...duplicateCandidate }),
  ]);
  assert("duplicate detail URL fetched once", duplicateCalls === 1, String(duplicateCalls));
  assert("duplicate detail URL reuses evidence", Boolean(first.detailEvidence) && Boolean(second.detailEvidence));

  const requested: string[] = [];
  const oneHop = createBoundedDetailAcquirer(source(), async (url) => {
    requested.push(url);
    return africaHtml;
  });
  const oneHopResult = await oneHop.enrich(candidate());
  assert("one candidate makes one detail request", requested.length === 1 && requested[0] === candidate().url);
  assert("application URL is recorded but never followed", !requested.includes(oneHopResult.detailEvidence?.applicationUrl ?? ""));

  let isolationCalls = 0;
  const isolated = createBoundedDetailAcquirer(source(), async () => {
    isolationCalls += 1;
    if (isolationCalls === 1) throw new Error("unreachable");
    return africaHtml;
  });
  const failedCandidate = candidate("https://opportunitydesk.org/first/");
  const survivingCandidate = candidate("https://opportunitydesk.org/second/");
  const afterFailure = await isolated.enrich(failedCandidate);
  const afterSuccess = await isolated.enrich(survivingCandidate);
  const isolatedMetrics = isolated.metrics();
  assert("unreachable detail preserves original candidate", afterFailure.detailEvidence === undefined && afterFailure.title === failedCandidate.title);
  assert("detail failure is isolated from next candidate", Boolean(afterSuccess.detailEvidence));
  assert("failure metrics are explicit", isolatedMetrics.fetches === 2 && isolatedMetrics.failures === 1 && isolatedMetrics.succeeded === 1);

  let boundedCalls = 0;
  const bounded = createBoundedDetailAcquirer(source(), async () => {
    boundedCalls += 1;
    return africaHtml;
  });
  for (let index = 0; index < MAX_DETAIL_FETCHES_PER_SOURCE + 2; index += 1) {
    await bounded.enrich(candidate(`https://opportunitydesk.org/item-${index}/`));
  }
  assert("per-source detail volume is capped", boundedCalls === MAX_DETAIL_FETCHES_PER_SOURCE, String(boundedCalls));

  let unsupportedCalls = 0;
  const unsupported = createBoundedDetailAcquirer(source("Other", "https://example.org/feed"), async () => {
    unsupportedCalls += 1;
    return africaHtml;
  });
  await unsupported.enrich(candidate("https://example.org/item"));
  assert("unsupported source performs no network request", unsupportedCalls === 0);
}

asyncTests().then(() => {
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exitCode = failed > 0 ? 1 : 0;
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
