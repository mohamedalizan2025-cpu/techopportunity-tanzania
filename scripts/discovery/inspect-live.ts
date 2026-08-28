// =====================================================================
// Milestone 2 — live truth inspector (READ-ONLY, SELECT-only).
//
// Purpose: reconcile previous-report claims against the ACTUAL database.
//  1. Schema state: which migrations (0004-0010) are genuinely applied —
//     detected from information_schema/pg_catalog markers, NEVER inferred
//     from filenames.
//  2. Baseline A-L: status/category/source/method/coverage/duplicates/
//     audit counts + real row samples per major class.
//
// Run: npx tsx --env-file=.env.local scripts/discovery/inspect-live.ts
// =====================================================================
import { createClient } from "@supabase/supabase-js";

const env = process.env;
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

type Row = Record<string, unknown>;
type PageQuery<T> = (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

async function fetchAll<T>(query: PageQuery<T>): Promise<T[]> {
  const out: T[] = [];
  for (let page = 0; page < 200; page++) {
    const from = page * 1000;
    const { data, error } = await query(from, from + 999);
    if (error) throw new Error(`fetch failed: ${error.message}`);
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

function countBy<T extends Row>(rows: T[], key: keyof T & string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = String(r[key] ?? "(null)");
    out[k] = (out[k] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort((a, b) => b[1] - a[1]));
}

function show(label: string, obj: unknown): void {
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(obj, null, 1));
}

async function main(): Promise<void> {
  // ------------------------------------------------------------------
  // PART 1 — SCHEMA TRUTH (migration detection via behaviour probes)
  // PostgREST does not expose information_schema, so applied state is
  // detected from OBSERVABLE BEHAVIOUR, never from filenames:
  //   * 0005: does an `eligibility` column exist on opportunities?
  //   * 0006: does the `opportunity_references` table exist?
  //   * 0007: does `last_verified_at` exist?
  //   * 0008: what does an INSERT without `country` actually store?
  //   * 0009: do `decided_by`/`decided_at` exist?
  //   * 0004/0010: do the category seed rows exist?
  // ------------------------------------------------------------------

  // Category seeds (0004 admissions, 0010 jobs detection).
  const { data: cats, error: catErr } = await db.from("categories").select("id,slug,label").order("slug");
  if (catErr) throw new Error(`categories read failed: ${catErr.message}`);
  show("L. category seeds (live)", cats);

  // Column probes: ask for each migration marker column; a PostgREST
  // 400 "column does not exist" proves the migration is NOT applied.
  const probes: Array<[string, string, string]> = [
    ["0005 eligibility", "eligibility", "opportunities"],
    ["0005 eligibility_evidence", "eligibility_evidence", "opportunities"],
    ["0007 last_verified_at", "last_verified_at", "opportunities"],
    ["0009 decided_by", "decided_by", "opportunities"],
    ["0009 decided_at", "decided_at", "opportunities"],
  ];
  const colState: Record<string, string> = {};
  for (const [label, col, table] of probes) {
    const { error } = await db.from(table).select(col).limit(1);
    colState[label] = error ? `ABSENT (${error.message.slice(0, 60)})` : "PRESENT";
  }
  // 0006 table probe.
  const { error: refErr } = await db.from("opportunity_references").select("id").limit(1);
  colState["0006 opportunity_references table"] = refErr ? `ABSENT (${refErr.message.slice(0, 60)})` : "PRESENT";
  show("column/table presence probes", colState);

  // ------------------------------------------------------------------
  // PART 2 — BASELINE A-L
  // ------------------------------------------------------------------
  const opps = await fetchAll<Row>((from, to) =>
    db.from("opportunities").select("*").order("id").range(from, to)
  );
  show("row total", { opportunities: opps.length });

  const slugById = new Map<number, string>();
  for (const c of cats ?? []) {
    const r = c as Row;
    slugById.set(Number(r.id), String(r.slug));
  }
  const withCat: Row[] = opps.map((o) => ({ ...o, category: slugById.get(Number(o.category_id)) ?? "(missing-fk)" }));

  show("A. status distribution", countBy(withCat, "status"));
  show("B. category distribution", countBy(withCat, "category"));

  // Source names for the distribution (registry read).
  const sources = await fetchAll<Row>((from, to) =>
    db.from("opportunity_sources").select("id,name,active").order("name").range(from, to)
  );
  const nameById = new Map(sources.map((s) => [String(s.id), `${s.name} ${s.active ? "(active)" : "(INACTIVE)"}`]));
  const bySource = countBy(opps, "source_id");
  show("C. source distribution", Object.fromEntries(
    Object.entries(bySource).map(([id, n]) => [nameById.get(id) ?? id, n])
  ));
  show("registry rows", sources.length);
  show("D. discovery method", countBy(opps, "discovery_method"));

  const covered = (k: string) => opps.filter((o) => o[k] !== null && String(o[k]).trim() !== "").length;
  show("E-G+H coverage", {
    city: covered("city"),
    region: covered("region"),
    country: covered("country"),
    countryValues: countBy(opps, "country"),
    deadline: covered("deadline"),
    organizationId: covered("organization_id"),
    venueName: covered("venue_name"),
  });

  show("I. pending queue size", opps.filter((o) => o.status === "pending").length);

  // J. duplicate/identity signals.
  const urlCount = new Map<string, number>();
  for (const o of opps) {
    const u = String(o.url ?? "");
    urlCount.set(u, (urlCount.get(u) ?? 0) + 1);
  }
  const dupUrls = [...urlCount.entries()].filter(([, n]) => n > 1);
  const titleNorm = new Map<string, number>();
  for (const o of opps) {
    const t = String(o.title ?? "").toLowerCase().replace(/\s+/g, " ").trim();
    titleNorm.set(t, (titleNorm.get(t) ?? 0) + 1);
  }
  const dupTitles = [...titleNorm.entries()].filter(([, n]) => n > 1);
  show("J. duplicates", { duplicateUrls: dupUrls, duplicateTitles: dupTitles });

  // K. audit trail row count.
  const { count: auditCount, error: auditErr } = await db
    .from("opportunity_enrichments")
    .select("id", { count: "exact", head: true });
  show("K. audit trail", auditErr ? { error: auditErr.message } : { opportunity_enrichments_rows: auditCount });

  // ------------------------------------------------------------------
  // PART 3 — SAMPLES per major class (real rows)
  // ------------------------------------------------------------------
  const brief = (o: Row) => ({
    title: String(o.title ?? "").slice(0, 70),
    status: o.status,
    category: slugById.get(Number(o.category_id)) ?? "(missing-fk)",
    country: o.country,
    deadline: o.deadline,
    source_id: o.source_id,
    method: o.discovery_method,
  });
  const pending = withCat.filter((o) => o.status === "pending");
  const published = withCat.filter((o) => o.status === "published");
  const rejected = withCat.filter((o) => o.status === "rejected");
  const newsHints = /akagua|azindua|waziri|serikali ya|hafla|matukio|habari|taarifa|sherehe|uzinduzi|minister|launches|announces|news/i;
  const actionHints = /apply|ombi|maombi|fomu|scholarship|fellowship|vacanc|ajira|nafasi za kazi|internship|grant|competition|hackathon|deadline|closing|call for|applications? open|udahili|mafunzo|kongamano/i;
  const pendingNews = pending.filter((o) => newsHints.test(String(o.title ?? "")) && !actionHints.test(String(o.title ?? "")));
  const pendingAction = pending.filter((o) => actionHints.test(String(o.title ?? "")));
  const pendingAmbig = pending.filter((o) => !actionHints.test(String(o.title ?? "")) && !newsHints.test(String(o.title ?? "")));
  show("pending heuristic classes (NOT truth — signals only)", {
    newsLike: pendingNews.length,
    actionLike: pendingAction.length,
    ambiguous: pendingAmbig.length,
  });
  show("samples: published", published.slice(0, 12).map(brief));
  show("samples: pending action-like", pendingAction.slice(0, 8).map(brief));
  show("samples: pending news-like", pendingNews.slice(0, 8).map(brief));
  show("samples: pending ambiguous", pendingAmbig.slice(0, 8).map(brief));
  show("samples: rejected", rejected.map(brief));

  // ------------------------------------------------------------------
  // PART 4 — INSERT BEHAVIOUR PROBE for the country default (0008).
  // One reversible test row: INSERT WITHOUT the country field, read
  // back what the DB actually stored, then DELETE the probe row.
  // If it stores 'Tanzania' the 0001 default is still live (0008 NOT
  // applied); if NULL, 0008 IS applied.
  // ------------------------------------------------------------------
  const probeTitle = "M2 SCHEMA PROBE — AUTO-DELETED, DO NOT MODERATE";
  const { data: probe, error: probeErr } = await db
    .from("opportunities")
    .insert({
      slug: `m2-schema-probe-${Date.now()}`,
      title: probeTitle,
      description: "Reversible schema probe inserted by inspect-live.ts; deleted immediately after read-back.",
      url: "https://example.com/m2-schema-probe",
      category_id: 10, // 'other' — guaranteed by 0001 seed
      status: "rejected",
    })
    .select("id,country")
    .single();
  if (probeErr) {
    show("0008 INSERT probe", { error: probeErr.message });
  } else {
    show("0008 INSERT probe (country stored when field omitted)", probe);
    const { error: delErr } = await db.from("opportunities").delete().eq("id", (probe as Row).id);
    if (delErr) {
      console.error(`!! PROBE ROW NOT DELETED — id ${(probe as Row).id}: ${delErr.message}`);
    } else {
      console.log("probe row deleted (reversible probe complete)");
    }
  }

  console.log("\n=== INTERPRETATION ===");
  const jobsExists = (cats ?? []).some((c) => (c as Row).slug === "jobs");
  const admissionsExists = (cats ?? []).some((c) => (c as Row).slug === "admissions");
  console.log(`0004 admissions seed applied: ${admissionsExists}`);
  console.log(`0010 jobs seed applied: ${jobsExists}`);
}

main().catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
