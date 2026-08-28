import { createClient } from "@supabase/supabase-js";
import { fetchPage } from "./fetch";
import { extractAllCandidates, extractFeedCandidates } from "./adapters";
import { discoverFeedUrls } from "./extract";
import { normalizeCandidate } from "./normalize";
import { isObviousSectionLabel, isValidOpportunityUrl, validateCandidate } from "./validate";
import type { CandidateOpportunity, SourceRecord } from "./types";

/**
 * Read-only dry-run: exercises the full discovery extraction pipeline
 * (base_url + advertised feeds, all four extractors, normalize + validate)
 * against every active source and reports where explicit location/deadline
 * evidence exists. Writes nothing to the database.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Missing SUPABASE credentials for dry-run");

const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const hasLocation = (c: CandidateOpportunity) =>
  Boolean(c.venueName) || Boolean(c.address) || Boolean(c.city) || Boolean(c.region);

async function main() {
const { data: sources } = await client
  .from("opportunity_sources")
  .select("id,name,base_url,active")
  .eq("active", true)
  .order("name");

const activeSources = (sources ?? []) as unknown as SourceRecord[];

const totals = { sources: 0, fetched: 0, failures: 0, candidates: 0, valid: 0, withLocation: 0, withDeadline: 0, withBoth: 0, withNeither: 0, noiseFiltered: 0 };



for (const source of activeSources) {
  totals.sources += 1;
  try {
    const html = await fetchPage(source.base_url);
    totals.fetched += 1;
    const raw = extractAllCandidates(html, source.id, source.base_url);
    const feedUrls = discoverFeedUrls(html, source.base_url).slice(0, 2);
    for (const feedUrl of feedUrls) {
      try {
        const feedBody = await fetchPage(feedUrl);
        totals.fetched += 1;
        raw.push(...extractFeedCandidates(feedBody, source.id, feedUrl));
      } catch {
        totals.failures += 1;
      }
    }

    const normalized = raw
      .map((c) => ({ c, n: normalizeCandidate(c, source.id) }))
      .filter((x): x is { c: Parameters<typeof normalizeCandidate>[0]; n: CandidateOpportunity } => x.n !== null);
    const valid = normalized.filter((x) => validateCandidate(x.n)).map((x) => x.n);
    const labelNoise = normalized.filter((x) => !validateCandidate(x.n) && isObviousSectionLabel(x.n.title) && x.c.url && isValidOpportunityUrl(x.c.url));
    totals.noiseFiltered += labelNoise.length;
    if (labelNoise.length > 0) {
      const titles = labelNoise.map((x) => x.n.title.slice(0, 40)).join(" | ");
      console.log("    noise-filtered: " + titles);
    }

    totals.candidates += valid.length;
    const withLoc = valid.filter(hasLocation);
    const withDl = valid.filter((c) => c.deadline !== null);
    const withBoth = valid.filter((c) => hasLocation(c) && c.deadline !== null);
    totals.valid += valid.length;
    const catDist = valid.reduce((acc, v) => { acc[v.category] = (acc[v.category] || 0) + 1; return acc; }, {} as Record<string, number>);
    console.log('    categories: ' + JSON.stringify(catDist));
    totals.withLocation += withLoc.length;
    totals.withDeadline += withDl.length;
    totals.withBoth += withBoth.length;
    totals.withNeither += valid.length - withLoc.length - withDl.length + withBoth.length;

    console.log(`=== ${source.name} | candidates=${valid.length} location=${withLoc.length} deadline=${withDl.length} both=${withBoth.length} feeds=${feedUrls.length}`);
    for (const c of withLoc) {
      console.log(`    LOC ${c.title.slice(0, 60)} -> venue=${c.venueName} city=${c.city} region=${c.region} url=${c.url.slice(0, 60)}`);
    }
    for (const c of withDl) {
      console.log(`    DL  ${c.title.slice(0, 60)} -> ${c.deadline} url=${c.url.slice(0, 60)}`);
    }
  } catch (e) {
    totals.failures += 1;
    console.log(`=== ${source.name} | ERROR ${String(e instanceof Error ? e.message : e).slice(0, 60)}`);
  }
}

console.log("\nTOTALS " + JSON.stringify(totals));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
