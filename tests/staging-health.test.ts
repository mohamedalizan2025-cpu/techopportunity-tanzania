import assert from "node:assert/strict";
import { inspectStagingHealth, isExpectedPauseTolerated, STAGING_PROJECT_URL, validateStagingUrl } from "../scripts/staging/health";

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

await test("connectivity-null pause signature is tolerated only when a pause is explicitly expected", async () => {
  const throwing: typeof fetch = async () => { throw new Error("connection refused (paused)"); };
  const paused = await inspectStagingHealth({ url: STAGING_PROJECT_URL, anonKey: KEY, fetchImpl: throwing });
  assert.equal(paused.state, "failed");
  assert.deepEqual(paused.reasons, ["staging_request_failed"]);
  assert.equal(paused.connectivity.state, "failed");
  assert.equal(paused.connectivity.httpStatus, null);
  assert.equal(isExpectedPauseTolerated(paused, "true"), true);
  assert.equal(isExpectedPauseTolerated(paused, undefined), false);
  assert.equal(isExpectedPauseTolerated(paused, "false"), false);
  assert.equal(isExpectedPauseTolerated(paused, ""), false);
});

await test("expected pause never hides RLS, http-bearing, or blocked failures", async () => {
  const rlsFail: typeof fetch = async (input) => String(input).includes("talent_profiles")
    ? response(403, {})
    : response(200, [{ status: "pending" }]);
  const rls = await inspectStagingHealth({ url: STAGING_PROJECT_URL, anonKey: KEY, fetchImpl: rlsFail });
  assert.equal(rls.state, "failed");
  assert.equal(isExpectedPauseTolerated(rls, "true"), false);

  const httpFail: typeof fetch = async () => response(503, { message: "paused?" });
  const http = await inspectStagingHealth({ url: STAGING_PROJECT_URL, anonKey: KEY, fetchImpl: httpFail });
  assert.equal(http.state, "failed");
  assert.equal(http.connectivity.httpStatus, 503);
  assert.equal(isExpectedPauseTolerated(http, "true"), false);

  const blocked = await inspectStagingHealth({ url: STAGING_PROJECT_URL, anonKey: undefined });
  assert.equal(blocked.state, "blocked");
  assert.equal(isExpectedPauseTolerated(blocked, "true"), false);

  const healthyFetch: typeof fetch = async (input) => String(input).includes("talent_profiles")
    ? response(401, {})
    : response(200, [{ status: "published" }]);
  const healthy = await inspectStagingHealth({ url: STAGING_PROJECT_URL, anonKey: KEY, fetchImpl: healthyFetch });
  assert.equal(healthy.state, "healthy");
  assert.equal(isExpectedPauseTolerated(healthy, "true"), false);
});

console.log("\n6 staging health tests passed.");
}

void main();
