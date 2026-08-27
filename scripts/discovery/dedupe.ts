import type { CandidateOpportunity } from "./types";

export function isDuplicate(
  candidate: CandidateOpportunity,
  existing: Array<{
    url: string | null;
    source_id?: string | null;
    sourceId?: string | null;
    title: string | null;
    deadline: string | null;
  }>
): boolean {
  const canonicalUrl = candidate.url.trim();

  return existing.some((row) => {
    const rowSourceId = row.sourceId ?? row.source_id ?? null;

    if (row.url && normalizeUrl(row.url) === normalizeUrl(canonicalUrl)) return true;
    if (rowSourceId === candidate.sourceId && row.url && normalizeUrl(row.url) === normalizeUrl(canonicalUrl)) return true;
    return false;
  });
}

function normalizeUrl(value: string): string {
  try {
    return new URL(value).toString().replace(/\/?$/, "");
  } catch {
    return value.trim();
  }
}

export function sameUrl(a: string, b: string): boolean {
  return normalizeUrl(a) === normalizeUrl(b);
}
