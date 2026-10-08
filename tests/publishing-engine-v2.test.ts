/**
 * Publishing Engine V2 — operational guarantees.
 *
 * Proves, without database or network access:
 *  - no auto-publish path exists (discovery + submissions enter pending
 *    only; approval demands a human confirmation token);
 *  - ready classification works (full evidence → ready, gaps → named state);
 *  - duplicate reason works (WHY names the matched row + rule, nothing is
 *    deleted or mutated);
 *  - expired listing handling works (expired excluded from active work,
 *    unknown stays visible and unrewritten);
 *  - unknown eligibility cannot become verified (approval + verified-access
 *    both demand stored human evidence);
 *  - moderation remains protected (auth/confirm/reason gates are pure and
 *    fail closed);
 *  - approve/reject remain human-triggered (confirmation + reason gates).
 *
 * Permanent rule: NO blind auto-publish. Final publish/approve remains a
 * human action — every test below pins one side of that rule.
 */
import {
  REVIEW_READINESS_LABEL,
  countReviewQueue,
  duplicateWhy,
  orderReviewQueue,
  parseReviewReadinessState,
  reviewReadinessOf,
  type ReadinessRow,
  type ReviewReadinessState,
} from "../lib/review-readiness";
import {
  EMPTY_QUEUE_FILTER,
  filterPendingQueue,
  isQueueFilterEmpty,
  matchesQueueFilter,
  parseQueueFilter,
  queueFilterQuery,
} from "../lib/data/moderation";
import { partitionPublishedByLifecycle } from "../lib/data/published-management";
import {
  evaluateUnpublishPermission,
  parseUnpublishRequest,
} from "../lib/data/published-management";
import {
  APPROVE_CONFIRM_TOKEN,
  isApproveConfirmed,
  normalizeModerationReason,
} from "../lib/staff-form-state";
import {
  hasVerifiedTanzanianAccess,
  isAiSearchableOpportunity,
} from "../lib/opportunity-trust";
import { deriveLifecycleState, isActionableNow } from "../lib/lifecycle";
import {
  applyPublicOpportunityQuery,
  mapOpportunityRow,
  type OpportunityRow,
} from "../lib/data/opportunities";
import { isActivePendingOpportunity } from "../lib/data/moderation";
import { parseReviewInput } from "../lib/data/moderation-review";
import { reviewedOpportunityUpdate } from "../lib/data/moderation-review";
import { buildPendingRow } from "../scripts/discovery/runner";
import { qualifyOpportunity } from "../scripts/discovery/qualification";
import type { CandidateOpportunity } from "../scripts/discovery/types";
import type { Opportunity } from "../lib/types";

let passed = 0;
function check(name: string, actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL ${name}\n  expected: ${e}\n  actual:   ${a}`);
    process.exitCode = 1;
    return;
  }
  console.log(`PASS ${name}`);
  passed += 1;
}

const NOW = new Date("2027-01-15T12:00:00.000Z");

function readinessRow(overrides: Partial<ReadinessRow> = {}): ReadinessRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Mandela Washington Fellowship 2027 applications now open",
    description:
      "A fully funded six-week leadership fellowship in the United States for young African leaders aged 25 to 35, covering travel, housing, and tuition.",
    url: "https://mandelawashingtonfellowship.org/apply/",
    sourceName: "Mandela Washington Fellowship",
    sourceUrl: "https://mandelawashingtonfellowship.org/apply/",
    discoveryMethod: "html",
    deadline: "2027-10-13T00:00:00.000Z",
    deadlinePrecision: "date",
    deadlineEvidence: "Structured source value: 2027-10-13",
    location: null,
    trust: {
      relevanceDecision: "relevant",
      relevanceEvidence: "Fellowship call with explicit apply action.",
      eligibilityDecision: "tanzanians_eligible",
      eligibilityEvidence: "Official page: open to young African leaders.",
      qualificationRuleVersion: "m31-2026-09-04-v1",
      countryVerification: "unknown",
      countryEvidence: null,
      lastVerifiedAt: null,
      decidedBy: null,
      decidedAt: null,
      canonicalEvidenceUrl: "https://mandelawashingtonfellowship.org/apply/",
    },
    status: "pending",
    ...overrides,
  };
}

function opportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    slug: "fixture-opportunity",
    title: "AI Innovation Challenge 2027",
    category: "competition",
    organization: null,
    description:
      "A sufficiently detailed technology opportunity description that supports every publishing-engine check.",
    url: "https://example.org/opportunity",
    deadline: "2027-06-01T00:00:00.000Z",
    deadlinePrecision: "date",
    deadlineEvidence: "Official page deadline: 1 June 2027",
    location: null,
    imageUrl: null,
    status: "pending",
    createdAt: "2027-01-01T00:00:00.000Z",
    ...overrides,
  } as Opportunity;
}

function candidate(overrides: Partial<CandidateOpportunity> = {}): CandidateOpportunity {
  return {
    title: "AI Innovation Challenge 2027",
    description:
      "Call for applications: AI builders across Africa may apply before the stated deadline.",
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

// --- 1. No auto-publish path -------------------------------------------------

const evidencedQualification = qualifyOpportunity(
  candidate(),
  NOW,
  { sourceType: "university" }
);
const pendingRow = buildPendingRow(candidate(), 3, evidencedQualification);
check(
  "discovery inserts pending only, even fully evidenced",
  (pendingRow as Record<string, unknown>).status,
  "pending"
);
check(
  "discovery never writes a published status",
  JSON.stringify(pendingRow).includes('"published"'),
  false
);

check("approve confirmation missing fails closed", isApproveConfirmed(null), false);
check("approve confirmation forged fails closed", isApproveConfirmed("approve"), false);
check(
  "approve confirmation exact token passes",
  isApproveConfirmed(APPROVE_CONFIRM_TOKEN),
  true
);

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}
const parsedApproval = parseReviewInput(
  form({
    title: "Valid Opportunity Title",
    category: "hackathon",
    description:
      "This official programme description explains the technology focus, applicant work, and reviewable opportunity details in full.",
    url: "https://example.com/opportunity",
    relevance_evidence: "Official page describes an applied technology opportunity.",
    eligibility: "tanzanians_eligible",
    eligibility_evidence: "Official eligibility section is open to all African nationals.",
    deadline_precision: "unknown",
    country_verification: "unknown",
  })
);
check("review parser succeeds on valid human input", parsedApproval.ok, true);
if (parsedApproval.ok) {
  check("review parser emits no status (cannot publish by parsing)", "status" in parsedApproval.review, false);
  const update = reviewedOpportunityUpdate(parsedApproval.review, "moderator-id", NOW.toISOString(), 3);
  check("the single human review path publishes with attribution", update.status, "published");
  check("human review path records the deciding moderator", update.decided_by, "moderator-id");
}

// --- 2. Ready classification --------------------------------------------------

check(
  "fully evidenced row is ready for review",
  reviewReadinessOf(readinessRow(), [], NOW).state,
  "ready-for-review"
);
check(
  "unknown eligibility keeps Tanzanian access unevidenced but reviewable",
  reviewReadinessOf(
    readinessRow({
      trust: { ...readinessRow().trust!, eligibilityDecision: "unknown", eligibilityEvidence: null },
    }),
    [],
    NOW
  ).access.evidenced,
  false
);
check(
  "evidenced ineligibility is ready for a fast reasoned rejection",
  reviewReadinessOf(
    readinessRow({
      trust: {
        ...readinessRow().trust!,
        eligibilityDecision: "tanzanians_not_eligible",
        eligibilityEvidence: "Official page: Kenyan nationals only.",
      },
    }),
    [],
    NOW
  ).state,
  "ready-for-review"
);
check(
  "missing evidence is needs-evidence",
  reviewReadinessOf(readinessRow({ description: "Apply now!" }), [], NOW).state,
  "needs-evidence"
);
check(
  "unusable source is source-problem",
  reviewReadinessOf(
    readinessRow({
      url: "not a url",
      trust: { ...readinessRow().trust!, canonicalEvidenceUrl: null },
    }),
    [],
    NOW
  ).state,
  "source-problem"
);
check(
  "missing deadline evidence with stored value stays classifiable",
  reviewReadinessOf(
    readinessRow({ deadline: null, deadlinePrecision: "unknown", deadlineEvidence: null }),
    [],
    NOW
  ).state,
  "ready-for-review"
);

// --- 3. Duplicate reason ------------------------------------------------------

const publishedSibling = readinessRow({
  id: "33333333-3333-4333-8333-333333333333",
  url: "https://mandelawashingtonfellowship.org/apply/?utm_source=feed#section",
  sourceName: "Aggregator",
  sourceUrl: "https://aggregator.example/feed",
  status: "published",
  slug: "mandela-washington-fellowship-2027",
});
const dupResult = reviewReadinessOf(readinessRow(), [publishedSibling], NOW);
check("canonical-URL match against published is possible-duplicate", dupResult.state, "possible-duplicate");
check("duplicate match names the rule", dupResult.duplicate?.kind, "canonical-url");
check("duplicate match names the published row status", dupResult.duplicate?.status, "published");
check(
  "duplicate WHY names the matched title and the rule",
  (dupResult.duplicate ? duplicateWhy(dupResult.duplicate) : "").includes("Same canonical URL") &&
    (dupResult.duplicate ? duplicateWhy(dupResult.duplicate) : "").includes(publishedSibling.title),
  true
);

const titleSibling = readinessRow({
  id: "44444444-4444-4444-8444-444444444444",
  url: "https://other.example/opportunity",
  sourceName: "Other Registry",
  sourceUrl: "https://other.example/opportunity",
  status: "pending",
});
const titleDup = reviewReadinessOf(readinessRow(), [titleSibling], NOW);
check("title-core match is possible-duplicate", titleDup.state, "possible-duplicate");
check("title-core match names the rule", titleDup.duplicate?.kind, "title-core");

const corpusBefore = JSON.stringify([publishedSibling, titleSibling]);
reviewReadinessOf(readinessRow(), [publishedSibling, titleSibling], NOW);
check("duplicate check never mutates the corpus", JSON.stringify([publishedSibling, titleSibling]), corpusBefore);
check(
  "same-source title-core match is not a duplicate",
  reviewReadinessOf(
    readinessRow(),
    [readinessRow({ id: "55555555-5555-4555-8555-555555555555", url: "https://mandelawashingtonfellowship.org/apply/round-two" })],
    NOW
  ).state,
  "ready-for-review"
);

// --- 4. Expired listing handling ----------------------------------------------

check(
  "explicit past deadline is deadline-unclear, not silently dropped",
  reviewReadinessOf(readinessRow({ deadline: "2020-01-01T00:00:00.000Z" }), [], NOW).state,
  "deadline-unclear"
);
check(
  "expired pending is excluded from active review work",
  isActivePendingOpportunity(opportunity({ deadline: "2020-01-01T00:00:00.000Z" }), NOW),
  false
);
check(
  "unknown deadline stays in active review work",
  isActivePendingOpportunity(opportunity({ deadline: null }), NOW),
  true
);

const browseCorpus = [
  opportunity({ id: "a", slug: "open-call", deadline: "2027-06-01T00:00:00.000Z", status: "published" }),
  opportunity({ id: "b", slug: "past-call", deadline: "2020-01-01T00:00:00.000Z", status: "published" }),
  opportunity({ id: "c", slug: "no-date-call", deadline: null, status: "published" }),
];
const browseVisible = applyPublicOpportunityQuery(browseCorpus, {}, NOW).map((o) => o.slug);
check("public browse excludes explicit past deadlines", browseVisible.includes("past-call"), false);
check("public browse keeps honestly unknown deadlines", browseVisible.includes("no-date-call"), true);

const split = partitionPublishedByLifecycle(browseCorpus, NOW);
check("published split keeps active rows", split.active.map((o) => o.slug), ["open-call", "no-date-call"]);
check("published split isolates expired rows", split.expired.map((o) => o.slug), ["past-call"]);
check(
  "lifecycle partition rewrites nothing (unknown stays unknown)",
  browseCorpus.find((o) => o.slug === "no-date-call")?.deadline,
  null
);
check("lifecycle derivation is clock-deterministic", deriveLifecycleState("2020-01-01T00:00:00.000Z", NOW), "expired");
check("unknown deadline is actionable, never hidden as expired", isActionableNow(null, NOW), true);

// --- 5. Unknown eligibility cannot become verified ----------------------------

check(
  "unknown eligibility is not verified Tanzanian access",
  hasVerifiedTanzanianAccess(opportunity({ trust: undefined })),
  false
);
check(
  "eligible without evidence is not verified Tanzanian access",
  hasVerifiedTanzanianAccess(
    opportunity({
      trust: {
        relevanceDecision: "relevant",
        relevanceEvidence: "evidence",
        eligibilityDecision: "tanzanians_eligible",
        eligibilityEvidence: null,
        qualificationRuleVersion: "m31-2026-09-04-v1",
        countryVerification: "unknown",
        countryEvidence: null,
        lastVerifiedAt: null,
        decidedBy: null,
        decidedAt: null,
        canonicalEvidenceUrl: "https://example.org/opportunity",
      },
    })
  ),
  false
);
check(
  "approval rejects unknown eligibility (keep pending or reject)",
  parseReviewInput(
    form({
      title: "Valid Opportunity Title",
      category: "hackathon",
      description:
        "This official programme description explains the technology focus, applicant work, and reviewable opportunity details in full.",
      url: "https://example.com/opportunity",
      relevance_evidence: "Official page describes an applied technology opportunity.",
      eligibility: "unknown",
      eligibility_evidence: "",
      deadline_precision: "unknown",
      country_verification: "unknown",
    })
  ).ok,
  false
);
check(
  "untrusted rows never enter the AI-searchable set",
  isAiSearchableOpportunity(opportunity({ trust: undefined }), NOW),
  false
);

// --- 6. Moderation remains protected -------------------------------------------

check(
  "unpublish with a malformed request is denied before auth",
  evaluateUnpublishPermission(parseUnpublishRequest(form({})), {
    ok: false,
    reason: "unauthenticated",
  }),
  { ok: false, denial: "invalid-id" }
);
const authedNope = evaluateUnpublishPermission(
  parseUnpublishRequest(
    (() => {
      const fd = new FormData();
      fd.set("opportunityId", "11111111-1111-4111-8111-111111111111");
      fd.set("confirm", "unpublish");
      fd.set("reason", "Expired test record with a specific reason.");
      return fd;
    })()
  ),
  { ok: false, reason: "unauthenticated" }
);
check("unpublish without a session is denied even when confirmed", authedNope, {
  ok: false,
  denial: "unauthenticated",
});
check(
  "short rejection reasons fail closed",
  normalizeModerationReason("too short"),
  null
);
check(
  "rejection reason bounds are enforced",
  normalizeModerationReason("A specific evidence-based reason for this decision."),
  "A specific evidence-based reason for this decision."
);

// --- 7. Queue operations -------------------------------------------------------

check(
  "readiness slug parses exactly",
  parseReviewReadinessState("ready-for-review"),
  "ready-for-review"
);
check("hostile readiness slug is ignored", parseReviewReadinessState("urgent"), null);
check(
  "queue filter accepts a readiness state",
  parseQueueFilter({ readiness: "possible-duplicate" }).readiness,
  "possible-duplicate"
);
check(
  "queue filter rejects a hostile readiness value",
  parseQueueFilter({ readiness: "everything" }).readiness,
  null
);
check("empty filter stays empty with the new dimension", isQueueFilterEmpty(EMPTY_QUEUE_FILTER), true);
check(
  "readiness filter serializes into navigation",
  queueFilterQuery({ ...EMPTY_QUEUE_FILTER, readiness: "needs-evidence" }),
  "?readiness=needs-evidence"
);

const readyOpp = opportunity({ id: "ready-1" });
const dupOpp = opportunity({ id: "dup-1" });
const readinessById = new Map<string, ReviewReadinessState>([
  ["ready-1", "ready-for-review"],
  ["dup-1", "possible-duplicate"],
]);
check(
  "readiness filter selects matching rows",
  filterPendingQueue([readyOpp, dupOpp], { ...EMPTY_QUEUE_FILTER, readiness: "ready-for-review" }, readinessById).map((o) => o.id),
  ["ready-1"]
);
check(
  "unclassified rows fail closed under a readiness filter",
  matchesQueueFilter(readyOpp, { ...EMPTY_QUEUE_FILTER, readiness: "ready-for-review" }),
  false
);

const ordered = orderReviewQueue([
  { opportunity: opportunity({ id: "old-ambiguous", createdAt: "2027-01-01T00:00:00.000Z" }), state: "needs-evidence" as ReviewReadinessState },
  { opportunity: opportunity({ id: "new-ready", createdAt: "2027-01-10T00:00:00.000Z" }), state: "ready-for-review" as ReviewReadinessState },
  { opportunity: opportunity({ id: "old-ready", createdAt: "2027-01-02T00:00:00.000Z" }), state: "ready-for-review" as ReviewReadinessState },
]);
check(
  "priority ordering puts ready first, oldest within state",
  ordered.map((i) => i.opportunity.id),
  ["old-ready", "new-ready", "old-ambiguous"]
);

check(
  "operational counts cover every state",
  countReviewQueue([
    { state: "ready-for-review" },
    { state: "needs-evidence" },
    { state: "possible-duplicate" },
    { state: "deadline-unclear" },
    { state: "source-problem" },
  ]),
  { total: 5, ready: 1, needsEvidence: 1, possibleDuplicate: 1, sourceProblem: 1, deadlineUnclear: 1 }
);
check(
  "state labels cover the five required outcomes",
  [
    REVIEW_READINESS_LABEL["ready-for-review"],
    REVIEW_READINESS_LABEL["needs-evidence"],
    REVIEW_READINESS_LABEL["possible-duplicate"],
    REVIEW_READINESS_LABEL["source-problem"],
    REVIEW_READINESS_LABEL["deadline-unclear"],
  ],
  ["Ready for review", "Needs evidence", "Possible duplicate", "Source problem", "Deadline unclear"]
);

// --- 8. Lifecycle row mapping keeps staff reads honest ------------------------

const staffRow = {
  id: "66666666-6666-4666-8666-666666666666",
  slug: "staff-row",
  title: "Staff row",
  description: "x".repeat(100),
  url: "https://example.org/staff",
  source_url: null,
  deadline: null,
  venue_name: null,
  address: null,
  city: null,
  region: null,
  country: null,
  latitude: null,
  longitude: null,
  image_url: null,
  created_at: "2027-01-01T00:00:00.000Z",
  category: { slug: "competition" },
  organization: null,
  discovered_at: null,
  discovery_method: "rss",
  source: { name: "Example" },
} as unknown as OpportunityRow;
check(
  "staff row mapping preserves pending status",
  mapOpportunityRow(staffRow, "pending").status,
  "pending"
);

console.log(`\n${passed} publishing-engine-v2 guarantee tests passed.`);
