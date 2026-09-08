import { createClient } from "@supabase/supabase-js";
import { evaluateAiReadiness } from "../../lib/ai-readiness";
import { buildHomepageSnapshot } from "../../lib/opportunity-presentation";
import { canonicalOpportunityUrl } from "../discovery/dedupe";
import { mapRowToOpportunity, type OpportunityRow } from "../../lib/data/opportunities";

async function main(): Promise<void> {
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) {
  throw new Error("M31 AI-readiness verification requires Supabase URL, anon key, and service role key.");
}

const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

const trustSelect = `
  id,slug,title,description,url,source_url,deadline,deadline_precision,deadline_evidence,status,
  venue_name,address,city,region,country,latitude,longitude,image_url,created_at,discovered_at,discovery_method,
  relevance_decision,relevance_evidence,eligibility,eligibility_evidence,qualification_rule_version,
  country_verification,country_evidence,last_verified_at,decided_by,decided_at,
  category:categories(slug),organization:organizations(id,name),source:opportunity_sources(name),
  references:opportunity_references(url,is_canonical)
`;

const trustProbe = await service.from("opportunities").select("qualification_rule_version").limit(1);
if (trustProbe.error) {
  console.log(`M31_AI_READINESS_REPORT_JSON=${JSON.stringify({
    schemaVersion: 1,
    state: "NO_GO",
    schemaReady: false,
    reason: "M31 trust schema is not applied or not visible in the API schema cache.",
    errorCode: trustProbe.error.code ?? null,
  })}`);
  process.exit(1);
}

const { data, error } = await service.from("opportunities").select(trustSelect).eq("status", "published");
if (error) throw new Error(error.message);

const published = ((data ?? []) as unknown as OpportunityRow[]).map(mapRowToOpportunity);

const canonical = published.map((item) => canonicalOpportunityUrl(item.trust?.canonicalEvidenceUrl ?? item.url));
const duplicateIntegrityPassed = new Set(canonical).size === canonical.length;
const [anonPublished, anonPending, anonSources, anonSaved] = await Promise.all([
  anon.from("opportunities").select("id", { count: "exact", head: true }),
  anon.from("opportunities").select("id", { count: "exact", head: true }).eq("status", "pending"),
  anon.from("opportunity_sources").select("id", { count: "exact", head: true }),
  anon.from("saved_opportunities").select("user_id", { count: "exact", head: true }),
]);
const securityBoundariesPassed = !anonPublished.error && anonPending.count === 0 && anonSources.count === 0 && Boolean(anonSaved.error);
const snapshot = buildHomepageSnapshot(published);
const report = evaluateAiReadiness({
  published,
  featured: [...snapshot.closingSoon, ...snapshot.recentlyAdded],
  duplicateIntegrityPassed,
  securityBoundariesPassed,
});
console.log(`M31_AI_READINESS_REPORT_JSON=${JSON.stringify({ ...report, schemaReady: true })}`);
if (report.state !== "READY") process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "M31 AI-readiness verification failed.");
  process.exitCode = 1;
});
