import {
  extractCandidatesFromAtom,
  extractCandidatesFromHtml,
  extractCandidatesFromJsonLd,
  extractCandidatesFromRss,
} from "./extract";

/**
 * Source-adapter boundary — the ONLY layer that knows where evidence came
 * from. The formal chain this file participates in:
 *
 *   Source (registry row: WHO publishes)
 *     ↓ evidence acquisition (fetch.ts — bounded documents per channel)
 *   Evidence acquisition
 *     ↓ this file: adapters turn the document into raw candidates
 *   Candidate extraction
 *     ↓ normalize.ts → optional one-hop detail → validate.ts → qualify → dedupe.ts
 *   Pending opportunity (moderation queue)
 *     ↓ human verification
 *   Published opportunity
 *
 * A "source adapter" here is deliberately NOT a class or plugin system —
 * it is a pure function that turns one fetched document (page, feed, or
 * future API payload rendered as text) into raw candidate records.
 * Everything after extraction (normalization, validation, dedupe,
 * moderation) is adapter-agnostic: candidates carry an evidenceUrl and a
 * referenceKind (see types.ts) instead of channel knowledge, so future
 * channels — public APIs, permitted public social sources, manually
 * supplied evidence (EvidenceChannel) — join without touching the
 * opportunity domain.
 */
export type RawCandidate = Record<string, string | null>;

export type EvidenceExtractor = (
  body: string,
  sourceId: string,
  sourceUrl: string
) => RawCandidate[];

/**
 * Ordered adapter registry. Every extractor is content-sniffing and safe
 * to run on any body (a foreign format yields zero candidates), so order
 * affects only attribution, not correctness: JSON-LD is richest and runs
 * first; RSS precedes Atom because real Atom documents contain no
 * `<item>` blocks, so feed attribution stays correct either way.
 */
export const EVIDENCE_EXTRACTORS: Array<{
  family: string;
  extract: EvidenceExtractor;
}> = [
  { family: "json-ld", extract: extractCandidatesFromJsonLd },
  { family: "rss", extract: extractCandidatesFromRss },
  { family: "atom", extract: extractCandidatesFromAtom },
  { family: "html", extract: extractCandidatesFromHtml },
];

/** Runs every registered adapter over one document. */
export function extractAllCandidates(
  body: string,
  sourceId: string,
  sourceUrl: string
): RawCandidate[] {
  return EVIDENCE_EXTRACTORS.flatMap(({ extract }) =>
    extract(body, sourceId, sourceUrl)
  );
}

/**
 * Feed-family adapters only. Advertised feeds (`<link rel="alternate">`)
 * are item-level evidence sources; they must never be sniffed with the
 * page extractors. Future API/social channels that deliver structured
 * item lists belong in this family.
 */
export const FEED_EXTRACTORS: Array<{
  family: string;
  extract: EvidenceExtractor;
}> = [
  { family: "rss", extract: extractCandidatesFromRss },
  { family: "atom", extract: extractCandidatesFromAtom },
];

export function extractFeedCandidates(
  body: string,
  sourceId: string,
  feedUrl: string
): RawCandidate[] {
  return FEED_EXTRACTORS.flatMap(({ extract }) =>
    extract(body, sourceId, feedUrl)
  );
}
