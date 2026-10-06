/**
 * Pre-pilot P0C: self-service account deletion deletes exactly the
 * caller's own account through the scoped database function.
 *
 * Guards: confirmation contract, session-only target (no client UUID),
 * migration shape (SET NULL anonymization, parameterless definer
 * function, closed-first grants), no service-role/admin path in product
 * code, UI honesty (permanent, irreversible, WhatsApp fallback), and
 * staff/report surfaces tolerating anonymized reporters.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ACCOUNT_DELETION_CONFIRMATION,
  parseDeletionConfirmation,
} from "../lib/account-deletion-state";

function read(relative: string): string {
  return readFileSync(join(process.cwd(), relative), "utf-8");
}

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

let passed = 0;
function test(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
}

test("confirmation is exactly DELETE and nothing else", () => {
  assert.equal(ACCOUNT_DELETION_CONFIRMATION, "DELETE");
  assert.equal(parseDeletionConfirmation(form({ confirmation: "DELETE" })), true);
  assert.equal(parseDeletionConfirmation(form({ confirmation: "delete" })), false);
  assert.equal(parseDeletionConfirmation(form({ confirmation: " DELETE " })), false);
  assert.equal(parseDeletionConfirmation(form({ confirmation: "" })), false);
  assert.equal(parseDeletionConfirmation(form({})), false);
});

test("no user identity field exists for deletion (session is the target)", () => {
  const stateSource = read("lib/account-deletion-state.ts");
  assert.doesNotMatch(stateSource, /user_?id|target/i, "no identity concept in parser");
  const parsed = parseDeletionConfirmation(
    form({ confirmation: "DELETE", user_id: "attacker-uuid", target: "victim-uuid" })
  );
  assert.equal(parsed, true, "extraneous fields change nothing; none are read");
});

const actions = read("lib/data/account-deletion-actions.ts");

test("action derives the target from the session only", () => {
  assert.match(actions, /getAuthenticatedUser/);
  assert.match(actions, /\.rpc\("request_own_account_deletion"\)/);
  assert.doesNotMatch(actions, /formData\.get\("user_?id"/);
  assert.doesNotMatch(actions, /formData\.get\("target"/);
  assert.doesNotMatch(actions, /userId\s*[,}]/, "no caller id flows anywhere");
});

test("no service-role, admin API, or generic delete endpoint in product flow", () => {
  assert.doesNotMatch(actions, /SUPABASE_SERVICE_ROLE_KEY|service_role/i);
  assert.doesNotMatch(actions, /auth\.admin/i);
  assert.doesNotMatch(actions, /export async function (GET|POST|DELETE|PUT)/);
  assert.doesNotMatch(actions, /\.from\("auth"\./);
  for (const file of [
    "components/delete-account-section.tsx",
    "app/profile/page.tsx",
    "app/login/page.tsx",
  ]) {
    assert.doesNotMatch(read(file), /SUPABASE_SERVICE_ROLE_KEY|service_role|auth\.admin/i, file);
  }
});

test("failure is closed and success signs out to a deleted banner", () => {
  assert.match(actions, /could not be deleted/);
  assert.match(actions, /auth\.signOut\(\)/);
  assert.match(actions, /redirect\("\/login\?deleted=1"\)/);
  const login = read("app/login/page.tsx");
  assert.match(login, /deleted/);
  assert.match(login, /Your account has been deleted/);
});

const migration = read("supabase/migrations/0024_account_deletion.sql");

test("migration anonymizes reports instead of destroying trust input", () => {
  assert.match(migration, /alter column reporter_user_id drop not null/);
  assert.match(migration, /on delete set null/);
  assert.doesNotMatch(migration, /delete from public\.listing_reports/i);
  assert.doesNotMatch(migration, /delete from public\.opportunities/i);
});

test("deletion function is parameterless, session-scoped, and fail-closed", () => {
  assert.match(migration, /security definer/);
  assert.match(migration, /set search_path = public/);
  assert.match(migration, /request_own_account_deletion\(\)/);
  assert.match(migration, /\(select auth\.uid\(\)\)/);
  assert.match(migration, /raise exception 'not authenticated'/);
  assert.match(migration, /delete from auth\.users where id = target/);
  assert.doesNotMatch(migration, /target\s+(uuid|text)\s*[,)]/, "no callable parameter");
});

test("function grants stay closed-first with authenticated execute only", () => {
  assert.match(
    migration,
    /revoke all on function public\.request_own_account_deletion\(\)\s+from public, anon, authenticated, service_role/
  );
  assert.match(
    migration,
    /grant execute on function public\.request_own_account_deletion\(\)\s+to authenticated/
  );
  assert.doesNotMatch(migration, /grant\s+all\b/);
});

test("baseline grant contract covers the deletion function", () => {
  const baseline = read("supabase/migrations/0021_explicit_data_api_grants.sql");
  assert.match(
    baseline,
    /revoke all on function public\.request_own_account_deletion\(\)\s+from public, anon, authenticated, service_role/
  );
  assert.match(
    baseline,
    /grant execute on function public\.request_own_account_deletion\(\)\s+to authenticated/
  );
});

const section = read("components/delete-account-section.tsx");

test("deletion UI is deliberate, honest, and reversible-free of dark patterns", () => {
  assert.match(section, /Type DELETE to confirm/);
  assert.match(section, /cannot be undone/i);
  assert.match(section, /Permanently deletes your account and private data/);
  assert.match(section, /identity removed/);
  assert.match(section, /Contact page/);
  assert.match(section, /disabled=\{isPending \|\| !confirmed\}/);
});

test("profile hosts deletion and privacy stays truthful", () => {
  const profile = read("app/profile/page.tsx");
  assert.match(profile, /DeleteAccountSection/);
  const privacy = read("app/privacy/page.tsx").replace(/\s+/g, " ");
  assert.ok(privacy.includes("Delete your whole account yourself on the Profile page"));
  assert.ok(privacy.includes("identity removed"));
  assert.ok(privacy.includes("cannot be purged instantly"));
  assert.ok(privacy.includes("+255 624 295 705"));
});

test("staff surfaces tolerate anonymized reporters", () => {
  const page = read("app/reports/page.tsx");
  assert.match(page, /removed account \(identity anonymized\)/);
  const staffTypes = read("lib/data/listing-report-actions.ts");
  assert.match(staffTypes, /reporterUserId: string \| null/);
});

console.log(`\n${passed} account-deletion contract tests passed.`);
