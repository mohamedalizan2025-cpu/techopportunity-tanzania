import type {
  Opportunity,
  OpportunityCategory,
  OpportunityStatus,
} from "../types";
import { createSupabaseServerClient } from "./supabase-client";

export type OpportunitySort = "deadline" | "newest";

export type DeadlineFilter = "soon" | "upcoming" | "rolling";

export interface OpportunityQuery {
  category?: OpportunityCategory | null;
  sort?: OpportunitySort;
  q?: string | null;
  city?: string | null;
  region?: string | null;
  deadline?: DeadlineFilter | null;
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
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  created_at: string;
  category: { slug: string } | null;
  organization: { id: string; name: string } | null;
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
  organization:organizations ( id, name ),
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
  organization:organizations ( id, name ),
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
    organizationId: row.organization?.id ?? null,
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
    .replace(/[,%()'"*\\;]/g, " ")
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

/** Frees filter values of PostgREST grammar characters; used for city/region. */
export function sanitizeFilterValue(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[,%()'"*\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return cleaned.length >= 2 ? cleaned : null;
}

export function parseDeadlineFilter(raw: string | null | undefined): DeadlineFilter | null {
  return raw === "soon" || raw === "upcoming" || raw === "rolling"
    ? (raw as DeadlineFilter)
    : null;
}

/**
 * Explicit result cap for public listing. PostgREST silently caps
 * un-limited selects at 1,000 rows; declaring our own limit keeps the
 * behavior deliberate (and identical for the browse UI and the assistant,
 * which share this function) instead of accidental. Keyset pagination is
 * the documented next step once the published set outgrows the cap
 * (§12.6).
 */
const PUBLISHED_LIST_LIMIT = 500;

export async function listPublishedOpportunities(
  query?: OpportunityQuery,
  limit: number = PUBLISHED_LIST_LIMIT
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

  const city = sanitizeFilterValue(query?.city);
  if (city) {
    // Case-insensitive exact match: stored values may differ in casing from
    // the canonical taxonomy while naming the same real location.
    request = request.ilike("city", city);
  }

  const region = sanitizeFilterValue(query?.region);
  if (region) {
    request = request.ilike("region", region);
  }

  if (query?.deadline) {
    const now = new Date();
    if (query.deadline === "rolling") {
      request = request.is("deadline", null);
    } else {
      request = request.gt("deadline", now.toISOString());
      if (query.deadline === "soon") {
        const soon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        request = request.lte("deadline", soon.toISOString());
      }
    }
  }

  if (query?.sort === "newest") {
    request = request.order("created_at", { ascending: false });
  } else {
    request = request
      .order("deadline", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
  }

  request = request.limit(Math.max(1, Math.min(limit, PUBLISHED_LIST_LIMIT)));

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

export interface PublishedLocations {
  cities: string[];
  regions: string[];
}

/**
 * Distinct, non-null locations across published opportunities.
 * Deduplicated in memory — appropriate at current scale, no extra
 * database features required. The explicit 1,000-row select is a cap on
 * RAW rows scanned, not on the result: city/region values come from a
 * bounded taxonomy, so distinct coverage saturates long before the cap.
 */
export async function listPublishedLocations(): Promise<PublishedLocations> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { cities: [], regions: [] };

  const { data, error } = await supabase
    .from("opportunities")
    .select("city,region")
    .eq("status", "published")
    .limit(1000);

  if (error) {
    console.error("[lib/data] Failed to list locations:", error.message);
    return { cities: [], regions: [] };
  }

  const cities = new Set<string>();
  const regions = new Set<string>();
  for (const row of (data ?? []) as unknown as Array<{ city: string | null; region: string | null }>) {
    if (row.city && row.city.trim() !== "") cities.add(row.city.trim());
    if (row.region && row.region.trim() !== "") regions.add(row.region.trim());
  }
  return {
    cities: [...cities].sort((a, b) => a.localeCompare(b)).slice(0, 50),
    regions: [...regions].sort((a, b) => a.localeCompare(b)).slice(0, 50),
  };
}

export async function getOpportunityBySlug(
  slug: string
): Promise<Opportunity | null> {  const supabase = createSupabaseServerClient();
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
