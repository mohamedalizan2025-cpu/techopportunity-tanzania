import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  EMPTY_QUEUE_FILTER,
  filterPendingQueue,
  matchesQueueFilter,
  parseBulkRejectIds,
  parseQueueFilter,
  queueFilterQuery,
} from "../lib/data/moderation";
import { isFurnitureQueueItem } from "../lib/triage-bucket";
import type { Opportunity } from "../lib/types";

const root = process.cwd();
const actions = readFileSync(join(root, "lib/data/moderation-actions.ts"), "utf8");
const panel = readFileSync(join(root, "app/moderation/queue-bulk-panel.tsx"), "utf8");
const queuePage = readFileSync(join(root, "app/moderation/page.tsx"), "utf8");
const moderation = readFileSync(join(root, "lib/data/moderation.ts"), "utf8");
const staffState = readFileSync(join(root, "lib/staff-form-state.ts"), "utf8");

function row(overrides: Partial<Opportunity>): Opportunity {
  return {
    id: "x",
    slug: "x",
    title: "Ordinary page",
    category: "other",
    description: "",
    url: "https://example.com",
    deadline: null,
    location: null,
    imageUrl: null,
    status: "pending",
    createdAt: "2026-08-27T00:00:00.000Z",
    organization: null,
    sourceName: null,
    ...overrides,
  } as Opportunity;
}

const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";

test("legacy ambiguous flag is retired: only furniture remains a flag", () => {
  assert.equal(parseQueueFilter({ flag: "ambiguous" }).flag, null);
  assert.equal(parseQueueFilter({ flag: "furniture" }).flag, "furniture");
});

test("furniture flag matches exact reviewed titles and nothing else", () => {
  assert.equal(isFurnitureQueueItem("Quick Links"), true);
  assert.equal(isFurnitureQueueItem("QUICK LINKS"), true);
  assert.equal(isFurnitureQueueItem("  Main navigation  "), true);
  assert.equal(isFurnitureQueueItem("About the University"), true);
  assert.equal(isFurnitureQueueItem("VETA Gallery"), true);
  assert.equal(isFurnitureQueueItem("Payment &amp; Settlement systems"), true);
  assert.equal(isFurnitureQueueItem("News &amp; Events"), true);
  assert.equal(isFurnitureQueueItem("Latest News roundup"), false);
  assert.equal(isFurnitureQueueItem("Quick Links for Applicants"), false);
  assert.equal(isFurnitureQueueItem("Call for Applications 2026"), false);
  assert.equal(
    isFurnitureQueueItem("World Bank Group (WBG) Young Professionals Program 2026"),
    false
  );
  assert.equal(isFurnitureQueueItem(""), false);
});

test("queue search and flag params parse fail-closed", () => {
  assert.equal(parseQueueFilter({}).q, null);
  assert.equal(parseQueueFilter({}).flag, null);
  assert.equal(parseQueueFilter({ q: "  Sahara  " }).q, "Sahara");
  assert.equal(parseQueueFilter({ q: "   " }).q, null);
  assert.equal(parseQueueFilter({ q: "x".repeat(121) }).q, null);
  assert.equal(parseQueueFilter({ q: ["first", "second"] }).q, "first");
  assert.equal(parseQueueFilter({ flag: "ambiguous" }).flag, null);
  assert.equal(parseQueueFilter({ flag: "Ambiguous" }).flag, null);
  assert.equal(parseQueueFilter({ flag: "all" }).flag, null);
  assert.equal(parseQueueFilter({ flag: ["ambiguous", "x"] }).flag, null);
  assert.equal(parseQueueFilter({ flag: "furniture" }).flag, "furniture");
  assert.equal(parseQueueFilter({ flag: "Furniture" }).flag, null);
  assert.equal(parseQueueFilter({ flag: ["furniture", "x"] }).flag, "furniture");
  const combined = parseQueueFilter({ bucket: "2", source: "Twaweza", q: "AI", flag: "furniture" });
  assert.deepEqual(combined, { bucket: 2, sourceName: "Twaweza", q: "AI", flag: "furniture", geography: null, sector: null });
});

test("search and flag narrow the rendered view only, combined with AND", () => {
  const a = row({ id: "a", title: "Sahara CodeSwitch Africa Challenge", sourceName: "Twaweza" });
  const b = row({ id: "b", title: "WAZIRI AKAGUA MIRADI", sourceName: "Twaweza" });
  const base = { bucket: null, sourceName: null, q: null, flag: null };
  assert.equal(matchesQueueFilter(a, { ...base, q: "sahara" }), true);
  assert.equal(matchesQueueFilter(a, { ...base, q: "SAHARA" }), true);
  assert.equal(matchesQueueFilter(a, { ...base, q: "aas" }), false);
  assert.equal(
    matchesQueueFilter(b, { ...base, sourceName: "Twaweza", q: "waziri", flag: "furniture" }),
    false,
    "non-furniture rows never match the furniture flag"
  );
  assert.equal(
    matchesQueueFilter(b, { ...base, sourceName: "Elsewhere", q: "waziri", flag: null }),
    false
  );
  const c = row({ id: "c", title: "Quick Links", sourceName: "Twaweza" });
  assert.equal(matchesQueueFilter(c, { ...base, flag: "furniture" }), true);
  assert.equal(matchesQueueFilter(a, { ...base, flag: "furniture" }), false);
  assert.equal(matchesQueueFilter(b, { ...base, flag: "furniture" }), false);
  assert.equal(
    matchesQueueFilter(c, { ...base, sourceName: "Twaweza", flag: "furniture" }),
    true
  );
  assert.deepEqual(
    filterPendingQueue([a, b], { ...base, q: "sahara" }).map((item) => item.id),
    ["a"]
  );
  assert.equal(filterPendingQueue([a, b], EMPTY_QUEUE_FILTER).length, 2);
});

test("search and flag survive the URL round-trip", () => {
  const query = queueFilterQuery({ bucket: 2, sourceName: "Twaweza", q: "AI & Health", flag: "furniture" });
  const parsed = parseQueueFilter({ ...Object.fromEntries(new URLSearchParams(query)) });
  assert.deepEqual(parsed, { bucket: 2, sourceName: "Twaweza", q: "AI & Health", flag: "furniture", geography: null, sector: null });
  const furnitureQuery = queueFilterQuery({ bucket: null, sourceName: null, q: null, flag: "furniture" });
  assert.equal(furnitureQuery, "?flag=furniture");
  assert.deepEqual(
    parseQueueFilter({ ...Object.fromEntries(new URLSearchParams(furnitureQuery)) }),
    { bucket: null, sourceName: null, q: null, flag: "furniture", geography: null, sector: null }
  );
  assert.equal(queueFilterQuery(EMPTY_QUEUE_FILTER), "");
});

test("bulk id parsing is bounded, strict, and order-preserving", () => {
  assert.deepEqual(parseBulkRejectIds([]), { ok: false, error: "empty" });
  assert.deepEqual(parseBulkRejectIds("nope"), { ok: false, error: "empty" });
  assert.deepEqual(parseBulkRejectIds([ID_A]), { ok: true, ids: [ID_A] });
  assert.deepEqual(parseBulkRejectIds([` ${ID_A} `, ID_B, ID_A]), { ok: true, ids: [ID_A, ID_B] });
  assert.deepEqual(parseBulkRejectIds([ID_A, "not-a-uuid"]), { ok: false, error: "invalid" });
  assert.deepEqual(parseBulkRejectIds([ID_A, 42]), { ok: false, error: "invalid" });
  assert.deepEqual(parseBulkRejectIds([ID_A, "   "]), { ok: false, error: "invalid" });
  const fifty = Array.from({ length: 50 }, (_, i) =>
    `${String(i).padStart(8, "0")}-1111-4111-8111-111111111111`.slice(0, 36)
  );
  assert.equal(parseBulkRejectIds(fifty).ok, true);
  assert.deepEqual(parseBulkRejectIds([...fifty, ID_B]), { ok: false, error: "too-many" });
});

test("the bulk action reuses the single-record attributable path", () => {
  assert.match(actions, /export async function bulkRejectPendingAction/);
  assert.match(actions, /const access = await getModerationAccess\(\)/);
  assert.match(actions, /parseBulkRejectIds\(formData\.getAll\("opportunityId"\)\)/);
  assert.match(actions, /normalizeModerationReason\(formData\.get\("rejectionReason"\)\)/);
  assert.match(actions, /formData\.get\("confirm"\) !== BULK_REJECT_CONFIRM_TOKEN/);
  assert.match(actions, /formData\.get\("acknowledge"\) !== "yes"/);
  assert.match(actions, /BULK_REJECT_MAX_ITEMS/);
  assert.match(actions, /getPendingOpportunityById\(id\)/);
  assert.match(actions, /access\.staff\.client[\s\S]*\.rpc\("reject_pending_opportunity"/);
  assert.match(actions, /target_opportunity_id: id,[\s\S]*decision_reason: rejectionReason/);
  assert.match(actions, /revalidatePath\("\/moderation"\)/);
  assert.doesNotMatch(actions, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("the bulk action has no approve path and no new database system", () => {
  const body = actions.slice(
    actions.indexOf("export async function bulkRejectPendingAction"),
    actions.indexOf("export async function rereviewPublishedOpportunityAction")
  );
  assert.ok(body.length > 0);
  assert.doesNotMatch(body, /"approve"/);
  assert.doesNotMatch(body, /\.from\("opportunities"\)\s*\.update/);
  assert.doesNotMatch(body, /\.from\("opportunity_enrichments"\)\s*\.insert/);
});

test("the bulk panel keeps selection client-side and results per-record", () => {
  assert.match(panel, /bulkRejectPendingAction/);
  assert.match(panel, /name="opportunityId"/);
  assert.match(panel, /Select all visible/);
  assert.match(panel, /name="rejectionReason"/);
  assert.match(panel, /maxLength=\{MODERATION_REASON_MAX_LENGTH\}/);
  assert.match(panel, /name="acknowledge"/);
  assert.match(panel, /name="confirm"[\s\S]*value=\{BULK_REJECT_CONFIRM_TOKEN\}/);
  assert.match(panel, /role=\{state\.status === "error" \? "alert" : "status"\}/);
  assert.doesNotMatch(panel, /\.rpc\(/);
  assert.doesNotMatch(panel, /supabase/i);
  assert.doesNotMatch(panel, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("the queue page guards, searches, flags, and hosts the panel", () => {
  assert.match(queuePage, /getModerationAccess\(\)/);
  assert.match(queuePage, /name="q"/);
  assert.match(queuePage, /QueueBulkPanel/);
  assert.doesNotMatch(queuePage, /isAmbiguousQueueItem/);
  assert.match(queuePage, /isFurnitureQueueItem/);
  assert.match(queuePage, /Furniture/);
  assert.match(queuePage, /flag: "furniture"/);
  assert.doesNotMatch(moderation, /isAmbiguousQueueItem/);
  assert.match(moderation, /isFurnitureQueueItem/);
  assert.match(staffState, /BULK_REJECT_CONFIRM_TOKEN = "bulk-reject"/);
  assert.match(staffState, /BULK_REJECT_MAX_ITEMS = 50/);
});
