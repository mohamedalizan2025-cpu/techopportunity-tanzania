import { categoryLabel } from "../category-labels";
import { evaluateDeadline } from "../deadline-intelligence";
import type { MatchingInput } from "../personalization";
import { explainMatch } from "../personalization";
import { GEOGRAPHY_LABELS, SECTOR_LABELS, geographyOf, sectorOf } from "../taxonomy";
import type { Opportunity } from "../types";

export const OPPORTUNITY_INTELLIGENCE_SCHEMA_VERSION = 1 as const;

const MAX_DESCRIPTION_LENGTH = 3_500;
const MAX_EVIDENCE_LENGTH = 1_000;
const MAX_OUTPUT_TEXT_LENGTH = 320;
const MAX_OUTPUT_ITEMS = 5;

export type EvidenceBasis = "verified_fact" | "profile_observation" | "unknown";
export type InsightMode = "ai" | "deterministic";
export type InsightAvailabilityReason =
  | "disabled"
  | "zero_spend"
  | "not_configured"
  | "provider_unavailable"
  | "quota_exhausted"
  | "timeout"
  | "invalid_response";

export interface SanitizedOpportunityIntelligenceInput {
  schemaVersion: typeof OPPORTUNITY_INTELLIGENCE_SCHEMA_VERSION;
  opportunity: {
    type: Opportunity["category"];
    sector: ReturnType<typeof sectorOf>;
    geography: ReturnType<typeof geographyOf>;
    description: string;
    eligibility: {
      decision: "unknown" | "tanzanians_eligible" | "tanzanians_not_eligible";
      evidence: string | null;
    };
    deadline: {
      value: string | null;
      precision: Opportunity["deadlinePrecision"];
      evidence: string | null;
    };
  };
  profile: {
    careerLevel: MatchingInput["careerLevel"];
    fieldDiscipline: string | null;
    sectors: MatchingInput["sectors"];
    preferredTypes: MatchingInput["preferredTypes"];
    skills: string[];
    region: string | null;
    experienceLevel: MatchingInput["experienceLevel"];
  };
  deterministic: {
    whyFit: string[];
    deadlineUrgency: DeadlineUrgency;
  };
  evidenceCatalog: Array<{
    id: string;
    basis: Exclude<EvidenceBasis, "unknown">;
    statement: string;
  }>;
}

export interface InsightItem {
  text: string;
  basis: EvidenceBasis;
  evidenceRefs: string[];
}

export interface EligibilityAssessment {
  status: "verified_for_tanzanians" | "not_eligible" | "unknown";
  summary: string;
  evidence: string[];
}

export interface DeadlineUrgency {
  level: "urgent" | "upcoming" | "rolling" | "closed" | "unknown";
  summary: string;
}

export interface OpportunityInsight {
  schemaVersion: typeof OPPORTUNITY_INTELLIGENCE_SCHEMA_VERSION;
  mode: InsightMode;
  provider: string | null;
  availabilityReason: InsightAvailabilityReason | null;
  whyFit: InsightItem[];
  eligibilityAssessment: EligibilityAssessment;
  readiness: InsightItem[];
  missingOrUnclear: InsightItem[];
  nextActions: InsightItem[];
  deadlineUrgency: DeadlineUrgency;
  confidence: {
    level: "low" | "medium" | "high";
    limitations: string[];
  };
}

/**
 * This is the only shape a model may add. Authoritative eligibility,
 * geography, deadline state and deterministic fit are deliberately absent,
 * so provider output cannot override them.
 */
export interface ModelOpportunityAssistance {
  readiness: InsightItem[];
  missingOrUnclear: InsightItem[];
  nextActions: InsightItem[];
  confidence: {
    level: "low" | "medium" | "high";
    limitations: string[];
  };
}

function cleanInputText(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  const cleaned = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[contact removed]")
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, "[link removed]")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[contact removed]")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, "[identifier removed]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
  return cleaned || null;
}

function deadlineUrgency(opportunity: Opportunity, now: Date): DeadlineUrgency {
  const evaluated = evaluateDeadline(
    { deadline: opportunity.deadline, precision: opportunity.deadlinePrecision },
    now
  );
  if (evaluated.status === "closing_soon") {
    return {
      level: "urgent",
      summary: evaluated.remainingDays === 1
        ? "The verified deadline is about one day away."
        : `The verified deadline is in about ${evaluated.remainingDays} days.`,
    };
  }
  if (evaluated.status === "upcoming") {
    return {
      level: "upcoming",
      summary: evaluated.remainingDays === null
        ? "A future deadline is recorded."
        : `The verified deadline is in about ${evaluated.remainingDays} days.`,
    };
  }
  if (evaluated.status === "rolling") {
    return { level: "rolling", summary: "The source evidence records a rolling deadline." };
  }
  if (evaluated.status === "closed") {
    return { level: "closed", summary: "The recorded deadline has passed." };
  }
  return {
    level: "unknown",
    summary: "Deadline urgency cannot be established from the stored evidence.",
  };
}

function evidenceCatalog(
  opportunity: Opportunity,
  input: MatchingInput,
  whyFit: string[]
): SanitizedOpportunityIntelligenceInput["evidenceCatalog"] {
  const catalog: SanitizedOpportunityIntelligenceInput["evidenceCatalog"] = [];
  const add = (
    id: string,
    basis: Exclude<EvidenceBasis, "unknown">,
    statement: string | null
  ) => {
    if (statement) catalog.push({ id, basis, statement });
  };

  add("verified.type", "verified_fact", `Opportunity type: ${categoryLabel(opportunity.category)}`);
  const sector = sectorOf(opportunity);
  add("verified.sector", "verified_fact", sector ? `Sector: ${SECTOR_LABELS[sector]}` : null);
  const geography = geographyOf(opportunity);
  add("verified.geography", "verified_fact", geography ? `Geography: ${GEOGRAPHY_LABELS[geography]}` : null);
  add(
    "verified.eligibility",
    "verified_fact",
    cleanInputText(opportunity.trust?.eligibilityEvidence, MAX_EVIDENCE_LENGTH)
  );
  add("verified.deadline", "verified_fact", opportunity.deadline ? `Deadline: ${opportunity.deadline}` : null);
  add("profile.careerLevel", "profile_observation", input.careerLevel ? `Career level: ${input.careerLevel}` : null);
  add("profile.fieldDiscipline", "profile_observation", cleanInputText(input.fieldDiscipline, 80));
  add("profile.region", "profile_observation", cleanInputText(input.region, 80));
  input.skills.slice(0, 10).forEach((skill, index) => {
    add(`profile.skill.${index}`, "profile_observation", cleanInputText(skill, 40));
  });
  whyFit.slice(0, MAX_OUTPUT_ITEMS).forEach((reason, index) => {
    add(`match.${index}`, "profile_observation", cleanInputText(reason, MAX_OUTPUT_TEXT_LENGTH));
  });
  return catalog;
}

/**
 * Explicit privacy allowlist. Identity, contact data, auth IDs, activity,
 * goals, CVs and database metadata are never accepted by this function's
 * output contract. Free text is bounded and direct identifiers are redacted.
 */
export function buildSanitizedOpportunityIntelligenceInput(
  opportunity: Opportunity,
  input: MatchingInput,
  now = new Date()
): SanitizedOpportunityIntelligenceInput {
  const whyFit = explainMatch(opportunity, input).slice(0, MAX_OUTPUT_ITEMS);
  const eligibilityDecision = opportunity.trust?.eligibilityDecision ?? "unknown";
  return {
    schemaVersion: OPPORTUNITY_INTELLIGENCE_SCHEMA_VERSION,
    opportunity: {
      type: opportunity.category,
      sector: sectorOf(opportunity),
      geography: geographyOf(opportunity),
      description: cleanInputText(opportunity.description, MAX_DESCRIPTION_LENGTH) ?? "",
      eligibility: {
        decision: eligibilityDecision,
        evidence: cleanInputText(opportunity.trust?.eligibilityEvidence, MAX_EVIDENCE_LENGTH),
      },
      deadline: {
        value: opportunity.deadline,
        precision: opportunity.deadlinePrecision,
        evidence: cleanInputText(opportunity.deadlineEvidence, MAX_EVIDENCE_LENGTH),
      },
    },
    profile: {
      careerLevel: input.careerLevel,
      fieldDiscipline: cleanInputText(input.fieldDiscipline, 80),
      sectors: [...input.sectors].slice(0, 13),
      preferredTypes: [...input.preferredTypes].slice(0, 20),
      skills: input.skills
        .map((skill) => cleanInputText(skill, 40))
        .filter((skill): skill is string => skill !== null)
        .slice(0, 30),
      region: cleanInputText(input.region, 80),
      experienceLevel: input.experienceLevel,
    },
    deterministic: {
      whyFit,
      deadlineUrgency: deadlineUrgency(opportunity, now),
    },
    evidenceCatalog: evidenceCatalog(opportunity, input, whyFit),
  };
}

function eligibilityAssessment(
  input: SanitizedOpportunityIntelligenceInput
): EligibilityAssessment {
  const { decision, evidence } = input.opportunity.eligibility;
  if (decision === "tanzanians_eligible") {
    return {
      status: "verified_for_tanzanians",
      summary:
        "The authoritative evidence confirms access for Tanzanian applicants. It does not prove that you meet every other requirement.",
      evidence: evidence ? [evidence] : [],
    };
  }
  if (decision === "tanzanians_not_eligible") {
    return {
      status: "not_eligible",
      summary: "The authoritative evidence says Tanzanian applicants are not eligible.",
      evidence: evidence ? [evidence] : [],
    };
  }
  return {
    status: "unknown",
    summary: "Tanzania eligibility is unknown and must remain unconfirmed.",
    evidence: evidence ? [evidence] : [],
  };
}

export function buildDeterministicOpportunityInsight(
  input: SanitizedOpportunityIntelligenceInput,
  availabilityReason: InsightAvailabilityReason = "disabled"
): OpportunityInsight {
  const matchRefs = input.evidenceCatalog
    .filter((entry) => entry.id.startsWith("match."))
    .map((entry) => entry.id);
  const whyFit = input.deterministic.whyFit.map((text, index) => ({
    text,
    basis: "profile_observation" as const,
    evidenceRefs: matchRefs[index] ? [matchRefs[index]] : [],
  }));
  const hasProfileSignal = input.profile.careerLevel !== null ||
    input.profile.fieldDiscipline !== null ||
    input.profile.sectors.length > 0 ||
    input.profile.preferredTypes.length > 0 ||
    input.profile.skills.length > 0;

  const readiness: InsightItem[] = whyFit.length > 0
    ? [{
        text: "Your profile contains confirmed signals that match this opportunity; verify the remaining application requirements at the source.",
        basis: "profile_observation",
        evidenceRefs: matchRefs.slice(0, 3),
      }]
    : [{
        text: hasProfileSignal
          ? "The current profile does not establish a direct match beyond the verified opportunity facts."
          : "Add optional profile details to receive profile-based readiness guidance.",
        basis: "unknown",
        evidenceRefs: [],
      }];

  const nextActions: InsightItem[] = [
    {
      text: "Open the official source and confirm every eligibility and application requirement before applying.",
      basis: "verified_fact",
      evidenceRefs: input.opportunity.eligibility.evidence ? ["verified.eligibility"] : [],
    },
  ];
  if (input.opportunity.deadline.value) {
    nextActions.push({
      text: "Confirm the deadline timezone and plan submission time from the official source.",
      basis: "verified_fact",
      evidenceRefs: ["verified.deadline"],
    });
  }

  return {
    schemaVersion: OPPORTUNITY_INTELLIGENCE_SCHEMA_VERSION,
    mode: "deterministic",
    provider: null,
    availabilityReason,
    whyFit,
    eligibilityAssessment: eligibilityAssessment(input),
    readiness,
    missingOrUnclear: [
      {
        text: "Requirements not stated in the verified evidence remain unknown, including any documents, experience thresholds, or selection criteria not shown here.",
        basis: "unknown",
        evidenceRefs: [],
      },
    ],
    nextActions,
    deadlineUrgency: input.deterministic.deadlineUrgency,
    confidence: {
      level: "medium",
      limitations: [
        "This guidance uses only the stored opportunity evidence and selected profile fields.",
        "The official source remains authoritative and may contain requirements not captured here.",
      ],
    },
  };
}

function plainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  const keys = Object.keys(value).sort();
  return keys.length === expected.length && keys.every((key, index) => key === [...expected].sort()[index]);
}

function validOutputText(value: unknown): value is string {
  return typeof value === "string" &&
    value.trim() === value &&
    value.length >= 2 &&
    value.length <= MAX_OUTPUT_TEXT_LENGTH &&
    !/[\u0000-\u001f\u007f<>]/.test(value) &&
    !/\b\d+(?:\.\d+)?\s*%|\bpercent(?:age)?\b|\bmatch\s*score\b/i.test(value);
}

function parseInsightItems(
  value: unknown,
  catalog: Map<string, Exclude<EvidenceBasis, "unknown">>
): InsightItem[] | null {
  if (!Array.isArray(value) || value.length > MAX_OUTPUT_ITEMS) return null;
  const parsed: InsightItem[] = [];
  for (const item of value) {
    if (!plainObject(item) || !exactKeys(item, ["text", "basis", "evidenceRefs"])) return null;
    if (!validOutputText(item.text)) return null;
    if (item.basis !== "verified_fact" && item.basis !== "profile_observation" && item.basis !== "unknown") return null;
    if (!Array.isArray(item.evidenceRefs) || item.evidenceRefs.length > 4) return null;
    const refs = item.evidenceRefs;
    if (!refs.every((ref): ref is string => typeof ref === "string" && catalog.has(ref))) return null;
    if (item.basis === "unknown" && refs.length !== 0) return null;
    if (item.basis === "verified_fact" && refs.some((ref) => catalog.get(ref) !== "verified_fact")) return null;
    if (
      item.basis === "profile_observation" &&
      (refs.length === 0 || !refs.some((ref) => catalog.get(ref) === "profile_observation"))
    ) return null;
    parsed.push({ text: item.text, basis: item.basis, evidenceRefs: [...new Set(refs)] });
  }
  return parsed;
}

/** Strict fail-closed validator for provider output. Extra keys are rejected. */
export function validateModelOpportunityAssistance(
  raw: unknown,
  input: SanitizedOpportunityIntelligenceInput
): ModelOpportunityAssistance | null {
  if (!plainObject(raw) || !exactKeys(raw, ["readiness", "missingOrUnclear", "nextActions", "confidence"])) return null;
  const catalog = new Map(input.evidenceCatalog.map((entry) => [entry.id, entry.basis]));
  const readiness = parseInsightItems(raw.readiness, catalog);
  const missingOrUnclear = parseInsightItems(raw.missingOrUnclear, catalog);
  const nextActions = parseInsightItems(raw.nextActions, catalog);
  if (!readiness || !missingOrUnclear || !nextActions || !plainObject(raw.confidence)) return null;
  if (!exactKeys(raw.confidence, ["level", "limitations"])) return null;
  if (raw.confidence.level !== "low" && raw.confidence.level !== "medium" && raw.confidence.level !== "high") return null;
  if (!Array.isArray(raw.confidence.limitations) || raw.confidence.limitations.length > 4) return null;
  if (!raw.confidence.limitations.every(validOutputText)) return null;
  return {
    readiness,
    missingOrUnclear,
    nextActions,
    confidence: {
      level: raw.confidence.level,
      limitations: [...raw.confidence.limitations],
    },
  };
}

/** Provider additions are merged around, never over, deterministic truth. */
export function mergeModelOpportunityAssistance(
  deterministic: OpportunityInsight,
  assistance: ModelOpportunityAssistance,
  provider: string
): OpportunityInsight {
  return {
    ...deterministic,
    mode: "ai",
    provider,
    availabilityReason: null,
    readiness: assistance.readiness.length > 0 ? assistance.readiness : deterministic.readiness,
    missingOrUnclear: assistance.missingOrUnclear.length > 0
      ? assistance.missingOrUnclear
      : deterministic.missingOrUnclear,
    nextActions: assistance.nextActions.length > 0 ? assistance.nextActions : deterministic.nextActions,
    confidence: {
      level: assistance.confidence.level,
      limitations: [
        ...assistance.confidence.limitations,
        ...deterministic.confidence.limitations,
      ].slice(0, 5),
    },
  };
}
