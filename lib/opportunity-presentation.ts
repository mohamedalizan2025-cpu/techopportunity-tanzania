import type { Opportunity, OpportunityLocation } from "./types";
import { deriveLifecycleState, isActionableNow } from "./lifecycle";

const DAY_MS = 24 * 60 * 60 * 1000;

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
  const lifecycle = deriveLifecycleState(deadline, now);
  if (lifecycle === "unknown" || !deadline) {
    return { state: "unknown", label: "Deadline not listed", dateLabel: null };
  }

  const dateLabel = formatDate(deadline);
  if (lifecycle === "expired") {
    return { state: "expired", label: "Deadline passed", dateLabel };
  }

  const remainingDays = Math.max(
    1,
    Math.ceil((new Date(deadline).getTime() - now.getTime()) / DAY_MS)
  );
  if (remainingDays <= 14) {
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

/**
 * Current production has no eligibility column (migration 0005 is owner-gated),
 * so the only truthful public state is unknown. Keep this explicit and separate
 * from location until evidence-backed eligibility is stored.
 */
export const UNKNOWN_TANZANIA_ELIGIBILITY =
  "Tanzania eligibility not confirmed";

const BROWSE_RETURN_FALLBACK = "/#opportunities";
const BROWSE_QUERY_KEYS = new Set([
  "q",
  "category",
  "deadline",
  "city",
  "region",
  "sort",
]);

/** Accept only an internal homepage result URL; external/open redirects fail closed. */
export function sanitizeBrowseReturnHref(raw: string | null | undefined): string {
  if (!raw || raw.length > 600) return BROWSE_RETURN_FALLBACK;
  try {
    const base = "https://browse.invalid";
    const parsed = new URL(raw, base);
    if (parsed.origin !== base || parsed.pathname !== "/") return BROWSE_RETURN_FALLBACK;
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

export function opportunityExcerpt(description: string, limit = 180): string {
  const normalized = description.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 1).trimEnd()}…`;
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
      isActionableNow(opportunity.deadline, now)
  );

  const closingSoon = publishedActionable
    .filter((opportunity) => {
      if (!opportunity.deadline) return false;
      const deadline = new Date(opportunity.deadline).getTime();
      const remaining = deadline - now.getTime();
      return Number.isFinite(deadline) && remaining > 0 && remaining <= 14 * DAY_MS;
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
