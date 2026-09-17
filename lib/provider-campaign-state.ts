/**
 * Provider Campaign Pilot domain (internal, staff-only).
 *
 * A campaign links ONE verified (published) opportunity to staff-entered
 * targeting notes. Statuses model the pilot's own pipeline — the
 * "Engagement Funnel" counts campaigns per status, never people.
 *
 * Privacy: this module is pure and knows nothing about talent profiles,
 * saved bookmarks, activity tracking, or alert preferences. Audience sizing
 * (lib/campaign-analytics.ts) counts PUBLIC corpus inventory only.
 */

export const CAMPAIGN_STATUSES = ["draft", "active", "paused", "completed"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
};

export const CAMPAIGN_STATUS_DESCRIPTIONS: Record<CampaignStatus, string> = {
  draft: "Being prepared — not yet promoted.",
  active: "Currently promoted to its target audience.",
  paused: "Temporarily on hold.",
  completed: "Finished — kept for aggregate learning.",
};

export const MAX_CAMPAIGN_NAME = 120;
export const MAX_CAMPAIGN_GOAL = 500;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ProviderCampaign {
  id: string;
  name: string;
  opportunityId: string;
  status: CampaignStatus;
  geography: string | null;
  sector: string | null;
  opportunityType: string | null;
  goalText: string | null;
  createdAt: string;
  updatedAt: string;
}

export function parseCampaignStatus(value: unknown): CampaignStatus | null {
  return typeof value === "string" &&
    (CAMPAIGN_STATUSES as readonly string[]).includes(value)
    ? (value as CampaignStatus)
    : null;
}

export function isCampaignId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function boundedText(raw: unknown, min: number, max: number): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
  return cleaned.length >= min ? cleaned : null;
}

export function sanitizeCampaignName(raw: unknown): string | null {
  return boundedText(raw, 3, MAX_CAMPAIGN_NAME);
}

export function sanitizeCampaignGoal(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  return boundedText(raw, 1, MAX_CAMPAIGN_GOAL);
}

/** Targeting dimensions are optional staff notes; unknown stays unknown. */
export function sanitizeCampaignTargeting(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  return boundedText(raw, 1, 60);
}

export function parseCampaignForm(formData: FormData): {
  name: string;
  opportunityId: string;
  geography: string | null;
  sector: string | null;
  opportunityType: string | null;
  goalText: string | null;
} | null {
  const name = sanitizeCampaignName(formData.get("name"));
  const opportunityId = formData.get("opportunityId");
  if (!name || !isCampaignId(opportunityId)) return null;
  const geographyField = formData.get("geography");
  let geography: string | null = null;
  if (geographyField !== null && String(geographyField).trim() !== "") {
    const cleaned = String(geographyField).trim();
    if (cleaned !== "national" && cleaned !== "international") return null;
    geography = cleaned;
  }
  return {
    name,
    opportunityId,
    geography,
    sector: sanitizeCampaignTargeting(formData.get("sector")),
    opportunityType: sanitizeCampaignTargeting(formData.get("opportunityType")),
    goalText: sanitizeCampaignGoal(formData.get("goal")),
  };
}
