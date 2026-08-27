import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { fetchPage } from "./fetch";
import {
  discoverFeedUrls,
  extractCandidatesFromAtom,
  extractCandidatesFromHtml,
  extractCandidatesFromJsonLd,
  extractCandidatesFromRss,
  extractOpportunityLinks,
} from "./extract";
import { normalizeCandidate } from "./normalize";
import { isDuplicate, sameUrl } from "./dedupe";
import { validateCandidate } from "./validate";
import { loadActiveSources } from "./sources";
import type { CandidateOpportunity, DiscoverySummary } from "./types";

const DEFAULT_CATEGORY_IDS: Record<string, number> = {
  hackathon: 1,
  competition: 2,
  scholarship: 3,
  conference: 4,
  workshop: 5,
  internship: 6,
  fellowship: 7,
  grant: 8,
  "tech-event": 9,
  other: 10,
};

export async function runDiscovery(): Promise<DiscoverySummary> {
  const sources = await loadActiveSources();
  const summary: DiscoverySummary = {
    sourcesChecked: sources.length,
    sourcesSucceeded: 0,
    candidatesFound: 0,
    validCandidates: 0,
    insertedPending: 0,
    duplicatesSkipped: 0,
    errors: 0,
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY in environment");
  }

  const anonClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const serviceClient = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const categoryIdMap = await loadCategoryIdMap(serviceClient);
  const existingRows = await loadExistingRows(serviceClient);

  for (const source of sources) {
    try {
      const html = await fetchPage(source.base_url);
      const rawCandidates = [
        ...extractCandidatesFromRss(html, source.id, source.base_url),
        ...extractCandidatesFromJsonLd(html, source.id, source.base_url),
        ...extractCandidatesFromAtom(html, source.id, source.base_url),
        ...extractCandidatesFromHtml(html, source.id, source.base_url),
      ];

      // Advertised feeds (link rel=alternate only, capped at 2 per source)
      // carry item-level title/link/description evidence the homepage HTML
      // lacks. Each feed fetch is failure-isolated like a source.
      const feedUrls = discoverFeedUrls(html, source.base_url).slice(0, 2);
      for (const feedUrl of feedUrls) {
        try {
          const feedBody = await fetchPage(feedUrl);
          rawCandidates.push(
            ...extractCandidatesFromRss(feedBody, source.id, feedUrl),
            ...extractCandidatesFromAtom(feedBody, source.id, feedUrl)
          );
        } catch (feedError) {
          const message = feedError instanceof Error ? feedError.message : "feed fetch failed";
          console.error(`[${source.name}] feed fetch failed ${feedUrl}: ${message}`);
        }
      }

      summary.candidatesFound += rawCandidates.length;

      // One-hop roundup expansion: candidates whose title advertises multiple
      // opportunities get their page fetched ONCE; explicit opportunity-text
      // links become individual candidates (one row = one opportunity). The
      // roundup parent is suppressed only when at least one inner candidate
      // survives; otherwise the parent is kept, so nothing is ever lost.
      // Bounded: max 5 roundup fetches per source, failure-isolated.
      const expanded: typeof rawCandidates = [];
      let roundupFetches = 0;
      for (const cand of rawCandidates) {
        if (cand.roundup !== "true" || typeof cand.url !== "string" || roundupFetches >= 5) {
          expanded.push(cand);
          continue;
        }
        try {
          roundupFetches += 1;
          const pageHtml = await fetchPage(cand.url);
          const inner = extractOpportunityLinks(pageHtml, cand.url);
          if (inner.length > 0) {
            for (const link of inner) {
              expanded.push({
                title: link.title,
                url: link.url,
                description: `Listed in: ${cand.title}`,
                sourceId: cand.sourceId,
                sourceUrl: cand.url,
                discoveryMethod: cand.discoveryMethod,
              });
            }
            console.log(`[${source.name}] roundup expanded: ${inner.length} opportunities from ${cand.url}`);
          } else {
            expanded.push(cand);
          }
        } catch (roundupError) {
          const message = roundupError instanceof Error ? roundupError.message : "roundup fetch failed";
          console.error(`[${source.name}] roundup fetch failed ${cand.url}: ${message}`);
          expanded.push(cand);
        }
      }

      const rowsToInsert: Record<string, unknown>[] = [];

      for (const raw of expanded) {
        const candidate = normalizeCandidate(raw, source.id);
        if (!candidate || !validateCandidate(candidate)) continue;

        if (isDuplicate(candidate, existingRows)) {
          summary.duplicatesSkipped += 1;
          continue;
        }

        const alreadySeenInBatch = rowsToInsert.some((row) => row.url === candidate.url && sameUrl(row.url as string, candidate.url));
        if (alreadySeenInBatch) {
          summary.duplicatesSkipped += 1;
          continue;
        }

        const categoryId = resolveCategoryId(candidate.category, categoryIdMap);
        if (categoryId === null) {
          // Unknown category slug (e.g. a newly added category whose seed row
          // has not been applied yet). Skip the candidate instead of failing
          // the source; the next run after the seed row exists will capture it.
          console.warn(
            `[${source.name}] Skipping candidate '${candidate.title.slice(0, 50)}' — unknown category '${candidate.category}' (missing category seed?)`
          );
          continue;
        }

        const row = buildPendingRow(candidate, categoryId);
        rowsToInsert.push(row);
        existingRows.push({ id: "", url: candidate.url, source_id: candidate.sourceId, title: candidate.title, deadline: candidate.deadline });
      }

      summary.validCandidates += rowsToInsert.length;

      if (rowsToInsert.length > 0) {
        const { error } = await anonClient.from("opportunities").insert(rowsToInsert);
        if (error) {
          throw new Error(`Insert failed for ${source.name}: ${error.message}`);
        }
        summary.insertedPending += rowsToInsert.length;
      }

      summary.sourcesSucceeded += 1;
      await recordSourceResult(serviceClient, source.id, true);
    } catch (error) {
      summary.errors += 1;
      const message = error instanceof Error ? error.message : "Unknown discovery error";
      console.error(`[${source.name}] ${message}`);
      await recordSourceResult(serviceClient, source.id, false, message);
    }
  }

  return summary;
}

async function loadCategoryIdMap(client: SupabaseClient): Promise<Record<string, number>> {
  const { data, error } = await client.from("categories").select("id,slug");
  if (error || !data || data.length === 0) {
    return DEFAULT_CATEGORY_IDS;
  }
  const map: Record<string, number> = {};
  for (const row of data as Array<{ id: number; slug: string }>) {
    map[row.slug] = row.id;
  }
  return map;
}

async function loadExistingRows(client: SupabaseClient) {
  const { data, error } = await client.from("opportunities").select("id, url, source_id, title, deadline");
  if (error) {
    throw new Error(`Failed to load opportunities for dedupe: ${error.message}`);
  }
  return (data ?? []) as Array<{ id: string; url: string | null; source_id: string | null; title: string | null; deadline: string | null }>;
}

async function recordSourceResult(
  client: SupabaseClient,
  sourceId: string,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  const now = new Date().toISOString();
  const update = success
    ? { last_checked_at: now, last_success_at: now, last_error: null }
    : { last_checked_at: now, last_error: errorMessage ?? null };
  const { error } = await client.from("opportunity_sources").update(update).eq("id", sourceId);
  if (error) {
    console.error(`Failed to update source health for ${sourceId}: ${error.message}`);
  }
}

function buildPendingRow(candidate: CandidateOpportunity, categoryId: number) {
  return {
    slug: createSlug(candidate.title),
    title: candidate.title,
    description: candidate.description,
    category_id: categoryId,
    organization_id: null,
    url: candidate.url,
    source_url: candidate.sourceUrl,
    source_id: candidate.sourceId,
    discovered_at: new Date().toISOString(),
    discovery_method: candidate.discoveryMethod,
    deadline: candidate.deadline,
    status: "pending",
    venue_name: candidate.venueName,
    address: candidate.address,
    city: candidate.city,
    region: candidate.region,
    country: candidate.country,
    submitted_by: null,
  };
}

function createSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return `${base || "opportunity"}-${Math.random().toString(36).slice(2, 10)}`;
}

function resolveCategoryId(category: string, map: Record<string, number>): number | null {
  return map[category] ?? DEFAULT_CATEGORY_IDS[category] ?? null;
}
