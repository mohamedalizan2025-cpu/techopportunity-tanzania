import type { createSupabaseAuthServerClient } from "./supabase-auth";
import {
  parseCampaignStatus,
  type CampaignStatus,
  type ProviderCampaign,
} from "../provider-campaign-state";

type StaffClient = Awaited<ReturnType<typeof createSupabaseAuthServerClient>>;

interface ProviderCampaignRow {
  id: string;
  name: string;
  opportunity_id: string;
  status: string;
  geography: string | null;
  sector: string | null;
  opportunity_type: string | null;
  goal_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderCampaignListResult {
  /** False only when the owner-gated 0020 schema is not yet applied. */
  available: boolean;
  campaigns: ProviderCampaign[];
}

export function missingCampaignSchema(error: {
  code?: string;
  message?: string;
}): boolean {
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("provider_campaigns") === true
  );
}

export function mapProviderCampaignRow(row: ProviderCampaignRow): ProviderCampaign | null {
  const status = parseCampaignStatus(row.status);
  if (!status) return null;
  return {
    id: row.id,
    name: row.name,
    opportunityId: row.opportunity_id,
    status,
    geography: row.geography,
    sector: row.sector,
    opportunityType: row.opportunity_type,
    goalText: row.goal_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Staff-scoped campaign reads. Callers must hold `getModerationAccess()`
 * success; RLS additionally confines every row to staff. Never called with
 * an ordinary or anonymous client.
 */
export async function listProviderCampaigns(
  client: StaffClient
): Promise<ProviderCampaignListResult> {
  const { data, error } = await client
    .from("provider_campaigns")
    .select(
      "id, name, opportunity_id, status, geography, sector, opportunity_type, goal_text, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    if (!missingCampaignSchema(error)) {
      console.error("[lib/data] Failed to list provider campaigns:", error.message);
    }
    return { available: false, campaigns: [] };
  }

  const campaigns: ProviderCampaign[] = [];
  for (const row of (data ?? []) as unknown as ProviderCampaignRow[]) {
    const campaign = mapProviderCampaignRow(row);
    if (campaign) campaigns.push(campaign);
  }
  return { available: true, campaigns };
}

export async function getProviderCampaign(
  client: StaffClient,
  campaignId: string
): Promise<{ available: boolean; campaign: ProviderCampaign | null }> {
  const { data, error } = await client
    .from("provider_campaigns")
    .select(
      "id, name, opportunity_id, status, geography, sector, opportunity_type, goal_text, created_at, updated_at"
    )
    .eq("id", campaignId)
    .maybeSingle();

  if (error) {
    if (!missingCampaignSchema(error)) {
      console.error("[lib/data] Failed to read provider campaign:", error.message);
    }
    return { available: false, campaign: null };
  }
  if (!data) return { available: true, campaign: null };
  return {
    available: true,
    campaign: mapProviderCampaignRow(data as unknown as ProviderCampaignRow),
  };
}

export type { CampaignStatus };
