import {
  OPPORTUNITY_CATEGORIES,
  type Opportunity,
  type OpportunityCategory,
  type OpportunityStatus,
} from "../types";
import { categoryLabel } from "../category-labels";
import { deriveLifecycleState } from "../lifecycle";
import { evaluateDeadline } from "../deadline-intelligence";
import {
  comparePublicTrust,
  isAiSearchableOpportunity,
  isTestOrPlaceholderOpportunity,
} from "../opportunity-trust";
import type {
  CountryVerification,
  EligibilityDecision,
  RelevanceDecision,
} from "../opportunity-trust";
import { createSupabaseServerClient } from "./supabase-client";

export type OpportunitySort = "deadline" | "newest" | "relevance";

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
  source_url?: string | null;
  deadline: string | null;
  deadline_precision?: "unknown" | "date" | "date_time" | "rolling" | "unspecified";
  deadline_evidence?: string | null;
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
  relevance_decision?: RelevanceDecision;
  relevance_evidence?: string | null;
  eligibility?: EligibilityDecision;
  eligibility_evidence?: string | null;
  qualification_rule_version?: string | null;
  country_verification?: CountryVerification;
  country_evidence?: string | null;
  last_verified_at?: string | null;
  decided_by?: string | null;
  decided_at?: string | null;
  references?: Array<{ url: string; is_canonical: boolean }> | null;
}

const OPPORTUNITY_SELECT = `
  id,
  slug,
  title,
  description,
  url,
  source_url,
  deadline,
  deadline_precision,
  deadline_evidence,
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

const OPPORTUNITY_TRUST_SELECT = `
  relevance_decision,
  relevance_evidence,
  eligibility,
  eligibility_evidence,
  qualification_rule_version,
  country_verification,
  country_evidence,
  last_verified_at,
  decided_by,
  decided_at,
  references:opportunity_references ( url, is_canonical )
`;

export function trustSchemaEnabled(): boolean {
  return process.env.M31_TRUST_SCHEMA_ENABLED === "true";
}

export function opportunitySelect(): string {
  return trustSchemaEnabled()
    ? `${OPPORTUNITY_SELECT},${OPPORTUNITY_TRUST_SELECT}`
    : OPPORTUNITY_SELECT;
}

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
    sourceUrl: row.source_url ?? null,
    discoveredAt: row.discovered_at,
    discoveryMethod: row.discovery_method,
    description: row.description,
    url: row.url,
    deadline: row.deadline,
    deadlinePrecision: row.deadline_precision ?? "unspecified",
    deadlineEvidence: row.deadline_evidence ?? null,
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
    trust: row.relevance_decision
      ? {
          relevanceDecision: row.relevance_decision,
          relevanceEvidence: row.relevance_evidence ?? null,
          eligibilityDecision: row.eligibility ?? "unknown",
          eligibilityEvidence: row.eligibility_evidence ?? null,
          qualificationRuleVersion: row.qualification_rule_version ?? null,
          countryVerification: row.country_verification ?? "unknown",
          countryEvidence: row.country_evidence ?? null,
          lastVerifiedAt: row.last_verified_at ?? null,
          decidedBy: row.decided_by ?? null,
          decidedAt: row.decided_at ?? null,
          canonicalEvidenceUrl:
            row.references?.find((reference) => reference.is_canonical)?.url ?? null,
        }
      : undefined,
  };
}

export function mapRowToOpportunity(row: OpportunityRow): Opportunity {
  return mapOpportunityRow(row, "published");
}

/**
 * Normalizes free-text search input into safe, bounded public URL state.
 * Control and PostgREST grammar characters are removed even though M28's
 * deterministic matcher does not interpolate the query into a DB expression.
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

export function parseOpportunityCategory(
  raw: string | null | undefined
): OpportunityCategory | null {
  return (OPPORTUNITY_CATEGORIES as readonly string[]).includes(raw ?? "")
    ? (raw as OpportunityCategory)
    : null;
}

export function parseOpportunitySort(
  raw: string | null | undefined,
  hasQuery: boolean
): OpportunitySort {
  if (raw === "newest" || raw === "deadline") return raw;
  if (raw === "relevance" && hasQuery) return "relevance";
  return hasQuery ? "relevance" : "deadline";
}

function normalizedWords(value: string | null | undefined): string[] {
  if (!value) return [];
  return (
    value
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLocaleLowerCase("en")
      .match(/[\p{L}\p{N}]+/gu) ?? []
  );
}

function termMatches(term: string, words: string[]): boolean {
  return words.some(
    (word) => word === term || (term.length >= 3 && word.startsWith(term))
  );
}

interface SearchField {
  words: string[];
  phrase: string;
  weight: number;
}

function searchScore(opportunity: Opportunity, query: string): number | null {
  const queryWords = normalizedWords(query).slice(0, 12);
  if (queryWords.length === 0) return null;
  const queryPhrase = queryWords.join(" ");
  const place = [
    opportunity.location?.city,
    opportunity.location?.region,
    opportunity.location?.country,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ");
  const values: Array<[string | null | undefined, number]> = [
    [opportunity.title, 12],
    [categoryLabel(opportunity.category), 10],
    [opportunity.category.replaceAll("-", " "), 10],
    [opportunity.organization, 9],
    [opportunity.sourceName, 6],
    [opportunity.description, 4],
    [place, 3],
  ];
  const fields: SearchField[] = values.map(([value, weight]) => {
    const words = normalizedWords(value);
    return { words, phrase: words.join(" "), weight };
  });

  if (!queryWords.every((term) => fields.some((field) => termMatches(term, field.words)))) {
    return null;
  }

  return fields.reduce((score, field) => {
    const phraseBonus = field.phrase.includes(queryPhrase) ? field.weight * 5 : 0;
    const tokenScore = queryWords.reduce(
      (sum, term) => sum + (termMatches(term, field.words) ? field.weight : 0),
      0
    );
    return score + phraseBonus + tokenScore;
  }, 0);
}

function normalizedDate(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function stableTieBreak(a: Opportunity, b: Opportunity): number {
  return a.title.localeCompare(b.title, "en", { sensitivity: "base" }) ||
    a.id.localeCompare(b.id);
}

function compareNewest(a: Opportunity, b: Opportunity): number {
  return normalizedDate(b.createdAt) - normalizedDate(a.createdAt) || stableTieBreak(a, b);
}

/** Actionable exact deadlines first, unknown deadlines next, passed dates last. */
function compareDeadline(a: Opportunity, b: Opportunity, now: Date): number {
  const stateRank = (opportunity: Opportunity): number => {
    const state = deriveLifecycleState(opportunity.deadline, now);
    if (state === "active") return 0;
    if (state === "expired") return 2;
    return 1;
  };
  const rank = stateRank(a) - stateRank(b);
  if (rank !== 0) return rank;
  if (a.deadline && b.deadline) {
    const direction = stateRank(a) === 2 ? -1 : 1;
    const dateOrder =
      (normalizedDate(a.deadline) - normalizedDate(b.deadline)) * direction;
    if (dateOrder !== 0) return dateOrder;
  }
  return compareNewest(a, b);
}

function sameText(left: string | null | undefined, right: string): boolean {
  return left?.trim().localeCompare(right, "en", { sensitivity: "accent" }) === 0;
}

/**
 * Pure M28 query semantics over a bounded corpus already protected by the
 * published-only database predicate and RLS. The status filter remains here as
 * defence in depth and is explicitly covered by tests.
 */
export function applyPublicOpportunityQuery(
  corpus: Opportunity[],
  query: OpportunityQuery = {},
  now: Date = new Date()
): Opportunity[] {
  const q = sanitizeSearchQuery(query.q);
  const city = sanitizeFilterValue(query.city);
  const region = sanitizeFilterValue(query.region);
  const sort = parseOpportunitySort(query.sort, q !== null);

  const matched = corpus.flatMap((opportunity) => {
    if (opportunity.status !== "published") return [];
    if (isTestOrPlaceholderOpportunity(opportunity)) return [];
    if (query.category && opportunity.category !== query.category) return [];
    if (city && !sameText(opportunity.location?.city, city)) return [];
    if (region && !sameText(opportunity.location?.region, region)) return [];

    if (query.deadline) {
      const state = deriveLifecycleState(opportunity.deadline, now);
      if (query.deadline === "rolling" && opportunity.deadline !== null) return [];
      if (query.deadline === "upcoming" && state !== "active") return [];
      if (query.deadline === "soon") {
        if (
          evaluateDeadline({ deadline: opportunity.deadline }, now).status !==
          "closing_soon"
        ) return [];
      }
    }

    const score = q ? searchScore(opportunity, q) : 0;
    return score === null ? [] : [{ opportunity, score }];
  });

  matched.sort((left, right) => {
    const trustOrder = comparePublicTrust(left.opportunity, right.opportunity, now);
    if (trustOrder !== 0) return trustOrder;
    if (sort === "relevance") {
      return right.score - left.score || compareDeadline(left.opportunity, right.opportunity, now);
    }
    if (sort === "newest") return compareNewest(left.opportunity, right.opportunity);
    return compareDeadline(left.opportunity, right.opportunity, now);
  });
  return matched.map(({ opportunity }) => opportunity);
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

async function fetchPublishedOpportunityCorpus(): Promise<Opportunity[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("opportunities")
    .select(opportunitySelect())
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(PUBLISHED_LIST_LIMIT);

  if (error) {
    console.error("[lib/data] Failed to list opportunities:", error.message);
    return [];
  }
  return ((data ?? []) as unknown as OpportunityRow[]).map(mapRowToOpportunity);
}

export async function listPublishedOpportunities(
  query?: OpportunityQuery,
  limit: number = PUBLISHED_LIST_LIMIT
): Promise<Opportunity[]> {
  const corpus = await fetchPublishedOpportunityCorpus();
  return applyPublicOpportunityQuery(corpus, query).slice(
    0,
    Math.max(1, Math.min(limit, PUBLISHED_LIST_LIMIT))
  );
}

/** Future AI boundary: only fully evidenced rows can enter assistant context. */
export async function listAiSearchableOpportunities(
  query?: OpportunityQuery,
  limit: number = PUBLISHED_LIST_LIMIT
): Promise<Opportunity[]> {
  const corpus = await fetchPublishedOpportunityCorpus();
  return applyPublicOpportunityQuery(corpus, query)
    .filter(isAiSearchableOpportunity)
    .slice(0, Math.max(1, Math.min(limit, PUBLISHED_LIST_LIMIT)));
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

export function derivePublishedLocations(corpus: Opportunity[]): PublishedLocations {
  const cities = new Set<string>();
  const regions = new Set<string>();
  for (const opportunity of corpus) {
    if (opportunity.status !== "published") continue;
    const city = opportunity.location?.city?.trim();
    const region = opportunity.location?.region?.trim();
    if (city) cities.add(city);
    if (region) regions.add(region);
  }
  return {
    cities: [...cities].sort((a, b) => a.localeCompare(b)).slice(0, 50),
    regions: [...regions].sort((a, b) => a.localeCompare(b)).slice(0, 50),
  };
}

export interface PublicBrowseData {
  opportunities: Opportunity[];
  locations: PublishedLocations;
}

/** One published-corpus read supplies both results and location controls. */
export async function getPublicBrowseData(
  query: OpportunityQuery
): Promise<PublicBrowseData> {
  const corpus = await fetchPublishedOpportunityCorpus();
  return {
    opportunities: applyPublicOpportunityQuery(corpus, query),
    locations: derivePublishedLocations(corpus),
  };
}

/**
 * Distinct, non-null locations across published opportunities.
 * Deduplicated in memory — appropriate at current scale, no extra
 * database features required. The explicit 1,000-row select is a cap on
 * RAW rows scanned, not on the result: city/region values come from a
 * bounded taxonomy, so distinct coverage saturates long before the cap.
 */
export async function listPublishedLocations(): Promise<PublishedLocations> {
  return derivePublishedLocations(await fetchPublishedOpportunityCorpus());
}

export async function getOpportunityBySlug(
  slug: string
): Promise<Opportunity | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("opportunities")
    .select(opportunitySelect())
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[lib/data] Failed to fetch opportunity:", error.message);
    return null;
  }

  if (!data) return null;
  const opportunity = mapRowToOpportunity(data as unknown as OpportunityRow);
  return isTestOrPlaceholderOpportunity(opportunity) ? null : opportunity;
}
