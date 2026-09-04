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
const savedMigration = read("supabase/migrations/0011_saved_opportunities.sql");
const savedAction = read("lib/data/saved-opportunity-actions.ts");
const savedData = read("lib/data/saved-opportunities.ts");
const savedPage = read("app/saved/page.tsx");
const alertMigration = read("supabase/migrations/0012_deadline_alerts.sql");
const alertAction = read("lib/data/deadline-alert-actions.ts");
const alertData = read("lib/data/deadline-alerts.ts");
const alertDomain = read("lib/deadline-alerts.ts");
const deadlineDomain = read("lib/deadline-intelligence.ts");
const alertRunner = read("scripts/alerts/runner.ts");
const alertIndex = read("scripts/alerts/index.ts");
const alertWorkflow = read(".github/workflows/deadline-alerts.yml");
const authAction = read("lib/data/auth-actions.ts");
const authCallback = read("app/auth/callback/route.ts");
const authRedirect = read("lib/auth-redirect.ts");
const m31Migration = read("supabase/migrations/0013_m31_data_trust.sql");
const m31Trust = read("lib/opportunity-trust.ts");
const m31AiReadiness = read("lib/ai-readiness.ts");
const m31Remediation = read("scripts/m31/remediation.ts");
const m31SourcePolicy = read("scripts/discovery/source-policy.ts");
const opportunitiesData = read("lib/data/opportunities.ts");
const moderationActions = read("lib/data/moderation-actions.ts");

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

invariant("saved relationships are owner-only and never anonymous or mutable", () => {
  assert.match(savedMigration, /alter table public\.saved_opportunities enable row level security/);
  assert.equal((savedMigration.match(/\(select auth\.uid\(\)\) = user_id/g) ?? []).length, 3);
  assert.match(savedMigration, /revoke all on table public\.saved_opportunities from anon/);
  assert.match(savedMigration, /revoke update on table public\.saved_opportunities from authenticated/);
  assert.match(savedMigration, /unique \(user_id, opportunity_id\)/);
});

invariant("saved mutations derive ownership from authenticated claims", () => {
  assert.match(savedAction, /getAuthenticatedUser\(\)/);
  assert.match(savedAction, /user_id: user\.userId/);
  assert.doesNotMatch(savedAction, /formData\.get\(["']user_?id["']\)/i);
  assert.match(savedAction, /\.eq\(["']status["'], ["']published["']\)/);
});

invariant("saved reads protect the route and suppress unpublished content", () => {
  assert.match(savedPage, /if \(!user\) redirect\(["']\/login\?next=%2Fsaved["']\)/);
  assert.match(savedData, /\.eq\(["']user_id["'], user\.userId\)/);
  assert.match(savedData, /\.eq\(["']opportunity\.status["'], ["']published["']\)/);
  assert.match(savedData, /related\?\.status === ["']published["']/);
});

invariant("deadline preferences and events are private least-privilege tables", () => {
  assert.match(alertMigration, /alter table public\.user_alert_preferences enable row level security/);
  assert.match(alertMigration, /alter table public\.deadline_alert_events enable row level security/);
  assert.equal((alertMigration.match(/\(select auth\.uid\(\)\) = user_id/g) ?? []).length, 5);
  assert.match(alertMigration, /revoke all on table public\.deadline_alert_events from anon, authenticated/);
  assert.match(alertMigration, /grant select on table public\.deadline_alert_events to authenticated/);
  assert.doesNotMatch(alertMigration, /grant insert[^;]*deadline_alert_events/i);
});

invariant("alert ownership comes from claims and unpublished content is suppressed", () => {
  assert.match(alertAction, /getAuthenticatedUser\(\)/);
  assert.match(alertAction, /user_id: user\.userId/);
  assert.doesNotMatch(alertAction, /formData\.get\(["']user_?id["']\)/i);
  assert.match(alertData, /\.eq\("user_id", user\.userId\)/);
  assert.match(alertData, /\.eq\("opportunity\.status", "published"\)/);
  assert.match(alertData, /opportunity\.status !== "published"/);
});

invariant("deadline evaluation and alert idempotency are centralized", () => {
  assert.match(deadlineDomain, /export const CLOSING_SOON_DAYS = 14/);
  assert.match(alertDomain, /evaluateAlertEligibility/);
  assert.match(alertDomain, /exactCurrentMatch/);
  assert.match(alertMigration, /unique \(user_id, opportunity_id, event_type, event_fingerprint\)/);
  assert.match(alertRunner, /ignoreDuplicates: true/);
});

invariant("deadline alert state never claims unimplemented delivery", () => {
  assert.match(alertMigration, /check \(state = 'generated'\)/);
  assert.match(alertRunner, /deliveryAttempted: false/);
  assert.doesNotMatch(alertRunner, /\b(?:email|smtp|sendgrid|resend)\b/i);
});

invariant("email confirmation uses a canonical callback and safe internal destination", () => {
  assert.match(authAction, /options: \{ emailRedirectTo \}/);
  assert.match(authCallback, /exchangeCodeForSession\(code\)/);
  assert.match(authCallback, /sanitizeNextPath/);
  assert.match(authRedirect, /VERCEL_PROJECT_PRODUCTION_URL/);
  assert.doesNotMatch(authRedirect, /request\.headers|headers\(\)|x-forwarded-host/i);
});

invariant("discovery uses one authoritative six-hour UTC schedule and the pending-only worker", () => {
  assert.match(discoveryWorkflow, /cron: ['"]0 3\/6 \* \* \*['"]/);
  assert.doesNotMatch(discoveryWorkflow, /cron: ['"]0 3 \* \* \*['"]/);
  assert.equal((discoveryWorkflow.match(/\bcron:/g) ?? []).length, 1);
  assert.match(discoveryWorkflow, /DISCOVERY_EXPECTED_INTERVAL_HOURS: ['"]6['"]/);
  assert.match(discoveryWorkflow, /run: npm run verify/);
  assert.match(discoveryWorkflow, /run: node --import tsx scripts\/discovery\/index\.ts/);
});

invariant("scheduled and manual discovery share a non-cancelling bounded concurrency lane", () => {
  assert.match(discoveryWorkflow, /workflow_dispatch:/);
  assert.match(discoveryWorkflow, /concurrency:\s*\n\s*(?:#[^\n]*\n\s*)*group: discovery-production\s*\n\s*cancel-in-progress: false/);
  assert.match(discoveryWorkflow, /timeout-minutes: 30/);
  assert.doesNotMatch(discoveryWorkflow, /(?:retry|re-run|rerun)-?(?:action|workflow)/i);
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
  assert.match(discoveryWorkflow, /github\.run_id \}\}-\$\{\{ github\.run_attempt/);
  assert.match(discoveryWorkflow, /retention-days: 90/);
});

invariant("schedule monitor is credential-free and cannot execute discovery", () => {
  assert.match(healthWorkflow, /cron: ['"]30 3\/6 \* \* \*['"]/);
  assert.match(healthWorkflow, /DISCOVERY_EXPECTED_INTERVAL_HOURS: ['"]6['"]/);
  assert.match(healthWorkflow, /run: npm run health:monitor/);
  assert.doesNotMatch(healthWorkflow, /secrets\.|SUPABASE_SERVICE_ROLE_KEY|scripts\/discovery\/index\.ts/);
});

invariant("deadline alert scheduler is separate, bounded, owner-gated, and observable", () => {
  assert.equal((alertWorkflow.match(/\bcron:/g) ?? []).length, 1);
  assert.match(alertWorkflow, /cron: '15 2 \* \* \*'/);
  assert.match(alertWorkflow, /group: deadline-alerts-production/);
  assert.match(alertWorkflow, /cancel-in-progress: false/);
  assert.match(alertWorkflow, /timeout-minutes: 20/);
  assert.match(alertWorkflow, /vars\.DEADLINE_ALERTS_ENABLED == 'true'/);
  assert.match(alertWorkflow, /actions\/upload-artifact@v4/);
  assert.match(alertIndex, /DEADLINE_ALERTS_ENABLED !== "true"/);
  assert.doesNotMatch(alertWorkflow, /scripts\/discovery\/index\.ts/);
  assert.doesNotMatch(discoveryWorkflow, /scripts\/alerts\//);
});

invariant("deadline scheduler credentials are scoped only to its worker step", () => {
  const worker = alertWorkflow.indexOf("- name: Evaluate deadline alerts");
  const firstSecret = alertWorkflow.indexOf("secrets.");
  assert.ok(worker >= 0);
  assert.ok(firstSecret > worker);
  assert.doesNotMatch(alertWorkflow.slice(0, worker), /secrets\./);
});

invariant("ordinary milestone CI is read-only and credential-free", () => {
  assert.match(verificationWorkflow, /permissions:\s*\n\s*contents: read/);
  assert.match(verificationWorkflow, /run: npm run verify/);
  assert.match(verificationWorkflow, /run: npm run build/);
  assert.doesNotMatch(verificationWorkflow, /secrets\.|SUPABASE_SERVICE_ROLE_KEY|scripts\/discovery\/index\.ts/);
});

invariant("M31 forward migration preserves rows and removes fabricated country defaults", () => {
  assert.match(m31Migration, /alter column country drop default/);
  assert.match(m31Migration, /add column if not exists qualification_rule_version/);
  assert.match(m31Migration, /create table if not exists public\.opportunity_references/);
  assert.match(m31Migration, /alter table public\.opportunity_references enable row level security/);
  assert.doesNotMatch(m31Migration, /delete\s+from\s+public\.opportunities/i);
  assert.doesNotMatch(m31Migration, /update\s+public\.opportunities\s+set\s+country/i);
});

invariant("M31 discovery and moderation fail closed at the trust-schema boundary", () => {
  assert.match(runnerSource, /evidencePersistenceSkipped/);
  assert.match(runnerSource, /qualification_rule_version/);
  assert.match(moderationActions, /Approval is paused until the owner activates the M31 trust schema/);
  assert.match(moderationActions, /eligibility = "tanzanians_eligible"/);
  assert.match(moderationActions, /decided_by/);
});

invariant("M31 public and AI presentation exclude untrusted authority inputs", () => {
  assert.match(m31Trust, /isTestOrPlaceholderOpportunity/);
  assert.match(m31Trust, /isAiSearchableOpportunity/);
  assert.match(opportunitiesData, /\.filter\(isAiSearchableOpportunity\)/);
  assert.match(m31AiReadiness, /criteria\.every/);
  assert.doesNotMatch(m31AiReadiness, /embedding|vector|openai/i);
});

invariant("M31 source hardening disables generic institutional HTML", () => {
  assert.match(m31SourcePolicy, /GENERIC_HTML_DENY_TYPES/);
  assert.match(m31SourcePolicy, /allowGenericHtml: false/);
  assert.match(runnerSource, /sourceAcquisitionPolicy/);
});

invariant("M31 remediation is confirmation-gated status-only preservation", () => {
  assert.match(m31Remediation, /--confirm=M31-UNPUBLISH-PUBLIC-TESTS/);
  assert.match(m31Remediation, /update\(\{ status: "rejected" \}\)/);
  assert.doesNotMatch(m31Remediation, /\.delete\s*\(/);
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
