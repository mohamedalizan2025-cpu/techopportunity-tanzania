import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { extractCandidatesFromRss, extractCandidatesFromJsonLd, extractCandidatesFromHtml } from "./extract";
import { normalizeCandidate, inferCategory } from "./normalize";
import { isDuplicate } from "./dedupe";
import { validateCandidate } from "./validate";
import type { CandidateOpportunity } from "./types";

const SOURCE_ID = "00000000-0000-0000-0000-000000000001";
const SOURCE_URL = "https://source.example.com";

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function loadFixture(file: string): string {
  return readFileSync(resolve("scripts/discovery/fixtures", file), "utf8");
}

function pipeline(html: string): CandidateOpportunity[] {
  const raw = [
    ...extractCandidatesFromRss(html, SOURCE_ID, SOURCE_URL),
    ...extractCandidatesFromJsonLd(html, SOURCE_ID, SOURCE_URL),
    ...extractCandidatesFromHtml(html, SOURCE_ID, SOURCE_URL),
  ];
  const accepted: CandidateOpportunity[] = [];
  for (const item of raw) {
    const candidate = normalizeCandidate(item, SOURCE_ID);
    if (!candidate || !validateCandidate(candidate)) continue;
    if (
      accepted.some((a) => a.url === candidate.url) ||
      isDuplicate(candidate, accepted.map((a) => ({ url: a.url, source_id: a.sourceId, title: a.title, deadline: a.deadline })))
    ) {
      continue;
    }
    accepted.push(candidate);
  }
  return accepted;
}

// 1. valid opportunity
const validPage = loadFixture("valid-opportunity.html");
const validCandidates = pipeline(validPage);
assert("valid opportunity: exactly one candidate", validCandidates.length === 1, `got ${validCandidates.length}`);
assert(
  "valid opportunity: correct fields",
  validCandidates.length === 1 &&
    validCandidates[0].title === "AI for Africa Hackathon" &&
    validCandidates[0].url === "https://example.com/hackathon" &&
    validCandidates[0].discoveryMethod === "json-ld",
  JSON.stringify(validCandidates)
);

// 1b. explicit JSON-LD location extracted into structured fields
assert(
  "valid opportunity: JSON-LD location structured",
  validCandidates.length === 1 &&
    validCandidates[0].venueName === "Costech Building" &&
    validCandidates[0].city === "Dar es Salaam" &&
    validCandidates[0].region === "Dar es Salaam" &&
    validCandidates[0].address === "Ali Hassan Mwinyi Road",
  JSON.stringify(validCandidates[0])
);

// 1c. ambiguous bare-string location stays traceable but unstructured
const ambiguous = pipeline(loadFixture("ambiguous-location.html"));
assert(
  "ambiguous location: venue kept, city/region stay null",
  ambiguous.length === 1 &&
    ambiguous[0].venueName === "Tanzania" &&
    ambiguous[0].city === null &&
    ambiguous[0].region === null &&
    ambiguous[0].address === null,
  JSON.stringify(ambiguous)
);

// 2 + 6. missing deadline is tolerated, category inferred from keywords
if (validCandidates.length === 1) {
  assert("missing deadline: candidate survives with null deadline", validCandidates[0].deadline === null);
  assert("category inference: hackathon", validCandidates[0].category === "hackathon", `got ${validCandidates[0].category}`);
}

// 3. duplicate page against existing rows and within batch
const duplicateAccepted = pipeline(loadFixture("duplicate-page.html"));
assert("duplicate within batch: collapsed to one candidate", duplicateAccepted.length <= 1);
const duplicateAgainstExisting =
  duplicateAccepted.length > 0 && isDuplicate(duplicateAccepted[0], [{ url: "https://example.com/hackathon", source_id: SOURCE_ID, title: null, deadline: null }]);
assert("duplicate vs existing db rows: detected", duplicateAccepted.length === 0 || duplicateAgainstExisting);

// 4. malformed JSON-LD is skipped without crashing
const malformedTotal = pipeline(loadFixture("malformed-jsonld.html")).length;
assert("malformed JSON-LD: zero candidates", malformedTotal === 0, `got ${malformedTotal}`);

// 5. malformed / dangerous URLs produce nothing
const invalidUrlTotal = pipeline(loadFixture("invalid-url.html")).length;
assert("malformed URL: javascript: anchor rejected", invalidUrlTotal === 0, `got ${invalidUrlTotal}`);

// 7. irrelevant page yields nothing
const irrelevantTotal = pipeline(loadFixture("no-opportunity-page.html")).length;
assert("irrelevant page: zero candidates", irrelevantTotal === 0, `got ${irrelevantTotal}`);

// 8. explicitly invalid category value is rejected even though inference could rescue it
const bogusCategory = normalizeCandidate(
  {
    title: "Made-up Opportunity Title",
    description: "A description long enough to pass validation checks.",
    url: "https://example.com/bogus",
    category: "galactic-tourism",
  },
  SOURCE_ID
);
assert("invalid category: explicit bad value rejected", bogusCategory === null);

// 9. relative links resolve against the source base URL instead of being dropped
const relativeHtml = `<html><body><h1>Annual Developers Meetup</h1><a href="/events/meetup-2026">info</a></body></html>`;
const relativeCandidates = pipeline(relativeHtml);
assert(
  "relative URL: resolved against source base",
  relativeCandidates.length === 1 && relativeCandidates[0].url === `${SOURCE_URL}/events/meetup-2026`,
  JSON.stringify(relativeCandidates)
);
if (relativeCandidates.length === 1) {
  assert("category inference: tech-event for meetup", inferCategory([relativeCandidates[0].title]) === "tech-event");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
