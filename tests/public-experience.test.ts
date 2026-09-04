/** Behavioral M27 tests for the public product experience. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildHref } from "../components/opportunity-filters";
import {
  buildHomepageSnapshot,
  formatDeadlinePresentation,
  opportunityHref,
  sourcePresentation,
  UNKNOWN_TANZANIA_ELIGIBILITY,
} from "../lib/opportunity-presentation";
import type { Opportunity } from "../lib/types";

const NOW = new Date("2026-09-03T12:00:00.000Z");

function opportunity(
  slug: string,
  overrides: Partial<Opportunity> = {}
): Opportunity {
  return {
    id: slug,
    slug,
    title: `Opportunity ${slug}`,
    category: "scholarship",
    organization: null,
    description: "A published technology opportunity with a meaningful evidence-based description for Tanzanian applicants.",
    url: `https://example.org/${slug}`,
    deadline: null,
    location: null,
    imageUrl: null,
    status: "published",
    createdAt: "2026-09-01T09:00:00.000Z",
    deadlinePrecision: "unknown",
    deadlineEvidence: null,
    trust: {
      relevanceDecision: "relevant",
      relevanceEvidence: "Explicit technology opportunity call",
      eligibilityDecision: "tanzanians_eligible",
      eligibilityEvidence: "Applications are open to Tanzanian applicants",
      qualificationRuleVersion: "test-rule-v1",
      countryVerification: "unknown",
      countryEvidence: null,
      lastVerifiedAt: "2026-09-03T10:00:00.000Z",
      decidedBy: "staff-1",
      decidedAt: "2026-09-03T10:00:00.000Z",
      canonicalEvidenceUrl: `https://example.org/${slug}`,
    },
    ...overrides,
  };
}

// Live snapshot: public, actionable rows only.
const closing = opportunity("closing", {
  deadline: "2026-09-10T12:00:00.000Z",
  deadlinePrecision: "date",
  deadlineEvidence: "Official page states 10 September 2026",
  createdAt: "2026-08-20T09:00:00.000Z",
});
const recentUnknown = opportunity("recent-unknown", {
  createdAt: "2026-09-02T09:00:00.000Z",
});
const expired = opportunity("expired", {
  deadline: "2026-09-01T12:00:00.000Z",
  createdAt: "2026-09-03T09:00:00.000Z",
});
const pending = opportunity("pending", {
  status: "pending",
  deadline: "2026-09-08T12:00:00.000Z",
  createdAt: "2026-09-03T10:00:00.000Z",
});
const rejected = opportunity("rejected", {
  status: "rejected",
  createdAt: "2026-09-03T11:00:00.000Z",
});
const snapshot = buildHomepageSnapshot(
  [closing, recentUnknown, expired, pending, rejected],
  NOW
);

assert.deepEqual(snapshot.closingSoon.map((item) => item.slug), ["closing"]);
assert.deepEqual(snapshot.recentlyAdded.map((item) => item.slug), [
  "recent-unknown",
  "closing",
]);
assert.equal(
  [...snapshot.closingSoon, ...snapshot.recentlyAdded].some(
    (item) => item.status !== "published"
  ),
  false,
  "unpublished records must never enter homepage snapshots"
);
assert.deepEqual(
  buildHomepageSnapshot([pending, rejected, expired], NOW),
  { closingSoon: [], recentlyAdded: [] },
  "empty public states must stay empty rather than receiving placeholders"
);

// Deadline states keep exact evidence and never turn null into rolling.
assert.deepEqual(formatDeadlinePresentation(null, NOW), {
  state: "unknown",
  label: "Deadline not listed",
  dateLabel: null,
});
assert.equal(formatDeadlinePresentation("not-a-date", NOW).state, "unknown");
assert.equal(
  formatDeadlinePresentation("2026-09-04T12:00:00.000Z", NOW).label,
  "Closes in 1 day"
);
assert.equal(
  formatDeadlinePresentation("2026-09-12T12:00:00.000Z", NOW).state,
  "urgent"
);
assert.equal(
  formatDeadlinePresentation("2026-10-12T12:00:00.000Z", NOW).state,
  "active"
);
assert.equal(
  formatDeadlinePresentation("2026-09-01T12:00:00.000Z", NOW).label,
  "Deadline passed"
);

// Tanzania eligibility stays unknown regardless of source or location.
const tanzaniaLocated = opportunity("tanzania-location", {
  organization: "Tanzania Example Organization",
  sourceName: "Tanzania Example Source",
  location: {
    venueName: null,
    address: null,
    city: "Dar es Salaam",
    region: "Dar es Salaam",
    country: "Tanzania",
    latitude: null,
    longitude: null,
  },
});
assert.equal(
  UNKNOWN_TANZANIA_ELIGIBILITY,
  "Tanzania eligibility not confirmed"
);
assert.equal(sourcePresentation(tanzaniaLocated), "Source: Tanzania Example Source");

// Stable public navigation contracts.
assert.equal(opportunityHref("real-opportunity"), "/opportunities/real-opportunity");
assert.equal(opportunityHref("safe slug"), "/opportunities/safe%20slug");
assert.equal(
  buildHref("grant", "newest", {
    q: "climate tech",
    region: "Arusha",
    deadline: "soon",
  }),
  "/?q=climate+tech&category=grant&deadline=soon&region=Arusha&sort=newest"
);

// The live route retains its server-side published boundary and accessible landmarks.
const root = process.cwd();
const dataSource = readFileSync(join(root, "lib/data/opportunities.ts"), "utf8");
const homeSource = readFileSync(join(root, "app/(home)/page.tsx"), "utf8");
assert.match(dataSource, /\.eq\("status", "published"\)/);
assert.match(homeSource, /<main id="main-content"/);
assert.match(homeSource, /aria-labelledby="opportunities-heading"/);
assert.match(homeSource, /sm:grid-cols-2/);
assert.doesNotMatch(homeSource, /MOCK_OPPORTUNITIES/);

console.log("PASS  M27 public experience behavior (20 assertions)");
