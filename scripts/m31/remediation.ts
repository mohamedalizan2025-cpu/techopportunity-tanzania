import { createClient } from "@supabase/supabase-js";
import { isTestOrPlaceholderOpportunity } from "../../lib/opportunity-trust";
import type { Opportunity } from "../../lib/types";
import { qualifyOpportunity, shouldEnterModerationQueue } from "../discovery/qualification";
import type { CandidateOpportunity, SourceType } from "../discovery/types";

type Bucket = "reject_noise" | "review_required" | "potentially_qualifying";

const APPLY_FLAG = "--apply-test-quarantine";
const CONFIRM = "--confirm=M31-UNPUBLISH-PUBLIC-TESTS";

async function main(): Promise<void> {
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("M31 remediation requires Supabase URL and service role key.");
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data, error } = await client
  .from("opportunities")
  .select("id,title,description,url,source_url,deadline,status,country,discovery_method,source_id,category:categories(slug),source:opportunity_sources(name,source_type)")
  .order("created_at", { ascending: true });
if (error) throw new Error(error.message);

const rows = (data ?? []) as unknown as Array<{
  id: string; title: string; description: string; url: string; source_url: string | null;
  deadline: string | null; status: Opportunity["status"]; country: string | null;
  discovery_method: CandidateOpportunity["discoveryMethod"] | null; source_id: string | null;
  category: { slug: string } | null; source: { name: string; source_type: SourceType } | null;
}>;

const results = rows.map((row) => {
  const publicShape: Opportunity = {
    id: row.id, slug: row.id, title: row.title, description: row.description,
    category: (row.category?.slug ?? "other") as Opportunity["category"],
    organization: null, sourceName: row.source?.name ?? null,
    discoveryMethod: row.discovery_method, sourceUrl: row.source_url,
    url: row.url, deadline: row.deadline, location: row.country ? {
      venueName: null, address: null, city: null, region: null, country: row.country,
      latitude: null, longitude: null,
    } : null, imageUrl: null, status: row.status, createdAt: "1970-01-01T00:00:00Z",
  };
  const candidate: CandidateOpportunity = {
    title: row.title, description: row.description, category: row.category?.slug ?? "other",
    organization: null, url: row.url, deadline: row.deadline, venueName: null,
    address: null, city: null, region: null, country: row.country,
    sourceId: row.source_id ?? "", sourceUrl: row.source_url ?? row.url,
    evidenceUrl: row.source_url, referenceKind: "source-base",
    discoveryMethod: row.discovery_method ?? "html",
  };
  const qualification = qualifyOpportunity(candidate, new Date(), {
    sourceType: row.source?.source_type,
  });
  const testArtifact = isTestOrPlaceholderOpportunity(publicShape);
  const bucket: Bucket = testArtifact || qualification.relevance === "not_relevant" || qualification.tanzaniaAccessibility === "tanzanians_not_eligible"
    ? "reject_noise"
    : shouldEnterModerationQueue(qualification) && Boolean(row.source_url)
      ? "potentially_qualifying"
      : "review_required";
  return { id: row.id, title: row.title, status: row.status, source: row.source?.name ?? null, testArtifact, bucket, qualification };
});

const pendingResults = results.filter((row) => row.status === "pending");
const bucketCounts = pendingResults.reduce<Record<Bucket, number>>((counts, row) => {
  counts[row.bucket] += 1;
  return counts;
}, { reject_noise: 0, review_required: 0, potentially_qualifying: 0 });
const publicTests = results.filter((row) => row.status === "published" && row.testArtifact);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  mode: process.argv.includes(APPLY_FLAG) ? "apply-test-quarantine" : "plan-only",
  observedCorpusCount: results.length,
  pendingCount: pendingResults.length,
  bucketCounts,
  publicTestArtifacts: publicTests.map(({ id, title }) => ({ id, title })),
  mutationScope: "published test artifacts -> rejected; status only; no deletes",
};
console.log(`M31_REMEDIATION_REPORT_JSON=${JSON.stringify(report)}`);

if (process.argv.includes(APPLY_FLAG)) {
  if (!process.argv.includes(CONFIRM)) {
    throw new Error(`Apply refused. Re-run with the exact confirmation ${CONFIRM}`);
  }
  for (const row of publicTests) {
    const { data: changed, error: updateError } = await client
      .from("opportunities")
      .update({ status: "rejected" })
      .eq("id", row.id)
      .eq("status", "published")
      .select("id");
    if (updateError) throw new Error(`Failed to quarantine ${row.id}: ${updateError.message}`);
    if ((changed ?? []).length !== 1) throw new Error(`Concurrent change refused for ${row.id}.`);
  }
  console.log(`M31_QUARANTINED_COUNT=${publicTests.length}`);
}
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "M31 remediation failed.");
  process.exitCode = 1;
});
