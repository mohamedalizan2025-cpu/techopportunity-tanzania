import type { Opportunity } from "./types";
import { geographyOf, sectorOf } from "./taxonomy";

/**
 * Privacy-safe aggregate analytics for the internal Provider Campaign Pilot.
 *
 * Purity contract (permanent): this module imports ONLY public-corpus types
 * and the deterministic taxonomy. It never imports a data-access layer, a
 * Supabase client, talent profiles, saved bookmarks, activity tracking, or
 * alert preferences — so every number it produces is computable from data
 * staff can already read. Per-talent engagement analytics are NOT built
 * here; they require a future consent + threshold-suppression design.
 */

export interface CampaignTargeting {
  geography: string | null;
  sector: string | null;
  opportunityType: string | null;
}

export interface AudienceEstimate {
  /** Published, lifecycle-active opportunities considered. */
  corpusSize: number;
  /** Opportunities matching ALL supplied targeting dimensions. */
  matched: number;
  matchedNational: number;
  matchedInternational: number;
}

export function estimateAudience(
  corpus: readonly Opportunity[],
  targeting: CampaignTargeting
): AudienceEstimate {
  let matched = 0;
  let matchedNational = 0;
  let matchedInternational = 0;
  for (const opportunity of corpus) {
    if (
      targeting.geography !== null &&
      geographyOf(opportunity) !== targeting.geography
    ) {
      continue;
    }
    if (
      targeting.sector !== null &&
      sectorOf(opportunity) !== targeting.sector
    ) {
      continue;
    }
    if (
      targeting.opportunityType !== null &&
      opportunity.category !== targeting.opportunityType
    ) {
      continue;
    }
    matched += 1;
    const geography = geographyOf(opportunity);
    if (geography === "national") matchedNational += 1;
    else if (geography === "international") matchedInternational += 1;
  }
  return {
    corpusSize: corpus.length,
    matched,
    matchedNational,
    matchedInternational,
  };
}

export interface FunnelSummary {
  total: number;
  draft: number;
  active: number;
  paused: number;
  completed: number;
}

export function summarizeFunnel(
  campaigns: ReadonlyArray<{ status: string }>
): FunnelSummary {
  const summary: FunnelSummary = {
    total: campaigns.length,
    draft: 0,
    active: 0,
    paused: 0,
    completed: 0,
  };
  for (const campaign of campaigns) {
    if (campaign.status === "draft") summary.draft += 1;
    else if (campaign.status === "active") summary.active += 1;
    else if (campaign.status === "paused") summary.paused += 1;
    else if (campaign.status === "completed") summary.completed += 1;
  }
  return summary;
}
