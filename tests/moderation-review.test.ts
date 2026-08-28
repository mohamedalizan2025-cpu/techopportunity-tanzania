/**
 * Pure unit tests for the moderator review parser (lib/data/moderation-review.ts).
 * Database-side guarantees (pending guard, staff authorization, double-decision
 * protection) are enforced by the server action + RLS and verified separately.
 */
import { parseReviewInput } from "../lib/data/moderation-review";

let passed = 0;
let failed = 0;
function assert(name: string, condition: boolean, detail = ""): void {
  if (condition) { passed += 1; console.log(`PASS  ${name}`); }
  else { failed += 1; console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`); }
}

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const BASE = {
  title: "Valid Opportunity Title",
  category: "hackathon",
  description: "A description that is long enough.",
  url: "https://example.com/opportunity",
};

// 1. approve with no enrichment (all optional fields absent → nulls)
const r1 = parseReviewInput(form(BASE));
assert("1 approve, no enrichment: ok", r1.ok);
if (r1.ok) assert(
  "1 optional fields remain null when not supplied (case 11)",
  r1.review.venueName === null && r1.review.city === null && r1.review.region === null &&
    r1.review.deadline === null && r1.review.address === null && r1.review.organizationId === null,
  JSON.stringify(r1.review)
);

// 2. approve with organizer
const r2 = parseReviewInput(form({ ...BASE, organizationId: "11111111-1111-4111-8111-111111111111" }));
assert("2 organizer attached", r2.ok && r2.review.organizationId === "11111111-1111-4111-8111-111111111111");

// 3. approve with location (city + canonical region)
const r3 = parseReviewInput(form({ ...BASE, city: "Dar es Salaam", region: "Dar es Salaam" }));
assert("3 location: city + canonical region accepted", r3.ok && r3.review.city === "Dar es Salaam" && r3.review.region === "Dar es Salaam");

// 4. approve with deadline (date-only → deterministic UTC)
const r4 = parseReviewInput(form({ ...BASE, deadline: "2026-10-01" }));
assert("4 deadline normalized to UTC midnight", r4.ok && r4.review.deadline === "2026-10-01T00:00:00.000Z", JSON.stringify(r4.ok ? r4.review.deadline : r4));

// 5. approve with multiple enriched fields
const r5 = parseReviewInput(form({ ...BASE, venue_name: "Costech Building", address: "Ali Hassan Mwinyi Road", city: "Dar es Salaam", region: "Dar es Salaam", deadline: "2026-10-01", organizationId: "11111111-1111-4111-8111-111111111111" }));
assert("5 multiple enriched fields accepted", r5.ok && r5.review.venueName === "Costech Building" && r5.review.address === "Ali Hassan Mwinyi Road" && r5.review.organizationId !== null);

// 6. reject path never wipes: the parser is not even invoked on rejection;
//    prove the parser itself carries no decision semantics (no `decision` read)
const r6 = parseReviewInput(form({ ...BASE, decision: "reject" }));
assert("6 parser ignores decision verb (reject path wipes nothing)", r6.ok);

// 7. invalid organization UUID rejected
const r7 = parseReviewInput(form({ ...BASE, organizationId: "not-a-uuid" }));
assert("7 invalid organization UUID rejected", !r7.ok && r7.message.includes("organization"));

// 9. already-published / already-rejected updates are unreachable through
//    this parser+action (pending guard) — parser cannot bypass it; asserted
//    structurally: parser never emits status
const r9 = parseReviewInput(form(BASE));
assert("9 parser emits no status field (pending guard lives in the UPDATE)", r9.ok && !("status" in r9.review));

// 12. provenance fields cannot be modified: fed explicitly, never returned
const r12 = parseReviewInput(form({ ...BASE, source_id: "22222222-2222-4222-8222-222222222222", discovered_at: "1999-01-01", discovery_method: "manual", submitted_by: "33333333-3333-4333-8333-333333333333" }));
assert("12 provenance inputs ignored entirely", r12.ok && !("source_id" in r12.review) && !("discovered_at" in r12.review) && !("discovery_method" in r12.review) && !("submitted_by" in r12.review));

// extra: invalid region rejected (no arbitrary region strings)
const rEx = parseReviewInput(form({ ...BASE, region: "Atlantis" }));
assert("extra: non-canonical region rejected", !rEx.ok && rEx.message.includes("canonical"));

// extra: invalid deadline rejected
const rEx2 = parseReviewInput(form({ ...BASE, deadline: "not-a-date" }));
assert("extra: invalid deadline rejected", !rEx2.ok && rEx2.message.includes("Deadline"));

// extra: URL scheme guard
const rEx3 = parseReviewInput(form({ ...BASE, url: "javascript:alert(1)" }));
assert("extra: javascript: URL rejected", !rEx3.ok && rEx3.message.includes("http"));

// extra: non-canonical region case-insensitive canonicalization
const rEx4 = parseReviewInput(form({ ...BASE, region: "mjini magharibi" }));
assert("extra: canonical region case-insensitive", rEx4.ok && r4.ok && rEx4.review.region === "Mjini Magharibi");

// country honesty: empty stays null (never defaulted), verified value preserved
const rC1 = parseReviewInput(form(BASE));
assert("country: absent field stays null (no default)", rC1.ok && rC1.review.country === null);
const rC2 = parseReviewInput(form({ ...BASE, country: "Kenya" }));
assert("country: moderator-verified value preserved", rC2.ok && rC2.review.country === "Kenya");
const rC3 = parseReviewInput(form({ ...BASE, country: "x".repeat(101) }));
assert("country: over-long value rejected", !rC3.ok && rC3.message.includes("Country"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
