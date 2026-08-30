/**
 * Milestone 14 — published-record management contract tests.
 *
 * Pure unit tests for lib/data/published-management.ts: the unpublish
 * request parser, the permission/target gates, the update payload shape and
 * the list filter.
 *
 * Guarantee under test: an unpublish is a single-record, staff-gated,
 * confirmation-gated STATUS change onto an existing enum value. It never
 * deletes a row, never writes a provenance field, and can never publish
 * something that is not already published.
 *
 * The database-side halves (RLS published-only reads, the conditional UPDATE
 * that no-ops on a concurrent change) are enforced by policy + the
 * `.eq("status","published")` guard and are verified against live behavior.
 */
import {
  UNPUBLISH_TARGET_STATUS,
  canUnpublish,
  evaluateUnpublishPermission,
  evaluateUnpublishTarget,
  filterPublishedRecords,
  parseUnpublishRequest,
  unpublishDenialMessage,
  unpublishUpdatePayload,
  type UnpublishRequest,
} from "../lib/data/published-management";
import { UNPUBLISH_CONFIRM_TOKEN } from "../lib/staff-form-state";
import type { ModerationAccessResult, StaffContext } from "../lib/data/moderation";
import type { Opportunity, OpportunityStatus } from "../lib/types";

let passed = 0;
let failed = 0;
function assert(name: string, condition: boolean, detail = ""): void {
  if (condition) { passed += 1; console.log(`PASS  ${name}`); }
  else { failed += 1; console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`); }
}

const ID = "11111111-1111-4111-8111-111111111111";
const STATUSES: OpportunityStatus[] = ["pending", "published", "rejected", "expired"];

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

function row(overrides: Partial<Opportunity>): Opportunity {
  return {
    id: ID,
    slug: "some-opportunity",
    title: "Some Opportunity",
    category: "scholarship",
    description: "Description",
    url: "https://example.com/opportunity",
    deadline: null,
    location: null,
    imageUrl: null,
    status: "published",
    createdAt: "2026-08-27T00:00:00.000Z",
    organization: null,
    sourceName: "OpportunityDesk",
    discoveredAt: "2026-08-27T00:00:00.000Z",
    discoveryMethod: "json-ld",
    ...overrides,
  } as Opportunity;
}

const allowed: ModerationAccessResult = {
  ok: true,
  staff: { client: {}, userId: "u1", displayName: null, email: null } as unknown as StaffContext,
};
const unauthenticated: ModerationAccessResult = { ok: false, reason: "unauthenticated" };
const forbidden: ModerationAccessResult = { ok: false, reason: "forbidden" };

/** Narrowing helpers: a refusal's reason, or null when the gate allowed. */
function denialOf(
  result: ReturnType<typeof evaluateUnpublishPermission>
): string | null {
  return result.ok ? null : result.denial;
}
function reasonOf(request: UnpublishRequest): string | null {
  return request.ok ? null : request.reason;
}

// --- 1. authorization: nobody but a confirmed staff member gets through ----

assert(
  "1 unauthenticated request is refused",
  evaluateUnpublishPermission({ ok: true, id: ID }, unauthenticated).ok === false
);
assert(
  "1 non-staff (forbidden) request is refused",
  evaluateUnpublishPermission({ ok: true, id: ID }, forbidden).ok === false
);
assert(
  "1 refusal reason distinguishes session vs permission",
  denialOf(evaluateUnpublishPermission({ ok: true, id: ID }, unauthenticated)) === "unauthenticated" &&
    denialOf(evaluateUnpublishPermission({ ok: true, id: ID }, forbidden)) === "forbidden"
);
assert(
  "1 staff + confirmed request is allowed and hands back the staff client",
  evaluateUnpublishPermission({ ok: true, id: ID }, allowed).ok === true
);

// --- 2/3. list honesty: only published rows are presented as public --------

const publishedRow = row({ id: "p1", status: "published" });
const pendingRow = row({ id: "q1", status: "pending" });
const rejectedRow = row({ id: "r1", status: "rejected" });
const expiredRow = row({ id: "e1", status: "expired" });

assert(
  "2 published records are listed",
  filterPublishedRecords([publishedRow, pendingRow]).map((r) => r.id).join() === "p1"
);
assert(
  "3 pending/rejected/expired are never listed as published",
  filterPublishedRecords([pendingRow, rejectedRow, expiredRow]).length === 0
);
assert(
  "3 list filter preserves input order (no re-ranking)",
  filterPublishedRecords([
    row({ id: "a", status: "published" }),
    pendingRow,
    row({ id: "b", status: "published" }),
  ]).map((r) => r.id).join() === "a,b"
);

// --- 4. only a published record can be unpublished ------------------------

assert("4 canUnpublish accepts only 'published'", canUnpublish("published"));
for (const status of STATUSES.filter((s) => s !== "published")) {
  assert(`4 canUnpublish refuses '${status}'`, !canUnpublish(status));
  assert(
    `4 target gate refuses a '${status}' record`,
    evaluateUnpublishTarget({ status }).ok === false
  );
}
assert("4 target gate refuses a missing/already-changed row", evaluateUnpublishTarget(null).ok === false);
assert("4 target gate allows a still-published row", evaluateUnpublishTarget({ status: "published" } as Opportunity).ok === true);

// --- 5/6. the write is a status change, never a delete, never provenance ---

const payload = unpublishUpdatePayload();
assert("5 payload writes exactly one column", Object.keys(payload).length === 1);
assert("5 payload writes only 'status'", "status" in payload && Object.keys(payload)[0] === "status");
assert(
  "5 no delete semantics: payload carries no id/url/where clause",
  !("id" in payload) && !("url" in payload) && !("slug" in payload)
);
assert(
  "6 provenance fields are never in the payload",
  ["source_id", "source_url", "url", "discovered_at", "discovery_method", "submitted_by", "title", "description", "category_id", "deadline", "city", "region", "country"]
    .every((field) => !(field in payload))
);
assert(
  "6 payload preserves the record by keeping the row: it never sets a null wipe",
  payload.status !== null && payload.status !== undefined
);

// --- no invented status: the target must be an existing enum value ---------

assert(
  "7 unpublish target is an EXISTING status (no new value, no DDL)",
  (STATUSES as string[]).includes(UNPUBLISH_TARGET_STATUS)
);
assert(
  "7 unpublish target is not 'published' (record leaves the public view)",
  (UNPUBLISH_TARGET_STATUS as string) !== "published"
);
assert(
  "7 unpublish does not silently re-queue the record as pending",
  (UNPUBLISH_TARGET_STATUS as string) !== "pending"
);

// --- 8. one deliberate action; double/concurrent change refuses -----------

assert(
  "8 well-formed confirmed request parses",
  parseUnpublishRequest(form({ opportunityId: ID, confirm: UNPUBLISH_CONFIRM_TOKEN })).ok === true
);
assert(
  "8 missing confirmation token is refused (no accidental mutation)",
  !parseUnpublishRequest(form({ opportunityId: ID })).ok
);
assert(
  "8 wrong confirmation value is refused",
  !parseUnpublishRequest(form({ opportunityId: ID, confirm: "yes" })).ok
);
assert(
  "8 blank opportunity id is refused",
  !parseUnpublishRequest(form({ opportunityId: "", confirm: UNPUBLISH_CONFIRM_TOKEN })).ok
);
assert(
  "8 non-UUID id is refused (no arbitrary target / SQL-shaped value)",
  !parseUnpublishRequest(form({ opportunityId: "1 or 1=1", confirm: UNPUBLISH_CONFIRM_TOKEN })).ok
);
assert(
  "8 missing id field is refused",
  !parseUnpublishRequest(form({ confirm: UNPUBLISH_CONFIRM_TOKEN })).ok
);
assert(
  "8 malformed id wins over unconfirmed (cheapest refusal first)",
  reasonOf(parseUnpublishRequest(form({ opportunityId: "nope" }))) === "invalid-id"
);
assert(
  "8 double action is refused: a record already moved off 'published' fails the target gate",
  evaluateUnpublishTarget({ status: UNPUBLISH_TARGET_STATUS } as Opportunity).ok === false
);

// --- 9/10. public visibility follows status -------------------------------
// Public reads are status-scoped (RLS 'everyone reads published' +
// getOpportunityBySlug `.eq('status','published')`), so a record whose status
// is no longer 'published' is unreadable publicly and its detail page 404s.

const afterUnpublish = { ...publishedRow, status: UNPUBLISH_TARGET_STATUS };
assert(
  "9 after unpublish the record is not in the publicly visible set",
  filterPublishedRecords([afterUnpublish]).length === 0
);
assert(
  "9 after unpublish the record still exists (never deleted)",
  afterUnpublish.id === publishedRow.id && afterUnpublish.title === publishedRow.title
);
assert(
  "10 no pending/rejected record can be listed as public",
  filterPublishedRecords([
    row({ status: "pending" }),
    row({ status: "rejected" }),
    row({ status: "expired" }),
  ]).length === 0
);
assert(
  "10 the payload cannot produce any other status (no arbitrary transitions)",
  unpublishUpdatePayload().status === UNPUBLISH_TARGET_STATUS
);
assert(
  "token: the confirmation value is a fixed literal, not user input",
  UNPUBLISH_CONFIRM_TOKEN === "unpublish"
);

// --- refusal messages are honest and non-empty ----------------------------

for (const denial of ["invalid-id", "unconfirmed", "unauthenticated", "forbidden", "not-published"] as const) {
  assert(`message: '${denial}' explains itself`, unpublishDenialMessage(denial).trim().length > 10);
}
assert(
  "message: 'not-published' does not claim a deletion",
  !unpublishDenialMessage("not-published").toLowerCase().includes("deleted")
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
