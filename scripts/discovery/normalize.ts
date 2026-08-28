import { OPPORTUNITY_CATEGORIES } from "../../lib/types";
import type { CandidateOpportunity } from "./types";

export function normalizeCandidate(input: Record<string, string | null>, sourceId: string): CandidateOpportunity | null {
  const title = cleanText(input.title);
  const description = cleanText(input.description) || `${title} — discovered via source automation.`;
  const url = normalizeUrl(input.url ?? "");
  const category = resolveCategory(input.category, [title ?? "", description ?? ""]);
  const organization = cleanText(input.organization) || "Unknown organization";
  const deadline = normalizeDeadline(input.deadline ?? null);
  // COUNTRY HONESTY: no evidence, no country. The previous
  // "|| 'Tanzania'" default fabricated location facts for every candidate
  // without structured country evidence; unknown must remain unknown.
  const country = cleanText(input.country);
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
    // Evidence chain: the document testifying about this opportunity is the
    // document it was extracted from, unless the extractor recorded a
    // distinct one (roundup children carry their parent page).
    evidenceUrl: cleanText(input.evidenceUrl) ?? cleanText(input.sourceUrl) ?? null,
    referenceKind:
      input.referenceKind === "evidence-document" ? "evidence-document" : "source-base",
    discoveryMethod: (input.discoveryMethod as CandidateOpportunity["discoveryMethod"]) ?? "html",
  };
}

function cleanText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const cleaned = decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : null;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "\u2013",
  mdash: "\u2014",
  hellip: "\u2026",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201c",
  rdquo: "\u201d",
  copy: "\u00a9",
  reg: "\u00ae",
  trade: "\u2122",
  laquo: "\u00ab",
  raquo: "\u00bb",
};

/**
 * Deterministic HTML-entity decoding for extracted text. Evidence from the
 * pending queue showed RSS/HTML titles stored with raw entities ("...Open
 * &#8211; August 27, 2026"). Numeric entities and a closed list of common
 * named entities are decoded; unknown entities are left untouched (never
 * guessed). Pure and exported for testing.
 */
export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]{1,6});/gi, (_m, hex: string) => entityChar(parseInt(hex, 16)))
    .replace(/&#(\d{1,7});/g, (_m, dec: string) => entityChar(parseInt(dec, 10)))
    .replace(/&([a-z]{2,8});/gi, (m, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? m);
}

function entityChar(code: number): string {
  // Reject surrogates and out-of-range code points: an undecodable entity
  // collapses to nothing rather than corrupting the title.
  if (!Number.isFinite(code) || code < 1 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
    return "";
  }
  return String.fromCodePoint(code);
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
  // jobs/vacancies (owner-gated seed 0010): deliberately conservative —
  // vacancy/vacancies, "job(s)" as a word, ajira, nafasi za kazi. Terms
  // like "position", "career(s)" or "officer" stay UNMAPPED: they are
  // frequent in news headlines and would turn noise into job rows.
  ["jobs", /\bvacanc(?:y|ies)\b|\bjobs?\b|\bajira\b|nafasi za kazi/i],
  ["competition", /competiti|\bchallenge\b|\bpitch\b|\baward(s)?\b|\bprize\b|\bmashindano\b|\bshindano\b/i],
  ["workshop", /\bworkshop\b|\bbootcamp\b|\btraining\b|\bmafunzo\b/i],
  ["conference", /conference|\bsummit\b|\bforum\b|\bkongamano\b/i],
  ["tech-event", /\bmeetup\b|tech\s+week|tech\s+talk|\bdevfest\b|\bmakerspace\b/i],
];

/**
 * Unambiguous Swahili opportunity terms now covered: mafunzo (training),
 * mashindano/shindano (competition), kongamano (conference), udhamini
 * (scholarship), udahili/fomu ya maombi (admissions/application — backed by
 * the dedicated 'admissions' category), ajira/nafasi za kazi (employment —
 * backed by the owner-gated 'jobs' category). Terms WITHOUT a clear
 * category equivalent — tuzo (awards), maonesho (exhibition), miradi
 * (projects), orodha ya waliochaguliwa (selection lists) — are
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
