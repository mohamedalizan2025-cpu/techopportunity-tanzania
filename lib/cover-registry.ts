import { geographyOf, sectorOf } from "./taxonomy";
import type { Opportunity } from "./types";

/**
 * Central visual/media registry for opportunity covers.
 *
 * Resolution order for an opportunity cover:
 *  1. Official opportunity image / OG image — when stored in `imageUrl`
 *     and the URL is a safe https origin (validated at insert time).
 *  2. Official organization logo — when the attached organization has
 *     a logo URL in the organizations table (future extension).
 *  3. Category-specific fallback artwork — locally stored editorial
 *     photography under `public/images/editorial/`, keyed by
 *     geography × category. These are AI-generated editorial images
 *     with provenance recorded in `docs/VISUAL_ASSET_PROVENANCE.md`.
 *     The images are visual context, never documentary evidence.
 *
 * Rules: never scrape, hotlink, or invent provenance. Fallbacks are
 * deterministic and visually consistent across categories.
 */

type CoverSlot =
  | "tanzania-education"
  | "tanzania-technology"
  | "tanzania-leadership"
  | "africa-education"
  | "africa-entrepreneurship"
  | "africa-technology"
  | "international-education"
  | "international-research"
  | "international-career"
  | "international-leadership"
  | "moment-hackathon"
  | "moment-fellowship"
  | "moment-internship"
  | "moment-scholarship"
  | "moment-conference"
  | "moment-research"
  | "moment-public-sector";

const EDITORIAL = {
  students: "/images/editorial/hero-students.webp",
  zanzibar: "/images/editorial/zanzibar-students.webp",
  technology: "/images/editorial/technology-makers.webp",
  founders: "/images/editorial/founders-pitch.webp",
  climate: "/images/editorial/climate-research.webp",
  global: "/images/editorial/global-scholars.webp",
  leadership: "/images/editorial/leadership-roundtable.webp",
  career: "/images/editorial/career-mentorship.webp",
  organizations: "/images/editorial/organizations-partnership.webp",
} as const;

const SLOT_PATHS: Record<CoverSlot, readonly string[]> = {
  "tanzania-education": [EDITORIAL.zanzibar, EDITORIAL.students],
  "tanzania-technology": [EDITORIAL.technology, EDITORIAL.career],
  "tanzania-leadership": [EDITORIAL.founders, EDITORIAL.leadership],
  "africa-education": [EDITORIAL.global, EDITORIAL.zanzibar],
  "africa-entrepreneurship": [EDITORIAL.founders, EDITORIAL.leadership],
  "africa-technology": [EDITORIAL.technology, EDITORIAL.climate],
  "international-education": [EDITORIAL.global, EDITORIAL.zanzibar],
  "international-research": [EDITORIAL.climate, EDITORIAL.technology],
  "international-career": [EDITORIAL.career, EDITORIAL.founders],
  "international-leadership": [EDITORIAL.leadership, EDITORIAL.global],
  "moment-hackathon": [EDITORIAL.technology, EDITORIAL.founders],
  "moment-fellowship": [EDITORIAL.leadership, EDITORIAL.global, EDITORIAL.students],
  "moment-internship": [EDITORIAL.career, EDITORIAL.technology],
  "moment-scholarship": [EDITORIAL.zanzibar, EDITORIAL.global],
  "moment-conference": [EDITORIAL.leadership, EDITORIAL.organizations],
  "moment-research": [EDITORIAL.climate, EDITORIAL.technology],
  "moment-public-sector": [EDITORIAL.organizations, EDITORIAL.leadership],
};

/**
 * Check if a URL is a safe, absolute https URL suitable for direct use.
 * This is a lightweight check; the discovery pipeline validates more
 * thoroughly at insert time.
 */
function isSafeImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

type CoverCandidate = Pick<Opportunity, "category"> & {
  slug?: string | null;
  imageUrl?: string | null;
  title?: string;
  description?: string;
  location?: Opportunity["location"];
  trust?: Opportunity["trust"];
};

export function coverSlotFor(
  opportunity: CoverCandidate
): CoverSlot {
  const category = opportunity.category;
  if (category === "hackathon" || category === "competition") return "moment-hackathon";
  if (category === "fellowship") return "moment-fellowship";
  if (category === "internship" || category === "jobs") return "moment-internship";
  if (category === "scholarship") return "moment-scholarship";
  if (category === "conference" || category === "tech-event" || category === "workshop")
    return "moment-conference";
  if (category === "research-call") return "moment-research";
  if (category === "public-challenge") return "moment-public-sector";
  if (category === "grant" || category === "accelerator") return "africa-entrepreneurship";

  const geography = geographyOf(opportunity as Opportunity);
  const sector = sectorOf(opportunity as Opportunity);
  if (geography === "national") {
    if (sector === "ai-data" || sector === "engineering" || sector === "cybersecurity")
      return "tanzania-technology";
    if (sector === "entrepreneurship" || sector === "finance") return "tanzania-leadership";
    return "tanzania-education";
  }
  if (geography === "international") {
    if (sector === "health" || sector === "education") return "international-education";
    if (sector === "engineering" || sector === "ai-data" || sector === "energy")
      return "international-research";
    if (sector === "finance" || sector === "entrepreneurship") return "international-career";
    return "international-leadership";
  }
  if (sector === "ai-data" || sector === "engineering") return "africa-technology";
  if (sector === "entrepreneurship" || sector === "finance") return "africa-entrepreneurship";
  return "africa-education";
}

function stableIndex(value: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

/**
 * Deterministically choose a cover image for this opportunity.
 * Priority: 1) opportunity.imageUrl, 2) category fallback.
 * Never returns null — always provides a visual.
 */
export function coverAssetFor(
  opportunity: CoverCandidate
): string {
  // 1. Official opportunity image (OG image, stored at insert time)
  if (isSafeImageUrl(opportunity.imageUrl)) {
    return opportunity.imageUrl!;
  }
  // 2. Category-specific fallback artwork
  const paths = SLOT_PATHS[coverSlotFor(opportunity)];
  return paths[stableIndex(opportunity.slug ?? "", paths.length)];
}

/** Registry slots still awaiting a local visual asset. */
export function pendingCoverSlots(): CoverSlot[] {
  return (Object.keys(SLOT_PATHS) as CoverSlot[]).filter((slot) => SLOT_PATHS[slot].length === 0);
}