import type { Opportunity, OpportunityCategory } from "./types";
import { OPPORTUNITY_CATEGORIES } from "./types";
import { categoryLabel } from "./category-labels";
import {
  SECTORS,
  SECTOR_LABELS,
  sectorOf,
  type Sector,
} from "./taxonomy";

/**
 * Personalization foundation for the TALENT side (docs/PLATFORM_ARCHITECTURE.md).
 *
 * This module is a PURE, DETERMINISTIC layer. It never touches the database or
 * the network, never fabricates a signal from missing data, and never reduces a
 * fit to a numeric figure or other match gimmick. It defines:
 *
 *   1. the talent profile shape and its bounded vocabularies (reusing the
 *      existing opportunity taxonomy for sectors and preferred types);
 *   2. a clean, versioned MATCHING-INPUT CONTRACT (`buildMatchingInput`) that
 *      normalizes any profile into one stable value a future recommender —
 *      including a grounded AI layer, only after the AI readiness contract
 *      passes — can rely on without reshaping the data model;
 *   3. an EXPLAINABLE ranking (`rankForYou`) that returns human-readable
 *      reasons for every recommendation.
 *
 * Explore is never affected by anything here: personalization only orders and
 * explains the SAME trusted, already-published corpus (see lib/data/for-you.ts).
 */

// --- Career / experience vocabularies --------------------------------------

export const CAREER_LEVELS = [
  "student",
  "recent-graduate",
  "early-career",
  "mid-career",
  "senior",
  "researcher",
  "founder",
  "other",
] as const;
export type CareerLevel = (typeof CAREER_LEVELS)[number];

export const CAREER_LEVEL_LABELS: Record<CareerLevel, string> = {
  student: "Student",
  "recent-graduate": "Recent graduate",
  "early-career": "Early career",
  "mid-career": "Mid career",
  senior: "Senior / established",
  researcher: "Researcher / academic",
  founder: "Founder / entrepreneur",
  other: "Other",
};

export const EXPERIENCE_LEVELS = [
  "none",
  "entry",
  "some",
  "experienced",
  "expert",
] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  none: "No experience yet",
  entry: "Entry level (0–1 years)",
  some: "Some experience (1–3 years)",
  experienced: "Experienced (3–7 years)",
  expert: "Expert (7+ years)",
};

/** Array bounds mirror the migration CHECK constraints (0018). */
export const MAX_SECTORS = 13;
export const MAX_PREFERRED_TYPES = 20;
export const MAX_SKILLS = 30;
export const MAX_FIELD_DISCIPLINE = 80;
export const MAX_REGION = 80;
export const MAX_GOALS = 500;

// --- Profile shape ---------------------------------------------------------

export interface TalentProfile {
  /** Core. */
  careerLevel: CareerLevel | null;
  fieldDiscipline: string | null;
  sectors: Sector[];
  preferredTypes: OpportunityCategory[];
  /** Optional / progressive. */
  skills: string[];
  region: string | null;
  experienceLevel: ExperienceLevel | null;
  goals: string | null;
}

export const EMPTY_TALENT_PROFILE: TalentProfile = {
  careerLevel: null,
  fieldDiscipline: null,
  sectors: [],
  preferredTypes: [],
  skills: [],
  region: null,
  experienceLevel: null,
  goals: null,
};

// --- Normalizers (shared by form parsing and row mapping) ------------------

export function parseCareerLevel(raw: unknown): CareerLevel | null {
  return typeof raw === "string" &&
    (CAREER_LEVELS as readonly string[]).includes(raw)
    ? (raw as CareerLevel)
    : null;
}

export function parseExperienceLevel(raw: unknown): ExperienceLevel | null {
  return typeof raw === "string" &&
    (EXPERIENCE_LEVELS as readonly string[]).includes(raw)
    ? (raw as ExperienceLevel)
    : null;
}

/**
 * Bounded free-text: strips control characters and PostgREST/URL grammar,
 * collapses whitespace, and enforces the min/max length. Returns null when
 * nothing usable remains — blank stays absent, never inferred.
 */
function boundedText(
  raw: unknown,
  min: number,
  max: number
): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[,%()'"*\\;]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
  return cleaned.length >= min ? cleaned : null;
}

export function sanitizeFieldDiscipline(raw: unknown): string | null {
  return boundedText(raw, 2, MAX_FIELD_DISCIPLINE);
}

export function sanitizeRegion(raw: unknown): string | null {
  return boundedText(raw, 2, MAX_REGION);
}

export function sanitizeGoals(raw: unknown): string | null {
  return boundedText(raw, 1, MAX_GOALS);
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "en"));
}

/** Keeps only recognized sector slugs, deduped and deterministically ordered. */
export function parseSectorList(raw: unknown): Sector[] {
  const values = Array.isArray(raw) ? raw : [];
  const recognized = values.filter((value): value is Sector =>
    typeof value === "string" &&
    (SECTORS as readonly string[]).includes(value)
  );
  return uniqueSorted(recognized).slice(0, MAX_SECTORS);
}

/** Keeps only recognized opportunity-type slugs, deduped and ordered. */
export function parseTypeList(raw: unknown): OpportunityCategory[] {
  const values = Array.isArray(raw) ? raw : [];
  const recognized = values.filter((value): value is OpportunityCategory =>
    typeof value === "string" &&
    (OPPORTUNITY_CATEGORIES as readonly string[]).includes(value)
  );
  return uniqueSorted(recognized).slice(0, MAX_PREFERRED_TYPES);
}

/** Skills are free text: lowercased, trimmed, de-duplicated, bounded. */
export function parseSkillList(raw: unknown): string[] {
  const values = Array.isArray(raw) ? raw : [];
  const cleaned = values
    .filter((value): value is string => typeof value === "string")
    .map((value) =>
      value
        .normalize("NFKC")
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 40)
        .toLowerCase()
    )
    .filter((value) => value.length >= 2);
  return uniqueSorted(cleaned).slice(0, MAX_SKILLS);
}

/**
 * Normalize a loosely-typed profile source (a database row or parsed form) into
 * a clean TalentProfile. Every field passes through the same bound/whitelist
 * normalizers, so an out-of-vocabulary or oversized value can never survive into
 * the matching contract.
 */
export function normalizeTalentProfile(source: {
  careerLevel?: unknown;
  fieldDiscipline?: unknown;
  sectors?: unknown;
  preferredTypes?: unknown;
  skills?: unknown;
  region?: unknown;
  experienceLevel?: unknown;
  goals?: unknown;
}): TalentProfile {
  return {
    careerLevel: parseCareerLevel(source.careerLevel),
    fieldDiscipline: sanitizeFieldDiscipline(source.fieldDiscipline),
    sectors: parseSectorList(source.sectors),
    preferredTypes: parseTypeList(source.preferredTypes),
    skills: parseSkillList(source.skills),
    region: sanitizeRegion(source.region),
    experienceLevel: parseExperienceLevel(source.experienceLevel),
    goals: sanitizeGoals(source.goals),
  };
}

// --- Matching-input contract ----------------------------------------------

/**
 * The clean, deterministic input a recommender consumes. Versioned so a future
 * model change is explicit rather than silent. Derived entirely from the user's
 * OWN profile — never from another user's data and never from an organization.
 */
export interface MatchingInput {
  schemaVersion: 1;
  careerLevel: CareerLevel | null;
  fieldDiscipline: string | null;
  sectors: Sector[];
  preferredTypes: OpportunityCategory[];
  skills: string[];
  region: string | null;
  experienceLevel: ExperienceLevel | null;
  goals: string | null;
}

export function buildMatchingInput(profile: TalentProfile): MatchingInput {
  return {
    schemaVersion: 1,
    careerLevel: profile.careerLevel,
    fieldDiscipline: profile.fieldDiscipline,
    sectors: uniqueSorted(profile.sectors),
    preferredTypes: uniqueSorted(profile.preferredTypes),
    skills: uniqueSorted(profile.skills),
    region: profile.region,
    experienceLevel: profile.experienceLevel,
    goals: profile.goals,
  };
}

/**
 * A profile is "core-complete" when it carries at least one usable core signal.
 * Until then For You stays honestly empty rather than guessing — the user can
 * always keep using Explore.
 */
export function hasCoreProfile(input: MatchingInput): boolean {
  return (
    input.careerLevel !== null ||
    input.fieldDiscipline !== null ||
    input.sectors.length > 0 ||
    input.preferredTypes.length > 0
  );
}

// --- Explainable ranking ---------------------------------------------------

function normalizedWords(value: string | null | undefined): string[] {
  if (!value) return [];
  return (
    value
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLocaleLowerCase("en")
      .match(/[\p{L}\p{N}]+/gu) ?? []
  );
}

function containsAllWords(haystack: string[], needle: string): boolean {
  const words = normalizedWords(needle);
  if (words.length === 0) return false;
  return words.every((word) => haystack.includes(word));
}

function sameText(left: string | null | undefined, right: string | null): boolean {
  if (!left || !right) return false;
  return left.trim().localeCompare(right, "en", { sensitivity: "accent" }) === 0;
}

/**
 * Deterministic, human-readable reasons this opportunity fits the profile. No
 * numeric weight is exposed. Every reason maps to a real signal on the row;
 * absence of a signal produces no reason (unknown stays unknown).
 */
export function explainMatch(
  opportunity: Opportunity,
  input: MatchingInput
): string[] {
  const reasons: string[] = [];

  if (input.preferredTypes.includes(opportunity.category)) {
    reasons.push(`A type you follow: ${categoryLabel(opportunity.category)}`);
  }

  const sector = sectorOf(opportunity);
  if (sector !== null && input.sectors.includes(sector)) {
    reasons.push(`In your field: ${SECTOR_LABELS[sector]}`);
  }

  const haystack = normalizedWords(
    [opportunity.title, opportunity.description].join(" \n ")
  );

  if (input.fieldDiscipline !== null && containsAllWords(haystack, input.fieldDiscipline)) {
    reasons.push(`Matches your discipline: ${input.fieldDiscipline}`);
  }

  for (const skill of input.skills) {
    if (containsAllWords(haystack, skill)) {
      reasons.push(`Uses your skill: ${skill}`);
      if (reasons.filter((reason) => reason.startsWith("Uses your skill:")).length >= 2) {
        break;
      }
    }
  }

  if (
    input.region !== null &&
    (sameText(opportunity.location?.region, input.region) ||
      sameText(opportunity.location?.city, input.region))
  ) {
    reasons.push(`In your region: ${input.region}`);
  }

  return reasons;
}

export interface RankedOpportunity {
  opportunity: Opportunity;
  reasons: string[];
}

function deadlineRank(opportunity: Opportunity): number {
  const timestamp = opportunity.deadline ? Date.parse(opportunity.deadline) : NaN;
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
}

/**
 * Rank the trusted corpus for one profile. Deterministic ordering:
 *   1. more matched signals first;
 *   2. soonest known deadline first (unknown deadlines last);
 *   3. stable title, then id tie-break.
 * Only opportunities with at least one real signal are returned — For You never
 * pads with unexplained rows. The corpus itself is already the published,
 * lifecycle-active set, so personalization restricts nothing that Explore shows.
 */
export function rankForYou(
  corpus: readonly Opportunity[],
  input: MatchingInput
): RankedOpportunity[] {
  const ranked: RankedOpportunity[] = [];
  for (const opportunity of corpus) {
    const reasons = explainMatch(opportunity, input);
    if (reasons.length === 0) continue;
    ranked.push({ opportunity, reasons });
  }
  ranked.sort((left, right) => {
    if (right.reasons.length !== left.reasons.length) {
      return right.reasons.length - left.reasons.length;
    }
    const leftDeadline = deadlineRank(left.opportunity);
    const rightDeadline = deadlineRank(right.opportunity);
    if (leftDeadline !== rightDeadline) {
      return leftDeadline < rightDeadline ? -1 : 1;
    }
    return (
      left.opportunity.title.localeCompare(right.opportunity.title, "en", {
        sensitivity: "base",
      }) || left.opportunity.id.localeCompare(right.opportunity.id)
    );
  });
  return ranked;
}
