import type { Opportunity, OpportunityLocation } from "./types";

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
