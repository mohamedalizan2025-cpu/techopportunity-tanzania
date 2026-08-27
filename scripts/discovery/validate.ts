import { OPPORTUNITY_CATEGORIES } from "../../lib/types";
import type { CandidateOpportunity } from "./types";

export function validateCandidate(candidate: CandidateOpportunity): boolean {
  if (!candidate.title || candidate.title.length < 3) return false;
  if (!candidate.description || candidate.description.length < 10) return false;
  if (!(OPPORTUNITY_CATEGORIES as readonly string[]).includes(candidate.category)) return false;
  if (!isValidOpportunityUrl(candidate.url)) return false;
  if (candidate.organization && candidate.organization.length > 200) return false;
  if (candidate.title.length > 200) return false;
  if (candidate.description.length > 10000) return false;
  return true;
}

/**
 * Deterministic structural URL guards. These reject only clearly corrupted
 * or non-opportunity targets; legitimate formats (PDF documents, query-
 * string pages, deep paths) are preserved. Transient network failures are
 * handled elsewhere and deliberately NOT rejected here.
 */
export function isValidOpportunityUrl(rawUrl: string): boolean {
  if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) return false;
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (!["http:", "https:"].includes(parsed.protocol)) return false;

  // Hostname corruption such as www.www.example.com (duplicated www label).
  const wwwLabels = parsed.hostname
    .split(".")
    .filter((label) => label.toLowerCase() === "www").length;
  if (wwwLabels >= 2) return false;

  // Image files are never opportunity pages.
  if (/\.(jpe?g|png|gif|webp|svg|ico)$/i.test(parsed.pathname)) return false;

  // Comment permalinks point at discussions, not opportunities.
  if (/^#comment-/i.test(parsed.hash)) return false;

  return true;
}
