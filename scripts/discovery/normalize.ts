import { OPPORTUNITY_CATEGORIES } from "../../lib/types";
import type { CandidateOpportunity } from "./types";

export function normalizeCandidate(input: Record<string, string | null>, sourceId: string): CandidateOpportunity | null {
  const title = cleanText(input.title);
  const description = cleanText(input.description) || `${title} — discovered via source automation.`;
  const url = normalizeUrl(input.url ?? "");
  const category = normalizeCategory(input.category ?? "");
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
}

function normalizeCategory(value: string): string | null {
  const normalized = value.toLowerCase().trim().replace(/\s+/g, "-");
  return (OPPORTUNITY_CATEGORIES as readonly string[]).includes(normalized)
    ? normalized
    : null;
}
