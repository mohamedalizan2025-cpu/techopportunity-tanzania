import {
  hasMeaningfulDescription,
  hasConsistentCountryTruth,
  hasConsistentDeadlineTruth,
  isAiSearchableOpportunity,
  isKnownClosed,
  isTestOrPlaceholderOpportunity,
} from "./opportunity-trust";
import type { Opportunity } from "./types";

export interface AiReadinessInput {
  published: Opportunity[];
  featured: Opportunity[];
  duplicateIntegrityPassed: boolean;
  securityBoundariesPassed: boolean;
}

export interface AiReadinessCriterion {
  id: string;
  passed: boolean;
  observed: number | boolean;
  required: string;
}

export interface AiReadinessReport {
  schemaVersion: 1;
  state: "READY" | "NO_GO";
  criteria: AiReadinessCriterion[];
}

export function evaluateAiReadiness(input: AiReadinessInput): AiReadinessReport {
  const published = input.published.filter((item) => item.status === "published");
  const count = (predicate: (item: Opportunity) => boolean) =>
    published.filter(predicate).length;
  const criteria: AiReadinessCriterion[] = [
    { id: "published_corpus_nonempty", passed: published.length > 0, observed: published.length, required: "> 0" },
    { id: "no_public_test_or_placeholder", passed: count(isTestOrPlaceholderOpportunity) === 0, observed: count(isTestOrPlaceholderOpportunity), required: "0" },
    { id: "no_known_closed_featured", passed: input.featured.filter((item) => isKnownClosed(item)).length === 0, observed: input.featured.filter((item) => isKnownClosed(item)).length, required: "0" },
    { id: "canonical_evidence_complete", passed: count((item) => !item.trust?.canonicalEvidenceUrl) === 0, observed: count((item) => !item.trust?.canonicalEvidenceUrl), required: "0 missing" },
    { id: "meaningful_descriptions_complete", passed: count((item) => !hasMeaningfulDescription(item)) === 0, observed: count((item) => !hasMeaningfulDescription(item)), required: "0 missing" },
    { id: "relevance_evidence_complete", passed: count((item) => item.trust?.relevanceDecision !== "relevant" || !item.trust.relevanceEvidence) === 0, observed: count((item) => item.trust?.relevanceDecision !== "relevant" || !item.trust.relevanceEvidence), required: "0 missing" },
    { id: "verified_eligibility_complete", passed: count((item) => item.trust?.eligibilityDecision !== "tanzanians_eligible" || !item.trust.eligibilityEvidence) === 0, observed: count((item) => item.trust?.eligibilityDecision !== "tanzanians_eligible" || !item.trust.eligibilityEvidence), required: "0 missing" },
    { id: "known_deadline_evidence_complete", passed: count((item) => Boolean(item.deadline) && !item.deadlineEvidence) === 0, observed: count((item) => Boolean(item.deadline) && !item.deadlineEvidence), required: "0 missing" },
    { id: "deadline_semantics_consistent", passed: count((item) => !hasConsistentDeadlineTruth(item)) === 0, observed: count((item) => !hasConsistentDeadlineTruth(item)), required: "0 inconsistent or unspecified" },
    { id: "country_truth_consistent", passed: count((item) => !hasConsistentCountryTruth(item)) === 0, observed: count((item) => !hasConsistentCountryTruth(item)), required: "0 inconsistent" },
    { id: "moderation_attribution_complete", passed: count((item) => !item.trust?.decidedBy || !item.trust.decidedAt) === 0, observed: count((item) => !item.trust?.decidedBy || !item.trust.decidedAt), required: "0 missing" },
    { id: "qualification_version_complete", passed: count((item) => !item.trust?.qualificationRuleVersion) === 0, observed: count((item) => !item.trust?.qualificationRuleVersion), required: "0 missing" },
    { id: "all_published_ai_searchable", passed: count((item) => !isAiSearchableOpportunity(item)) === 0, observed: count((item) => !isAiSearchableOpportunity(item)), required: "0 failing" },
    { id: "duplicate_integrity", passed: input.duplicateIntegrityPassed, observed: input.duplicateIntegrityPassed, required: "true" },
    { id: "security_boundaries", passed: input.securityBoundariesPassed, observed: input.securityBoundariesPassed, required: "true" },
  ];
  return {
    schemaVersion: 1,
    state: criteria.every((criterion) => criterion.passed) ? "READY" : "NO_GO",
    criteria,
  };
}
