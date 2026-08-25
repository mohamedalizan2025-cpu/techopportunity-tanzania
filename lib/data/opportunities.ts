import type { Opportunity } from "../types";

const EMPTY_RESULT: Opportunity[] = [];

export async function listPublishedOpportunities(): Promise<Opportunity[]> {
  return EMPTY_RESULT;
}

export async function getOpportunityBySlug(slug: string): Promise<Opportunity | null> {
  void slug;
  return null;
}
