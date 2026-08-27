import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { fetchPage } from "./fetch";
import { extractCandidatesFromJsonLd } from "./extract";
import { sanitizeSearchQuery } from "../../lib/data/opportunities";
import { sameUrl } from "./dedupe";

const ALLOWED_FIELDS = new Set(["venue_name", "address", "city", "region", "deadline"]);
const SAMPLE_SOURCE_NAMES = process.argv.includes("--sample");

interface EnrichTarget {
  id: string;
  title: string;
  url: string;
  venue_name: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  deadline: string | null;
  source_name: string;
}

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const env = loadEnv();
const BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = (env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const DRY_RUN = process.argv.includes("--dry-run");
if (!BASE || !SERVICE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const service = createClient(BASE, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

async function loadTargets(): Promise<EnrichTarget[]> {
  const { data, error } = await service
    .from("opportunities")
    .select("id,title,url,venue_name,address,city,region,deadline,source:opportunity_sources(name)")
    .not("source_id", "is", null)
    .limit(300);
  if (error) throw new Error(`Failed to load enrichment targets: ${error.message}`);
  const rows = (data ?? []) as unknown as Array<EnrichTarget & { source: { name: string } | null }>;
  const mapped = rows.map((r) => ({ ...r, source_name: r.source?.name ?? "unknown" }));
  if (!SAMPLE_SOURCE_NAMES) return mapped;
  const wanted = ["Nelson Mandela African Institution of Science and Technology", "Financial Sector Deepening Tanzania", "Dar es Salaam Institute of Technology", "State University of Zanzibar", "University of Dar es Salaam", "Vocational Education and Training Authority"];
  return mapped.filter((r) => wanted.includes(r.source_name)).slice(0, 12);
}

interface Proposal {
  opportunityId: string;
  field: string;
  value: string;
  evidenceUrl: string;
  method: string;
  title: string;
  sourceName: string;
}

function proposalsFor(target: EnrichTarget, candidates: ReturnType<typeof extractCandidatesFromJsonLd>, evidenceUrl: string): Proposal[] {
  const proposals: Proposal[] = [];
  const candidate = candidates.find((c) => sameUrl(c.url ?? "", target.url));
  if (!candidate) return proposals;
  const pairs: Array<[string, string | null, string | null]> = [
    ["venue_name", target.venue_name, candidate.venueName],
    ["address", target.address, candidate.address],
    ["city", target.city, candidate.city],
    ["region", target.region, candidate.region],
    ["deadline", target.deadline, candidate.deadline],
  ];
  for (const [field, current, incoming] of pairs) {
    if (current !== null && current !== "") continue;
    if (!incoming || incoming.trim() === "") continue;
    const clean = sanitizeSearchQuery(incoming) ?? incoming.trim().slice(0, 500);
    proposals.push({
      opportunityId: target.id,
      field,
      value: clean,
      evidenceUrl,
      method: "json-ld-extraction",
      title: target.title,
      sourceName: target.source_name,
    });
  }
  return proposals;
}

async function main() {
  const targets = await loadTargets();
  console.log(`targets=${targets.length} mode=${DRY_RUN ? "DRY-RUN" : "APPLY"} sample=${SAMPLE_SOURCE_NAMES}`);

  const proposals: Proposal[] = [];
  let fetched = 0;
  let fetchFailures = 0;
  let noEvidence = 0;

  for (const target of targets) {
    try {
      const html = await fetchPage(target.url);
      fetched += 1;
      const candidates = extractCandidatesFromJsonLd(html, "enrichment", target.url);
      const p = proposalsFor(target, candidates, target.url);
      if (p.length === 0) noEvidence += 1;
      proposals.push(...p);
    } catch (e) {
      fetchFailures += 1;
      console.error(`fetch-fail [${target.source_name}] ${target.url} :: ${String(e).slice(0, 60)}`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\nfetched=${fetched} fetch_failures=${fetchFailures} no_evidence_records=${noEvidence} proposals=${proposals.length}`);
  for (const p of proposals) {
    console.log(`PROPOSE ${p.field} = "${p.value}" | ${p.sourceName} | ${p.title.slice(0, 50)} | evidence=${p.evidenceUrl}`);
  }

  if (DRY_RUN || proposals.length === 0) {
    console.log("\nDRY-RUN complete — nothing written.");
    return;
  }

  let written = 0;
  for (const p of proposals) {
    if (!ALLOWED_FIELDS.has(p.field)) continue;
    const patch: Record<string, string> = { [p.field]: p.value };
    const { error } = await service.from("opportunities").update(patch).eq("id", p.opportunityId);
    if (error) {
      console.error(`write-fail ${p.field} ${p.opportunityId}: ${error.message}`);
      continue;
    }
    const audit = {
      opportunity_id: p.opportunityId,
      field: p.field,
      previous_value: null,
      new_value: p.value,
      evidence_url: p.evidenceUrl,
      method: p.method,
    };
    const { error: auditError } = await service.from("opportunity_enrichments").insert(audit);
    if (auditError) console.error(`audit-fail ${p.opportunityId}/${p.field}: ${auditError.message}`);
    written += 1;
  }
  console.log(`\nwritten=${written} audit_rows_targeted=${proposals.length}`);
}

void main();
