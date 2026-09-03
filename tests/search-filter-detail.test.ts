/** Focused M28 search, filter, sorting, detail-navigation and security tests. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildHref } from "../components/opportunity-filters";
import {
  applyPublicOpportunityQuery,
  derivePublishedLocations,
  parseDeadlineFilter,
  parseOpportunityCategory,
  parseOpportunitySort,
  sanitizeFilterValue,
  sanitizeSearchQuery,
} from "../lib/data/opportunities";
import {
  formatDiscoveredDate,
  formatResultCount,
  opportunityHref,
  sanitizeBrowseReturnHref,
  sourceHostname,
  UNKNOWN_TANZANIA_ELIGIBILITY,
} from "../lib/opportunity-presentation";
import type { Opportunity } from "../lib/types";

const NOW = new Date("2026-09-03T12:00:00.000Z");

function makeOpportunity(
  slug: string,
  overrides: Partial<Opportunity> = {}
): Opportunity {
  return {
    id: slug,
    slug,
    title: `Opportunity ${slug}`,
    category: "other",
    organization: null,
    sourceName: null,
    discoveredAt: null,
    description: "Technology opportunity for builders.",
    url: `https://example.org/${slug}`,
    deadline: null,
    location: null,
    imageUrl: null,
    status: "published",
    createdAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

const aiTitle = makeOpportunity("ai-title", {
  title: "AI Developer Scholarship",
  category: "scholarship",
  organization: "Open Technology Fund",
  sourceName: "Tech Grants Africa",
  description: "Funding for software builders.",
  deadline: "2026-09-08T12:00:00.000Z",
  createdAt: "2026-08-20T00:00:00.000Z",
  discoveredAt: "2026-08-19T00:00:00.000Z",
  location: {
    venueName: null,
    address: null,
    city: "Arusha",
    region: "Arusha",
    country: "Tanzania",
    latitude: null,
    longitude: null,
  },
});
const aiDescription = makeOpportunity("ai-description", {
  title: "Emerging Technology Award",
  category: "competition",
  description: "Build an AI startup product with regional mentors.",
  deadline: "2026-10-20T12:00:00.000Z",
  createdAt: "2026-09-02T00:00:00.000Z",
});
const fellowship = makeOpportunity("research-fellowship", {
  title: "Digital Public Goods Programme",
  category: "fellowship",
  organization: "Africa Research Foundation",
  sourceName: "Research Calls",
  description: "A programme for machine learning researchers.",
  createdAt: "2026-09-01T00:00:00.000Z",
  location: {
    venueName: null,
    address: null,
    city: "Moshi",
    region: "Kilimanjaro",
    country: "Tanzania",
    latitude: null,
    longitude: null,
  },
});
const expiredHackathon = makeOpportunity("expired-hackathon", {
  title: "Open Data Hackathon",
  category: "hackathon",
  deadline: "2026-08-15T12:00:00.000Z",
  createdAt: "2026-07-01T00:00:00.000Z",
});
const pendingAi = makeOpportunity("pending-ai", {
  title: "AI Internship",
  category: "internship",
  status: "pending",
  deadline: "2026-09-07T12:00:00.000Z",
});
const rejectedAi = makeOpportunity("rejected-ai", {
  title: "AI Grant",
  category: "grant",
  status: "rejected",
});
const corpus = [
  expiredHackathon,
  fellowship,
  aiDescription,
  pendingAi,
  rejectedAi,
  aiTitle,
];

// Search semantics: natural words across supported fields.
assert.deepEqual(
  applyPublicOpportunityQuery(corpus, { q: "AI" }, NOW).map((item) => item.slug),
  ["ai-title", "ai-description"],
  "title match outranks description match deterministically"
);
assert.deepEqual(
  applyPublicOpportunityQuery(corpus, { q: "research fellowship" }, NOW).map(
    (item) => item.slug
  ),
  ["research-fellowship"],
  "multi-word search may match across organization and category"
);
assert.equal(
  applyPublicOpportunityQuery(corpus, { q: "machine learning" }, NOW)[0]?.slug,
  "research-fellowship"
);
assert.equal(
  applyPublicOpportunityQuery(corpus, { q: "Tech Grants" }, NOW)[0]?.slug,
  "ai-title",
  "source names are searchable"
);
assert.equal(
  applyPublicOpportunityQuery(corpus, { q: "Arusha" }, NOW)[0]?.slug,
  "ai-title",
  "recorded cities are searchable"
);
assert.deepEqual(
  applyPublicOpportunityQuery(corpus, { q: "Tanzania" }, NOW).map(
    (item) => item.slug
  ),
  ["ai-title", "research-fellowship"],
  "recorded country is searchable without implying applicant eligibility"
);
assert.equal(applyPublicOpportunityQuery(corpus, { q: "   " }, NOW).length, 4);
assert.equal(applyPublicOpportunityQuery(corpus, { q: "" }, NOW).length, 4);
assert.equal(sanitizeSearchQuery("  AI,%()';\\  "), "AI");
assert.equal(sanitizeSearchQuery("x"), null);
assert.equal(sanitizeSearchQuery("a".repeat(200))?.length, 120);

// Individual and composed filters.
assert.deepEqual(
  applyPublicOpportunityQuery(corpus, { category: "fellowship" }, NOW).map(
    (item) => item.slug
  ),
  ["research-fellowship"]
);
assert.deepEqual(
  applyPublicOpportunityQuery(corpus, { deadline: "soon" }, NOW).map(
    (item) => item.slug
  ),
  ["ai-title"]
);
assert.deepEqual(
  applyPublicOpportunityQuery(corpus, { deadline: "upcoming" }, NOW).map(
    (item) => item.slug
  ),
  ["ai-title", "ai-description"]
);
assert.deepEqual(
  applyPublicOpportunityQuery(corpus, { deadline: "rolling" }, NOW).map(
    (item) => item.slug
  ),
  ["research-fellowship"]
);
assert.deepEqual(
  applyPublicOpportunityQuery(
    corpus,
    { q: "AI", category: "scholarship", deadline: "soon", region: "arusHA" },
    NOW
  ).map((item) => item.slug),
  ["ai-title"]
);
assert.equal(parseOpportunityCategory("scholarship"), "scholarship");
assert.equal(parseOpportunityCategory("not-real"), null);
assert.equal(parseDeadlineFilter("soon"), "soon");
assert.equal(parseDeadlineFilter("yesterday"), null);
assert.equal(sanitizeFilterValue("  Dar es Salaam  "), "Dar es Salaam");

// Sorting: future deadlines first, unknown next, expired last; all ties stable.
assert.deepEqual(
  applyPublicOpportunityQuery(corpus, { sort: "deadline" }, NOW).map(
    (item) => item.slug
  ),
  ["ai-title", "ai-description", "research-fellowship", "expired-hackathon"]
);
assert.deepEqual(
  applyPublicOpportunityQuery(corpus, { sort: "newest" }, NOW).map(
    (item) => item.slug
  ),
  ["ai-description", "research-fellowship", "ai-title", "expired-hackathon"]
);
assert.equal(parseOpportunitySort(undefined, true), "relevance");
assert.equal(parseOpportunitySort("relevance", false), "deadline");
assert.equal(parseOpportunitySort("nonsense", false), "deadline");

// Published-only defence and derived controls.
assert.equal(
  applyPublicOpportunityQuery(corpus, { q: "AI" }, NOW).some(
    (item) => item.status === "pending" || item.status === "rejected"
  ),
  false
);
assert.deepEqual(derivePublishedLocations(corpus), {
  cities: ["Arusha", "Moshi"],
  regions: ["Arusha", "Kilimanjaro"],
});

// Clean, reproducible URL state and recovery links.
const combinedHref = buildHref("scholarship", "newest", {
  q: "AI developer",
  deadline: "soon",
  region: "Arusha",
});
assert.equal(
  combinedHref,
  "/?q=AI+developer&category=scholarship&deadline=soon&region=Arusha&sort=newest"
);
assert.equal(buildHref(null, "relevance", { q: "AI" }), "/?q=AI");
assert.equal(buildHref(null, "relevance", { q: null }), "/");
assert.equal(formatResultCount(0), "0 opportunities shown");
assert.equal(formatResultCount(1), "1 opportunity shown");
assert.equal(formatResultCount(12), "12 opportunities shown");

assert.equal(
  sanitizeBrowseReturnHref(`${combinedHref}#opportunities`),
  `${combinedHref}#opportunities`
);
assert.equal(sanitizeBrowseReturnHref("https://evil.example/results"), "/#opportunities");
assert.equal(sanitizeBrowseReturnHref("/moderation"), "/#opportunities");
assert.equal(
  sanitizeBrowseReturnHref("/?q=AI&debug=secret&sort=relevance"),
  "/?q=AI&sort=relevance#opportunities"
);
assert.match(opportunityHref("ai-title", combinedHref), /^\/opportunities\/ai-title\?from=/);

// Evidence/detail presentation remains factual.
assert.equal(sourceHostname("https://www.example.org/apply?id=1"), "example.org");
assert.equal(sourceHostname("not a URL"), null);
assert.equal(formatDiscoveredDate(aiTitle.discoveredAt), "First found 19 Aug 2026");
assert.equal(formatDiscoveredDate(null), null);
assert.equal(UNKNOWN_TANZANIA_ELIGIBILITY, "Tanzania eligibility not confirmed");

// Route/accessibility contracts without pixel snapshots.
const root = process.cwd();
const home = readFileSync(join(root, "app/(home)/page.tsx"), "utf8");
const filters = readFileSync(join(root, "components/opportunity-filters.tsx"), "utf8");
const detailRoute = readFileSync(join(root, "app/opportunities/[slug]/page.tsx"), "utf8");
const detail = readFileSync(join(root, "components/opportunity-detail.tsx"), "utf8");
const data = readFileSync(join(root, "lib/data/opportunities.ts"), "utf8");
assert.match(home, /role="status" aria-live="polite"/);
assert.match(filters, /<label htmlFor="opportunity-search"/);
assert.match(filters, /aria-label="Opportunity filters"/);
assert.match(filters, /aria-label={`Remove \$\{chip\.label\}`}/);
assert.match(detailRoute, /if \(!opportunity\) notFound\(\)/);
assert.match(data, /\.eq\("status", "published"\)/);
assert.match(detail, /Open source and application details/);
assert.match(detail, /one source\/details link/);

console.log("PASS  M28 search/filter/detail behavior (52 assertions)");
