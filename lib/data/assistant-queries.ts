import type { AssistantPlan } from "../assistant/plan";
import { listPublishedOpportunities } from "./opportunities";

/**
 * Assistant execution layer. Reuses listPublishedOpportunities() — the SAME
 * function the manual browse UI uses — so assistant filtering can never
 * drift from website filtering. Published-only reads via the anon client,
 * RLS authoritative. No pending/rejected/registry/audit access exists here.
 */

export interface AssistantResultItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  organization: string | null;
  city: string | null;
  region: string | null;
  deadline: string | null;
}

export interface AssistantAnswer {
  summary: string;
  appliedFilters: {
    q: string | null;
    category: string | null;
    city: string | null;
    region: string | null;
    deadline: string | null;
    sort: string;
  };
  results: AssistantResultItem[];
}

const MAX_RESULTS = 12;

/** Pure, DB-free: deterministic grounded answer from an explicit result set. */
export function buildGroundedAnswerFromResults(
  plan: AssistantPlan,
  results: AssistantResultItem[]
): AssistantAnswer {
  const filterBits: string[] = [];
  if (plan.q) filterBits.push(`matching “${plan.q}”`);
  if (plan.category) filterBits.push(`in ${plan.category}`);
  if (plan.city) filterBits.push(`in ${plan.city}`);
  if (plan.region) filterBits.push(`in the ${plan.region} region`);
  if (plan.deadline === "soon") filterBits.push("closing within 14 days");
  if (plan.deadline === "rolling") filterBits.push("with no fixed deadline");

  const summary =
    results.length === 0
      ? `No published opportunities match ${filterBits.length > 0 ? filterBits.join(", ") : "your search"}.`
      : `${results.length} published opportunit${results.length === 1 ? "y" : "ies"} match ${filterBits.length > 0 ? filterBits.join(", ") : "your search"}.`;

  return {
    summary,
    appliedFilters: {
      q: plan.q,
      category: plan.category,
      city: plan.city,
      region: plan.region,
      deadline: plan.deadline,
      sort: plan.sort,
    },
    results,
  };
}

export async function executeAssistantPlan(plan: AssistantPlan): Promise<AssistantAnswer> {
  const opportunities = await listPublishedOpportunities({
    category: plan.category,
    sort: plan.sort,
    q: plan.q,
    city: plan.city,
    region: plan.region,
    deadline: plan.deadline,
  });

  const results: AssistantResultItem[] = opportunities.slice(0, MAX_RESULTS).map((o) => ({
    id: o.id,
    slug: o.slug,
    title: o.title,
    category: o.category,
    organization: o.organization,
    city: o.location?.city ?? null,
    region: o.location?.region ?? null,
    deadline: o.deadline,
  }));

  return buildGroundedAnswerFromResults(plan, results);
}
