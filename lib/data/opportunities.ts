import { MOCK_OPPORTUNITIES } from "./mock-opportunities";
import type { Opportunity } from "../types";

export async function listPublishedOpportunities(): Promise<Opportunity[]> {
  return MOCK_OPPORTUNITIES.filter((opportunity) => opportunity.status === "published");
}

export async function getOpportunityBySlug(slug: string): Promise<Opportunity | null> {
  return (
    MOCK_OPPORTUNITIES.find(
      (opportunity) => opportunity.slug === slug && opportunity.status === "published"
    ) ?? null
  );
}
