import { OPPORTUNITY_CATEGORIES } from "../../lib/types";
import type { CandidateOpportunity } from "./types";

export function normalizeCandidate(input: Record<string, string | null>, sourceId: string): CandidateOpportunity | null {
  const title = cleanText(input.title);
  const description = cleanText(input.description) || `${title} — discovered via source automation.`;
  const url = normalizeUrl(input.url ?? "");
  const category = resolveCategory(input.category, [title ?? "", description ?? ""]);
  const organization = cleanText(input.organization) || "Unknown organization";
  const deadline = normalizeDeadline(input.deadline ?? null);
  const country = cleanText(input.country) || "Tanzania";
  const venueName = cleanText(input.venueName);
  const address = cleanText(input.address);
  const city = cleanText(input.city);
  const region = cleanText(input.region);

  if (!title || !url) return null;
  if (!category) return null;

  return {
    title,
    description: description.slice(0, 10000),
    category,
    organization,
    url,
    deadline,
    venueName,
    address,
    city,
    region,
    country,
    sourceId,
    sourceUrl: input.sourceUrl ?? "",
    discoveryMethod: (input.discoveryMethod as CandidateOpportunity["discoveryMethod"]) ?? "html",
  };
}

function cleanText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : null;
}

function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function normalizeDeadline(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  // Date-only values are calendar dates: parse as UTC midnight so the stored
  // instant is identical regardless of the machine's timezone.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? new Date(`${trimmed}T00:00:00Z`)
    : new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function resolveCategory(value: string | null | undefined, hintTexts: string[]): string | null {
  const explicit = cleanText(value)?.toLowerCase().trim().replace(/\s+/g, "-");
  if (explicit) {
    return (OPPORTUNITY_CATEGORIES as readonly string[]).includes(explicit)
      ? explicit
      : null;
  }
  const inferred = inferCategory(hintTexts);
  return (OPPORTUNITY_CATEGORIES as readonly string[]).includes(inferred) ? inferred : "other";
}

const CATEGORY_PATTERNS: Array<[string, RegExp]> = [
  ["admissions", /\budahili\b|admission|fomu ya maombi|application for|application window/i],
  ["hackathon", /\bhack(?:athon|fest)\b/i],
  ["scholarship", /\bscholarship\b|bursary|\budhamini\b/i],
  ["fellowship", /\bfellowship\b/i],
  ["grant", /\bgrants?\b|call for proposals|\bfunding\b/i],
  ["internship", /\binternship(s)?\b|\bintern(s)?\b/i],
  ["competition", /competiti|\bchallenge\b|\bpitch\b|\baward(s)?\b|\bprize\b|\bmashindano\b|\bshindano\b/i],
  ["workshop", /\bworkshop\b|\bbootcamp\b|\btraining\b|\bmafunzo\b/i],
  ["conference", /conference|\bsummit\b|\bforum\b|\bkongamano\b/i],
  ["tech-event", /\bmeetup\b|tech\s+week|tech\s+talk|\bdevfest\b|\bmakerspace\b/i],
];

/**
 * Unambiguous Swahili opportunity terms now covered: mafunzo (training),
 * mashindano/shindano (competition), kongamano (conference), udhamini
 * (scholarship), udahili/fomu ya maombi (admissions/application — backed by
 * the dedicated 'admissions' category). Terms WITHOUT a clear category
 * equivalent — ajira (employment), tuzo (awards), maonesho (exhibition),
 * miradi (projects), orodha ya waliochaguliwa (selection lists) — are
 * deliberately NOT mapped: they stay "other" for the human moderator
 * instead of being guessed.
 */

export function inferCategory(texts: string[]): string {
  const haystack = texts.filter(Boolean).join(" ");
  for (const [category, pattern] of CATEGORY_PATTERNS) {
    if (pattern.test(haystack)) return category;
  }
  return "other";
}
