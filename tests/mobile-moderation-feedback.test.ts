/**
 * Mobile moderation approval feedback — regression protection.
 *
 * Reported defect: on a phone, after tapping Approve at the sticky decision
 * controls, a server-side refusal was rendered ONLY at the top of the long
 * decision form. The moderator stayed scrolled at the bottom, saw the
 * "Working…" state end, and nothing else — the approval looked like it had
 * silently failed. The fix keeps the authoritative top alert (single
 * role="alert" for assistive technology, focused with preventScroll) and
 * echoes the same refusal inside the sticky decision controls so the reason
 * is visible exactly where the decision was made.
 *
 * These tests pin the fix and, importantly, re-assert that NO trust gate was
 * weakened: missing human confirmation still fails closed, incomplete
 * trust/evidence still fails, and only a fully evidenced, human-confirmed
 * review can approve.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  APPROVE_CONFIRM_TOKEN,
  isApproveConfirmed,
} from "../lib/staff-form-state";
import {
  parseReviewInput,
  reviewedOpportunityUpdate,
} from "../lib/data/moderation-review";

const root = process.cwd();
const form = readFileSync(
  join(root, "app/moderation/decision-form.tsx"),
  "utf8"
);
const actions = readFileSync(
  join(root, "lib/data/moderation-actions.ts"),
  "utf8"
);

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

const validApprovalFields: Record<string, string> = {
  title: "Valid Mobile Review Title",
  category: "fellowship",
  description:
    "This official programme description explains the technology focus, the applicant work, and the reviewable opportunity details in full for a human moderator decision.",
  url: "https://example.org/opportunity",
  relevance_evidence: "Official page describes an applied technology opportunity.",
  eligibility: "tanzanians_eligible",
  eligibility_evidence: "Official eligibility section is open to all African nationals.",
  deadline_precision: "unknown",
  country_verification: "unknown",
};

// --- Mobile-visible error feedback -------------------------------------------

test("server refusal is echoed inside the sticky decision controls, above the buttons", () => {
  const controlsIndex = form.indexOf('id="decision-controls"');
  assert.ok(controlsIndex > -1, "sticky decision controls must keep their stable id");
  const confirmIndex = form.indexOf('name="confirm"');
  assert.ok(confirmIndex > controlsIndex, "confirmation checkbox stays inside the sticky controls");

  const stickyBlock = form.slice(controlsIndex, confirmIndex);
  assert.match(
    stickyBlock,
    /state\.status === "error"[\s\S]{0,200}aria-hidden="true"[\s\S]{0,200}\{state\.message\}/,
    "the refusal message must be rendered inside the sticky decision block"
  );
  assert.equal(
    form.match(/aria-hidden="true"/g)?.length,
    1,
    "exactly one visual echo (screen readers hear the single role=alert)"
  );
});

test("the authoritative alert stays at the top and is focused without scrolling", () => {
  const alertIndex = form.indexOf('role="alert"');
  const controlsIndex = form.indexOf('id="decision-controls"');
  assert.ok(alertIndex > -1 && alertIndex < controlsIndex, "top alert stays before the sticky controls");
  assert.match(form, /ref=\{errorRef\}/);
  assert.match(form, /tabIndex=\{-1\}/);
  assert.match(
    form,
    /useEffect\(\(\) => \{[\s\S]*?state\.status === "error"[\s\S]*?errorRef\.current\?\.focus\(\{ preventScroll: true \}\)/,
    "error arrival must move focus to the alert without yanking the mobile scroll position"
  );
});

test("sticky decision controls, pending state, and success state are preserved", () => {
  assert.match(form, /className="sticky bottom-0/);
  assert.match(form, /disabled=\{isPending\}/);
  assert.match(form, /"Working…"/);
  assert.match(form, /state\.status === "success"/);
  assert.match(form, /Review next in queue → \(Enter\)/);
  assert.match(form, /autoFocus/);
});

// --- Trust gates stay exactly as strong ---------------------------------------

test("missing human confirmation still fails closed", () => {
  assert.equal(isApproveConfirmed(null), false);
  assert.equal(isApproveConfirmed(""), false);
  assert.equal(isApproveConfirmed("approve"), false);
  assert.equal(isApproveConfirmed(APPROVE_CONFIRM_TOKEN), true);

  const confirmGate = actions.indexOf("isApproveConfirmed(formData.get(\"confirm\"))");
  const accessGate = actions.indexOf("getModerationAccess()");
  const writeGate = actions.indexOf("await saveApprovedReview({");
  assert.ok(confirmGate > -1, "confirmation gate must exist in the action");
  assert.ok(
    confirmGate < accessGate && confirmGate < writeGate,
    "the confirmation gate must run before authentication and before any write"
  );
});

test("missing trust/evidence still fails approval", () => {
  assert.equal(parseReviewInput(formData(validApprovalFields)).ok, true);

  const withoutRelevance = { ...validApprovalFields };
  delete withoutRelevance.relevance_evidence;
  assert.equal(parseReviewInput(formData(withoutRelevance)).ok, false);

  const unknownEligibility = {
    ...validApprovalFields,
    eligibility: "unknown",
    eligibility_evidence: "",
  };
  assert.equal(parseReviewInput(formData(unknownEligibility)).ok, false);

  const shortEligibilityEvidence = {
    ...validApprovalFields,
    eligibility_evidence: "too short",
  };
  assert.equal(parseReviewInput(formData(shortEligibilityEvidence)).ok, false);

  const unevidencedCountry = { ...validApprovalFields, country: "Kenya" };
  assert.equal(parseReviewInput(formData(unevidencedCountry)).ok, false);
});

test("a valid fully evidenced review can approve with human attribution", () => {
  const parsed = parseReviewInput(formData(validApprovalFields));
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const update = reviewedOpportunityUpdate(
    parsed.review,
    "moderator-id",
    "2026-10-19T00:00:00.000Z",
    3
  );
  assert.equal(update.status, "published");
  assert.equal(update.decided_by, "moderator-id");
  assert.equal(update.decided_at, "2026-10-19T00:00:00.000Z");
  assert.equal(update.last_verified_at, "2026-10-19T00:00:00.000Z");
  assert.equal(update.eligibility, "tanzanians_eligible");
});

// --- No automation ------------------------------------------------------------

test("no automatic approval path exists in the decision form", () => {
  assert.doesNotMatch(form, /requestSubmit\(/);
  assert.doesNotMatch(form, /\.submit\(/);
  assert.doesNotMatch(form, /useEffect\(\(\) => \{[\s\S]{0,120}formAction/);
  assert.match(form, /type="checkbox"/);
  assert.match(form, /value=\{APPROVE_CONFIRM_TOKEN\}/);
});

test("bulk moderation never approves", () => {
  assert.doesNotMatch(actions, /bulkApprove/i);
  assert.match(actions, /There is intentionally no bulk approve/);
});
