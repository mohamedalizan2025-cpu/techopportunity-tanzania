/** Focused M29 authentication, ownership, saved-state, and privacy tests. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { mapSavedOpportunityRows } from "../lib/data/saved-opportunities";
import {
  canSaveOpportunity,
  formatSavedDate,
  isSavedOpportunityId,
  ownsSavedRelationship,
  parseSavedMutation,
} from "../lib/saved-opportunity-state";
import {
  postLoginDestination,
  sanitizeNextPath,
} from "../lib/staff-form-state";
import { sanitizeBrowseReturnHref } from "../lib/opportunity-presentation";

let passed = 0;
function test(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
}

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const OPPORTUNITY_ID = "33333333-3333-4333-8333-333333333333";

test("redirect accepts an opportunity detail", () => {
  assert.equal(sanitizeNextPath("/opportunities/example"), "/opportunities/example");
});
test("redirect preserves internal query and fragment state", () => {
  assert.equal(sanitizeNextPath("/?q=AI#opportunities"), "/?q=AI#opportunities");
});
test("redirect accepts the protected saved route", () => {
  assert.equal(sanitizeNextPath("/saved"), "/saved");
});
test("redirect rejects an external origin", () => {
  assert.equal(sanitizeNextPath("https://evil.example"), null);
});
test("redirect rejects a protocol-relative origin", () => {
  assert.equal(sanitizeNextPath("//evil.example"), null);
});
test("redirect rejects a javascript URL", () => {
  assert.equal(sanitizeNextPath("javascript:alert(1)"), null);
});
test("redirect rejects backslash ambiguity", () => {
  assert.equal(sanitizeNextPath("/\\evil.example"), null);
});
test("redirect rejects control characters", () => {
  assert.equal(sanitizeNextPath("/saved\nSet-Cookie:bad"), null);
});
test("redirect rejects an empty value", () => {
  assert.equal(sanitizeNextPath(""), null);
});
test("redirect rejects excessive length", () => {
  assert.equal(sanitizeNextPath(`/${"a".repeat(700)}`), null);
});
test("ordinary login defaults to saved opportunities", () => {
  assert.equal(postLoginDestination(null, false), "/saved");
});
test("ordinary login returns to a public opportunity", () => {
  assert.equal(postLoginDestination("/opportunities/example", false), "/opportunities/example");
});
test("staff login also preserves a public return", () => {
  assert.equal(postLoginDestination("/?q=AI", true), "/?q=AI");
});
test("ordinary user cannot be routed into moderation", () => {
  assert.equal(postLoginDestination("/moderation", false), "/saved");
});

test("ordinary user cannot reach moderation through query or fragment state", () => {
  assert.equal(postLoginDestination("/moderation?bucket=2", false), "/saved");
  assert.equal(postLoginDestination("/moderation#queue", false), "/saved");
});
test("staff user can be routed into moderation", () => {
  assert.equal(postLoginDestination("/moderation", true), "/moderation");
});
test("ordinary user cannot be routed into a moderation detail", () => {
  assert.equal(postLoginDestination("/moderation/abc", false), "/saved");
});
test("ordinary user cannot be routed into published management", () => {
  assert.equal(postLoginDestination("/published-management", false), "/saved");
});

test("ordinary user cannot reach published management through query state", () => {
  assert.equal(postLoginDestination("/published-management?sort=newest", false), "/saved");
});
test("detail navigation accepts only the exact saved route", () => {
  assert.equal(sanitizeBrowseReturnHref("/saved"), "/saved");
  assert.equal(sanitizeBrowseReturnHref("/saved/private"), "/#opportunities");
});

test("canonical opportunity UUID is accepted", () => {
  assert.equal(isSavedOpportunityId(OPPORTUNITY_ID), true);
});
test("arbitrary opportunity ID is refused", () => {
  assert.equal(isSavedOpportunityId("pending-secret"), false);
});
test("save mutation parses without a user id", () => {
  const data = new FormData();
  data.set("opportunityId", OPPORTUNITY_ID);
  data.set("intent", "save");
  assert.deepEqual(parseSavedMutation(data), { opportunityId: OPPORTUNITY_ID, intent: "save" });
});
test("remove mutation parses without a user id", () => {
  const data = new FormData();
  data.set("opportunityId", OPPORTUNITY_ID);
  data.set("intent", "remove");
  assert.deepEqual(parseSavedMutation(data), { opportunityId: OPPORTUNITY_ID, intent: "remove" });
});
test("invalid mutation UUID fails closed", () => {
  const data = new FormData();
  data.set("opportunityId", "not-a-uuid");
  data.set("intent", "save");
  assert.equal(parseSavedMutation(data), null);
});
test("invalid mutation intent fails closed", () => {
  const data = new FormData();
  data.set("opportunityId", OPPORTUNITY_ID);
  data.set("intent", "update");
  assert.equal(parseSavedMutation(data), null);
});
test("client-supplied user id is ignored", () => {
  const data = new FormData();
  data.set("opportunityId", OPPORTUNITY_ID);
  data.set("intent", "save");
  data.set("user_id", USER_B);
  assert.deepEqual(Object.keys(parseSavedMutation(data) ?? {}).sort(), ["intent", "opportunityId"]);
});
test("published opportunity may be saved", () => {
  assert.equal(canSaveOpportunity("published"), true);
});
test("pending opportunity may not be saved", () => {
  assert.equal(canSaveOpportunity("pending"), false);
});
test("rejected opportunity may not be saved", () => {
  assert.equal(canSaveOpportunity("rejected"), false);
});
test("expired-status opportunity may not be newly saved", () => {
  assert.equal(canSaveOpportunity("expired"), false);
});
test("missing opportunity may not be saved", () => {
  assert.equal(canSaveOpportunity(null), false);
});
test("owner can access own saved relationship", () => {
  assert.equal(ownsSavedRelationship(USER_A, USER_A), true);
});
test("user A cannot access user B saved relationship", () => {
  assert.equal(ownsSavedRelationship(USER_A, USER_B), false);
});
test("anonymous user cannot access a saved relationship", () => {
  assert.equal(ownsSavedRelationship(null, USER_A), false);
});
test("saved date is presented", () => {
  assert.equal(formatSavedDate("2026-09-03T09:00:00.000Z"), "Saved 3 Sept 2026");
});
test("invalid saved date stays unknown", () => {
  assert.equal(formatSavedDate("not-a-date"), null);
});
test("missing related opportunity becomes unavailable", () => {
  const [entry] = mapSavedOpportunityRows([{ id: USER_A, opportunity_id: OPPORTUNITY_ID, created_at: "2026-09-03T09:00:00Z", opportunity: null }]);
  assert.equal(entry.opportunity, null);
});
test("pending related content is suppressed by the mapper", () => {
  const [entry] = mapSavedOpportunityRows([{
    id: USER_A,
    opportunity_id: OPPORTUNITY_ID,
    created_at: "2026-09-03T09:00:00Z",
    opportunity: {
      id: OPPORTUNITY_ID,
      slug: "private-pending",
      title: "Private pending title",
      description: "Private pending description",
      url: "https://example.org/private",
      deadline: null,
      venue_name: null,
      address: null,
      city: null,
      region: null,
      country: null,
      latitude: null,
      longitude: null,
      image_url: null,
      created_at: "2026-09-01T00:00:00Z",
      category: { slug: "other" },
      organization: null,
      discovered_at: null,
      discovery_method: null,
      source: null,
      status: "pending",
    },
  }]);
  assert.equal(entry.opportunity, null);
});
test("published related content remains viewable", () => {
  const [entry] = mapSavedOpportunityRows([{
    id: USER_A,
    opportunity_id: OPPORTUNITY_ID,
    created_at: "2026-09-03T09:00:00Z",
    opportunity: {
      id: OPPORTUNITY_ID,
      slug: "public-opportunity",
      title: "Public opportunity",
      description: "Public description",
      url: "https://example.org/public",
      deadline: null,
      venue_name: null,
      address: null,
      city: null,
      region: null,
      country: null,
      latitude: null,
      longitude: null,
      image_url: null,
      created_at: "2026-09-01T00:00:00Z",
      category: { slug: "other" },
      organization: null,
      discovered_at: null,
      discovery_method: null,
      source: null,
      status: "published",
    },
  }]);
  assert.equal(entry.opportunity?.slug, "public-opportunity");
});

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), "utf8");
const migration = read("supabase/migrations/0011_saved_opportunities.sql");
const authAction = read("lib/data/auth-actions.ts");
const savedAction = read("lib/data/saved-opportunity-actions.ts");
const savedData = read("lib/data/saved-opportunities.ts");
const loginPage = read("app/login/page.tsx");
const loginForm = read("app/login/login-form.tsx");
const savedPage = read("app/saved/page.tsx");
const header = read("components/site-header.tsx");
const saveControl = read("components/save-opportunity-control.tsx");
const home = read("app/(home)/page.tsx");
const detail = read("app/opportunities/[slug]/page.tsx");
const moderation = read("app/moderation/page.tsx");
const publishedManagement = read("app/published-management/page.tsx");
const assistant = read("app/api/assistant/ask/route.ts");

test("migration creates only the relationship table", () => {
  assert.match(migration, /create table public\.saved_opportunities/);
  assert.doesNotMatch(migration, /alter table public\.opportunities\s+add/i);
});
test("migration references authenticated users", () => {
  assert.match(migration, /user_id\s+uuid not null references auth\.users/);
});
test("migration references canonical opportunities", () => {
  assert.match(migration, /opportunity_id uuid not null references public\.opportunities/);
});
test("migration prevents duplicate saves", () => {
  assert.match(migration, /unique \(user_id, opportunity_id\)/);
});
test("migration enables RLS", () => {
  assert.match(migration, /enable row level security/);
});
test("read policy binds auth uid to owner", () => {
  assert.match(migration, /users read own saved opportunities[\s\S]*auth\.uid\(\)[\s\S]*user_id/);
});
test("insert policy binds auth uid to owner", () => {
  assert.match(migration, /users save published opportunities for themselves[\s\S]*auth\.uid\(\)[\s\S]*user_id/);
});
test("insert policy requires a published opportunity", () => {
  assert.match(migration, /opportunity\.status = 'published'/);
});
test("delete policy binds auth uid to owner", () => {
  assert.match(migration, /users remove own saved opportunities[\s\S]*auth\.uid\(\)[\s\S]*user_id/);
});
test("anonymous table privileges are revoked", () => {
  assert.match(migration, /revoke all on table public\.saved_opportunities from anon/);
});
test("saved relationships cannot be updated", () => {
  assert.match(migration, /revoke update on table public\.saved_opportunities from authenticated/);
  assert.doesNotMatch(migration, /for update/);
});
test("duplicate insert is idempotent", () => {
  assert.match(savedAction, /error\.code !== "23505"/);
});
test("save action derives user identity from claims", () => {
  assert.match(savedAction, /getAuthenticatedUser\(\)/);
  assert.match(savedAction, /user_id: user\.userId/);
});
test("save action never reads a client user id", () => {
  assert.doesNotMatch(savedAction, /formData\.get\(["']user_?id["']\)/i);
});
test("save action verifies published status", () => {
  assert.match(savedAction, /\.eq\("status", "published"\)/);
});
test("saved query filters by authenticated owner", () => {
  assert.match(savedData, /\.eq\("user_id", user\.userId\)/);
});
test("saved query filters related rows to published", () => {
  assert.match(savedData, /\.eq\("opportunity\.status", "published"\)/);
});
test("saved mapper suppresses non-published content", () => {
  assert.match(savedData, /related\?\.status === "published"/);
});
test("login explains the public site remains public", () => {
  assert.match(loginPage, /always remain public/);
});
test("login form has labelled email and password", () => {
  assert.match(loginForm, /<label htmlFor="email"/);
  assert.match(loginForm, /<label htmlFor="password"/);
});
test("login form offers account creation", () => {
  assert.match(loginForm, /value="sign-up"/);
  assert.match(loginForm, /Create account/);
});
test("invalid authentication has an honest error", () => {
  assert.match(authAction, /Invalid email or password/);
});
test("minimum password length applies only to account creation", () => {
  assert.match(authAction, /mode === "sign-up" && password\.length < 8/);
});
test("email confirmation is handled honestly", () => {
  assert.match(authAction, /Check your email to confirm the account/);
});
test("sign out invalidates the Supabase session", () => {
  assert.match(authAction, /supabase\.auth\.signOut\(\)/);
});
test("saved page redirects anonymous users to login", () => {
  assert.match(savedPage, /if \(!user\) redirect\("\/login\?next=%2Fsaved"\)/);
});
test("saved page has an honest empty state", () => {
  assert.match(savedPage, /You haven't saved any opportunities yet/);
});
test("saved page hides unavailable details", () => {
  assert.match(savedPage, /private or removed details are not shown/);
});
test("navigation shows sign in to anonymous users", () => {
  assert.match(header, /\/login\?next=%2Fsaved/);
});
test("navigation exposes saved and sign out when authenticated", () => {
  assert.match(header, />Saved</);
  assert.match(header, />Sign out</);
});
test("staff navigation still depends on the staff role", () => {
  assert.match(header, /isStaff \?/);
});
test("save control exposes pressed state", () => {
  assert.match(saveControl, /aria-pressed={saved}/);
});
test("save control has contextual accessible labels", () => {
  assert.match(saveControl, /Sign in to save \$\{opportunityTitle\}/);
  assert.match(saveControl, /Remove \$\{opportunityTitle\} from saved opportunities/);
});
test("public homepage does not require login", () => {
  assert.doesNotMatch(home, /redirect\(["']\/login/);
});
test("public detail does not require login", () => {
  assert.doesNotMatch(detail, /redirect\(["']\/login/);
});
test("moderation still enforces staff access", () => {
  assert.match(moderation, /getModerationAccess\(\)/);
});
test("published management still enforces staff access", () => {
  assert.match(publishedManagement, /getModerationAccess\(\)/);
});
test("assistant remains behind the kill switch", () => {
  assert.match(assistant, /ASSISTANT_ENABLED !== "true"/);
});

console.log(`\n${passed} M29 account and saved-opportunity tests passed.`);
