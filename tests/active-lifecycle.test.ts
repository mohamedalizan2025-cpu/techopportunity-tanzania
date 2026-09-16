/**
 * Active Lifecycle Hardening — Authoritative Discovery milestone.
 *
 * Proves the three active boundaries without touching history:
 *  - public active browsing excludes explicit past deadlines (stored rows
 *    remain reachable via direct detail, which keeps "Deadline passed");
 *  - moderator active queue predicate excludes explicit past deadlines
 *    (direct pending fetch is preserved);
 *  - new discovery admission rejects past deadlines and secondary origins
 *    without resolved authoritative evidence.
 */
import { applyPublicOpportunityQuery, derivePublishedLocations } from "../lib/data/opportunities";
import { isActivePendingOpportunity } from "../lib/data/moderation";
import { formatDeadlinePresentation } from "../lib/opportunity-presentation";
import {
  hasAuthoritativeEvidence,
  isAuthoritativeSourceType,
  isExpiredCandidate,
  qualifyOpportunity,
  shouldAdmitCandidate,
  shouldEnterModerationQueue,
} from "../scripts/discovery/qualification";
import type { Opportunity } from "../lib/types";
import type { CandidateOpportunity } from "../scripts/discovery/types";

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

const NOW = new Date("2026-09-16T12:00:00.000Z");

function opportunity(slug: string, overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: slug,
    slug,
    title: `Opportunity ${slug}`,
    category: "fellowship",
    organization: null,
    description: "A sufficiently detailed technology opportunity description for active-browse checks.",
    url: `https://example.org/${slug}`,
    deadline: null,
    location: null,
    imageUrl: null,
    status: "published",
    createdAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  } as Opportunity;
}

function candidate(overrides: Partial<CandidateOpportunity> = {}): CandidateOpportunity {
  return {
    title: "AI Innovation Challenge 2027",
    description: "Call for applications: AI builders across Africa may apply.",
    category: "competition",
    organization: null,
    url: "https://university.example.ac.tz/opportunity",
    deadline: "2027-03-13T00:00:00.000Z",
    venueName: null,
    address: null,
    city: null,
    region: null,
    country: null,
    sourceId: "source",
    sourceUrl: "https://university.example.ac.tz",
    evidenceUrl: "https://university.example.ac.tz/opportunity",
    referenceKind: "source-base",
    discoveryMethod: "rss",
    ...overrides,
  };
}

// --- public active browsing -------------------------------------------------

const future = opportunity("future", { deadline: "2027-03-13T00:00:00.000Z" });
const expired = opportunity("expired", { deadline: "2026-09-01T00:00:00.000Z" });
const unknown = opportunity("unknown", { deadline: null });

assert(
  "public active browse excludes expired but keeps future + unknown",
  (() => {
    const slugs = applyPublicOpportunityQuery([future, expired, unknown], {}, NOW).map((o) => o.slug);
    return slugs.includes("future") && slugs.includes("unknown") && !slugs.includes("expired");
  })()
);

assert(
  "public locations exclude expired rows",
  (() => {
    const withPlaces: Opportunity[] = [
      opportunity("a", {
        deadline: "2027-03-13T00:00:00.000Z",
        location: { venueName: null, address: null, city: "Arusha", region: null, country: null, latitude: null, longitude: null },
      }),
      opportunity("b", {
        deadline: "2026-09-01T00:00:00.000Z",
        location: { venueName: null, address: null, city: "Expired City", region: null, country: null, latitude: null, longitude: null },
      }),
    ];
    const locations = derivePublishedLocations(withPlaces, NOW);
    return locations.cities.includes("Arusha") && !locations.cities.includes("Expired City");
  })()
);

assert(
  "direct detail preserves Deadline passed for stored expired rows",
  formatDeadlinePresentation("2026-09-01T00:00:00.000Z", NOW).state === "expired" &&
    formatDeadlinePresentation("2026-09-01T00:00:00.000Z", NOW).label === "Deadline passed"
);

// --- moderator active queue -------------------------------------------------

assert("active pending keeps null deadlines", isActivePendingOpportunity({ deadline: null }, NOW));
assert(
  "active pending keeps future deadlines",
  isActivePendingOpportunity({ deadline: "2027-03-13T00:00:00.000Z" }, NOW)
);
assert(
  "active pending hides explicit past deadlines (view-level, no status write)",
  !isActivePendingOpportunity({ deadline: "2026-09-01T00:00:00.000Z" }, NOW)
);

// --- discovery admission: expiry --------------------------------------------

const pastCandidate = candidate({ deadline: "2026-09-01T00:00:00.000Z" });
assert("past deadline is expired", isExpiredCandidate(pastCandidate, NOW));
assert("future deadline is not expired", !isExpiredCandidate(candidate(), NOW));
assert("null deadline is not expired", !isExpiredCandidate(candidate({ deadline: null }), NOW));

const pastQualification = qualifyOpportunity(pastCandidate, NOW, { sourceType: "university" });
assert("past deadline qualifies as not_relevant", pastQualification.relevance === "not_relevant");
assert("past deadline never enters moderation", !shouldEnterModerationQueue(pastQualification));
assert(
  "past deadline never admitted even from authoritative origin",
  !shouldAdmitCandidate(pastCandidate, pastQualification, "university", NOW)
);

// --- discovery admission: authority ------------------------------------------

assert("university is authoritative", isAuthoritativeSourceType("university"));
assert("government is authoritative", isAuthoritativeSourceType("government"));
assert("ngo is authoritative", isAuthoritativeSourceType("ngo"));
assert("aggregator other is not authoritative", !isAuthoritativeSourceType("other"));
assert("undefined source is not authoritative", !isAuthoritativeSourceType(undefined));

const fresh = candidate();
const freshQualification = qualifyOpportunity(fresh, NOW, { sourceType: "university" });
assert("authoritative relevant candidate qualifies", freshQualification.relevance === "relevant");
assert(
  "authoritative origin admits without extra evidence",
  shouldAdmitCandidate(fresh, freshQualification, "university", NOW)
);

const secondaryBare = candidate({
  url: "https://opportunitydesk.org/2026/09/01/example/",
  sourceUrl: "https://opportunitydesk.org/feed/",
  evidenceUrl: "https://opportunitydesk.org/2026/09/01/example/",
});
const secondaryQualification = qualifyOpportunity(secondaryBare, NOW, { sourceType: "other" });
if (secondaryQualification.relevance === "relevant" && secondaryQualification.tanzaniaAccessibility !== "tanzanians_not_eligible") {
  assert(
    "secondary origin without evidence is withheld (no ambiguous queue item)",
    !shouldAdmitCandidate(secondaryBare, secondaryQualification, "other", NOW)
  );
} else {
  assert("secondary bare fixture is already withheld by qualification", !shouldEnterModerationQueue(secondaryQualification));
}

assert(
  "same-host application link is not authoritative evidence",
  !hasAuthoritativeEvidence(
    candidate({
      url: "https://opportunitydesk.org/item/",
      detailEvidence: {
        canonicalTitle: null,
        opportunityUrl: "https://opportunitydesk.org/item/",
        evidenceUrl: "https://opportunitydesk.org/item/",
        description: null,
        applicationUrl: "https://opportunitydesk.org/apply/",
        deadline: null,
        deadlineKind: "unknown",
        deadlineEvidence: null,
        location: null,
        eligibilityEvidence: null,
        relevanceEvidence: "Apply now",
      },
    })
  )
);

const externalEvidence = candidate({
  url: "https://opportunitydesk.org/item/",
  detailEvidence: {
    canonicalTitle: null,
    opportunityUrl: "https://opportunitydesk.org/item/",
    evidenceUrl: "https://opportunitydesk.org/item/",
    description: null,
    applicationUrl: "https://apply.official-organizer.org/fellowship",
    deadline: null,
    deadlineKind: "unknown",
    deadlineEvidence: null,
    location: null,
    eligibilityEvidence: "African applicants may apply",
    relevanceEvidence: "Applications are now open",
  },
});
assert("external application portal is authoritative evidence", hasAuthoritativeEvidence(externalEvidence));

assert(
  "generic form host is not authoritative evidence (anyone can publish there)",
  !hasAuthoritativeEvidence(
    candidate({
      url: "https://opportunitydesk.org/item/",
      detailEvidence: {
        canonicalTitle: null,
        opportunityUrl: "https://opportunitydesk.org/item/",
        evidenceUrl: "https://opportunitydesk.org/item/",
        description: null,
        applicationUrl: "https://www.tfaforms.com/5212267",
        deadline: null,
        deadlineKind: "unknown",
        deadlineEvidence: null,
        location: null,
        eligibilityEvidence: "African applicants may apply",
        relevanceEvidence: "Applications are now open",
      },
    })
  )
);

// --- discovery admission: Tanzania exclusion (measured 2026 cases) ------------

const ugandaOnlyCandidate = candidate({
  title: "Teach for Uganda STEM Fellowship 2026",
  description: "Eligibility: applicants must be female Ugandan citizens or refugees residing in Uganda.",
  url: "https://opportunitydesk.org/2026/09/16/teach-for-uganda-stem-fellowship-2026/",
  detailEvidence: {
    canonicalTitle: null,
    opportunityUrl: "https://opportunitydesk.org/2026/09/16/teach-for-uganda-stem-fellowship-2026/",
    evidenceUrl: "https://opportunitydesk.org/2026/09/16/teach-for-uganda-stem-fellowship-2026/",
    description: null,
    applicationUrl: "https://www.tfaforms.com/5212267",
    deadline: null,
    deadlineKind: "unknown",
    deadlineEvidence: null,
    location: null,
    eligibilityEvidence: "Must be a female Ugandan citizen or a refugee currently residing in Uganda.",
    relevanceEvidence: "Applications are open for",
  },
});
const ugandaOnly = qualifyOpportunity(ugandaOnlyCandidate, NOW, { sourceType: "other" });
assert("explicit Ugandan-citizen restriction excludes Tanzanians", ugandaOnly.tanzaniaAccessibility === "tanzanians_not_eligible");
assert("Uganda-only call never enters moderation", !shouldEnterModerationQueue(ugandaOnly));
assert(
  "Uganda-only call never admitted even with an external apply link",
  !shouldAdmitCandidate(ugandaOnlyCandidate, ugandaOnly, "other", NOW)
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
