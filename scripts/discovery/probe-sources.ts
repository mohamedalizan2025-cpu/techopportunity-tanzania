/**
 * READ-ONLY source-expansion + roundup probe (Product Milestone 1,
 * Phases 2 and 6). Uses the SAME hardened fetch boundary and adapters as
 * the pipeline. Two jobs:
 *
 * 1. PHASE 6 evidence: fetch the real roundup pages currently sitting in
 *    the pending queue and show how the one-hop decomposition would split
 *    them. Proves (or disproves) roundup quality against live sources.
 * 2. PHASE 2 evidence: probe a small set of candidate expansion sources
 *    (TZ admission agencies, international scholarship providers,
 *    aggregators) and report advertised feeds + extractable candidates,
 *    so the "smallest high-value expansion" decision rests on measured
 *    yield, not guesses.
 *
 * Run: npx tsx --env-file=.env.local scripts/discovery/probe-sources.ts
 *
 * Guarantees: SELECTs + GETs only; no writes; one document per candidate
 * source (+ up to 2 advertised feeds); every URL passes the acquisition
 * guard. No secrets printed.
 */
import { createClient } from "@supabase/supabase-js";
import { fetchPage } from "./fetch";
import { extractAllCandidates, extractFeedCandidates } from "./adapters";
import { discoverFeedUrls, extractOpportunityLinks, isRoundupTitle } from "./extract";
import { normalizeCandidate } from "./normalize";
import { validateCandidate } from "./validate";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Missing SUPABASE credentials for probe");
const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

// Candidate expansion sources — deliberately few, each tied to a documented
// product category gap (admissions agencies, international scholarships,
// previously-unverified aggregators).
const EXPANSION_CANDIDATES = [
  { name: "NACTE (National Council for Technical Education)", base: "https://www.nacte.go.tz" },
  { name: "TCU (Tanzania Commission for Universities)", base: "https://www.tcu.go.tz" },
  { name: "COSTECH", base: "https://www.costech.or.tz" },
  { name: "DAAD (international scholarships)", base: "https://www.daad.de/en/" },
  { name: "Chevening", base: "https://www.chevening.org" },
  { name: "AfterSchoolAfrica (re-test: was empty feed)", base: "https://www.afterschoolafrica.com" },
  { name: "YouthOp (re-test: previously timed out)", base: "https://www.youthop.com" },
];

async function probeRoundups() {
  console.log("=== PHASE 6: real roundup pages in the pending queue ===");
  const { data: pendings } = await client
    .from("opportunities")
    .select("title,url")
    .eq("status", "pending")
    .limit(500);
  const roundups = (pendings ?? []).filter((p) => isRoundupTitle(p.title as string));
  console.log(`pending rows matching roundup pattern: ${roundups.length}`);
  for (const p of roundups.slice(0, 3)) {
    console.log(`\n  ROUNDUP ${String(p.title).slice(0, 80)}`);
    console.log(`  url: ${p.url}`);
    try {
      const html = await fetchPage(p.url as string);
      const links = extractOpportunityLinks(html, p.url as string);
      console.log(`  one-hop decomposition: ${links.length} inner candidates`);
      links.slice(0, 8).forEach((l) => console.log(`    - ${l.title.slice(0, 70)}`));
    } catch (e) {
      console.log(`  probe failed: ${String(e instanceof Error ? e.message : e).slice(0, 80)}`);
    }
  }
}

async function probeExpansion() {
  console.log("\n=== PHASE 2: candidate expansion sources (measured yield) ===");
  for (const src of EXPANSION_CANDIDATES) {
    const line: string[] = [`\n  ${src.name} (${src.base})`];
    try {
      const html = await fetchPage(src.base);
      const raw = extractAllCandidates(html, "00000000-0000-0000-0000-0000000000ff", src.base);
      const feedUrls = discoverFeedUrls(html, src.base).slice(0, 2);
      let feedItems = 0;
      for (const feedUrl of feedUrls) {
        try {
          const body = await fetchPage(feedUrl);
          const items = extractFeedCandidates(body, "00000000-0000-0000-0000-0000000000ff", feedUrl);
          feedItems += items.length;
          raw.push(...items);
          line.push(`feed ${feedUrl} -> ${items.length} items`);
        } catch (e) {
          line.push(`feed ${feedUrl} FAILED (${String(e instanceof Error ? e.message : e).slice(0, 50)})`);
        }
      }
      const valid = raw
        .map((c) => normalizeCandidate(c, "probe"))
        .filter((n) => n !== null && validateCandidate(n));
      const cats = valid.reduce((acc, v) => { acc[v!.category] = (acc[v!.category] ?? 0) + 1; return acc; }, {} as Record<string, number>);
      line.push(`page candidates=${raw.length - feedItems} valid=${valid.length} categories=${JSON.stringify(cats)}`);
      valid.slice(0, 5).forEach((v) => line.push(`    sample [${v!.category}] ${v!.title.slice(0, 70)}`));
    } catch (e) {
      line.push(`BLOCKED/FAILED: ${String(e instanceof Error ? e.message : e).slice(0, 90)}`);
    }
    console.log(line.join("\n    "));
  }
}

async function main() {
  await probeRoundups();
  await probeExpansion();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
