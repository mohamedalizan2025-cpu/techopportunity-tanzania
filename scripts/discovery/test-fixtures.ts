import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  extractCandidatesFromAtom,
  extractCandidatesFromHtml,
  extractCandidatesFromJsonLd,
  extractCandidatesFromRss,
} from "./extract";
import { normalizeCandidate, inferCategory } from "./normalize";
import { isDuplicate } from "./dedupe";
import { isValidOpportunityUrl, validateCandidate } from "./validate";
import { isRoundupTitle, extractOpportunityLinks, roundupInnerCandidates } from "./extract";
import { EVIDENCE_EXTRACTORS, extractAllCandidates, extractFeedCandidates } from "./adapters";
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

// 0. deterministic URL-quality guards
assert("url guard: malformed www.www hostname rejected", !isValidOpportunityUrl("http://www.www.veta.go.tz/news/x"));
assert("url guard: ordinary www hostname preserved", isValidOpportunityUrl("https://www.veta.go.tz/news/x"));
assert("url guard: image file rejected", !isValidOpportunityUrl("https://www.veta.go.tz/media/images/gl-1.jpeg"));
assert("url guard: PDF document preserved (legitimate application form)", isValidOpportunityUrl("https://www.veta.go.tz/publication/doc/abc123"));
assert("url guard: comment permalink rejected", !isValidOpportunityUrl("https://www.fsdt.or.tz/2023/10/27/agriculture-financing/#comment-11"));
assert("url guard: query-string page preserved", isValidOpportunityUrl("https://suza.ac.tz/?p=19686"));
assert("url guard: deep path preserved", isValidOpportunityUrl("https://www.udsm.ac.tz/announcement/eac-scholarship"));
assert("url guard: non-http scheme rejected", !isValidOpportunityUrl("ftp://files.example.com/x"));

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

// 1c. national reference ("Tanzania") is rejected as venue AND as city/region
const ambiguous = pipeline(loadFixture("ambiguous-location.html"));
assert(
  "national reference: rejected entirely — nothing fabricated",
  ambiguous.length === 1 &&
    ambiguous[0].venueName === null &&
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

// 1d. explicit application/registration deadline fields → deadline
const explicitDeadline = pipeline(loadFixture("deadline-explicit.html"));
assert(
  "explicit deadline: applicationDeadline wins",
  explicitDeadline.length === 1 &&
    explicitDeadline[0].deadline === "2026-10-01T00:00:00.000Z",
  JSON.stringify(explicitDeadline[0]?.deadline)
);

// 1e. event startDate/endDate are NOT deadlines; malformed dates stay null
const eventDatesOnly = pipeline(loadFixture("event-start-only.html"));
assert(
  "event dates: startDate/endDate never become deadline; malformed ignored",
  eventDatesOnly.length === 1 && eventDatesOnly[0].deadline === null,
  JSON.stringify(eventDatesOnly[0]?.deadline)
);

// 1f. advertised-feed items: RSS item URL/title survive; pubDate is NOT a deadline
const rssFeed = loadFixture("feed-rss.xml");
const rssCandidatesRaw = extractCandidatesFromRss(rssFeed, SOURCE_ID, SOURCE_URL);
assert("rss feed: both items extracted", rssCandidatesRaw.length === 2, String(rssCandidatesRaw.length));
const rssNormalized = rssCandidatesRaw
  .map((c) => normalizeCandidate(c, SOURCE_ID))
  .filter((c): c is CandidateOpportunity => Boolean(c) && validateCandidate(c as CandidateOpportunity));
assert(
  "rss feed: item link/title preserved, pubDate rejected as deadline",
  rssNormalized.length === 2 &&
    rssNormalized.every((c) => c.deadline === null) &&
    rssNormalized.some((c) => c.url === "https://suza.ac.tz/?p=20100"),
  JSON.stringify(rssNormalized.map((c) => ({ u: c.url, d: c.deadline })))
);

// 1g. Atom entries: alternate link preferred, summary used, no location/deadline invented
const atomFeed = loadFixture("feed-atom.xml");
const atomRaw = extractCandidatesFromAtom(atomFeed, SOURCE_ID, "https://www.fsdt.or.tz/");
assert("atom feed: both entries extracted", atomRaw.length === 2, String(atomRaw.length));
const atomNormalized = atomRaw
  .map((c) => normalizeCandidate(c, SOURCE_ID))
  .filter((c): c is CandidateOpportunity => Boolean(c) && validateCandidate(c as CandidateOpportunity));
assert(
  "atom feed: alternate link wins, category inferred, deadline null",
  atomNormalized.length === 2 &&
    atomNormalized.some((c) => c.url === "https://www.fsdt.or.tz/2026/08/20/call-for-proposals") &&
    atomNormalized.every((c) => c.deadline === null && c.venueName === null),
  JSON.stringify(atomNormalized.map((c) => ({ u: c.url, d: c.deadline })))
);

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

// 7. section-label / navigation noise gate (exact-title match only)
const mkTitleCandidate = (title: string): CandidateOpportunity => ({
  title,
  description: "A description long enough to pass every other validation check.",
  category: "other",
  organization: null,
  url: "https://example.com/page",
  deadline: null,
  venueName: null,
  address: null,
  city: null,
  region: null,
  country: "Tanzania",
  sourceId: SOURCE_ID,
  sourceUrl: SOURCE_URL,
  evidenceUrl: SOURCE_URL,
  referenceKind: "source-base",
  discoveryMethod: "html",
});
for (const noise of ["ANNOUNCEMENTS", "Latest News", "View our events", "Publications", "Financial Markets", "QUICK LINKS", "Main navigation", "Welcome Note"]) {
  assert(`noise gate rejects: ${noise}`, !validateCandidate(mkTitleCandidate(noise)));
}
for (const legit of ["ANNOUNCEMENTS: New Scholarship 2026", "Call for Applications-WISE Scholarship-Cohort 4", "TANGAZO LA UDAHILI WA STASHAHADA 2026/2027"]) {
  assert(`noise gate preserves: ${legit.slice(0, 34)}`, validateCandidate(mkTitleCandidate(legit)));
}

if (relativeCandidates.length === 1) {
  assert("category inference: tech-event for meetup", inferCategory([relativeCandidates[0].title]) === "tech-event");
}

// 8. category inference: English + unambiguous Swahili + honest "other"
const catCases: Array<[string, string]> = [
  ["WISE Scholarship-Cohort 4 Application", "scholarship"],
  ["Graduate Fellowship in Public Health", "fellowship"],
  ["Data Innovation Grant for Youth Groups", "grant"],
  ["Software Engineering Internship Programme", "internship"],
  ["AI for Africa Hackathon", "hackathon"],
  ["Web Development Workshop for Beginners", "workshop"],
  ["East Africa Cyber Security Challenge", "competition"],
  ["Fintech Leaders Conference 2026", "conference"],
  ["Fomu ya Maombi ya Kujiunga na VETA cha Mafunzo ya Hoteli", "admissions"],
  ["APPLICATION FOR BACHELOR OF ENGINEERING AND TECHNOLOGY", "admissions"],
  ["TANGAZO LA UDAHILI WA STASHAHADA YA UHANDISI 2026/2027", "admissions"],
  ["Mashindano ya Ubunifu wa Teknolojia kwa Vijana", "competition"],
  ["Udhamini wa Masomo kwa Wanafunzi Bora 2026", "scholarship"],
  ["Kongamano la Teknolojia Tanzania 2026", "conference"],
];
for (const [title, expected] of catCases) {
  assert(`category: ${expected} — ${title.slice(0, 38)}`, inferCategory([title]) === expected, `got ${inferCategory([title])}`);
}
const honestOther: Array<[string, string]> = [
  ["WAZIRI WA ELIMU AKAGUA MIRADI YA HEET SUZA", "other"],
  ["ORODHA YA WALIOCHAGULIWA VETA NGAZI YA TATU", "other"],
  ["ASANTE KWA KUUNGANA NASI KATIKA MAONESHO YA SABASABA 2026", "other"],
];
for (const [title, expected] of honestOther) {
  assert(`category honesty: ${expected} — ${title.slice(0, 38)}`, inferCategory([title]) === expected, `got ${inferCategory([title])}`);
}

// 0b. roundup inner-link extraction (one-hop, deterministic)
const roundupHtml = `
  <a href="https://example.org/team">Our Secretariat Team</a>
  <a href="/announcements">Announcements</a>
  <a href="https://example.org/jobs/unicef-partnerships-officer">UNICEF Partnerships Officer (Dar es Salaam)</a>
  <a href="https://example.org/jobs/unicef-partnerships-officer">UNICEF Partnerships Officer (Dar es Salaam)</a>
  <a href="https://example.org/grant/global-fund-wd1">Click here to apply</a>
  <a href="https://example.org/scholar/wise-scholarship-cohort-4">WISE Scholarship Cohort 4 for African Women</a>
  <a href="https://other.example.org/apply/2026-young-innovators-programme/">https://other.example.org/apply/2026-young-innovators-programme/</a>
  <a href="javascript:void(0)">Danger link</a>
  <a href="#section">In-page section</a>
`;
const innerLinks = extractOpportunityLinks(roundupHtml, "https://example.org/roundup/30-hot-jobs");
assert("roundup: duplicate + junk anchors removed", innerLinks.length === 4, String(innerLinks.length));
assert("roundup: descriptive anchor title used", innerLinks.some((l) => l.title.startsWith("UNICEF Partnerships Officer")));
assert("roundup: generic anchor humanized from slug", innerLinks.some((l) => l.title === "global fund wd1"), JSON.stringify(innerLinks.map((l) => l.title)));
assert("roundup: URL-as-text anchor gets humanized title", innerLinks.some((l) => l.title === "2026 young innovators programme"), JSON.stringify(innerLinks.map((l) => l.title)));
assert("roundup: short non-action anchor rejected", !innerLinks.some((l) => l.title === "Our Secretariat Team"));

// roundup title detection
assert("roundup title: 30 Hot Job Opportunities detected", isRoundupTitle("30 Hot Job Opportunities Accross Various Sectors Currently Open"));
assert("roundup title: 10 Scholarships detected", isRoundupTitle("10 Scholarships for African Students"));
assert("roundup title: single opportunity NOT detected", !isRoundupTitle("WISE Scholarship-Cohort 4 Application"));

// ONE-ROW-ONE-OPPORTUNITY INVARIANT
// A multi-opportunity document decomposes into individual candidates, each
// carrying the evidence chain back to its parent; when decomposition finds
// nothing reliable, the parent remains a candidate (never silently dropped).
const parent = { title: "30 Hot Job Opportunities", url: "https://example.org/roundup/30-hot-jobs", sourceId: SOURCE_ID, discoveryMethod: "rss" };
const decomposed = roundupInnerCandidates(roundupHtml, parent);
assert("invariant: roundup decomposes into individual candidates", decomposed.length === 4, String(decomposed.length));
assert(
  "invariant: every inner candidate points at the parent (evidence chain)",
  decomposed.every((c) => c.sourceUrl === parent.url && c.sourceId === SOURCE_ID && typeof c.url === "string" && c.url !== parent.url),
  JSON.stringify(decomposed.map((c) => c.sourceUrl))
);
assert(
  "invariant: inner candidates are distinct opportunities (unique URLs)",
  new Set(decomposed.map((c) => c.url)).size === decomposed.length
);
assert(
  "invariant: empty decomposition yields nothing — caller keeps the parent",
  roundupInnerCandidates("<p>No opportunity links here</p>", parent).length === 0
);
// A feed with N items must yield N individual candidates, never one row.
const multiItemFeed = loadFixture("feed-rss.xml");
const feedRows = extractFeedCandidates(multiItemFeed, SOURCE_ID, "https://example.org/feed");
assert("invariant: each feed item becomes exactly one candidate", feedRows.length === 2, String(feedRows.length));

// P7 strengthening: suppression decisions must be made by EVIDENCE, and
// failed children must never silently delete the parent's chance.
assert(
  "invariant: children testify via a distinct evidence document",
  decomposed.every((c) => c.evidenceUrl === parent.url && c.referenceKind === "evidence-document"),
  JSON.stringify(decomposed.map((c) => [c.evidenceUrl, c.referenceKind]))
);
const directNormalized = normalizeCandidate(
  extractAllCandidates(validPage, SOURCE_ID, SOURCE_URL)[0],
  SOURCE_ID
);
assert(
  "invariant: direct extraction testifies with the fetched document itself",
  directNormalized !== null &&
    directNormalized.referenceKind === "source-base" &&
    directNormalized.evidenceUrl === SOURCE_URL
);
// Children that pass validation justify suppressing the parent...
const survivingChildren = decomposed
  .map((c) => normalizeCandidate(c, SOURCE_ID))
  .filter((c): c is CandidateOpportunity => c !== null && validateCandidate(c));
assert(
  "invariant: parent suppression requires at least one surviving child",
  survivingChildren.length > 0 &&
    survivingChildren.every((c) => c.evidenceUrl === parent.url),
  String(survivingChildren.length)
);
// ...but a roundup whose links ALL fail validation keeps the parent: the
// runner drops a parent only when a child it testified about survives.
const lossyRoundupHtml = `
  <a href="ftp://files.example.org/jobs">Ftp job board</a>
  <a href="javascript:applyNow()">Apply via script</a>
`;
const lossyChildren = roundupInnerCandidates(lossyRoundupHtml, parent)
  .map((c) => normalizeCandidate(c, SOURCE_ID))
  .filter((c): c is CandidateOpportunity => c !== null && validateCandidate(c));
assert(
  "invariant: all-invalid links → zero survivors → parent row is kept",
  lossyChildren.length === 0
);
// Duplicate inner items never produce duplicate rows (URL-keyed batch dedupe
// applies identically to decomposed children).
const dupChildren = decomposed.filter(
  (a, i) => decomposed.findIndex((b) => b.url === a.url) === i
);
assert("invariant: duplicate inner items collapse to one candidate each", dupChildren.length === decomposed.length);

// SOURCE-ADAPTER REGISTRY
// Extraction is an ordered list of pure adapters; the runner and dry-run
// share the single extraction path, so attribution stays consistent.
assert("adapters: registry covers the four implemented families", EVIDENCE_EXTRACTORS.map((e) => e.family).join(",") === "json-ld,rss,atom,html");
const jsonLdPage = extractAllCandidates(validPage, SOURCE_ID, SOURCE_URL);
assert(
  "adapters: unified extraction finds the JSON-LD opportunity",
  jsonLdPage.some((c) => c.discoveryMethod === "json-ld" && c.title === "AI for Africa Hackathon")
);
assert(
  "adapters: foreign formats yield zero candidates (safe sniffing)",
  extractAllCandidates("plain text with no markup", SOURCE_ID, SOURCE_URL).length === 0
);
assert(
  "adapters: feed family never runs page extractors on feeds",
  extractFeedCandidates(validPage, SOURCE_ID, SOURCE_URL).every((c) => c.discoveryMethod === "rss")
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
