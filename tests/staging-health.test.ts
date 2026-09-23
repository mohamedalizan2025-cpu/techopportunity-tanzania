import assert from "node:assert/strict";
import { inspectStagingHealth, STAGING_PROJECT_URL, validateStagingUrl } from "../scripts/staging/health";

const KEY = "staging-test-key-never-a-real-secret";

function response(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function test(name: string, run: () => void | Promise<void>) {
  await run();
  console.log(`PASS ${name}`);
}

async function main() {
await test("identity guard accepts only the exact staging project", () => {
  assert.equal(validateStagingUrl(STAGING_PROJECT_URL), STAGING_PROJECT_URL);
  assert.throws(() => validateStagingUrl("https://jltuufukcwztugvojwjd.supabase.co"), /staging_identity_mismatch/);
  assert.throws(() => validateStagingUrl(`${STAGING_PROJECT_URL}/rest/v1`), /staging_identity_mismatch/);
});

await test("healthy evidence requires published-only visibility and private-table denial", async () => {
  const calls: Array<{ url: string; method?: string }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, method: init?.method });
    return url.includes("talent_profiles")
      ? response(401, { message: "not exposed" })
      : response(200, [{ status: "published" }, { status: "published" }]);
  };
  const result = await inspectStagingHealth({ url: STAGING_PROJECT_URL, anonKey: KEY, fetchImpl });
  assert.equal(result.state, "healthy");
  assert.equal(result.readOnly, true);
  assert.equal(result.rls.publicOpportunitiesVisible, 2);
  assert.equal(result.rls.nonPublishedOpportunitiesVisible, 0);
  assert.equal(result.rls.privateTalentProfilesDenied, true);
  assert.deepEqual(calls.map((call) => call.method), ["GET", "GET"]);
  assert.equal(JSON.stringify(result).includes(KEY), false);
});

await test("non-published anonymous visibility fails closed", async () => {
  const fetchImpl: typeof fetch = async (input) => String(input).includes("talent_profiles")
    ? response(403, {})
    : response(200, [{ status: "pending" }]);
  const result = await inspectStagingHealth({ url: STAGING_PROJECT_URL, anonKey: KEY, fetchImpl });
  assert.equal(result.state, "failed");
  assert.deepEqual(result.reasons, ["anon_can_see_non_published_opportunities"]);
});

await test("missing credential records a blocked report without a request", async () => {
  const result = await inspectStagingHealth({ url: STAGING_PROJECT_URL, anonKey: undefined });
  assert.equal(result.state, "blocked");
  assert.deepEqual(result.reasons, ["staging_anon_key_missing"]);
});

console.log("\n4 staging health tests passed.");
}

void main();
