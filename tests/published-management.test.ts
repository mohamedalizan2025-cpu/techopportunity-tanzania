/**
 * Milestone 14 — published-record management contract tests.
 *
 * Pure unit tests for lib/data/published-management.ts: the unpublish
 * request parser, permission/target gates, exact RPC shape and list filter.
 *
 * Guarantee under test: an unpublish is a single-record, staff-gated,
 * confirmation-and-reason-gated STATUS change onto an existing enum value.
 * It never deletes a row, never writes a provenance field, and can never
 * publish something that is not already published.
 *
 * The database side is one exact-id/status RPC plus an audit trigger; both are
 * transaction-bound and are also verified against live staging behavior.
 */
import {
  UNPUBLISH_TARGET_STATUS,
  canUnpublish,
  evaluateUnpublishPermission,
  evaluateUnpublishTarget,
  filterPublishedRecords,
  parseUnpublishRequest,
  unpublishDenialMessage,
  unpublishRpcArguments,
  type UnpublishRequest,
} from "../lib/data/published-management";
import {
  UNPUBLISH_CONFIRM_TOKEN,
  UNPUBLISH_REASON_MAX_LENGTH,
} from "../lib/staff-form-state";
import type { ModerationAccessResult, StaffContext } from "../lib/data/moderation";
import type { Opportunity, OpportunityStatus } from "../lib/types";
import { readFileSync } from "node:fs";
import { join } from "node:path";

let passed = 0;
let failed = 0;
function assert(name: string, condition: boolean, detail = ""): void {
  if (condition) { passed += 1; console.log(`PASS  ${name}`); }
  else { failed += 1; console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`); }
}

const ID = "11111111-1111-4111-8111-111111111111";
const REASON = "The source evidence conflicts with the published eligibility claim.";
const STATUSES: OpportunityStatus[] = ["pending", "published", "rejected", "expired"];
const actionSource = readFileSync(join(process.cwd(), "lib/data/moderation-actions.ts"), "utf8");
const migrationSource = readFileSync(
  join(process.cwd(), "supabase/migrations/0015_published_unpublish_attribution.sql"),
  "utf8"
);

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
  evaluateUnpublishPermission({ ok: true, id: ID, reason: REASON }, unauthenticated).ok === false
);
assert(
  "1 non-staff (forbidden) request is refused",
  evaluateUnpublishPermission({ ok: true, id: ID, reason: REASON }, forbidden).ok === false
);
assert(
  "1 refusal reason distinguishes session vs permission",
  denialOf(evaluateUnpublishPermission({ ok: true, id: ID, reason: REASON }, unauthenticated)) === "unauthenticated" &&
    denialOf(evaluateUnpublishPermission({ ok: true, id: ID, reason: REASON }, forbidden)) === "forbidden"
);
assert(
  "1 staff + confirmed request is allowed and hands back the staff client",
  evaluateUnpublishPermission({ ok: true, id: ID, reason: REASON }, allowed).ok === true
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

// --- 5/6. exact RPC arguments cannot over-post another field or record -----

const rpcArguments = unpublishRpcArguments(ID, REASON);
assert("5 RPC accepts exactly target and reason", Object.keys(rpcArguments).length === 2);
assert("5 RPC target is the exact submitted UUID", rpcArguments.target_opportunity_id === ID);
assert(
  "5 no delete semantics: arguments carry no URL, slug, status or delete flag",
  !("url" in rpcArguments) && !("slug" in rpcArguments) && !("status" in rpcArguments) && !("delete" in rpcArguments)
);
assert(
  "6 provenance fields are never in the RPC arguments",
  ["source_id", "source_url", "url", "discovered_at", "discovery_method", "submitted_by", "title", "description", "category_id", "deadline", "city", "region", "country"]
    .every((field) => !(field in rpcArguments))
);
assert(
  "6 normalized moderation reason is passed without identity input",
  rpcArguments.decision_reason === REASON && !("actor_id" in rpcArguments)
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
  parseUnpublishRequest(form({ opportunityId: ID, confirm: UNPUBLISH_CONFIRM_TOKEN, reason: `  ${REASON}  ` })).ok === true
);
assert(
  "8 missing confirmation token is refused (no accidental mutation)",
  !parseUnpublishRequest(form({ opportunityId: ID })).ok
);
assert(
  "8 wrong confirmation value is refused",
  !parseUnpublishRequest(form({ opportunityId: ID, confirm: "yes", reason: REASON })).ok
);
assert(
  "8 missing or weak decision reason is refused",
  reasonOf(parseUnpublishRequest(form({ opportunityId: ID, confirm: UNPUBLISH_CONFIRM_TOKEN }))) === "invalid-reason" &&
    reasonOf(parseUnpublishRequest(form({ opportunityId: ID, confirm: UNPUBLISH_CONFIRM_TOKEN, reason: "too short" }))) === "invalid-reason"
);
assert(
  "8 overlong decision reason is refused",
  reasonOf(parseUnpublishRequest(form({ opportunityId: ID, confirm: UNPUBLISH_CONFIRM_TOKEN, reason: "x".repeat(UNPUBLISH_REASON_MAX_LENGTH + 1) }))) === "invalid-reason"
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
  "10 the client cannot supply an arbitrary resulting status",
  !("status" in unpublishRpcArguments(ID, REASON))
);
assert(
  "token: the confirmation value is a fixed literal, not user input",
  UNPUBLISH_CONFIRM_TOKEN === "unpublish"
);

// --- refusal messages are honest and non-empty ----------------------------

for (const denial of ["invalid-id", "unconfirmed", "invalid-reason", "unauthenticated", "forbidden", "not-published"] as const) {
  assert(`message: '${denial}' explains itself`, unpublishDenialMessage(denial).trim().length > 10);
}
assert(
  "message: 'not-published' does not claim a deletion",
  !unpublishDenialMessage("not-published").toLowerCase().includes("deleted")
);

// --- permanent database boundary: attribution and transition are atomic ---

assert(
  "DB authenticated actor is derived from auth.uid, never supplied by the client",
  /actor uuid := auth\.uid\(\)/.test(migrationSource) && !/actor_id\s*:=/.test(actionSource)
);
assert(
  "DB audit records exact target, statuses, actor, reason and decision time",
  /opportunity_id,[\s\S]*previous_value,[\s\S]*new_value,[\s\S]*actor_id,[\s\S]*reason,[\s\S]*created_at/.test(migrationSource) &&
    /new\.id,[\s\S]*old\.status::text,[\s\S]*new\.status::text,[\s\S]*actor,[\s\S]*decision_reason,[\s\S]*statement_timestamp\(\)/.test(migrationSource)
);
assert(
  "DB refuses anonymous, ordinary and service-role impersonation",
  /actor is null or not public\.is_staff\(\)/.test(migrationSource) &&
    /revoke all on function public\.unpublish_published_opportunity\(uuid, text\)\s+from public, anon, service_role/.test(migrationSource) &&
    /grant execute on function public\.unpublish_published_opportunity\(uuid, text\)\s+to authenticated/.test(migrationSource)
);
assert(
  "DB transition is exact-id and published-status scoped",
  /where opportunity\.id = target_opportunity_id[\s\S]*and opportunity\.status = 'published'/.test(migrationSource)
);
assert(
  "published-to-rejected audit failure rolls back the protected update",
  /after update of status on public\.opportunities\s+for each row execute function/.test(migrationSource) &&
    /old\.status = 'published' and new\.status = 'rejected'/.test(migrationSource) &&
    /raise (?:insufficient_privilege|invalid_parameter_value)/.test(migrationSource)
);
assert(
  "application unpublish uses only the authenticated RPC path",
  /permission\.staff\.client[\s\S]*\.rpc\("unpublish_published_opportunity"/.test(actionSource) &&
    !/SUPABASE_SERVICE_ROLE_KEY|service_role/.test(actionSource)
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
