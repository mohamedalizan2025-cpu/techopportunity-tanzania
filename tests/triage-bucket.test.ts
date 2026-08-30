/**
 * Milestone 10 — moderation throughput contract tests.
 *
 * Pure unit tests for:
 *   - lib/triage-bucket.ts      (prioritization hints, never decisions)
 *   - reviewCategoryOptions in lib/data/moderation.ts (live-taxonomy honesty)
 *
 * Honesty rules under test: heuristic buckets never approve/reject anything,
 * unseeded categories are never offered, and the record's discovered
 * category is always reviewable.
 */
import {
  TRIAGE_BUCKET_LABEL,
  TRIAGE_BUCKET_SHORT,
  firstSuggestedReview,
  triageBucketOf,
} from "../lib/triage-bucket";
import { reviewCategoryOptions } from "../lib/data/moderation";
import type { OpportunityCategory } from "../lib/types";

let passed = 0;
let failed = 0;
function assert(name: string, condition: boolean, detail = ""): void {
  if (condition) { passed += 1; console.log(`PASS  ${name}`); }
  else { failed += 1; console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`); }
}

const label = (slug: string) => slug.toUpperCase();

// --- triage buckets: category-driven classes --------------------------------

assert("bucket: scholarship → 2 (high value)", triageBucketOf("scholarship", "Anything") === 2);
assert("bucket: fellowship → 2", triageBucketOf("fellowship", "Anything") === 2);
assert("bucket: grant → 2", triageBucketOf("grant", "Anything") === 2);
assert("bucket: internship → 2", triageBucketOf("internship", "Anything") === 2);
assert("bucket: jobs → 3", triageBucketOf("jobs", "Anything") === 3);
assert("bucket: admissions → 4", triageBucketOf("admissions", "Anything") === 4);
assert("bucket: hackathon → 5", triageBucketOf("hackathon", "Anything") === 5);
assert("bucket: competition → 5", triageBucketOf("competition", "Anything") === 5);
assert("bucket: workshop → 6", triageBucketOf("workshop", "Anything") === 6);
assert("bucket: conference → 6", triageBucketOf("conference", "Anything") === 6);
assert("bucket: tech-event → 6", triageBucketOf("tech-event", "Anything") === 6);
assert("bucket: category wins over title", triageBucketOf("workshop", "Waziri akagua miradi") === 6);

// --- triage buckets: title heuristics for `other` ---------------------------

assert(
  "bucket: other + actionable title → 1 (heuristic)",
  triageBucketOf("other", "Call for Applications — Scholarship 2026") === 1
);
assert(
  "bucket: other + Swahili actionable title → 1 (heuristic)",
  triageBucketOf("other", "TANGAZO LA UDAHILI WA STASHAHADA 2026") === 1
);
assert(
  "bucket: other + news title → 8 (heuristic)",
  triageBucketOf("other", "WAZIRI WA ELIMU AKAGUA MIRADI YA HEET SUZA") === 8
);
assert(
  "bucket: other + neutral title → 7 (ambiguous)",
  triageBucketOf("other", "Programme overview document") === 7
);
assert(
  "bucket: null category falls back to title signals",
  triageBucketOf(null, "Apply now for the challenge") === 1
);

// --- labels stay honest ------------------------------------------------------

assert(
  "labels: heuristic buckets are marked heuristic",
  TRIAGE_BUCKET_LABEL[1].toLowerCase().includes("heuristic") &&
    TRIAGE_BUCKET_LABEL[8].toLowerCase().includes("heuristic")
);
assert(
  "labels: every bucket has a short + long label",
  ([1, 2, 3, 4, 5, 6, 7, 8] as const).every(
    (b) => TRIAGE_BUCKET_SHORT[b].length > 0 && TRIAGE_BUCKET_LABEL[b].length > 0
  )
);

// --- first suggested review --------------------------------------------------

const items = [
  { id: "a", bucket: triageBucketOf("other", "Welcome note") },           // 8
  { id: "b", bucket: triageBucketOf("other", "Ordinary page") },          // 7
  { id: "c", bucket: triageBucketOf("fellowship", "Fuller Fellowship") }, // 2
] as const;
const suggested = firstSuggestedReview([...items]);
assert(
  "suggested: high-value record is surfaced first regardless of queue position",
  suggested?.id === "c",
  JSON.stringify(suggested)
);

const sameBucket = [
  { id: "older", bucket: 7 as const },
  { id: "newer", bucket: 7 as const },
];
assert(
  "suggested: inside a bucket, deterministic queue order wins (no reshuffle)",
  firstSuggestedReview(sameBucket)?.id === "older"
);
assert("suggested: empty queue yields null", firstSuggestedReview([]) === null);

// --- review category options: live-taxonomy honesty --------------------------

const liveTen = (["hackathon", "competition", "scholarship", "conference", "workshop", "internship", "fellowship", "grant", "tech-event", "other"] as const).map(
  (slug) => ({ slug: slug as string, label: null })
);

const opts1 = reviewCategoryOptions(liveTen, "other", label);
assert(
  "options: unseeded admissions/jobs are never offered",
  !opts1.some((o) => o.slug === "admissions") && !opts1.some((o) => o.slug === "jobs"),
  JSON.stringify(opts1.map((o) => o.slug))
);

const opts2 = reviewCategoryOptions(
  [...liveTen, { slug: "admissions", label: "Admissions" }, { slug: "jobs", label: "Jobs" }],
  "other",
  label
);
assert(
  "options: seeded admissions/jobs appear automatically (0004/0010)",
  opts2.some((o) => o.slug === "admissions") && opts2.some((o) => o.slug === "jobs")
);

const opts3 = reviewCategoryOptions(liveTen, "scholarship", label);
assert(
  "options: record's discovered category is always reviewable",
  opts3.some((o) => o.slug === "scholarship")
);

const opts4 = reviewCategoryOptions([], "other", label);
assert(
  "options: unreadable live table falls back to the record's own category only",
  opts4.length === 1 && opts4[0].slug === "other" && opts4[0].label.includes("(current)"),
  JSON.stringify(opts4)
);

const opts5 = reviewCategoryOptions(
  [...liveTen, { slug: "not-a-category", label: "Mystery" }],
  "other",
  label
);
assert(
  "options: slugs outside the application taxonomy are never surfaced",
  !opts5.some((o) => o.slug === ("not-a-category" as OpportunityCategory))
);

const opts6 = reviewCategoryOptions(
  [{ slug: "hackathon", label: "Hackathon" }, { slug: "hackathon", label: "Duplicate" }],
  "hackathon",
  label
);
assert(
  "options: duplicate live rows collapse and no (current) duplicate is appended",
  opts6.length === 1 && opts6[0].label === "Hackathon",
  JSON.stringify(opts6)
);

const opts7 = reviewCategoryOptions(
  [{ slug: "hackathon", label: "   " }],
  "hackathon",
  label
);
assert(
  "options: blank live label falls back to the application label",
  opts7[0].label === "HACKATHON"
);

// ------------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
