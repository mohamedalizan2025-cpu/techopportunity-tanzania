/**
 * Assisted Approval — approval-readiness contract tests.
 *
 * Pure, credential-free tests for lib/approval-readiness.ts. The evaluator is
 * a READ-ONLY hint: it must never publish, approve, reject, or mutate. Every
 * ready result must also be accepted by the existing human approval parser.
 *
 * The required 14 outcomes are covered, plus ordering, live-reference
 * fail-closed checks, parser residual messages, and source-level guards
 * against auto-publish/bulk-approve paths.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  APPROVAL_READINESS_LABEL,
  APPROVAL_READINESS_NOTE,
  approvalFormDataOf,
  approvalReadinessOf,
  countApprovalQueue,
  orderApprovalQueue,
  parseApprovalReadinessState,
  type ApprovalReadinessRow,
} from "../lib/approval-readiness";
import { parseQueueFilter } from "../lib/data/moderation";
import {
  parseReviewInput,
  reviewedOpportunityUpdate,
} from "../lib/data/moderation-review";
import {
  APPROVE_CONFIRM_TOKEN,
  isApproveConfirmed,
} from "../lib/staff-form-state";

const NOW = new Date("2027-01-15T12:00:00.000Z");
const ORG_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_ORG_ID = "44444444-4444-4444-8444-444444444444";

const CONTEXT = {
  categorySlugs: new Set(["fellowship", "competition", "other"]),
  organizationIds: new Set([ORG_ID]),
};

function baseRow(
  overrides: Partial<ApprovalReadinessRow> = {}
): ApprovalReadinessRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Mandela Washington Fellowship 2027 applications now open",
    description:
      "A fully funded six-week leadership fellowship in the United States for young African leaders aged 25 to 35, covering travel, housing, and tuition.",
    url: "https://mandelawashingtonfellowship.org/apply/",
    category: "fellowship",
    organizationId: null,
    sourceName: "Mandela Washington Fellowship",
    sourceUrl: "https://mandelawashingtonfellowship.org/apply/",
    discoveryMethod: "html",
    deadline: "2027-10-13T00:00:00.000Z",
    deadlinePrecision: "date",
    deadlineEvidence: "Structured source value: 2027-10-13",
    location: null,
    status: "pending",
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
    ...overrides,
  };
}

function withTrust(
  overrides: Partial<NonNullable<ApprovalReadinessRow["trust"]>>
): ApprovalReadinessRow["trust"] {
  return { ...baseRow().trust!, ...overrides };
}

let passed = 0;
let failed = 0;
function check(name: string, actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failed += 1;
    console.error(`FAIL ${name}\n  expected: ${e}\n  actual:   ${a}`);
    return;
  }
  passed += 1;
  console.log(`PASS ${name}`);
}
function assert(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    passed += 1;
    console.log(`PASS ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
}
function read(file: string): string {
  return readFileSync(join(process.cwd(), file), "utf8");
}

// 1. Fully evidenced, explicitly eligible row is ready.
const ready = approvalReadinessOf(baseRow(), [], NOW, CONTEXT);
check("fully evidenced eligible row is ready for approval", ready.state, "ready-for-approval");
check("ready flag is true", ready.ready, true);
check("ready row passes every check", ready.checks.every((check) => check.pass), true);
check("ready row has no blockers", ready.blockers, []);
check(
  "ready row is accepted by the existing approval parser",
  parseReviewInput(approvalFormDataOf(baseRow())).ok,
  true
);

// 2. Eligibility unknown is NEVER ready.
const unknownEligibility = approvalReadinessOf(
  baseRow({
    trust: withTrust({
      eligibilityDecision: "unknown",
      eligibilityEvidence: null,
    }),
  }),
  [],
  NOW,
  CONTEXT
);
check("unknown eligibility is not ready", unknownEligibility.ready, false);
check("unknown eligibility state is needs-evidence", unknownEligibility.state, "needs-evidence");
assert(
  "unknown eligibility names its blocker",
  unknownEligibility.blockers.some((blocker) => blocker.code === "eligibility-unknown")
);
check(
  "unknown eligibility keeps the existing parser refusal",
  unknownEligibility.parseMessage,
  "Keep this record pending or reject it until Tanzanian eligibility is verified."
);

// 3. Evidenced ineligibility is not ready for approval.
const notEligible = approvalReadinessOf(
  baseRow({
    trust: withTrust({
      eligibilityDecision: "tanzanians_not_eligible",
      eligibilityEvidence: "Official page: Kenyan nationals only.",
    }),
  }),
  [],
  NOW,
  CONTEXT
);
check("evidenced ineligibility is not ready", notEligible.ready, false);
assert(
  "ineligibility names its own blocker",
  notEligible.blockers.some((blocker) => blocker.code === "eligibility-not-eligible")
);

// 4. Eligible decision without exact evidence is not ready.
const noEligibilityEvidence = approvalReadinessOf(
  baseRow({
    trust: withTrust({
      eligibilityDecision: "tanzanians_eligible",
      eligibilityEvidence: null,
    }),
  }),
  [],
  NOW,
  CONTEXT
);
check("missing eligibility evidence is not ready", noEligibilityEvidence.ready, false);
assert(
  "eligibility evidence blocker is named",
  noEligibilityEvidence.blockers.some(
    (blocker) => blocker.code === "eligibility-evidence"
  )
);
check(
  "eligibility evidence refusal is exact",
  noEligibilityEvidence.parseMessage,
  "Approval requires exact evidence that Tanzanians may apply."
);

// 5. Expired deadline is not ready.
const expired = approvalReadinessOf(
  baseRow({
    deadline: "2020-01-01T00:00:00.000Z",
    deadlinePrecision: "date",
    deadlineEvidence: "Structured source value: 2020-01-01",
  }),
  [],
  NOW,
  CONTEXT
);
check("expired deadline is not ready", expired.ready, false);
check("expired deadline state is deadline-unclear", expired.state, "deadline-unclear");
assert(
  "expired deadline blocker is named",
  expired.blockers.some((blocker) => blocker.code === "deadline-expired")
);

// 6. A claimed deadline without evidence is not ready.
const noDeadlineEvidence = approvalReadinessOf(
  baseRow({ deadlineEvidence: null }),
  [],
  NOW,
  CONTEXT
);
check("claimed deadline without evidence is not ready", noDeadlineEvidence.ready, false);
check("missing deadline evidence state is deadline-unclear", noDeadlineEvidence.state, "deadline-unclear");
assert(
  "missing deadline evidence blocker is named",
  noDeadlineEvidence.blockers.some(
    (blocker) => blocker.code === "deadline-evidence"
  )
);
check(
  "deadline evidence refusal is exact",
  noDeadlineEvidence.parseMessage,
  "Known or rolling deadlines require exact source evidence."
);

// 7. Missing relevance evidence is not ready.
const noRelevance = approvalReadinessOf(
  baseRow({ trust: withTrust({ relevanceEvidence: null }) }),
  [],
  NOW,
  CONTEXT
);
check("missing relevance evidence is not ready", noRelevance.ready, false);
assert(
  "relevance evidence blocker is named",
  noRelevance.blockers.some((blocker) => blocker.code === "relevance-evidence")
);
check(
  "relevance refusal is exact",
  noRelevance.parseMessage,
  "Approval requires explicit technology/research relevance evidence."
);

// 8. Geography/country claims must satisfy existing evidence rules.
const badCountry = approvalReadinessOf(
  baseRow({
    location: {
      venueName: null,
      address: null,
      city: null,
      region: null,
      country: "Tanzania",
      latitude: null,
      longitude: null,
    },
  }),
  [],
  NOW,
  CONTEXT
);
check("unevidenced country is not ready", badCountry.ready, false);
assert(
  "country evidence blocker is named",
  badCountry.blockers.some((blocker) => blocker.code === "country-evidence")
);
check(
  "country refusal is exact",
  badCountry.parseMessage,
  "Country text must remain empty until its source evidence is verified."
);

// 9. Duplicate signals block readiness with the existing WHY context.
const sibling = baseRow({
  id: "22222222-2222-4222-8222-222222222222",
  url: "https://mandelawashingtonfellowship.org/apply/?utm_source=feed#section",
  sourceName: "Aggregator",
  sourceUrl: "https://aggregator.example/feed",
});
const duplicate = approvalReadinessOf(baseRow(), [sibling], NOW, CONTEXT);
check("possible duplicate is not ready", duplicate.ready, false);
check("duplicate state is possible-duplicate", duplicate.state, "possible-duplicate");
assert(
  "duplicate blocker is named",
  duplicate.blockers.some((blocker) => blocker.code === "possible-duplicate")
);
check("duplicate match names the sibling", duplicate.duplicate?.id, sibling.id);

// 10. Ready queue contains pending rows only.
const published = approvalReadinessOf(
  baseRow({ status: "published" }),
  [],
  NOW,
  CONTEXT
);
check("published row is never ready", published.ready, false);
assert(
  "published row names the pending-only blocker",
  published.blockers.some((blocker) => blocker.code === "not-pending")
);

// 11. The evaluator has no publish path and never mutates the row.
const noStatus = approvalReadinessOf(baseRow(), [], NOW, CONTEXT);
check("readiness result carries no status field", "status" in noStatus, false);
const original = baseRow();
approvalReadinessOf(original, [], NOW, CONTEXT);
check("readiness never mutates the row", original.status, "pending");
check(
  "approval readiness source contains no write or publish path",
  /status:\s*["']published["']|\.(insert|update|delete|upsert)\s*\(/.test(
    read("lib/approval-readiness.ts")
  ),
  false
);

// 12. Bulk approval does not exist.
check(
  "moderation actions expose no bulk approval function",
  /export\s+async\s+function\s+bulkApprove|bulkApproveAction/.test(
    read("lib/data/moderation-actions.ts")
  ),
  false
);
check(
  "queue bulk panel exposes no approve action",
  /bulkApprove|Approve selected|approveSelected/i.test(
    read("app/moderation/queue-bulk-panel.tsx")
  ),
  false
);

// 13. Human confirmation remains mandatory.
check("approval confirmation missing fails closed", isApproveConfirmed(null), false);
check("approval confirmation forged fails closed", isApproveConfirmed("approve"), false);
check("exact approval confirmation passes", isApproveConfirmed(APPROVE_CONFIRM_TOKEN), true);

// 14. The existing manual approval path still works on a ready row.
const parsed = parseReviewInput(approvalFormDataOf(baseRow()));
check("ready row passes the existing manual approval parser", parsed.ok, true);
if (parsed.ok) {
  const update = reviewedOpportunityUpdate(
    parsed.review,
    "moderator-id",
    NOW.toISOString(),
    3
  );
  check("human approval payload publishes", update.status, "published");
  check("human approval payload records the moderator", update.decided_by, "moderator-id");
}

// --- Additional guards -------------------------------------------------------

// Live category/org references fail closed when absent.
const missingLiveCategory = approvalReadinessOf(
  baseRow({ category: "admissions" }),
  [],
  NOW,
  CONTEXT
);
check("category absent from the live table is not ready", missingLiveCategory.ready, false);
assert(
  "live-category blocker is named",
  missingLiveCategory.blockers.some(
    (blocker) => blocker.code === "category-reference"
  )
);
const missingOrg = approvalReadinessOf(
  baseRow({ organizationId: OTHER_ORG_ID }),
  [],
  NOW,
  CONTEXT
);
check("organization absent from the live registry is not ready", missingOrg.ready, false);
assert(
  "live-organization blocker is named",
  missingOrg.blockers.some(
    (blocker) => blocker.code === "organization-reference"
  )
);
const emptyContext = approvalReadinessOf(baseRow(), [], NOW, {
  categorySlugs: new Set(),
  organizationIds: new Set(),
});
check("empty live-reference context fails closed", emptyContext.ready, false);

// Parser-only refusals (title/URL/region/length) are never hidden.
const badTitle = approvalReadinessOf(baseRow({ title: "AB" }), [], NOW, CONTEXT);
check("parser-level title refusal is not ready", badTitle.ready, false);
assert(
  "parser-level title refusal is surfaced",
  badTitle.blockers.some(
    (blocker) =>
      blocker.code === "approval-contract" &&
      blocker.label.includes("Title must be between")
  )
);

// Ready means every check passes; not-ready always carries a reason.
for (const result of [
  ready,
  unknownEligibility,
  notEligible,
  noEligibilityEvidence,
  expired,
  noDeadlineEvidence,
  noRelevance,
  badCountry,
  duplicate,
  published,
  missingLiveCategory,
  missingOrg,
  emptyContext,
  badTitle,
]) {
  check(
    `ready equals all checks passing (${result.state})`,
    result.ready,
    result.checks.every((check) => check.pass)
  );
  assert(
    `not-ready result always names a blocker (${result.state})`,
    result.ready || result.blockers.length > 0
  );
}

// Ordering: ready first, nearest deadline first, no deadline last; then
// duplicate work, evidence work, deadline work, source work.
const ordered = orderApprovalQueue([
  {
    opportunity: {
      id: "later-ready",
      createdAt: "2027-01-01T00:00:00.000Z",
      deadline: "2027-12-01T00:00:00.000Z",
    },
    state: "ready-for-approval" as const,
  },
  {
    opportunity: {
      id: "sooner-ready",
      createdAt: "2027-01-10T00:00:00.000Z",
      deadline: "2027-02-01T00:00:00.000Z",
    },
    state: "ready-for-approval" as const,
  },
  {
    opportunity: {
      id: "no-date-ready",
      createdAt: "2027-01-02T00:00:00.000Z",
      deadline: null,
    },
    state: "ready-for-approval" as const,
  },
  {
    opportunity: {
      id: "duplicate-work",
      createdAt: "2026-11-01T00:00:00.000Z",
      deadline: null,
    },
    state: "possible-duplicate" as const,
  },
  {
    opportunity: {
      id: "evidence-work",
      createdAt: "2026-12-01T00:00:00.000Z",
      deadline: "2027-03-01T00:00:00.000Z",
    },
    state: "needs-evidence" as const,
  },
]);
check(
  "ready records sort nearest deadline first, then other states",
  ordered.map((item) => item.opportunity.id),
  ["sooner-ready", "later-ready", "no-date-ready", "duplicate-work", "evidence-work"]
);
const oldestFirst = orderApprovalQueue([
  {
    opportunity: {
      id: "newer",
      createdAt: "2027-01-02T00:00:00.000Z",
      deadline: null,
    },
    state: "needs-evidence" as const,
  },
  {
    opportunity: {
      id: "older",
      createdAt: "2027-01-01T00:00:00.000Z",
      deadline: null,
    },
    state: "needs-evidence" as const,
  },
]);
check(
  "non-ready states stay oldest-submitted-first",
  oldestFirst.map((item) => item.opportunity.id),
  ["older", "newer"]
);

// Counts and filter/label contracts.
check(
  "counts cover every approval state",
  countApprovalQueue([
    { state: "ready-for-approval" },
    { state: "needs-evidence" },
    { state: "possible-duplicate" },
    { state: "deadline-unclear" },
    { state: "source-problem" },
  ]),
  {
    total: 5,
    ready: 1,
    needsEvidence: 1,
    possibleDuplicate: 1,
    sourceProblem: 1,
    deadlineUnclear: 1,
  }
);
check("filter parser accepts ready-for-approval", parseQueueFilter({ readiness: "ready-for-approval" }).readiness, "ready-for-approval");
check("filter parser keeps legacy ready-for-review", parseQueueFilter({ readiness: "ready-for-review" }).readiness, "ready-for-review");
check("filter parser rejects hostile approval slugs", parseQueueFilter({ readiness: "urgent" }).readiness, null);
check("approval state parser accepts the exact slug", parseApprovalReadinessState("ready-for-approval"), "ready-for-approval");
check("approval state parser rejects legacy review slug", parseApprovalReadinessState("ready-for-review"), null);
check(
  "approval labels cover the five outcomes",
  [
    APPROVAL_READINESS_LABEL["ready-for-approval"],
    APPROVAL_READINESS_LABEL["needs-evidence"],
    APPROVAL_READINESS_LABEL["possible-duplicate"],
    APPROVAL_READINESS_LABEL["source-problem"],
    APPROVAL_READINESS_LABEL["deadline-unclear"],
  ],
  ["Ready for approval", "Needs evidence", "Possible duplicate", "Source problem", "Deadline unclear"]
);
check(
  "honesty note never claims a verdict",
  APPROVAL_READINESS_NOTE.includes("never a verdict"),
  true
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
