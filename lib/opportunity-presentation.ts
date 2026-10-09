import type { Opportunity, OpportunityLocation } from "./types";
import { isActionableNow } from "./lifecycle";
import { evaluateDeadline } from "./deadline-intelligence";
import { isFeatureEligible, publicQualityBand } from "./opportunity-trust";

export interface DeadlinePresentation {
  state: "active" | "urgent" | "expired" | "unknown";
  label: string;
  dateLabel: string | null;
}

export interface HomepageSnapshot {
  closingSoon: Opportunity[];
  recentlyAdded: Opportunity[];
}

/**
 * Country honesty gate: until owner migration 0008 (country evidence) is
 * applied, every stored `country` value originates from the schema default
 * (`not null default 'Tanzania'`) and cannot be distinguished from a
 * verified fact. Public presentation therefore never renders `country` —
 * showing it would imply verification that does not exist yet. When 0008
 * is live, evidence-backed display can be reintroduced here in one place.
 */

/**
 * Card meta line segments: organizer when attached, then recorded place
 * (city, region). Unknown fields are simply absent — neutral, never
 * fabricated. Country is deliberately excluded (see honesty gate above).
 */
export function buildCardMetaSegments(opportunity: Opportunity): string[] {
  const placeParts = [
    opportunity.location?.city ?? null,
    opportunity.location?.region ?? null,
  ].filter((part): part is string => part !== null && part.trim() !== "");

  return [
    opportunity.organization,
    placeParts.length > 0 ? placeParts.join(", ") : null,
  ].filter((segment): segment is string => segment !== null && segment.trim() !== "");
}

/** A concise place label that never includes the unevidenced country field. */
export function formatCardLocation(
  location: OpportunityLocation | null
): string | null {
  if (!location) return null;
  const parts = [location.city, location.region].filter(
    (part): part is string => part !== null && part.trim() !== ""
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

function formatDate(iso: string, month: "short" | "long" = "short"): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month,
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

/**
 * Public deadline copy derived only from the stored date. A missing or invalid
 * value stays unknown; it is never relabelled as a rolling deadline.
 */
export function formatDeadlinePresentation(
  deadline: string | null,
  now: Date = new Date()
): DeadlinePresentation {
  const evaluation = evaluateDeadline({ deadline }, now);
  if (evaluation.status === "unknown" || evaluation.status === "invalid" || !deadline) {
    return { state: "unknown", label: "Deadline not listed", dateLabel: null };
  }

  const dateLabel = formatDate(deadline);
  if (evaluation.status === "closed") {
    return { state: "expired", label: "Deadline passed", dateLabel };
  }

  const remainingDays = evaluation.remainingDays ?? 1;
  if (evaluation.status === "closing_soon") {
    return {
      state: "urgent",
      label: `Closes in ${remainingDays} ${remainingDays === 1 ? "day" : "days"}`,
      dateLabel,
    };
  }

  return { state: "active", label: "Deadline", dateLabel };
}

/** Platform freshness, intentionally described as "added" rather than updated. */
export function formatAddedDate(createdAt: string): string | null {
  const timestamp = Date.parse(createdAt);
  if (!Number.isFinite(timestamp)) return null;
  return `Added ${formatDate(createdAt)}`;
}

export function formatResultCount(count: number): string {
  const safeCount = Math.max(0, Math.trunc(count));
  return `${safeCount} ${safeCount === 1 ? "opportunity" : "opportunities"} shown`;
}

export function sourcePresentation(opportunity: Opportunity): string {
  const source = opportunity.sourceName?.trim();
  return source ? `Source: ${source}` : "Source page available";
}

/**
 * Public trust badge config. Only surfaced for opportunities in the "trusted"
 * quality band; every other band returns null so nothing is claimed that the
 * evidence pipeline has not verified.
 */
export function formatTrustBadge(
  opportunity: Opportunity
): { tone: "verified"; label: "Evidence verified" } | null {
  if (publicQualityBand(opportunity) === "trusted") {
    return { tone: "verified", label: "Evidence verified" };
  }
  return null;
}

export function sourceHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./i, "") || null;
  } catch {
    return null;
  }
}

export function formatDiscoveredDate(discoveredAt: string | null | undefined): string | null {
  if (!discoveredAt || !Number.isFinite(Date.parse(discoveredAt))) return null;
  return `First found ${formatDate(discoveredAt)}`;
}

/** Fallback when the existing trust projection is disabled or lacks evidence. */
export const UNKNOWN_TANZANIA_ELIGIBILITY =
  "Tanzania eligibility not confirmed";

/** Presentation only: never infer eligibility from location, profile or prose. */
export function eligibilityPresentation(opportunity: Opportunity): {
  label: string;
  evidence: string | null;
} {
  const trust = opportunity.trust;
  const evidence = trust?.eligibilityEvidence?.trim();
  if (opportunity.status === "published" && evidence && trust?.decidedBy &&
      trust.decidedAt && Number.isFinite(Date.parse(trust.decidedAt))) {
    if (trust.eligibilityDecision === "tanzanians_eligible") {
      return { label: "Tanzanian access evidenced", evidence };
    }
    if (trust.eligibilityDecision === "tanzanians_not_eligible") {
      return { label: "Tanzanians excluded by recorded requirements", evidence };
    }
  }
  return { label: UNKNOWN_TANZANIA_ELIGIBILITY, evidence: null };
}

/** A clickable evidence reference is not itself a certification of authority. */
export function publicEvidenceUrl(opportunity: Opportunity): string | null {
  const value = opportunity.trust?.canonicalEvidenceUrl;
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password
      ? url.href : null;
  } catch {
    return null;
  }
}

const BROWSE_RETURN_FALLBACK = "/#opportunities";
const BROWSE_QUERY_KEYS = new Set([
  "q",
  "category",
  "geography",
  "sector",
  "deadline",
  "city",
  "region",
  "sort",
  "page",
]);

/** Accept only an internal homepage result URL or the protected saved list. */
export function sanitizeBrowseReturnHref(raw: string | null | undefined): string {
  if (!raw || raw.length > 600) return BROWSE_RETURN_FALLBACK;
  try {
    const base = "https://browse.invalid";
    const parsed = new URL(raw, base);
    if (parsed.origin !== base) return BROWSE_RETURN_FALLBACK;
    if (parsed.pathname === "/saved") return "/saved";
    if (parsed.pathname !== "/") return BROWSE_RETURN_FALLBACK;
    const safe = new URLSearchParams();
    for (const [key, value] of parsed.searchParams) {
      if (BROWSE_QUERY_KEYS.has(key) && value.length <= 120 && !safe.has(key)) {
        safe.set(key, value);
      }
    }
    const query = safe.toString();
    return `/${query ? `?${query}` : ""}#opportunities`;
  } catch {
    return BROWSE_RETURN_FALLBACK;
  }
}

export function opportunityHref(slug: string, returnTo?: string): string {
  const pathname = `/opportunities/${encodeURIComponent(slug)}`;
  if (!returnTo) return pathname;
  const params = new URLSearchParams({ from: sanitizeBrowseReturnHref(returnTo) });
  return `${pathname}?${params.toString()}`;
}

/**
 * Card excerpt: drops a leading "Deadline: …." boilerplate sentence when the
 * card already renders the deadline separately, then shortens. Never invents
 * or reorders content — pure trimming of duplicated lead text.
 */
const DEADLINE_LEAD_PATTERN =
  /^(?:application\s+)?deadline:\s*(?:january|february|march|april|may|june|july|august|september|october|november|december|jan\.?|feb\.?|mar\.?|apr\.?|jun\.?|jul\.?|aug\.?|sept?\.?|oct\.?|nov\.?|dec\.?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{0,4}\s*\.?\s*[–—-]?\s*/i;

export function opportunityCardExcerpt(description: string, limit = 110): string {
  const normalized = description.replace(/\s+/g, " ").trim();
  const withoutDeadlineLead = normalized.replace(DEADLINE_LEAD_PATTERN, "");
  const body = withoutDeadlineLead.length > 0 ? withoutDeadlineLead : normalized;
  if (body.length <= limit) return body;
  return `${body.slice(0, limit - 1).trimEnd()}…`;
}

/**
 * Deterministic featured selection for the homepage: soonest deadlines
 * first, at most one record per category for type diversity, capped at
 * `count`. Editorial rule only — never "sponsored", never paid placement.
 */
export function featuredOpportunities(
  opportunities: Opportunity[],
  now: Date = new Date(),
  count = 3
): Opportunity[] {
  const actionable = opportunities.filter(
    (opportunity) =>
      opportunity.status === "published" &&
      isActionableNow(opportunity.deadline, now) &&
      isFeatureEligible(opportunity, now)
  );
  const byDeadline = [...actionable].sort((a, b) => {
    const da = a.deadline ? Date.parse(a.deadline) : Number.POSITIVE_INFINITY;
    const db = b.deadline ? Date.parse(b.deadline) : Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
  const picked: Opportunity[] = [];
  const seenCategories = new Set<string>();
  for (const opportunity of byDeadline) {
    if (picked.length >= count) break;
    if (seenCategories.has(opportunity.category)) continue;
    seenCategories.add(opportunity.category);
    picked.push(opportunity);
  }
  for (const opportunity of byDeadline) {
    if (picked.length >= count) break;
    if (!picked.includes(opportunity)) picked.push(opportunity);
  }
  return picked;
}

/**
 * Pure homepage selection over the already published public corpus. The status
 * check is deliberate defence in depth and makes unpublished leakage impossible
 * even if a future caller passes a mixed collection.
 */
export function buildHomepageSnapshot(
  opportunities: Opportunity[],
  now: Date = new Date(),
  limit = 3
): HomepageSnapshot {
  const publishedActionable = opportunities.filter(
    (opportunity) =>
      opportunity.status === "published" &&
      isActionableNow(opportunity.deadline, now) &&
      isFeatureEligible(opportunity, now)
  );

  const closingSoon = publishedActionable
    .filter((opportunity) => {
      return evaluateDeadline({ deadline: opportunity.deadline }, now).status === "closing_soon";
    })
    .sort(
      (a, b) =>
        new Date(a.deadline as string).getTime() -
        new Date(b.deadline as string).getTime()
    )
    .slice(0, limit);

  const recentlyAdded = [...publishedActionable]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit);

  return { closingSoon, recentlyAdded };
}

/**
 * Detail-page location lines: venue/address first, then city + region.
 * Country excluded per the honesty gate. A location object carrying only
 * blanks degrades to the same neutral state as a missing location.
 */
export function formatLocationDisplay(location: OpportunityLocation): string[] {
  const lines = [location.venueName, location.address].filter(
    (line): line is string => line !== null && line.trim() !== ""
  );
  const placeParts = [location.city, location.region].filter(
    (part): part is string => part !== null && part.trim() !== ""
  );
  if (placeParts.length > 0) lines.push(placeParts.join(", "));
  return lines.length > 0 ? lines : ["Location not specified"];
}
