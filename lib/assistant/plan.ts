import { OPPORTUNITY_CATEGORIES, type OpportunityCategory } from "../types";
import { TANZANIA_REGIONS } from "../tanzania-regions";
import { sanitizeSearchQuery } from "../data/opportunities";

/**
 * Strict assistant query-plan contract (docs/AI_ASSISTANT_DESIGN.md §4).
 * The model may populate ONLY these fields. Every value is validated against
 * the application's real vocabularies; anything unknown/invalid becomes null
 * or the documented default. The plan contains no SQL, no table names, no
 * PostgREST syntax and no write semantics of any kind.
 */

export type AssistantIntent = "search";
export type AssistantSort = "deadline" | "newest";
export type AssistantDeadline = "soon" | "upcoming" | "rolling";
export type AssistantAnswerStyle = "list" | "count" | "summary";

export interface AssistantPlan {
  intent: AssistantIntent;
  q: string | null;
  category: OpportunityCategory | null;
  city: string | null;
  region: string | null;
  deadline: AssistantDeadline | null;
  sort: AssistantSort;
  answerStyle: AssistantAnswerStyle;
}

const DEADLINE_VALUES = new Set(["soon", "upcoming", "rolling"]);
const SORT_VALUES = new Set(["deadline", "newest"]);
const STYLE_VALUES = new Set(["list", "count", "summary"]);

function optionalString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length < 2 || cleaned.length > maxLength) return null;
  return cleaned;
}

function canonicalRegion(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (cleaned.length === 0) return null;
  return TANZANIA_REGIONS.find((r) => r.toLowerCase() === cleaned.toLowerCase()) ?? null;
}

export function parseAssistantPlan(raw: unknown): AssistantPlan {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const category =
    typeof obj.category === "string" &&
    (OPPORTUNITY_CATEGORIES as readonly string[]).includes(obj.category)
      ? (obj.category as OpportunityCategory)
      : null;

  const region = canonicalRegion(obj.region);

  const deadline =
    typeof obj.deadline === "string" && DEADLINE_VALUES.has(obj.deadline)
      ? (obj.deadline as AssistantDeadline)
      : null;

  const sort =
    typeof obj.sort === "string" && SORT_VALUES.has(obj.sort)
      ? (obj.sort as AssistantSort)
      : "deadline";

  const answerStyle =
    typeof obj.answer_style === "string" && STYLE_VALUES.has(obj.answer_style)
      ? (obj.answer_style as AssistantAnswerStyle)
      : "list";

  return {
    intent: "search",
    q: sanitizeSearchQuery(typeof obj.q === "string" ? obj.q : null),
    category,
    city: optionalString(obj.city, 80),
    region,
    deadline,
    sort,
    answerStyle,
  };
}

/**
 * Deterministic fallback plan used whenever the provider is unavailable or
 * returns an unusable plan: the whole question becomes sanitized keywords.
 */
export function fallbackPlan(question: string): AssistantPlan {
  return {
    intent: "search",
    q: sanitizeSearchQuery(question),
    category: null,
    city: null,
    region: null,
    deadline: null,
    sort: "deadline",
    answerStyle: "list",
  };
}

/** Filters the route exposes back to the user — only plan-derived values. */
export function appliedFilters(plan: AssistantPlan) {
  return {
    q: plan.q,
    category: plan.category,
    city: plan.city,
    region: plan.region,
    deadline: plan.deadline,
    sort: plan.sort,
  };
}
