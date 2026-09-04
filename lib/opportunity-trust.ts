import type { Opportunity } from "./types";

export const M31_QUALIFICATION_RULE_VERSION = "m31-2026-09-04-v1";

export type RelevanceDecision =
  | "unreviewed"
  | "relevant"
  | "ambiguous"
  | "not_relevant";

export type EligibilityDecision =
  | "unknown"
  | "tanzanians_eligible"
  | "tanzanians_not_eligible";

export type CountryVerification =
  | "unknown"
  | "verified_tanzania"
  | "verified_other";

export interface OpportunityTrust {
  relevanceDecision: RelevanceDecision;
  relevanceEvidence: string | null;
  eligibilityDecision: EligibilityDecision;
  eligibilityEvidence: string | null;
  qualificationRuleVersion: string | null;
  countryVerification: CountryVerification;
  countryEvidence: string | null;
  lastVerifiedAt: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  canonicalEvidenceUrl: string | null;
}

function normalized(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
}

function hostname(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Deterministic public-contamination guard. It intentionally combines strong
 * test markers with provenance/shape signals so legitimate opportunities
 * about software testing or statistical regression are not hidden.
 */
export function isTestOrPlaceholderOpportunity(
  opportunity: Pick<
    Opportunity,
    "title" | "description" | "url" | "sourceName" | "discoveryMethod"
  >
): boolean {
  const title = normalized(opportunity.title);
  const description = normalized(opportunity.description);
  const unlinked = !opportunity.sourceName?.trim();

  if (/\b(?:delete me|dummy record|placeholder opportunity)\b/.test(title)) {
    return true;
  }
  if (/^(?:production link )?test(?: opportunity| record)?\b/.test(title)) {
    return true;
  }
  if (/^regression (?:alpha|bravo)\b/.test(title) && unlinked) {
    return true;
  }
  if (
    title === description &&
    title.split(" ").length === 1 &&
    title.length < 12
  ) {
    return true;
  }
  if (
    unlinked &&
    !opportunity.discoveryMethod &&
    title.split(" ").length === 1 &&
    title.length < 12 &&
    description.length < 20
  ) {
    return true;
  }
  return unlinked && hostname(opportunity.url) === "example.org" &&
    /\b(?:test|regression|placeholder)\b/.test(title);
}

export function hasMeaningfulDescription(
  opportunity: Pick<Opportunity, "title" | "description">
): boolean {
  const title = normalized(opportunity.title);
  const description = normalized(opportunity.description);
  return description.length >= 80 && description !== title;
}

export function isKnownClosed(
  opportunity: Pick<Opportunity, "deadline">,
  now = new Date()
): boolean {
  if (!opportunity.deadline) return false;
  const deadline = Date.parse(opportunity.deadline);
  return Number.isFinite(deadline) && deadline < now.getTime();
}

function validEvidenceUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function hasConsistentDeadlineTruth(
  opportunity: Pick<Opportunity, "deadline" | "deadlinePrecision" | "deadlineEvidence">
): boolean {
  if (opportunity.deadline === null) {
    if (opportunity.deadlinePrecision === "unknown") {
      return opportunity.deadlineEvidence === null;
    }
    return opportunity.deadlinePrecision === "rolling" && Boolean(opportunity.deadlineEvidence);
  }
  return (
    (opportunity.deadlinePrecision === "date" || opportunity.deadlinePrecision === "date_time") &&
    Boolean(opportunity.deadlineEvidence)
  );
}

export function hasConsistentCountryTruth(opportunity: Opportunity): boolean {
  const trust = opportunity.trust;
  if (!trust) return false;
  if (trust.countryVerification === "unknown") return trust.countryEvidence === null;
  const country = opportunity.location?.country?.trim().toLowerCase();
  if (!country || !trust.countryEvidence) return false;
  return trust.countryVerification === "verified_tanzania"
    ? country === "tanzania"
    : country !== "tanzania";
}

export function isAiSearchableOpportunity(opportunity: Opportunity): boolean {
  const trust = opportunity.trust;
  if (!trust || opportunity.status !== "published") return false;
  if (isTestOrPlaceholderOpportunity(opportunity) || isKnownClosed(opportunity)) return false;
  if (!hasMeaningfulDescription(opportunity)) return false;
  if (trust.relevanceDecision !== "relevant" || !trust.relevanceEvidence) return false;
  if (
    trust.eligibilityDecision !== "tanzanians_eligible" ||
    !trust.eligibilityEvidence
  ) return false;
  if (!trust.qualificationRuleVersion || !trust.lastVerifiedAt) return false;
  if (!trust.decidedBy || !trust.decidedAt) return false;
  if (!validEvidenceUrl(trust.canonicalEvidenceUrl)) return false;
  if (!hasConsistentDeadlineTruth(opportunity)) return false;
  if (!hasConsistentCountryTruth(opportunity)) return false;
  return true;
}

export type PublicQualityBand = "trusted" | "reviewable" | "excluded";

export function publicQualityBand(
  opportunity: Opportunity,
  now = new Date()
): PublicQualityBand {
  if (
    opportunity.status !== "published" ||
    isTestOrPlaceholderOpportunity(opportunity) ||
    isKnownClosed(opportunity, now)
  ) {
    return "excluded";
  }
  if (isAiSearchableOpportunity(opportunity)) return "trusted";
  return "reviewable";
}

export function isFeatureEligible(opportunity: Opportunity, now = new Date()): boolean {
  return publicQualityBand(opportunity, now) === "trusted";
}

export function comparePublicTrust(a: Opportunity, b: Opportunity, now = new Date()): number {
  const rank: Record<PublicQualityBand, number> = {
    trusted: 0,
    reviewable: 1,
    excluded: 2,
  };
  return rank[publicQualityBand(a, now)] - rank[publicQualityBand(b, now)];
}
