/**
 * Aggregate analytics helpers for the internal Provider Campaign Pilot.
 *
 * Only staff-visible aggregates live here: the pilot's own campaign
 * pipeline counts. Engagement (Saved/Interested/Applying/Applied) and
 * Relevant Audience are REAL database aggregates read through the
 * staff-only RPCs in migration 0020 (`lib/data/campaign-engagement.ts`) —
 * this module deliberately contains no audience estimator, because
 * counting opportunities and labelling the result "talent audience"
 * would be fabrication.
 */

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
