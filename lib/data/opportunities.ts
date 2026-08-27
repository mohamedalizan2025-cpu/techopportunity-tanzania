import type {
  Opportunity,
  OpportunityCategory,
  OpportunityStatus,
} from "../types";
import { createSupabaseServerClient } from "./supabase-client";

export type OpportunitySort = "deadline" | "newest";

export interface OpportunityQuery {
  category?: OpportunityCategory | null;
  sort?: OpportunitySort;
  q?: string | null;
}

export interface OpportunityRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  url: string;
  deadline: string | null;
  venue_name: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  created_at: string;
  category: { slug: string } | null;
  organization: { name: string } | null;
  discovered_at: string | null;
  discovery_method: string | null;
  source: { name: string } | null;
}

const OPPORTUNITY_SELECT = `
  id,
  slug,
  title,
  description,
  url,
  deadline,
  venue_name,
  address,
  city,
  region,
  country,
  latitude,
  longitude,
  image_url,
  created_at,
  category:categories ( slug ),
  organization:organizations ( name ),
  discovered_at,
  discovery_method,
  source:opportunity_sources ( name )
`;

export { OPPORTUNITY_SELECT };

const OPPORTUNITY_SELECT_CATEGORY_INNER = `
  id,
  slug,
  title,
  description,
  url,
  deadline,
  venue_name,
  address,
  city,
  region,
  country,
  latitude,
  longitude,
  image_url,
  created_at,
  category:categories!inner ( slug ),
  organization:organizations ( name ),
  discovered_at,
  discovery_method,
  source:opportunity_sources ( name )
`;

export function mapOpportunityRow(
  row: OpportunityRow,
  status: OpportunityStatus
): Opportunity {
  const hasLocation =
    row.venue_name !== null ||
    row.address !== null ||
    row.city !== null ||
    row.region !== null ||
    row.latitude !== null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: (row.category?.slug ?? "other") as OpportunityCategory,
    organization: row.organization?.name ?? null,
    sourceName: row.source?.name ?? null,
    discoveredAt: row.discovered_at,
    discoveryMethod: row.discovery_method,
    description: row.description,
    url: row.url,
    deadline: row.deadline,
    location: hasLocation
      ? {
          venueName: row.venue_name,
          address: row.address,
          city: row.city,
          region: row.region,
          country: row.country,
          latitude: row.latitude,
          longitude: row.longitude,
        }
      : null,
    imageUrl: row.image_url,
    status,
    createdAt: row.created_at,
  };
}

export function mapRowToOpportunity(row: OpportunityRow): Opportunity {
  return mapOpportunityRow(row, "published");
}

/**
 * Normalizes free-text search input into a safe ilike fragment.
 * Strips control characters and every character that participates in
 * PostgREST `or=` grammar, so the composed predicate can never escape
 * its column=value slots.
 */
export function sanitizeSearchQuery(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[,%()'"*\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return cleaned.length >= 2 ? cleaned : null;
}

function buildSearchFilter(q: string): string {
  return [
    `title.ilike.%${q}%`,
    `description.ilike.%${q}%`,
    `city.ilike.%${q}%`,
    `region.ilike.%${q}%`,
  ].join(",");
}

export async function listPublishedOpportunities(
  query?: OpportunityQuery
): Promise<Opportunity[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  let request = supabase
    .from("opportunities")
    .select(
      query?.category ? OPPORTUNITY_SELECT_CATEGORY_INNER : OPPORTUNITY_SELECT
    )
    .eq("status", "published");

  if (query?.category) {
    request = request.eq("category.slug", query.category);
  }

  const q = sanitizeSearchQuery(query?.q);
  if (q) {
    request = request.or(buildSearchFilter(q));
  }

  if (query?.sort === "newest") {
    request = request.order("created_at", { ascending: false });
  } else {
    request = request
      .order("deadline", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
  }

  const { data, error } = await request;

  if (error) {
    console.error("[lib/data] Failed to list opportunities:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as OpportunityRow[]).map(mapRowToOpportunity);
}

export async function listOrganizationOptions(): Promise<
  { id: string; name: string }[]
> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("organizations")
    .select("id,name")
    .order("name", { ascending: true });

  if (error) {
    console.error("[lib/data] Failed to list organizations:", error.message);
    return [];
  }

  return (data ?? []) as unknown as { id: string; name: string }[];
}

export async function getOpportunityBySlug(
  slug: string
): Promise<Opportunity | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("opportunities")
    .select(OPPORTUNITY_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[lib/data] Failed to fetch opportunity:", error.message);
    return null;
  }

  return data
    ? mapRowToOpportunity(data as unknown as OpportunityRow)
    : null;
}
