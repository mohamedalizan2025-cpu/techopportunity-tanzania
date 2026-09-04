import type { AuthenticatedUserContext } from "./supabase-auth";
import {
  OPPORTUNITY_SELECT,
  mapOpportunityRow,
  type OpportunityRow,
} from "./opportunities";
import type { OpportunityStatus } from "../types";
import type { SavedOpportunityEntry } from "../saved-opportunity-state";
import { isTestOrPlaceholderOpportunity } from "../opportunity-trust";

interface SavedOpportunityRow {
  id: string;
  opportunity_id: string;
  created_at: string;
  opportunity:
    | (OpportunityRow & { status: OpportunityStatus })
    | Array<OpportunityRow & { status: OpportunityStatus }>
    | null;
}

const SAVED_OPPORTUNITY_SELECT = `
  id,
  opportunity_id,
  created_at,
  opportunity:opportunities (
    status,
    ${OPPORTUNITY_SELECT}
  )
`;

export interface SavedOpportunityListResult {
  available: boolean;
  entries: SavedOpportunityEntry[];
}

function oneOpportunity(
  value: SavedOpportunityRow["opportunity"]
): (OpportunityRow & { status: OpportunityStatus }) | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

/** Defence in depth: even a staff session never maps non-published content. */
export function mapSavedOpportunityRows(
  rows: SavedOpportunityRow[]
): SavedOpportunityEntry[] {
  return rows.map((row) => {
    const related = oneOpportunity(row.opportunity);
    return {
      savedId: row.id,
      opportunityId: row.opportunity_id,
      savedAt: row.created_at,
      opportunity:
        related?.status === "published"
          ? (() => {
              const opportunity = mapOpportunityRow(related, "published");
              return isTestOrPlaceholderOpportunity(opportunity)
                ? null
                : opportunity;
            })()
          : null,
    };
  });
}

function missingSavedSchema(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("saved_opportunities") === true
  );
}

/** One authenticated query supplies card/detail saved state; anonymous callers skip it. */
export async function listSavedOpportunityIds(
  user: AuthenticatedUserContext
): Promise<Set<string>> {
  const { data, error } = await user.client
    .from("saved_opportunities")
    .select("opportunity_id")
    .eq("user_id", user.userId)
    .limit(500);
  if (error) {
    if (!missingSavedSchema(error)) {
      console.error("[lib/data] Failed to list saved opportunity ids:", error.message);
    }
    return new Set();
  }
  return new Set(
    ((data ?? []) as unknown as Array<{ opportunity_id: string }>).map(
      (row) => row.opportunity_id
    )
  );
}

export async function listSavedOpportunities(
  user: AuthenticatedUserContext
): Promise<SavedOpportunityListResult> {
  const { data, error } = await user.client
    .from("saved_opportunities")
    .select(SAVED_OPPORTUNITY_SELECT)
    .eq("user_id", user.userId)
    .eq("opportunity.status", "published")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    if (!missingSavedSchema(error)) {
      console.error("[lib/data] Failed to list saved opportunities:", error.message);
    }
    return { available: false, entries: [] };
  }

  return {
    available: true,
    entries: mapSavedOpportunityRows(
      (data ?? []) as unknown as SavedOpportunityRow[]
    ),
  };
}
