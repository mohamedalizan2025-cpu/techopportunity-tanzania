import type { SourceRecord, SourceType } from "./types";

const GENERIC_HTML_DENY_TYPES = new Set<SourceType>([
  "university",
  "government",
  "ngo",
  "company",
  "innovation_hub",
  "scholarship_provider",
  "fellowship_provider",
]);

export interface SourceAcquisitionPolicy {
  allowGenericHtml: boolean;
  reason: string;
}

/**
 * A homepage heading is not an opportunity boundary. Institutional sources
 * remain active for structured JSON-LD and advertised RSS/Atom feeds, but
 * their generic h1-h3 navigation/news/course headings cannot enter discovery.
 * A future source-specific adapter may opt in only with measured fixtures.
 */
export function sourceAcquisitionPolicy(
  source: Pick<SourceRecord, "name" | "source_type">
): SourceAcquisitionPolicy {
  if (GENERIC_HTML_DENY_TYPES.has(source.source_type)) {
    return {
      allowGenericHtml: false,
      reason: `${source.source_type} pages require structured/feed or source-specific opportunity boundaries`,
    };
  }
  return {
    allowGenericHtml: true,
    reason: "non-institutional source may use the bounded generic fallback",
  };
}
