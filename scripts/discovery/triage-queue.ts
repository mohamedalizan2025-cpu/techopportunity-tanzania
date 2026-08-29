/**
 * triage-queue.ts — read-only moderation triage helper (Milestone 3, Phase 6).
 *
 * Prints the pending queue ordered by the milestone's priority classes:
 *   1 clearly actionable opportunity (heuristic on title)
 *   2 scholarship / fellowship / grant / internship
 *   3 jobs
 *   4 admissions / programmes
 *   5 hackathon / competition
 *   6 workshop / training / conference / tech-event
 *   7 ambiguous items
 *   8 obvious institutional / news items (heuristic on title)
 *
 * Honesty rules (binding):
 *   - Bucket 1 and 8 are HEURISTIC SIGNALS from title wording only — they are
 *     suggestions, never truth. The moderator remains the final authority.
 *   - This script only reads; it never mutates status, category, or content.
 *   - Rows already carry category = `other` when the pipeline had no seed to
 *     map them into (0004/0010 unapplied) — triage cannot undo that.
 *
 * Usage: npx tsx --env-file=.env.local scripts/discovery/triage-queue.ts
 */
import { createClient } from "@supabase/supabase-js";

interface Row {
  id: string;
  title: string;
  category_id: number | null;
  url: string | null;
  created_at: string;
  source_id: string | null;
}

const ACTION_HINTS =
  /apply|application|call for|invitation|deadline|scholarship|fellowship|grant|internship|vacancy|job|ajira|nafasi za kazi|udahili|stashahada|kujiunga|registration|register|submit|open(ing)?s?\b|opportunity|opportunities|competition|challenge|hackathon|bootcamp|award|fund(ing)?\b/i;

const NEWS_HINTS =
  /^(latest|breaking)?\s*news\b|^(our )?(latest )?updates?\b|welcome note|press release|^about (us|the)|^(annual |quarterly )?report|statement (by|from|on)|^(the )?minister|^waziri|akagua|akifafanua|asema|asisitiza|kongamano la uzinduzi|photo gallery|^gallery\b|obituary|condolence/i;

function bucketOf(row: Row, slugById: Map<number, string>): number {
  switch (row.category_id === null ? null : slugById.get(row.category_id) ?? null) {
    case "scholarship":
    case "fellowship":
    case "grant":
    case "internship":
      return 2;
    case "jobs":
      return 3;
    case "admissions":
      return 4;
    case "hackathon":
    case "competition":
      return 5;
    case "workshop":
    case "conference":
    case "tech-event":
      return 6;
    default:
      break;
  }
  // category `other` (or unexpected): fall back to title signals.
  if (NEWS_HINTS.test(row.title)) return 8;
  if (ACTION_HINTS.test(row.title)) return 1;
  return 7;
}

const BUCKET_LABEL: Record<number, string> = {
  1: "actionable-looking (HEURISTIC, verify)",
  2: "scholarship/fellowship/grant/internship",
  3: "jobs",
  4: "admissions/programmes",
  5: "hackathon/competition",
  6: "workshop/conference/tech-event",
  7: "ambiguous",
  8: "institutional/news-looking (HEURISTIC, verify)",
};

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const db = createClient(url, key, { auth: { persistSession: false } });

  // Paginated full read of the pending queue (read-only).
  const rows: Row[] = [];
  const PAGE = 500;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("opportunities")
      .select("id,title,category_id,url,created_at,source_id")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("queue read failed:", error.message);
      process.exit(1);
    }
    rows.push(...((data ?? []) as unknown as Row[]));
    if (!data || data.length < PAGE) break;
  }

  // Source names for context (read-only).
  const { data: sources } = await db
    .from("opportunity_sources")
    .select("id,name");
  const nameById = new Map<string, string>(
    (sources ?? []).map((s) => [s.id as string, s.name as string])
  );

  // Category slugs by id (read-only).
  const { data: categories } = await db.from("categories").select("id,slug");
  const slugById = new Map<number, string>(
    (categories ?? []).map((c) => [c.id as number, c.slug as string])
  );

  const buckets = new Map<number, Row[]>();
  for (const row of rows) {
    const b = bucketOf(row, slugById);
    if (!buckets.has(b)) buckets.set(b, []);
    buckets.get(b)!.push(row);
  }

  console.log(`pending queue: ${rows.length} rows (oldest first inside each bucket)`);
  console.log("buckets 1 and 8 are heuristic signals, NOT truth; moderator decides.\n");
  for (const b of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const list = buckets.get(b) ?? [];
    console.log(`--- bucket ${b}: ${BUCKET_LABEL[b]} (${list.length}) ---`);
    for (const row of list) {
      const source = row.source_id ? nameById.get(row.source_id) ?? "?" : "manual";
      console.log(`  [${row.created_at.slice(0, 10)}] ${row.title}  (${source})  ${row.url ?? ""}`);
    }
  }
}

main();
