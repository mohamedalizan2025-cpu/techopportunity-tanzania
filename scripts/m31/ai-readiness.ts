import { createClient } from "@supabase/supabase-js";
import { evaluateAiReadiness } from "../../lib/ai-readiness";
import { buildHomepageSnapshot } from "../../lib/opportunity-presentation";
import { canonicalOpportunityUrl } from "../discovery/dedupe";
import type { Opportunity } from "../../lib/types";
import type { RelevanceDecision } from "../../lib/opportunity-trust";

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

type Row = Record<string, unknown>;
const published: Opportunity[] = ((data ?? []) as Row[]).map((row) => {
  const references = (row.references ?? []) as Array<{ url: string; is_canonical: boolean }>;
  const source = row.source as { name: string } | null;
  const category = row.category as { slug: Opportunity["category"] } | null;
  const organization = row.organization as { id: string; name: string } | null;
  const hasLocation = [row.venue_name, row.address, row.city, row.region, row.latitude].some((value) => value !== null);
  return {
    id: row.id as string, slug: row.slug as string, title: row.title as string,
    description: row.description as string, category: category?.slug ?? "other",
    organization: organization?.name ?? null, organizationId: organization?.id ?? null,
    sourceName: source?.name ?? null, sourceUrl: row.source_url as string | null,
    discoveredAt: row.discovered_at as string | null, discoveryMethod: row.discovery_method as string | null,
    url: row.url as string, deadline: row.deadline as string | null,
    deadlinePrecision: row.deadline_precision as Opportunity["deadlinePrecision"],
    deadlineEvidence: row.deadline_evidence as string | null,
    location: hasLocation ? {
      venueName: row.venue_name as string | null, address: row.address as string | null,
      city: row.city as string | null, region: row.region as string | null,
      country: row.country as string | null, latitude: row.latitude as number | null,
      longitude: row.longitude as number | null,
    } : null,
    imageUrl: row.image_url as string | null, status: "published", createdAt: row.created_at as string,
    trust: {
      relevanceDecision: row.relevance_decision as RelevanceDecision,
      relevanceEvidence: row.relevance_evidence as string | null,
      eligibilityDecision: row.eligibility as NonNullable<Opportunity["trust"]>["eligibilityDecision"],
      eligibilityEvidence: row.eligibility_evidence as string | null,
      qualificationRuleVersion: row.qualification_rule_version as string | null,
      countryVerification: row.country_verification as NonNullable<Opportunity["trust"]>["countryVerification"],
      countryEvidence: row.country_evidence as string | null,
      lastVerifiedAt: row.last_verified_at as string | null,
      decidedBy: row.decided_by as string | null, decidedAt: row.decided_at as string | null,
      canonicalEvidenceUrl: references.find((reference) => reference.is_canonical)?.url ?? null,
    },
  };
});

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
