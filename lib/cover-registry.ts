import { geographyOf, sectorOf } from "./taxonomy";
import type { Opportunity } from "./types";

/**
 * Central visual/media registry (photo-first architecture).
 *
 * Resolution order for an opportunity cover:
 *  1. verified organization/program image — only when licensed/provenanced
 *     (no registry entry qualifies today; see the asset manifest in
 *     docs/architecture.md §10b);
 *  2. reviewed local asset under `public/covers/` keyed by
 *     geography × category below;
 *  3. deterministic generated SVG fallback (`components/opportunity-cover`).
 *
 * Rules: never scrape, hotlink, or invent provenance. A registry slot holds
 * a local path ONLY after a licensed file with recorded provenance lands in
 * `public/covers/`. Until then every slot resolves to `null` and the UI
 * renders the generated fallback. Slots use `null` (not empty strings) so
 * "no asset" is explicit and greppable.
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

const SLOT_PATHS: Record<CoverSlot, string | null> = {
  "tanzania-education": null,
  "tanzania-technology": null,
  "tanzania-leadership": null,
  "africa-education": null,
  "africa-entrepreneurship": null,
  "africa-technology": null,
  "international-education": null,
  "international-research": null,
  "international-career": null,
  "international-leadership": null,
  "moment-hackathon": null,
  "moment-fellowship": null,
  "moment-internship": null,
  "moment-scholarship": null,
  "moment-conference": null,
  "moment-research": null,
  "moment-public-sector": null,
};

export function coverSlotFor(
  opportunity: Pick<Opportunity, "category"> & Partial<Opportunity>
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

/** Local asset path for the slot, or `null` while no licensed file exists. */
export function coverAssetFor(
  opportunity: Pick<Opportunity, "category"> & Partial<Opportunity>
): string | null {
  return SLOT_PATHS[coverSlotFor(opportunity)];
}

/** Registry slots still awaiting licensed files (the supply backlog). */
export function pendingCoverSlots(): CoverSlot[] {
  return (Object.keys(SLOT_PATHS) as CoverSlot[]).filter((slot) => SLOT_PATHS[slot] === null);
}
