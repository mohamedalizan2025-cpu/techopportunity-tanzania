/**
 * READ-ONLY baseline analysis of the real database (Product Milestone 1,
 * Phase 1). Measures what is actually stored — statuses, categories,
 * source distribution, discovery methods, duplicates, field coverage and
 * a conservative news-vs-actionable heuristic — so source-strategy and
 * relevance decisions are made from current evidence, not past reports.
 *
 * Run: npx tsx --env-file=.env.local scripts/discovery/analyze-baseline.ts
 *
 * Guarantees: only SELECTs, no INSERT/UPDATE/DELETE, no secret output.
 */
import { createClient } from "@supabase/supabase-js";

const env = process.env;
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const client = createClient(url, serviceKey, { auth: { persistSession: false } });

const PAGE = 1000;

type PageQuery<T> = (
  from: number,
  to: number
) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

async function fetchAll<T>(query: PageQuery<T>): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 0; page < 200; page += 1) {
    const from = page * PAGE;
    const { data, error } = await query(from, from + PAGE - 1);
    if (error) throw new Error(`query failed: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

interface Opp {
  id: string;
  title: string;
  status: string;
  category_id: number;
  organization_id: string | null;
  url: string;
  source_url: string | null;
  deadline: string | null;
  region: string | null;
  city: string | null;
  country: string | null;
  source_id: string | null;
  discovery_method: string | null;
  created_at: string;
}
interface Category { id: number; slug: string; label: string }
interface Source { id: string; name: string; base_url: string; source_type: string; active: boolean }

function countBy<T, K extends string>(rows: T[], key: (r: T) => K): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const r of rows) {
    const k = key(r);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function hostOf(raw: string | null): string {
  if (!raw) return "(none)";
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return "(unparseable)";
  }
}

// Conservative news-language heuristic (Swahili + English reporting verbs /
// institutional subjects). Used ONLY for measurement, never to delete or
// reclassify anything.
const NEWS_HINT =
  /akagua|asikitiza|azindua|afungua|atoa wito|atoa pongezi|apongea|ataja|akabidhi|aanza|amaliza|waziri|serikali ya|rais |naibu |katibu mkuu|mkutano wa (wa|na )?wanachama|press release|communique/i;
// Actionable-language heuristic: explicit application/participation verbs or
// a category keyword present in the title.
const ACTION_HINT =
  /\bapply\b|application|ombi|maombi|fomu|deadline|open call|call for|tuma|jiteng|register|registration|usajili|scholarship|fellowship|internship|vacanc|ajira|nafasi za kazi|grant|hackathon|competition|mashindano|shindano|workshop|mafunzo|bootcamp|training|conference|kongamano|summit|admission|udahili|cohort|funding|udhamini|tender|eit\b/i;

async function main() {
  const [opps, categories, sources] = await Promise.all([
    fetchAll<Opp>((from, to) =>
      client
        .from("opportunities")
        .select("id,title,status,category_id,organization_id,url,source_url,deadline,region,city,country,source_id,discovery_method,created_at")
        .order("id")
        .range(from, to)
    ),
    fetchAll<Category>((from, to) => client.from("categories").select("id,slug,label").order("id").range(from, to)),
    fetchAll<Source>((from, to) => client.from("opportunity_sources").select("id,name,base_url,source_type,active").order("id").range(from, to)),
  ]);

  const catById = new Map(categories.map((c) => [c.id, c.slug]));
  const srcById = new Map(sources.map((s) => [s.id, s.name]));

  console.log(`\n=== TOTALS ===`);
  console.log(`opportunities: ${opps.length}`);
  console.log(`by status:`, countBy(opps, (o) => o.status));

  console.log(`\n=== BY CATEGORY (all statuses) ===`);
  for (const [slug, n] of Object.entries(countBy(opps, (o) => catById.get(o.category_id) ?? `id:${o.category_id}`))) {
    console.log(`  ${slug}: ${n}`);
  }

  console.log(`\n=== DISCOVERY METHOD ===`);
  console.log(countBy(opps, (o) => o.discovery_method ?? "(none/manual)"));

  console.log(`\n=== BY REGISTRY SOURCE ===`);
  const bySource = countBy(opps, (o) => (o.source_id ? srcById.get(o.source_id) ?? o.source_id : "(no registry source)"));
  for (const [name, n] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) {
    const pending = opps.filter((o) => (o.source_id ? srcById.get(o.source_id) === name : name === "(no registry source)") && o.status === "pending").length;
    const published = opps.filter((o) => (o.source_id ? srcById.get(o.source_id) === name : name === "(no registry source)") && o.status === "published").length;
    const rejected = opps.filter((o) => (o.source_id ? srcById.get(o.source_id) === name : name === "(no registry source)") && o.status === "rejected").length;
    console.log(`  ${name}: total=${n} pending=${pending} published=${published} rejected=${rejected}`);
  }

  console.log(`\n=== SOURCE-URL HOST DISTRIBUTION (top 15) ===`);
  const hosts = countBy(opps, (o) => hostOf(o.source_url));
  Object.entries(hosts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([h, n]) => console.log(`  ${h}: ${n}`));

  console.log(`\n=== FIELD COVERAGE ===`);
  const pct = (n: number) => `${n}/${opps.length} (${opps.length ? Math.round((100 * n) / opps.length) : 0}%)`;
  console.log(`deadline present: ${pct(opps.filter((o) => o.deadline !== null).length)}`);
  console.log(`region present:   ${pct(opps.filter((o) => o.region !== null).length)}`);
  console.log(`city present:     ${pct(opps.filter((o) => o.city !== null).length)}`);
  console.log(`organizer linked: ${pct(opps.filter((o) => o.organization_id !== null).length)}`);
  console.log(`country values:`, countBy(opps, (o) => o.country ?? "(null)"));

  console.log(`\n=== DUPLICATES (URL-exact among non-rejected) ===`);
  const urlCounts = new Map<string, number>();
  for (const o of opps.filter((x) => x.status !== "rejected")) {
    urlCounts.set(o.url, (urlCounts.get(o.url) ?? 0) + 1);
  }
  const dupes = [...urlCounts.entries()].filter(([, n]) => n > 1);
  console.log(`distinct duplicate URLs: ${dupes.length}`);
  dupes.slice(0, 10).forEach(([u, n]) => console.log(`  x${n} ${u}`));

  console.log(`\n=== NEWS-vs-ACTIONABLE HEURISTIC (titles) ===`);
  const newsLike = opps.filter((o) => NEWS_HINT.test(o.title) && !ACTION_HINT.test(o.title));
  const actionLike = opps.filter((o) => ACTION_HINT.test(o.title));
  console.log(`titles matching news language only: ${newsLike.length} (${opps.length ? Math.round((100 * newsLike.length) / opps.length) : 0}%)`);
  console.log(`titles matching actionable language: ${actionLike.length} (${opps.length ? Math.round((100 * actionLike.length) / opps.length) : 0}%)`);

  console.log(`\n=== PENDING SAMPLE (first 40 titles) ===`);
  opps
    .filter((o) => o.status === "pending")
    .slice(0, 40)
    .forEach((o) => console.log(`  [${catById.get(o.category_id)}] ${o.title}`));

  console.log(`\n=== PUBLISHED SAMPLE (first 20 titles) ===`);
  opps
    .filter((o) => o.status === "published")
    .slice(0, 20)
    .forEach((o) => console.log(`  [${catById.get(o.category_id)}] ${o.title} (deadline: ${o.deadline ?? "none"})`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
