import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

function filesBelow(directory: string): string[] {
  const absolute = path.join(root, directory);
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(relative) : [relative];
  });
}

let passed = 0;
function invariant(name: string, check: () => void) {
  check();
  passed += 1;
  console.log(`PASS ${name}`);
}

const fetchSource = read("scripts/discovery/fetch.ts");
const runnerSource = read("scripts/discovery/runner.ts");
const assistantRoute = read("app/api/assistant/ask/route.ts");
const discoveryWorkflow = read(".github/workflows/discovery.yml");
const healthWorkflow = read(".github/workflows/discovery-health.yml");
const verificationWorkflow = read(".github/workflows/verification.yml");

invariant("all discovery network acquisition crosses fetchPage", () => {
  const directFetchFiles = filesBelow("scripts/discovery")
    .filter((file) => file.endsWith(".ts"))
    .filter((file) => /\bfetch\s*\(/.test(read(file)))
    .map((file) => file.replaceAll("\\", "/"));
  assert.deepEqual(directFetchFiles, ["scripts/discovery/fetch.ts"]);
});

invariant("acquisition keeps scheme/host, redirect, timeout, and size guards", () => {
  assert.match(fetchSource, /acquisitionBlockReason\(rawUrl/);
  assert.match(fetchSource, /MAX_REDIRECTS = 3/);
  assert.match(fetchSource, /MAX_RESPONSE_BYTES = 2 \* 1024 \* 1024/);
  assert.match(fetchSource, /REQUEST_TIMEOUT_MS = 20_000/);
  assert.match(fetchSource, /redirect: "manual"/);
  assert.match(fetchSource, /assertAcquirable\(new URL\(location, current\)/);
});

invariant("discovery writes pending opportunities only", () => {
  assert.match(runnerSource, /status: "pending"/);
  assert.doesNotMatch(runnerSource, /status: "published"/);
});

invariant("assistant kill switch precedes request parsing and provider use", () => {
  const guard = assistantRoute.indexOf('process.env.ASSISTANT_ENABLED !== "true"');
  const requestParsing = assistantRoute.indexOf("request.json()");
  assert.ok(guard >= 0);
  assert.ok(requestParsing > guard);
});

invariant("service-role credentials are absent from public application paths", () => {
  const publicFiles = [
    ...filesBelow("app"),
    ...filesBelow("components"),
    ...filesBelow("lib"),
    "proxy.ts",
    "next.config.ts",
  ].filter((file) => /\.(ts|tsx|js|mjs)$/.test(file));
  const exposed = publicFiles.filter((file) => /SUPABASE_SERVICE_ROLE_KEY|service_role/.test(read(file)));
  assert.deepEqual(exposed, []);
});

invariant("moderation and published-management pages enforce the shared access guard", () => {
  for (const file of ["app/moderation/page.tsx", "app/moderation/[id]/page.tsx", "app/published-management/page.tsx"]) {
    const source = read(file);
    assert.match(source, /getModerationAccess\(\)/);
    assert.match(source, /redirect\(/);
  }
});

invariant("scheduled discovery cadence and pending-only worker remain unchanged", () => {
  assert.match(discoveryWorkflow, /cron: ['"]0 3 \* \* \*['"]/);
  assert.match(discoveryWorkflow, /run: npm run verify/);
  assert.match(discoveryWorkflow, /run: node --import tsx scripts\/discovery\/index\.ts/);
});

invariant("discovery credentials are scoped only to the worker step", () => {
  const worker = discoveryWorkflow.indexOf("- name: Run discovery worker");
  const firstSecret = discoveryWorkflow.indexOf("secrets.");
  assert.ok(worker >= 0);
  assert.ok(firstSecret > worker);
  assert.doesNotMatch(discoveryWorkflow.slice(0, worker), /secrets\./);
});

invariant("health reporting is local-only and cannot mutate production", () => {
  const healthSource = [
    read("scripts/discovery/health.ts"),
    read("scripts/discovery/health-artifact.ts"),
    read("scripts/discovery/health-monitor.ts"),
  ].join("\n");
  assert.doesNotMatch(healthSource, /@supabase|createClient|\bfetch\s*\(|https?:\/\//);
  assert.doesNotMatch(healthSource, /\.(insert|update|delete|upsert)\s*\(/);
});

invariant("discovery workflow retains bounded machine-readable health evidence", () => {
  assert.match(discoveryWorkflow, /actions\/cache\/restore@v4/);
  assert.match(discoveryWorkflow, /actions\/cache\/save@v4/);
  assert.match(discoveryWorkflow, /actions\/upload-artifact@v4/);
  assert.match(discoveryWorkflow, /discovery-health\/report\.json/);
  assert.match(discoveryWorkflow, /retention-days: 90/);
});

invariant("schedule monitor is credential-free and cannot execute discovery", () => {
  assert.match(healthWorkflow, /cron: ['"]30 3\/6 \* \* \*['"]/);
  assert.match(healthWorkflow, /run: npm run health:monitor/);
  assert.doesNotMatch(healthWorkflow, /secrets\.|SUPABASE_SERVICE_ROLE_KEY|scripts\/discovery\/index\.ts/);
});

invariant("ordinary milestone CI is read-only and credential-free", () => {
  assert.match(verificationWorkflow, /permissions:\s*\n\s*contents: read/);
  assert.match(verificationWorkflow, /run: npm run verify/);
  assert.match(verificationWorkflow, /run: npm run build/);
  assert.doesNotMatch(verificationWorkflow, /secrets\.|SUPABASE_SERVICE_ROLE_KEY|scripts\/discovery\/index\.ts/);
});

invariant("verification implementation has no database or network client", () => {
  // Inspect the executable planner/classifier. This assertion file contains
  // the forbidden-token patterns as data, so including itself would make the
  // check self-defeating.
  const source = filesBelow("scripts/verification")
    .filter((file) => !file.endsWith("boundaries.ts"))
    .map(read)
    .join("\n");
  assert.doesNotMatch(source, /@supabase|createClient|https?:\/\//);
  assert.doesNotMatch(source, /\.from\(["'][^"']+["']\)\.(insert|update|delete|upsert)/);
});

console.log(`\n${passed} permanent boundary checks passed.`);
console.log(`BOUNDARY_REPORT_JSON=${JSON.stringify({ schemaVersion: 1, passed, failed: 0 })}`);
