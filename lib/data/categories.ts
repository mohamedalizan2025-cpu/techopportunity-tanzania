import type { OpportunityCategory } from "../types";
import { OPPORTUNITY_CATEGORIES } from "../types";
import { categoryLabel } from "../category-labels";
import { createSupabaseServerClient } from "./supabase-client";

export interface LiveCategory {
  slug: OpportunityCategory;
  label: string;
}

export interface CategoryRow {
  slug: string;
  label: string | null;
}

/**
 * Pure mapping from raw taxonomy rows to the live public category list.
 *
 * The application taxonomy (OPPORTUNITY_CATEGORIES) is the contract for
 * slugs/URLs; the LIVE table decides which of those slugs currently exist.
 * Slugs with no seeded row are never surfaced — the UI must not claim a
 * category exists when its live seed is absent. When owner migrations
 * 0004/0010 are eventually applied, admissions/jobs appear here
 * automatically through this same mechanism — no frontend change needed.
 */
export function mapLiveCategories(rows: CategoryRow[]): LiveCategory[] {
  return rows
    .filter((row): row is CategoryRow & { slug: OpportunityCategory } =>
      (OPPORTUNITY_CATEGORIES as readonly string[]).includes(row.slug)
    )
    .map((row) => ({
      slug: row.slug,
      label:
        row.label && row.label.trim() !== ""
          ? row.label.trim()
          : categoryLabel(row.slug),
    }));
}

/**
 * Live taxonomy for the public UI. The categories table is world-readable
 * (RLS select for anon), so this stays on the same anon server client as
 * every other public query — read-only, no new access path.
 */
export async function listLiveCategories(): Promise<LiveCategory[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("slug,label")
    .order("id", { ascending: true });

  if (error) {
    console.error("[lib/data] Failed to list categories:", error.message);
    return [];
  }

  return mapLiveCategories((data ?? []) as unknown as CategoryRow[]);
}
