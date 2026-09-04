import type { CandidateOpportunity } from "./types";

export interface DedupeRow {
  url: string | null;
  source_id?: string | null;
  sourceId?: string | null;
  title: string | null;
  deadline: string | null;
}

const TRACKING_QUERY_KEYS = /^(?:utm_.+|fbclid|gclid|mc_cid|mc_eid)$/i;
const TITLE_STOP_WORDS = new Set([
  "a", "an", "and", "at", "for", "in", "of", "program", "programme",
  "the", "to",
]);

export function canonicalOpportunityUrl(value: string): string {
  try {
    const parsed = new URL(value.trim());
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (TRACKING_QUERY_KEYS.test(key)) parsed.searchParams.delete(key);
    }
    parsed.searchParams.sort();
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return value.trim();
  }
}

function years(value: string): Set<string> {
  return new Set(value.match(/\b20\d{2}\b/g) ?? []);
}

function coreTitleTokens(value: string): string[] {
  const withoutContext = value
    .replace(/\([^)]*\bfully funded\b[^)]*\)/gi, " ")
    .replace(/\bfor study in\b[\s\S]*$/i, " ")
    // Measured cross-source variation: one aggregator appends a trailing
    // audience gloss after the cohort year while another keeps the canonical
    // programme title. This is deliberately narrow, not general fuzzy merge.
    .replace(/\bfor\s+(?:young\s+)?(?:west\s+)?african\s+(?:graduates?|professionals?|students?|youth)\b[\s\S]*$/i, " ");
  return [...new Set(withoutContext
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b20\d{2}(?:\s*[-/]\s*20\d{2})?\b/g, " ")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !TITLE_STOP_WORDS.has(token)))]
    .sort();
}

/**
 * Conservative cross-source identity: exact equality of a substantial,
 * order-independent core title plus at least one shared cohort year. It
 * intentionally refuses fuzzy/partial matches for moderator review.
 */
export function sameOpportunityTitle(a: string, b: string): boolean {
  const sharedYear = [...years(a)].some((year) => years(b).has(year));
  if (!sharedYear) return false;
  const aTokens = coreTitleTokens(a);
  const bTokens = coreTitleTokens(b);
  return aTokens.length >= 5
    && aTokens.length === bTokens.length
    && aTokens.every((token, index) => token === bTokens[index]);
}

export function isDuplicate(
  candidate: CandidateOpportunity,
  existing: DedupeRow[]
): boolean {
  const canonicalUrl = candidate.url.trim();

  return existing.some((row) => {
    const rowSourceId = row.sourceId ?? row.source_id ?? null;

    if (row.url && canonicalOpportunityUrl(row.url) === canonicalOpportunityUrl(canonicalUrl)) return true;
    if (
      row.title
      && rowSourceId
      && rowSourceId !== candidate.sourceId
      && sameOpportunityTitle(row.title, candidate.title)
    ) return true;
    return false;
  });
}

export function sameUrl(a: string, b: string): boolean {
  return canonicalOpportunityUrl(a) === canonicalOpportunityUrl(b);
}
