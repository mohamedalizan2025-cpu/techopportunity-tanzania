import { OPPORTUNITY_CATEGORIES } from "../../lib/types";
import type { CandidateOpportunity } from "./types";

export function validateCandidate(candidate: CandidateOpportunity): boolean {
  if (!candidate.title || candidate.title.length < 3) return false;
  if (!candidate.description || candidate.description.length < 10) return false;
  if (!(OPPORTUNITY_CATEGORIES as readonly string[]).includes(candidate.category)) return false;
  if (!candidate.url || !/^https?:\/\//i.test(candidate.url)) return false;
  if (candidate.organization && candidate.organization.length > 200) return false;
  if (candidate.title.length > 200) return false;
  if (candidate.description.length > 10000) return false;
  return true;
}
