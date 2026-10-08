/**
 * Ask Tech Opportunity answer contract (V1).
 *
 * Authority model: the provider may ONLY rephrase supplied facts
 * (curated FAQ entries + grounded published-opportunity rows). The
 * output schema has no eligibility, deadline, trust, or fit-score
 * fields, so model text cannot override deterministic truth — and a
 * strict local validator rejects anything outside the shape, plus any
 * authority-claiming, percentage, or score language.
 */
import {
  ASK_SOURCE_ROUTES,
  ASSISTANT_IDENTITY,
  faqEntryById,
  type AskFaqEntry,
} from "./knowledge";

export const ASK_SCHEMA_VERSION = 1 as const;
export const ASK_QUESTION_MIN_LENGTH = 4;
export const ASK_QUESTION_MAX_LENGTH = 500;
export const ASK_ANSWER_MAX_LENGTH = 800;
export const ASK_GROUNDED_LIMIT = 3;

export type AskMode = "ai" | "deterministic";
export type AskAvailabilityReason =
  | "faq"
  | "grounded"
  | "assistant"
  | "no_matches"
  | "out_of_scope"
  | "refused"
  | "invalid_question"
  | "disabled"
  | "zero_spend"
  | "not_configured"
  | "provider_unavailable"
  | "quota_exhausted"
  | "timeout"
  | "invalid_response";

export interface GroundedOpportunity {
  slug: string;
  title: string;
  categoryLabel: string;
  deadlineLabel: string;
  eligibilityLabel: string;
}

export interface AskAnswer {
  schemaVersion: typeof ASK_SCHEMA_VERSION;
  mode: AskMode;
  provider: string | null;
  availabilityReason: AskAvailabilityReason | null;
  text: string;
  sources: string[];
  opportunityRefs: string[];
  limitations: string[];
}

export interface ModelAskAssistance {
  answer: string;
  sources: string[];
  opportunityRefs: string[];
  limitations: string[];
}

function cleanFreeText(value: string, max: number): string {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[removed]")
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, "[removed]")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[removed]")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, "[removed]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Bounded, redacted question. Null means the route must reject it. */
export function sanitizeAskQuestion(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = cleanFreeText(raw, ASK_QUESTION_MAX_LENGTH + 100);
  if (cleaned.length < ASK_QUESTION_MIN_LENGTH) return null;
  if (cleaned.length > ASK_QUESTION_MAX_LENGTH) return null;
  return cleaned;
}

export function sanitizeAskFactsText(value: string, max: number): string {
  return cleanFreeText(value, max) ?? "";
}

function plainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  const keys = Object.keys(value).sort();
  return keys.length === expected.length && keys.every((key, index) => key === [...expected].sort()[index]);
}

const FORBIDDEN_ANSWER_PATTERNS =
  /\b\d+(?:\.\d+)?\s*%|\bpercent(?:age)?\b|\bmatch\s*score\b|\bguarantee(?:d|s)?\b|\bbest chance\b|\bwill be accepted\b|\bwill win\b|\bprobability\b|\byou are eligible\b|\byou're eligible\b|<\s*\/?\s*[a-z]/i;

function validAnswerText(value: unknown): value is string {
  return typeof value === "string" &&
    value.trim() === value &&
    value.length >= 2 &&
    value.length <= ASK_ANSWER_MAX_LENGTH &&
    !FORBIDDEN_ANSWER_PATTERNS.test(value);
}

/** Strict fail-closed validator for provider output. Extra keys rejected. */
export function validateModelAskAssistance(
  raw: unknown,
  groundedSlugs: readonly string[]
): ModelAskAssistance | null {
  if (!plainObject(raw) || !exactKeys(raw, ["answer", "sources", "opportunityRefs", "limitations"])) {
    return null;
  }
  if (!validAnswerText(raw.answer)) return null;
  if (!Array.isArray(raw.sources) || raw.sources.length > 4) return null;
  if (!raw.sources.every((source): source is string => typeof source === "string" && ASK_SOURCE_ROUTES.includes(source))) {
    return null;
  }
  if (!Array.isArray(raw.opportunityRefs) || raw.opportunityRefs.length > 3) return null;
  if (!raw.opportunityRefs.every((ref): ref is string => typeof ref === "string" && groundedSlugs.includes(ref))) {
    return null;
  }
  if (!Array.isArray(raw.limitations) || raw.limitations.length < 1 || raw.limitations.length > 3) return null;
  if (!raw.limitations.every((item): item is string =>
    typeof item === "string" && item.trim() === item && item.length >= 2 && item.length <= 200 &&
    !/[\u0000-\u001f\u007f<>]/.test(item))) {
    return null;
  }
  return {
    answer: raw.answer,
    sources: [...raw.sources],
    opportunityRefs: [...raw.opportunityRefs],
    limitations: [...raw.limitations],
  };
}

function faqAnswer(entry: AskFaqEntry): AskAnswer {
  return {
    schemaVersion: ASK_SCHEMA_VERSION,
    mode: "deterministic",
    provider: null,
    availabilityReason: "faq",
    text: entry.body,
    sources: [...entry.routes],
    opportunityRefs: [],
    limitations: ["Answered from Tech Opportunity's published help. The linked pages stay authoritative."],
  };
}

export function deterministicFaqAnswer(entryId: string): AskAnswer | null {
  const entry = faqEntryById(entryId);
  return entry ? faqAnswer(entry) : null;
}

/**
 * Deterministic fallback for conversational questions when no provider is
 * available: assistant identity plus the platform-help summary, extended
 * with grounded opportunity lines when the question also matched listings.
 * Never a primary answer while providers are configured.
 */
export function deterministicConversationalAnswer(
  facts: readonly GroundedOpportunity[]
): AskAnswer {
  const help = faqEntryById("using-platform");
  const lines = facts.map((fact) =>
    `${fact.title} (${fact.categoryLabel}) — ${fact.deadlineLabel}. ${fact.eligibilityLabel}`
  );
  const text = lines.length > 0
    ? `${ASSISTANT_IDENTITY} Based on your question, the closest published listings are: ${lines.join(" ")} Open any listing to confirm details at the official source.`
    : `${ASSISTANT_IDENTITY} ${help !== null ? help.body : "Ask me about opportunities, eligibility and deadlines, or using the platform."}`;
  return {
    schemaVersion: ASK_SCHEMA_VERSION,
    mode: "deterministic",
    provider: null,
    availabilityReason: "assistant",
    text,
    sources: ["/ask", "/"],
    opportunityRefs: facts.map((fact) => fact.slug),
    limitations: ["Answered from Tech Opportunity's published help without AI phrasing."],
  };
}

export function deterministicOpportunityAnswer(
  facts: readonly GroundedOpportunity[],
  question: string
): AskAnswer {
  if (facts.length === 0) {
    return {
      schemaVersion: ASK_SCHEMA_VERSION,
      mode: "deterministic",
      provider: null,
      availabilityReason: "no_matches",
      text: "Nothing in the current published list matches that. Try different keywords, browse the full shelf, or check back as new opportunities are reviewed.",
      sources: ["/"],
      opportunityRefs: [],
      limitations: ["Only the current published shelf was searched."],
    };
  }
  const lines = facts.map((fact) =>
    `${fact.title} (${fact.categoryLabel}) — ${fact.deadlineLabel}. ${fact.eligibilityLabel}`
  );
  return {
    schemaVersion: ASK_SCHEMA_VERSION,
    mode: "deterministic",
    provider: null,
    availabilityReason: "grounded",
    text: `Based on "${question}", the closest published listings are: ${lines.join(" ")} Open any listing to confirm details at the official source.`,
    sources: ["/"],
    opportunityRefs: facts.map((fact) => fact.slug),
    limitations: [
      "Only verified published listings were used; unknown eligibility stays unknown.",
      "The official source remains authoritative for every requirement.",
    ],
  };
}

export function deterministicRefusal(reason: "injection" | "out_of_scope"): AskAnswer {
  return {
    schemaVersion: ASK_SCHEMA_VERSION,
    mode: "deterministic",
    provider: null,
    availabilityReason: reason === "injection" ? "refused" : "out_of_scope",
    text: reason === "injection"
      ? "I can't help with that. Ask Tech Opportunity answers questions about opportunities, eligibility and trust information, application tracking, and using the platform."
      : "I don't have enough verified information to answer that. Ask Tech Opportunity covers opportunities, eligibility and trust information, application tracking, and platform help — try one of the suggested questions.",
    sources: ["/ask"],
    opportunityRefs: [],
    limitations: ["Ask answers only from verified platform information."],
  };
}

/** Merge validated provider phrasing around (never over) deterministic facts. */
export function mergeModelAskAssistance(
  deterministic: AskAnswer,
  assistance: ModelAskAssistance,
  provider: string
): AskAnswer {
  return {
    ...deterministic,
    mode: "ai",
    provider,
    availabilityReason: null,
    text: assistance.answer,
    sources: assistance.sources.length > 0 ? assistance.sources : deterministic.sources,
    opportunityRefs: assistance.opportunityRefs.length > 0
      ? assistance.opportunityRefs
      : deterministic.opportunityRefs,
    limitations: [...assistance.limitations, ...deterministic.limitations].slice(0, 4),
  };
}
