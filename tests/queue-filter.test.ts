/**
 * Milestone 11 — queue filter contract tests.
 *
 * Pure unit tests for the server-side VIEW filter in
 * lib/data/moderation.ts: parseQueueFilter, matchesQueueFilter,
 * filterPendingQueue, queueFilterQuery, queueNavigationFromIds.
 *
 * Honesty rules under test: filters only narrow what is rendered, the
 * deterministic order is preserved, hostile params are ignored, and
 * navigation-within-filter never invents a next record.
 */
import {
  EMPTY_QUEUE_FILTER,
  filterPendingQueue,
  isQueueFilterEmpty,
  matchesQueueFilter,
  parseQueueFilter,
  queueFilterQuery,
  queueNavigationFromIds,
} from "../lib/data/moderation";
import { triageBucketOf } from "../lib/triage-bucket";
import type { Opportunity, OpportunityLocation } from "../lib/types";
import type { OpportunityTrust } from "../lib/opportunity-trust";

let passed = 0;
let failed = 0;
function assert(name: string, condition: boolean, detail = ""): void {
  if (condition) { passed += 1; console.log(`PASS  ${name}`); }
  else { failed += 1; console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`); }
}

function row(overrides: Partial<Opportunity>): Opportunity {
  return {
    id: "x",
    slug: "x",
    title: "Ordinary page",
    category: "other",
    description: "",
    url: "https://example.com",
    deadline: null,
    location: null,
    imageUrl: null,
    status: "pending",
    createdAt: "2026-08-27T00:00:00.000Z",
    organization: null,
    sourceName: null,
    ...overrides,
  } as Opportunity;
}

function loc(country: string | null): OpportunityLocation {
  return {
    venueName: null, address: null, city: null, region: null,
    country, latitude: null, longitude: null,
  };
}

function trustWith(overrides: Partial<OpportunityTrust>): OpportunityTrust {
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

// --- parseQueueFilter: hostile-input safety ---------------------------------

assert("parse: empty params → empty filter", isQueueFilterEmpty(parseQueueFilter({})));
assert("parse: bucket=2 accepted", parseQueueFilter({ bucket: "2" }).bucket === 2);
assert("parse: bucket=8 accepted", parseQueueFilter({ bucket: "8" }).bucket === 8);
assert("parse: bucket=9 rejected", parseQueueFilter({ bucket: "9" }).bucket === null);
assert("parse: bucket=0 rejected", parseQueueFilter({ bucket: "0" }).bucket === null);
assert("parse: bucket=abc rejected", parseQueueFilter({ bucket: "abc" }).bucket === null);
assert("parse: bucket=12 rejected", parseQueueFilter({ bucket: "12" }).bucket === null);
assert(
  "parse: repeated bucket takes first valid value",
  parseQueueFilter({ bucket: ["3", "7"] }).bucket === 3
);
assert("parse: source trimmed", parseQueueFilter({ source: "  Twaweza  " }).sourceName === "Twaweza");
assert("parse: blank source ignored", parseQueueFilter({ source: "   " }).sourceName === null);
assert(
  "parse: overlong source ignored (never a giant query)",
  parseQueueFilter({ source: "a".repeat(121) }).sourceName === null
);

// --- matchesQueueFilter: AND semantics, hint-based bucket -------------------

const scholarship = row({ id: "s", category: "scholarship", title: "Anything", sourceName: "OpportunityDesk" });
const news = row({ id: "n", category: "other", title: "WAZIRI AKAGUA MIRADI", sourceName: "Twaweza" });
const actionable = row({ id: "a", category: "other", title: "Call for Applications", sourceName: "Twaweza" });

assert("match: empty filter matches everything", matchesQueueFilter(news, EMPTY_QUEUE_FILTER));
assert("match: bucket 2 selects scholarship", matchesQueueFilter(scholarship, { bucket: 2, sourceName: null, q: null, flag: null }));
assert("match: bucket 8 selects news-heuristic row", matchesQueueFilter(news, { bucket: 8, sourceName: null, q: null, flag: null }));
assert("match: bucket 8 does not select actionable row", !matchesQueueFilter(actionable, { bucket: 8, sourceName: null, q: null, flag: null }));
assert(
  "match: source filter requires exact sourceName",
  matchesQueueFilter(news, { bucket: null, sourceName: "Twaweza", q: null, flag: null }) &&
    !matchesQueueFilter(scholarship, { bucket: null, sourceName: "Twaweza", q: null, flag: null })
);
assert(
  "match: source filter does not match null sourceName",
  !matchesQueueFilter(row({ sourceName: null }), { bucket: null, sourceName: "Twaweza", q: null, flag: null })
);
assert(
  "match: bucket AND source must both hold",
  !matchesQueueFilter(scholarship, { bucket: 2, sourceName: "Twaweza", q: null, flag: null }) &&
    matchesQueueFilter(scholarship, { bucket: 2, sourceName: "OpportunityDesk", q: null, flag: null })
);

// --- filterPendingQueue: order preserved, rows only removed ------------------

const queue = [actionable, scholarship, news];
const emptyFilterResult = filterPendingQueue(queue, EMPTY_QUEUE_FILTER);
assert("filter: empty filter is a no-op (same rows, same order)", emptyFilterResult === queue);
const bucket8 = filterPendingQueue(queue, { bucket: 8, sourceName: null, q: null, flag: null });
assert("filter: bucket 8 yields exactly the news-heuristic row", bucket8.length === 1 && bucket8[0].id === "n");
const twaweza = filterPendingQueue(queue, { bucket: null, sourceName: "Twaweza", q: null, flag: null });
assert(
  "filter: deterministic order preserved inside a source filter",
  twaweza.length === 2 && twaweza[0].id === "a" && twaweza[1].id === "n"
);

// --- queueFilterQuery: round-trip through the URL ----------------------------

assert("query: empty filter produces no suffix", queueFilterQuery(EMPTY_QUEUE_FILTER) === "");
assert("query: bucket only", queueFilterQuery({ bucket: 5, sourceName: null, q: null, flag: null }) === "?bucket=5");
assert(
  "query: source with spaces and & is encoded",
  queueFilterQuery({ bucket: null, sourceName: "Higher Education & Loans", q: null, flag: null }) ===
    "?source=Higher+Education+%26+Loans"
);
const roundTrip = parseQueueFilter({
  ...Object.fromEntries(new URLSearchParams(queueFilterQuery({ bucket: 1, sourceName: "Sokoine University of Agriculture", q: null, flag: null }))),
});
assert(
  "query: build→parse round-trips both dimensions",
  roundTrip.bucket === 1 && roundTrip.sourceName === "Sokoine University of Agriculture"
);

// --- queueNavigationFromIds: next stays inside the filtered view --------------

const ids = ["a", "b", "c"];
const navMid = queueNavigationFromIds(ids, "b");
assert("nav: mid-list position and next are computed over the given (filtered) ids", navMid.position === 2 && navMid.nextId === "c");
const navEnd = queueNavigationFromIds(ids, "c");
assert("nav: filtered-batch end has no next (no fallthrough to hidden rows)", navEnd.position === 3 && navEnd.nextId === null);
const navOut = queueNavigationFromIds(["b", "c"], "a");
assert(
  "nav: a record outside the filtered view keeps a null position but total is honest",
  navOut.position === null && navOut.total === 2 && navOut.nextId === null
);
assert("nav: empty filtered view", queueNavigationFromIds([], "a").total === 0);

// --- geography + sector dimensions (National/International taxonomy) ---------
// The queue filter reuses the SAME derived classifier as public browse
// (lib/taxonomy.ts): one taxonomy, two entry points. A row whose derived
// dimension is unknown never matches a concrete filter and stays reachable
// once the filter is cleared.

const tz = row({ id: "tz", category: "scholarship", title: "Public Health Fellowship", location: loc("Tanzania") });
const intl = row({
  id: "intl",
  category: "fellowship",
  title: "Pan-African Leaders Fellowship",
  location: null,
  trust: trustWith({ eligibilityDecision: "tanzanians_eligible", eligibilityEvidence: "open to applicants from all African countries" }),
});
const unknown = row({ id: "unk", category: "other", title: "Ordinary page", location: null });

assert("geo: parse geography=national", parseQueueFilter({ geography: "national" }).geography === "national");
assert("geo: parse geography=international", parseQueueFilter({ geography: "international" }).geography === "international");
assert("geo: hostile geography ignored (city is not a group)", parseQueueFilter({ geography: "zanzibar" }).geography === null);
assert("geo: parse sector=health", parseQueueFilter({ sector: "health" }).sector === "health");
assert("geo: hostile sector ignored", parseQueueFilter({ sector: "not-a-sector" }).sector === null);
assert(
  "geo: a geography-only filter is not empty",
  !isQueueFilterEmpty({ ...EMPTY_QUEUE_FILTER, geography: "national" })
);
assert(
  "geo: Tanzania row matches national, not international",
  matchesQueueFilter(tz, { ...EMPTY_QUEUE_FILTER, geography: "national" }) &&
    !matchesQueueFilter(tz, { ...EMPTY_QUEUE_FILTER, geography: "international" })
);
assert(
  "geo: Africa-wide eligible row matches international",
  matchesQueueFilter(intl, { ...EMPTY_QUEUE_FILTER, geography: "international" })
);
assert(
  "geo: unknown-geography row matches no concrete group (fails safe)",
  !matchesQueueFilter(unknown, { ...EMPTY_QUEUE_FILTER, geography: "national" }) &&
    !matchesQueueFilter(unknown, { ...EMPTY_QUEUE_FILTER, geography: "international" })
);
assert(
  "geo: sector derived from title+description",
  matchesQueueFilter(tz, { ...EMPTY_QUEUE_FILTER, sector: "health" }) &&
    !matchesQueueFilter(intl, { ...EMPTY_QUEUE_FILTER, sector: "health" })
);
assert(
  "geo: geography AND sector must both hold",
  !matchesQueueFilter(tz, { ...EMPTY_QUEUE_FILTER, geography: "national", sector: "finance" }) &&
    matchesQueueFilter(tz, { ...EMPTY_QUEUE_FILTER, geography: "national", sector: "health" })
);

const geoQueue = [tz, intl, unknown];
const nationals = filterPendingQueue(geoQueue, { ...EMPTY_QUEUE_FILTER, geography: "national" });
assert(
  "geo: national filter yields only the national row, order preserved",
  nationals.length === 1 && nationals[0].id === "tz"
);
const internationals = filterPendingQueue(geoQueue, { ...EMPTY_QUEUE_FILTER, geography: "international" });
assert(
  "geo: international filter yields only the international row",
  internationals.length === 1 && internationals[0].id === "intl"
);

assert(
  "geo: query emits geography",
  queueFilterQuery({ ...EMPTY_QUEUE_FILTER, geography: "international" }) === "?geography=international"
);
assert(
  "geo: query emits sector",
  queueFilterQuery({ ...EMPTY_QUEUE_FILTER, sector: "ai-data" }) === "?sector=ai-data"
);
const geoRoundTrip = parseQueueFilter(
  Object.fromEntries(
    new URLSearchParams(queueFilterQuery({ ...EMPTY_QUEUE_FILTER, geography: "national", sector: "health" }))
  )
);
assert(
  "geo: build→parse round-trips geography + sector",
  geoRoundTrip.geography === "national" && geoRoundTrip.sector === "health"
);

// --- the filter is a view, not a verdict -------------------------------------

assert(
  "honesty: bucket filter uses the same heuristic buckets as the badges (no second scoring)",
  triageBucketOf(news.category, news.title) === 8
);

// ------------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
