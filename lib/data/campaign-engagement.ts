import type { createSupabaseAuthServerClient } from "./supabase-auth";

type StaffClient = Awaited<ReturnType<typeof createSupabaseAuthServerClient>>;

export interface CampaignEngagement {
  saved: number;
  interested: number;
  applying: number;
  applied: number;
}

export const EMPTY_ENGAGEMENT: CampaignEngagement = {
  saved: 0,
  interested: 0,
  applying: 0,
  applied: 0,
};

export interface CampaignEngagementResult {
  /**
   * False only when the owner-gated 0020 aggregate RPCs are not yet
   * applied. Callers show an honest "unavailable" state; they never
   * fabricate engagement.
   */
  available: boolean;
  engagement: CampaignEngagement;
}

export interface CampaignAudienceResult {
  /** False only when the owner-gated 0020 aggregate RPCs are not applied. */
  available: boolean;
  /** Real matching-profile count. 0 is valid: no audience yet. */
  audience: number;
}

function missingEngagementSchema(error: {
  code?: string;
  message?: string;
}): boolean {
  return (
    error.code === "PGRST202" ||
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.code === "42883" ||
    error.message?.includes("get_campaign_engagement") === true ||
    error.message?.includes("get_campaign_audience") === true ||
    error.message?.includes("provider_campaigns") === true
  );
}

function asEngagement(value: unknown): CampaignEngagement {
  const row = (Array.isArray(value) ? value[0] : value) as Record<
    string,
    unknown
  > | null;
  if (!row) return { ...EMPTY_ENGAGEMENT };
  const count = (field: string): number => {
    const parsed = Number(row[field]);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
  };
  return {
    saved: count("saved"),
    interested: count("interested"),
    applying: count("applying"),
    applied: count("applied"),
  };
}

/**
 * Staff-scoped REAL engagement aggregates for one campaign. The database
 * RPC counts stored activity rows and returns four integers — individual
 * rows never leave the database. Callers must hold
 * `getModerationAccess()` success; the RPC additionally rejects
 * non-staff callers before any count runs.
 */
export async function getCampaignEngagement(
  client: StaffClient,
  campaignId: string
): Promise<CampaignEngagementResult> {
  const { data, error } = await client.rpc("get_campaign_engagement", {
    p_campaign_id: campaignId,
  });
  if (error) {
    if (!missingEngagementSchema(error)) {
      console.error("[lib/data] Failed to read campaign engagement:", error.message);
    }
    return { available: false, engagement: { ...EMPTY_ENGAGEMENT } };
  }
  return { available: true, engagement: asEngagement(data) };
}

/**
 * Staff-scoped REAL audience count for one campaign: core-complete talent
 * profiles whose sector/type focus overlaps the campaign targeting.
 * Single integer; no profile rows ever leave the database.
 */
export async function getCampaignAudience(
  client: StaffClient,
  campaignId: string
): Promise<CampaignAudienceResult> {
  const { data, error } = await client.rpc("get_campaign_audience", {
    p_campaign_id: campaignId,
  });
  if (error) {
    if (!missingEngagementSchema(error)) {
      console.error("[lib/data] Failed to read campaign audience:", error.message);
    }
    return { available: false, audience: 0 };
  }
  const parsed = Number(data);
  return {
    available: true,
    audience: Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0,
  };
}
