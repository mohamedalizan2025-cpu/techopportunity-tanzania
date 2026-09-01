import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { fetchPage } from "./fetch";
import { extractAllCandidates, extractFeedCandidates } from "./adapters";
import { discoverFeedUrls, roundupInnerCandidates } from "./extract";
import { normalizeCandidate } from "./normalize";
import { isDuplicate, sameUrl } from "./dedupe";
import { validateCandidate } from "./validate";
import { qualifyOpportunity, shouldEnterModerationQueue } from "./qualification";
import { createBoundedDetailAcquirer } from "./detail";
import { loadActiveSources } from "./sources";
import { reconcileDiscoverySummary } from "./summary";
import type { CandidateOpportunity, DiscoverySummary, SourceRunResult } from "./types";

// Category identity comes ONLY from the database. The previous hardcoded
// DEFAULT_CATEGORY_IDS fallback could silently map a slug to the WRONG
// id if seeds drifted, and masked missing seeds; now a slug without a DB
// row is skipped loudly (categorySkipped + warn) instead.
export async function runDiscovery(): Promise<DiscoverySummary> {
  const sources = await loadActiveSources();
  const startedAt = new Date().toISOString();
  const qualificationNow = new Date(startedAt);
  const summary: DiscoverySummary = {
    startedAt,
    finishedAt: null,
    sourcesChecked: sources.length,
    sourcesAttempted: 0,
    sourcesSucceeded: 0,
    sourcesFailed: 0,
    candidatesFound: 0,
    noiseRejected: 0,
    structurallyValidCandidates: 0,
    deduplicatedCandidates: 0,
    validCandidates: 0,
    insertedPending: 0,
    duplicatesSkipped: 0,
    categorySkipped: 0,
    relevanceRejected: 0,
    eligibilityRejected: 0,
    eligibilityUnknown: 0,
    detailFetches: 0,
    detailSucceeded: 0,
    detailFailures: 0,
    detailDeadlineFound: 0,
    detailEligibilityFound: 0,
    detailApplicationFound: 0,
    sourceHealthFailures: 0,
    errors: 0,
    perSource: [],
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
    const detailAcquirer = createBoundedDetailAcquirer(source);
    // Structured per-source result: lets operators distinguish success-zero
    // from fetch failure, extraction failure, noise rejection and DB failure
    // after the run, from the JSON run summary alone.
    const sourceResult: SourceRunResult = {
      sourceId: source.id,
      name: source.name,
      ok: false,
      candidatesFound: 0,
      noiseRejected: 0,
      structurallyValidCandidates: 0,
      relevanceRejected: 0,
      eligibilityRejected: 0,
      eligibilityUnknown: 0,
      detailFetches: 0,
      detailSucceeded: 0,
      detailFailures: 0,
      detailDeadlineFound: 0,
      detailEligibilityFound: 0,
      detailApplicationFound: 0,
      duplicatesSkipped: 0,
      deduplicatedCandidates: 0,
      validCandidates: 0,
      categorySkipped: 0,
      insertedPending: 0,
      sourceHealthUpdated: false,
      sourceHealthError: null,
      error: null,
    };
    try {
      const html = await fetchPage(source.base_url);
      // Source page: every registered evidence adapter runs; each is
      // content-sniffing and yields zero candidates on foreign formats.
      const rawCandidates = extractAllCandidates(html, source.id, source.base_url);

      // Advertised feeds (link rel=alternate only, capped at 2 per source)
      // carry item-level title/link/description evidence the homepage HTML
      // lacks. Each feed fetch is failure-isolated like a source.
      const feedUrls = discoverFeedUrls(html, source.base_url).slice(0, 2);
      for (const feedUrl of feedUrls) {
        try {
          const feedBody = await fetchPage(feedUrl);
          rawCandidates.push(...extractFeedCandidates(feedBody, source.id, feedUrl));
        } catch (feedError) {
          const message = feedError instanceof Error ? feedError.message : "feed fetch failed";
          console.error(`[${source.name}] feed fetch failed ${feedUrl}: ${message}`);
        }
      }

      sourceResult.candidatesFound = rawCandidates.length;

      // One-hop roundup expansion (one-row-one-opportunity invariant): a
      // roundup parent's page is fetched ONCE; its explicit opportunity
      // links become individual candidates. The parent is suppressed only
      // when at least one inner candidate survives validation AND dedupe
      // below; otherwise the parent is kept, so multi-opportunity content
      // is never silently lost. Bounded: max 5 roundup fetches per source,
      // failure-isolated.
      const expanded: typeof rawCandidates = [];
      const suppressedRoundupUrls = new Set<string>();
      let roundupFetches = 0;
      for (const cand of rawCandidates) {
        if (cand.roundup !== "true" || typeof cand.url !== "string" || roundupFetches >= 5) {
          expanded.push(cand);
          continue;
        }
        try {
          roundupFetches += 1;
          const pageHtml = await fetchPage(cand.url);
          const inner = roundupInnerCandidates(pageHtml, {
            title: cand.title ?? "",
            url: cand.url,
            sourceId: cand.sourceId ?? source.id,
            discoveryMethod: cand.discoveryMethod,
          });
          if (inner.length > 0) {
            expanded.push(...inner);
            suppressedRoundupUrls.add(cand.url);
            console.log(`[${source.name}] roundup expanded: ${inner.length} opportunities from ${cand.url}`);
          } else {
            // Decomposition found nothing reliable: the parent stays
            // pending for the human moderator instead of being discarded.
            expanded.push(cand);
          }
        } catch (roundupError) {
          const message = roundupError instanceof Error ? roundupError.message : "roundup fetch failed";
          console.error(`[${source.name}] roundup fetch failed ${cand.url}: ${message}`);
          expanded.push(cand);
        }
      }

      const rowsToInsert: Record<string, unknown>[] = [];
      // Parallel to rowsToInsert: the evidence URL of each surviving row.
      // Kept out of the insert payload (not a DB column) but needed to
      // decide roundup parent suppression by EVIDENCE, not by shared
      // source-registry URLs.
      const insertedEvidenceUrls: string[] = [];

      for (const raw of expanded) {
        // Roundup parent suppression is decided here, AFTER validation and
        // dedupe of inner candidates have had their chance: a parent is
        // dropped only when a child it testified about actually survives
        // to insertion. Suppression matches on the CHILD'S evidence URL
        // (the parent page), never on shared source registry URLs, so no
        // legitimate sibling candidate can be lost. Preserves the
        // one-row-one-opportunity invariant without silent data loss.
        if (
          raw.referenceKind !== "evidence-document" &&
          suppressedRoundupUrls.has(raw.url as string)
        ) {
          const innerSurvived = insertedEvidenceUrls.some((u) =>
            sameUrl(u, raw.url as string)
          );
          if (innerSurvived) continue;
        }

        const normalizedCandidate = normalizeCandidate(raw, source.id);
        if (!normalizedCandidate) {
          sourceResult.noiseRejected += 1;
          continue;
        }
        const candidate = await detailAcquirer.enrich(normalizedCandidate);
        if (!validateCandidate(candidate)) {
          sourceResult.noiseRejected += 1;
          continue;
        }
        sourceResult.structurallyValidCandidates += 1;

        const qualification = qualifyOpportunity(candidate, qualificationNow, {
          sourceType: source.source_type,
        });
        if (!shouldEnterModerationQueue(qualification)) {
          if (qualification.relevance === "not_relevant") {
            sourceResult.relevanceRejected += 1;
          } else {
            sourceResult.eligibilityRejected += 1;
          }
          console.log(
            `[${source.name}] qualification rejected '${candidate.title.slice(0, 70)}' — ` +
              (qualification.relevanceEvidence ?? qualification.eligibilityEvidence ?? "explicit rule")
          );
          continue;
        }
        if (qualification.tanzaniaAccessibility === "unknown") {
          sourceResult.eligibilityUnknown += 1;
        }

        if (isDuplicate(candidate, existingRows)) {
          sourceResult.duplicatesSkipped += 1;
          continue;
        }

        const alreadySeenInBatch = rowsToInsert.some((row) => row.url === candidate.url && sameUrl(row.url as string, candidate.url));
        if (alreadySeenInBatch) {
          sourceResult.duplicatesSkipped += 1;
          continue;
        }

        sourceResult.deduplicatedCandidates += 1;

        const categoryId = resolveCategoryId(candidate.category, categoryIdMap);
        if (categoryId === null) {
          // Unknown category slug (e.g. a newly added category whose seed row
          // has not been applied yet). Skip the candidate instead of failing
          // the source; the next run after the seed row exists will capture it.
          sourceResult.categorySkipped += 1;
          console.warn(
            `[${source.name}] Skipping candidate '${candidate.title.slice(0, 50)}' — unknown category '${candidate.category}' (missing category seed?)`
          );
          continue;
        }

        sourceResult.validCandidates += 1;
        const row = buildPendingRow(candidate, categoryId);
        rowsToInsert.push(row);
        insertedEvidenceUrls.push(candidate.evidenceUrl ?? candidate.url);
        existingRows.push({ id: "", url: candidate.url, source_id: candidate.sourceId, title: candidate.title, deadline: candidate.deadline });
      }

      if (rowsToInsert.length > 0) {
        const { error } = await anonClient.from("opportunities").insert(rowsToInsert);
        if (error) {
          throw new Error(`Insert failed for ${source.name}: ${error.message}`);
        }
        sourceResult.insertedPending = rowsToInsert.length;
      }

      sourceResult.ok = true;
      sourceResult.sourceHealthError = await recordSourceResult(serviceClient, source.id, true);
      sourceResult.sourceHealthUpdated = sourceResult.sourceHealthError === null;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown discovery error";
      sourceResult.error = message;
      console.error(`[${source.name}] ${message}`);
      sourceResult.sourceHealthError = await recordSourceResult(serviceClient, source.id, false, message);
      sourceResult.sourceHealthUpdated = sourceResult.sourceHealthError === null;
    } finally {
      const detail = detailAcquirer.metrics();
      sourceResult.detailFetches = detail.fetches;
      sourceResult.detailSucceeded = detail.succeeded;
      sourceResult.detailFailures = detail.failures;
      sourceResult.detailDeadlineFound = detail.deadlineFound;
      sourceResult.detailEligibilityFound = detail.eligibilityFound;
      sourceResult.detailApplicationFound = detail.applicationFound;
      summary.perSource.push(sourceResult);
    }
  }

  summary.finishedAt = new Date().toISOString();
  return reconcileDiscoverySummary(summary);
}

async function loadCategoryIdMap(client: SupabaseClient): Promise<Record<string, number>> {
  const { data, error } = await client.from("categories").select("id,slug");
  if (error || !data || data.length === 0) {
    // Fail loudly: with no trustworthy slug→id map every candidate is
    // skipped and counted as categorySkipped rather than inserted against
    // guessed ids.
    console.error(
      `Failed to load category map (${error?.message ?? "empty table"}) — candidates will be skipped until the categories table is reachable`
    );
    return {};
  }
  const map: Record<string, number> = {};
  for (const row of data as Array<{ id: number; slug: string }>) {
    map[row.slug] = row.id;
  }
  return map;
}

// Dedupe loads EVERY opportunity row. PostgREST silently caps un-ranged
// selects at 1,000 rows, which would silently break dedupe once the table
// passes that mark — so the load paginates explicitly until a short page
// proves the table is exhausted. Scale guard: at DEDUPE_MAX_PAGES the
// table has reached the documented trigger for DB-side dedupe (§12.6).
const DEDUPE_PAGE_SIZE = 1000;
const DEDUPE_MAX_PAGES = 100;

async function loadExistingRows(client: SupabaseClient) {
  type DedupeRow = { id: string; url: string | null; source_id: string | null; title: string | null; deadline: string | null };
  const rows: DedupeRow[] = [];
  for (let page = 0; page < DEDUPE_MAX_PAGES; page += 1) {
    const from = page * DEDUPE_PAGE_SIZE;
    const { data, error } = await client
      .from("opportunities")
      .select("id, url, source_id, title, deadline")
      .order("id", { ascending: true })
      .range(from, from + DEDUPE_PAGE_SIZE - 1);
    if (error) {
      throw new Error(`Failed to load opportunities for dedupe: ${error.message}`);
    }
    const batch = (data ?? []) as DedupeRow[];
    rows.push(...batch);
    if (batch.length < DEDUPE_PAGE_SIZE) return rows;
  }
  console.warn(
    `Dedupe row load hit the ${DEDUPE_MAX_PAGES * DEDUPE_PAGE_SIZE}-row scale guard — switch to DB-side dedupe (architecture.md §12.6)`
  );
  return rows;
}

async function recordSourceResult(
  client: SupabaseClient,
  sourceId: string,
  success: boolean,
  errorMessage?: string
): Promise<string | null> {
  const now = new Date().toISOString();
  const update = success
    ? { last_checked_at: now, last_success_at: now, last_error: null }
    : { last_checked_at: now, last_error: errorMessage ?? null };
  const { error } = await client.from("opportunity_sources").update(update).eq("id", sourceId);
  if (error) {
    console.error(`Failed to update source health for ${sourceId}: ${error.message}`);
    return error.message;
  }
  return null;
}

function buildPendingRow(candidate: CandidateOpportunity, categoryId: number) {
  const row: Record<string, unknown> = {
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
    submitted_by: null,
  };
  // Country is written ONLY with extracted evidence. Without evidence the
  // field is omitted entirely: until migration 0008 (owner-gated) makes
  // the column nullable, the DB default applies to the omitted field; after
  // it, the row honestly carries NULL. The pipeline itself never decides.
  if (candidate.country !== null) {
    row.country = candidate.country;
  }
  return row;
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
  return map[category] ?? null;
}
