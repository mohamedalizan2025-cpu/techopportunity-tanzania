/**
 * Submit-flow taxonomy consistency contract.
 *
 * Invariant: the categories offered by the submission form are EXACTLY the
 * categories seeded in the live database (same source as the homepage hub),
 * and every offered category is accepted by server-side validation. The form
 * must never present admissions/jobs while their owner-gated seeds (0004/
 * 0010) are absent, and must pick them up automatically once seeded.
 */
import { mapLiveCategories } from "../lib/data/categories";
import { validateSubmission, type SubmissionInput } from "../lib/submission-validation";

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

function makeInput(category: string): SubmissionInput {
  return {
    title: "Example opportunity for taxonomy test",
    description: "A real description long enough to pass validation.",
    category,
    organizationId: "",
    url: "https://example.org/apply",
    deadline: "",
    venueName: "",
    address: "",
    city: "",
    region: "",
    country: "",
  };
}

// Current live shape: 0001 seeds only (0004/0010 unapplied).
const CURRENT_LIVE_ROWS = [
  { slug: "hackathon", label: "Hackathon" },
  { slug: "competition", label: "Competition" },
  { slug: "scholarship", label: "Scholarship" },
  { slug: "conference", label: "Conference" },
  { slug: "workshop", label: "Workshop" },
  { slug: "internship", label: "Internship" },
  { slug: "fellowship", label: "Fellowship" },
  { slug: "grant", label: "Grant" },
  { slug: "tech-event", label: "Tech Event" },
  { slug: "other", label: "Other" },
];

// 1. while the seeds are absent, the form must NOT offer admissions/jobs
const currentOptions = mapLiveCategories(CURRENT_LIVE_ROWS);
assert(
  "1 form options exclude unseeded admissions/jobs",
  currentOptions.every((c) => c.slug !== "admissions" && c.slug !== "jobs")
);

// 2. once the owner seeds land, the options appear with no frontend change
const futureOptions = mapLiveCategories([
  ...CURRENT_LIVE_ROWS,
  { slug: "admissions", label: "Admissions & Programmes" },
  { slug: "jobs", label: "Jobs & Vacancies" },
]);
assert(
  "2 seeded admissions/jobs appear automatically in form options",
  futureOptions.some((c) => c.slug === "admissions") &&
    futureOptions.some((c) => c.slug === "jobs")
);

// 3. UI ↔ server consistency: every offered option passes server-side
//    validation (no user can be offered a category that is then rejected)
assert(
  "3 every offered option is accepted by validateSubmission",
  currentOptions.every(
    (c) => validateSubmission(makeInput(c.slug)).ok === true
  )
);

// 4. offered options are always a subset of the server's accepted taxonomy
const accepted = CURRENT_LIVE_ROWS.map(({ slug }) => slug);
assert(
  "4 form options stay inside the accepted taxonomy",
  futureOptions.every((c) =>
    [...accepted, "admissions", "jobs"].includes(c.slug)
  )
);

// 5. option order mirrors the live table order (stable, id-sorted UX)
assert(
  "5 options preserve live-table order",
  currentOptions.map((c) => c.slug).join(",") ===
    CURRENT_LIVE_ROWS.map((r) => r.slug).join(",")
);

// 6. an unseeded slug submitted directly is caught by the server backstop
//    chain at latest in the category lookup — validation itself is the union
//    gate, so a slug OUTSIDE the union must fail validation outright
const bogus = validateSubmission(makeInput("not-a-category"));
assert(
  "6 unknown category fails server-side validation",
  bogus.ok === false && bogus.errors.category !== undefined
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
