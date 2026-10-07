import {
  REVIEW_READINESS_LABEL,
  REVIEW_READINESS_NOTE,
  reviewReadinessOf,
  type ReadinessRow,
} from "../lib/review-readiness";

function baseRow(overrides: Partial<ReadinessRow> = {}): ReadinessRow {
  return {
    id: "row-1",
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
      eligibilityDecision: "unknown",
      eligibilityEvidence: null,
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

// 1. Complete row with unknown eligibility is READY (eligibility is the moderator's decision).
check(
  "unknown eligibility does not block ready-for-review",
  reviewReadinessOf(baseRow(), []).state,
  "ready-for-review"
);

// 2. Missing evidence URL → source-problem.
check(
  "row without any usable link is a source problem",
  reviewReadinessOf(baseRow({ url: "not a url", trust: { ...baseRow().trust!, canonicalEvidenceUrl: null } }), []).state,
  "source-problem"
);

// 3. Unattributed row → source-problem.
check(
  "row without source attribution is a source problem",
  reviewReadinessOf(
    baseRow({ sourceName: null, sourceUrl: null, discoveryMethod: null }),
    []
  ).state,
  "source-problem"
);

// 4. Test/placeholder contamination → source-problem.
check(
  "test artifact title is a source problem",
  reviewReadinessOf(baseRow({ title: "PRODUCTION LINK TEST — DELETE ME" }), []).state,
  "source-problem"
);

// 5. Same canonical link (tracking params differ) → possible-duplicate.
const siblingSameLink = baseRow({
  id: "row-2",
  url: "https://mandelawashingtonfellowship.org/apply/?utm_source=feed#section",
  sourceName: "Aggregator",
  sourceUrl: "https://aggregator.example/feed",
});
check(
  "same canonical link across sources is a possible duplicate",
  reviewReadinessOf(baseRow(), [siblingSameLink]).state,
  "possible-duplicate"
);

// 6. Cross-source shared cohort year + exact title core → possible-duplicate.
const siblingSameTitle = baseRow({
  id: "row-3",
  url: "https://other.example/opportunity",
  sourceName: "Other Registry",
  sourceUrl: "https://other.example/opportunity",
});
check(
  "cross-source title-core match is a possible duplicate",
  reviewReadinessOf(baseRow(), [siblingSameTitle]).state,
  "possible-duplicate"
);

// 7. Same source + same title core is NOT a duplicate (single-source recrawl).
const siblingSameSource = baseRow({
  id: "row-4",
  url: "https://mandelawashingtonfellowship.org/apply/round-two",
});
check(
  "same-source title-core match is not a duplicate",
  reviewReadinessOf(baseRow(), [siblingSameSource]).state,
  "ready-for-review"
);

// 8. Self is never its own duplicate.
check(
  "row does not match itself",
  reviewReadinessOf(baseRow(), [baseRow()]).state,
  "ready-for-review"
);

// 9. Expired deadline → deadline-unclear.
check(
  "past deadline is deadline-unclear",
  reviewReadinessOf(baseRow({ deadline: "2020-01-01T00:00:00.000Z" }), []).state,
  "deadline-unclear"
);

// 10. Malformed deadline without evidence → deadline-unclear.
check(
  "malformed deadline without evidence is deadline-unclear",
  reviewReadinessOf(
    baseRow({ deadline: "soon-ish", deadlinePrecision: "unknown", deadlineEvidence: null }),
    []
  ).state,
  "deadline-unclear"
);

// 11. Honestly unknown deadline (consistent nulls) does not block review.
check(
  "consistent unknown deadline stays reviewable",
  reviewReadinessOf(
    baseRow({ deadline: null, deadlinePrecision: "unknown", deadlineEvidence: null }),
    []
  ).state,
  "ready-for-review"
);

// 12. Short description → needs-evidence.
check(
  "thin description is needs-evidence",
  reviewReadinessOf(baseRow({ description: "Apply now!" }), []).state,
  "needs-evidence"
);

// 13. Missing trust (never qualified) → needs-evidence.
check(
  "row without qualification evidence is needs-evidence",
  reviewReadinessOf(baseRow({ trust: undefined }), []).state,
  "needs-evidence"
);

// 14. Bare unevidenced country value → needs-evidence (M31 country truth).
check(
  "unevidenced country value is needs-evidence",
  reviewReadinessOf(
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
    []
  ).state,
  "needs-evidence"
);

// 15. Priority: source-problem beats duplicate.
check(
  "source-problem outranks possible-duplicate",
  reviewReadinessOf(
    baseRow({ url: "not a url", trust: { ...baseRow().trust!, canonicalEvidenceUrl: null } }),
    [siblingSameLink]
  ).state,
  "source-problem"
);

// 16. Priority: duplicate beats deadline-unclear.
check(
  "possible-duplicate outranks deadline-unclear",
  reviewReadinessOf(
    baseRow({ deadline: "2020-01-01T00:00:00.000Z" }),
    [siblingSameLink]
  ).state,
  "possible-duplicate"
);

// 17. Priority: deadline-unclear beats needs-evidence.
check(
  "deadline-unclear outranks needs-evidence",
  reviewReadinessOf(
    baseRow({ deadline: "2020-01-01T00:00:00.000Z", description: "Apply now!" }),
    []
  ).state,
  "deadline-unclear"
);

// 18. Checklist always has exactly the four deterministic gates in order.
check(
  "checklist carries the four gates in fixed order",
  reviewReadinessOf(baseRow(), []).checks.map((c) => c.id),
  ["source-usable", "not-duplicate", "deadline-clear", "evidence-complete"]
);

// 19. Ready row passes every gate.
check(
  "ready row passes all four gates",
  reviewReadinessOf(baseRow(), []).checks.every((c) => c.pass),
  true
);

// 20. Labels cover every required outcome; note disclaims verdicts.
check(
  "labels cover the five required outcomes",
  [
    REVIEW_READINESS_LABEL["ready-for-review"],
    REVIEW_READINESS_LABEL["needs-evidence"],
    REVIEW_READINESS_LABEL["possible-duplicate"],
    REVIEW_READINESS_LABEL["source-problem"],
    REVIEW_READINESS_LABEL["deadline-unclear"],
  ],
  ["Ready for review", "Needs evidence", "Possible duplicate", "Source problem", "Deadline unclear"]
);
check(
  "honesty note never claims a verdict",
  REVIEW_READINESS_NOTE.includes("never verdicts"),
  true
);

console.log(`\n${passed} review-readiness contract tests passed.`);
