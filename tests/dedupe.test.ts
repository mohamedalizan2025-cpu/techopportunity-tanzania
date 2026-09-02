import {
  canonicalOpportunityUrl,
  isDuplicate,
  sameOpportunityTitle,
  sameUrl,
  type DedupeRow,
} from "../scripts/discovery/dedupe";
import type { CandidateOpportunity } from "../scripts/discovery/types";

let passed = 0;
let failed = 0;
function assert(name: string, condition: boolean, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` - ${detail}` : ""}`);
  }
}

const candidate = (title: string, url: string, sourceId = "ofa"): CandidateOpportunity => ({
  title,
  description: "A sufficiently detailed opportunity description.",
  category: "other",
  organization: null,
  url,
  deadline: null,
  venueName: null,
  address: null,
  city: null,
  region: null,
  country: null,
  sourceId,
  sourceUrl: url,
  evidenceUrl: url,
  referenceKind: "source-base",
  discoveryMethod: "rss",
});

const row = (title: string, url: string, sourceId = "od"): DedupeRow => ({
  title,
  url,
  source_id: sourceId,
  deadline: null,
});

assert(
  "canonical URL strips fragment and known tracking parameters",
  sameUrl(
    "https://example.org/call/?utm_source=feed&b=2&a=1#apply",
    "https://example.org/call?a=1&b=2",
  ),
);
assert(
  "canonical URL preserves identity-bearing query parameters",
  canonicalOpportunityUrl("https://example.org/call?id=2") !== canonicalOpportunityUrl("https://example.org/call?id=3"),
);

const ubcOfa = "The University of British Columbia Mastercard Foundation Scholars Program 2027/2028 for study in Canada (Fully Funded)";
const ubcOd = "Mastercard Foundation Scholars Program at University of British Columbia 2027";
assert("conservative title identity catches reordered UBC pair", sameOpportunityTitle(ubcOfa, ubcOd));

const umapsOfa = "University of Michigan African Presidential Scholars Program (UMAPS) 2027 for Study in the United States (Fully Funded)";
const umapsOd = "University of Michigan African Presidential Scholars (UMAPS) 2027-2028";
assert("conservative title identity catches UMAPS pair", sameOpportunityTitle(umapsOfa, umapsOd));

const torontoSpecific = "The University of Toronto Mastercard Foundation Doctor of Public Health Scholarships 2027/2028 for Africa public health leaders (Fully Funded)";
const torontoBroad = "Mastercard Foundation Graduate Scholarship at the University of Toronto 2027-2028";
assert("partial Toronto overlap stays for moderation", !sameOpportunityTitle(torontoSpecific, torontoBroad));
assert(
  "different cohort years stay distinct",
  !sameOpportunityTitle("University of Example Research Fellowship 2027", "Research Fellowship at University of Example 2028"),
);
assert("short generic titles never become cross-source identity", !sameOpportunityTitle("AI Grant 2027", "Grant AI 2027"));
assert(
  "cross-source title identity reaches duplicate gate",
  isDuplicate(candidate(ubcOfa, "https://ofa.example/ubc", "ofa"), [row(ubcOd, "https://od.example/ubc", "od")]),
);
assert(
  "adjacent scheduled run rejects an already-persisted canonical URL",
  isDuplicate(
    candidate("Tanzania AI Fellowship 2027", "https://example.org/fellowship?utm_source=scheduled"),
    [row("Tanzania AI Fellowship 2027", "https://example.org/fellowship")],
  ),
);
assert(
  "same-source different URLs are not title-collapsed",
  !isDuplicate(candidate(ubcOfa, "https://ofa.example/ubc-a", "ofa"), [row(ubcOd, "https://ofa.example/ubc-b", "ofa")]),
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
