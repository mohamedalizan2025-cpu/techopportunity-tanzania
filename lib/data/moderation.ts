import type { Opportunity } from "../types";
import { createSupabaseAuthServerClient } from "./supabase-auth";
import {
  OPPORTUNITY_SELECT,
  mapOpportunityRow,
  type OpportunityRow,
} from "./opportunities";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidOpportunityId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export interface StaffContext {
  client: Awaited<ReturnType<typeof createSupabaseAuthServerClient>>;
  userId: string;
  displayName: string | null;
  email: string | null;
}

export type ModerationAccessResult =
  | { ok: true; staff: StaffContext }
  | { ok: false; reason: "unauthenticated" | "forbidden" };

async function readStaffProfile(
  client: StaffContext["client"],
  userId: string
): Promise<{ role: string; display_name: string | null } | null> {
  const { data, error } = await client
    .from("profiles")
    .select("role, display_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) return null;
  return (data as unknown as { role: string; display_name: string | null }) ?? null;
}

export async function getModerationAccess(): Promise<ModerationAccessResult> {
  let client;
  try {
    client = await createSupabaseAuthServerClient();
  } catch {
    return { ok: false, reason: "unauthenticated" };
  }

  const { data: claimsData, error: claimsError } =
    await client.auth.getClaims();
  const claims = claimsError ? null : (claimsData?.claims ?? null);
  const userId = (claims?.sub as string | undefined) ?? null;

  if (!userId) {
    return { ok: false, reason: "unauthenticated" };
  }

  const profile = await readStaffProfile(client, userId);
  if (!profile || !["moderator", "admin"].includes(profile.role)) {
    return { ok: false, reason: "forbidden" };
  }

  return {
    ok: true,
    staff: {
      client,
      userId,
      displayName: profile.display_name,
      email: (claims?.email as string | undefined) ?? null,
    },
  };
}

export interface EnrichmentAuditStatus {
  active: boolean;
  reason: string | null;
}

/**
 * Probes whether the enrichment audit trail (migration 0003) is live, so the
 * moderation UI can tell operators the truth instead of silently dropping
 * audit rows. Read-only; safe to call on every review render.
 */
export async function getEnrichmentAuditStatus(): Promise<EnrichmentAuditStatus> {
  const access = await getModerationAccess();
  if (!access.ok) return { active: false, reason: "unauthenticated" };

  const { error } = await access.staff.client
    .from("opportunity_enrichments")
    .select("id")
    .limit(1);

  if (!error) return { active: true, reason: null };
  if (error.code === "PGRST205" || error.message.includes("does not exist")) {
    return { active: false, reason: "migration 0003 not applied" };
  }
  return { active: false, reason: error.message };
}

function toOpportunityRows(data: unknown): OpportunityRow[] {
  return (data ?? []) as unknown as OpportunityRow[];
}

export async function listPendingOpportunities(): Promise<Opportunity[]> {
  const access = await getModerationAccess();
  if (!access.ok) return [];

  // Explicit cap, never the implicit PostgREST 1,000-row limit: a queue
  // this deep is itself the signal to build queue pagination (§12.1).
  const QUEUE_LIMIT = 500;

  const { data, error } = await access.staff.client
    .from("opportunities")
    .select(OPPORTUNITY_SELECT)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(QUEUE_LIMIT);

  if (error) {
    console.error("[lib/data] Failed to list pending opportunities:", error.message);
    return [];
  }

  const rows = toOpportunityRows(data);
  if (rows.length >= QUEUE_LIMIT) {
    console.warn(
      `[lib/data] Pending queue reached the ${QUEUE_LIMIT}-row explicit cap — older rows are hidden until queue pagination ships (§12.1)`
    );
  }

  return rows.map((row) => mapOpportunityRow(row, "pending"));
}

export async function getPendingOpportunityById(
  id: string
): Promise<Opportunity | null> {
  if (!isValidOpportunityId(id)) return null;

  const access = await getModerationAccess();
  if (!access.ok) return null;

  const { data, error } = await access.staff.client
    .from("opportunities")
    .select(OPPORTUNITY_SELECT)
    .eq("id", id)
    .eq("status", "pending")
    .maybeSingle();

  if (error) {
    console.error("[lib/data] Failed to fetch pending opportunity:", error.message);
    return null;
  }

  return data
    ? mapOpportunityRow(toOpportunityRows([data])[0], "pending")
    : null;
}
