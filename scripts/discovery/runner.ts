import { createClient } from "@supabase/supabase-js";
import { fetchPage } from "./fetch";
import { extractCandidatesFromHtml, extractCandidatesFromJsonLd, extractCandidatesFromRss } from "./extract";
import { normalizeCandidate } from "./normalize";
import { isDuplicate } from "./dedupe";
import { validateCandidate } from "./validate";
import { loadActiveSources } from "./sources";
import type { CandidateOpportunity, DiscoverySummary } from "./types";

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
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment");
  }

  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const allExisting = await supabase.from("opportunities").select("id, url, source_id, title, deadline");
  if (allExisting.error) {
    throw new Error(`Failed to load opportunities for dedupe: ${allExisting.error.message}`);
  }

  const existingRows = (allExisting.data ?? []) as Array<{ id: string; url: string | null; source_id: string | null; title: string | null; deadline: string | null }>;

  for (const source of sources) {
    try {
      const html = await fetchPage(source.base_url);
      const rawCandidates = [
        ...extractCandidatesFromRss(html, source.id, source.base_url),
        ...extractCandidatesFromJsonLd(html, source.id, source.base_url),
        ...extractCandidatesFromHtml(html, source.id, source.base_url),
      ];

      summary.candidatesFound += rawCandidates.length;

      const normalized = rawCandidates
        .map((candidate) => normalizeCandidate(candidate, source.id))
        .filter((candidate): candidate is CandidateOpportunity => Boolean(candidate));

      const realCandidates = normalized.filter((candidate) => {
        const valid = validateCandidate(candidate);
        if (!valid) return false;
        const duplicate = isDuplicate(candidate, existingRows);
        if (duplicate) {
          summary.duplicatesSkipped += 1;
          return false;
        }
        return true;
      });

      summary.validCandidates += realCandidates.length;

      if (realCandidates.length > 0) {
        const rows = realCandidates.map((candidate) => ({
          slug: createSlug(candidate.title),
          title: candidate.title,
          description: candidate.description,
          category_id: resolveCategoryId(candidate.category),
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
        }));

        const { error } = await supabase.from("opportunities").insert(rows);
        if (error) {
          throw new Error(`Insert failed for ${source.name}: ${error.message}`);
        }

        summary.insertedPending += rows.length;
      }

      summary.sourcesSucceeded += 1;
      await supabase.from("opportunity_sources").update({
        last_checked_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        last_error: null,
      }).eq("id", source.id);
    } catch (error) {
      summary.errors += 1;
      const message = error instanceof Error ? error.message : "Unknown discovery error";
      await supabase.from("opportunity_sources").update({
        last_checked_at: new Date().toISOString(),
        last_error: message,
      }).eq("id", source.id);
    }
  }

  return summary;
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

function resolveCategoryId(category: string): number {
  const map: Record<string, number> = {
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

  return map[category] ?? 10;
}
