import { decodeHtmlEntities } from "./normalize";
import type { RawCandidate } from "./adapters";
import type { SourceRecord } from "./types";

/**
 * Narrow, fixture-backed, SOURCE-SPECIFIC adapters.
 *
 * Institutional sources (universities, agencies, NGOs, companies) are blocked
 * from the GENERIC html extractor by source-policy.ts: a homepage heading is
 * not an opportunity boundary, and their news/nav furniture must never enter
 * discovery. source-policy.ts explicitly reserves ONE exception — "a future
 * source-specific adapter may opt in only with measured fixtures." This file
 * is that exception, and nothing more.
 *
 * A source adapter is a pure function that turns ONE already-fetched LISTING
 * document into raw candidates. It is:
 *   - keyed to an exact registry base_url, so it fires ONLY for a dedicated
 *     listing row the owner added by seed — never for the already-active
 *     site homepage;
 *   - structural, not semantic: it selects a precise, repeating detail-page
 *     boundary (a URL-shape contract verified against live fixtures) and
 *     reads the card title; it never decides relevance. Every candidate it
 *     emits still runs the FULL unchanged chain — normalize → validate →
 *     qualify → shouldAdmitCandidate. Weakening the parser is never the
 *     answer: a source that cannot produce a clean actionable boundary is
 *     rejected, not accommodated.
 */

export interface SourceAdapter {
  /** Human-readable adapter id, surfaced in logs/tests. */
  readonly id: string;
  extract(body: string, source: Pick<SourceRecord, "base_url">): RawCandidate[];
}

/**
 * Canonical lookup key: lower-cased host, path with any single trailing
 * slash removed, query/hash dropped. Registry rows and adapter keys are
 * compared through this so `https://x/event/` and `https://x/event` match.
 */
export function adapterKeyFor(baseUrl: string): string | null {
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname.toLowerCase();
    const path = url.pathname.replace(/\/+$/, "");
    return `${host}${path}`.toLowerCase();
  } catch {
    return null;
  }
}

interface ListingSpec {
  /** Detail-page href must match this against the listing origin. */
  detailHref: (href: URL, listing: URL) => boolean;
  minTitle: number;
  maxTitle: number;
}

const JUNK_TEXT = /^(continue reading|read more|read the full|learn more|details|more info|view all|see more|click here|home|about|contact|login|sign in|facebook|twitter|whatsapp|share)\b/i;

function extractListingAnchors(
  body: string,
  source: Pick<SourceRecord, "base_url">,
  spec: ListingSpec
): RawCandidate[] {
  let listing: URL;
  try {
    listing = new URL(source.base_url);
  } catch {
    return [];
  }
  const out: RawCandidate[] = [];
  const seen = new Set<string>();
  for (const match of body.matchAll(/<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]{0,300}?)<\/a>/gi)) {
    let target: URL;
    try {
      target = new URL(match[1], listing);
    } catch {
      continue;
    }
    if (target.protocol !== "http:" && target.protocol !== "https:") continue;
    if (target.host !== listing.host) continue;
    if (!spec.detailHref(target, listing)) continue;
    const title = decodeHtmlEntities(match[2].replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .trim();
    if (title.length < spec.minTitle || title.length > spec.maxTitle) continue;
    if (JUNK_TEXT.test(title)) continue;
    const abs = target.toString();
    if (seen.has(abs)) continue;
    seen.add(abs);
    out.push({
      title,
      url: abs,
      description: title,
      sourceUrl: source.base_url,
      discoveryMethod: "html",
    });
  }
  return out;
}

/**
 * University of Dar es Salaam — dedicated announcements listing
 * (`https://www.udsm.ac.tz/announcement`, a Drupal view distinct from the
 * site homepage). Boundary contract: an intra-host link whose path is
 * `/announcement/<slug>` is one announcement detail page.
 */
const udsmAnnouncementsAdapter: SourceAdapter = {
  id: "udsm-announcements",
  extract(body, source) {
    return extractListingAnchors(body, source, {
      detailHref: (href) => /^\/announcement\/[^/?#]+\/?$/.test(href.pathname),
      minTitle: 16,
      maxTitle: 200,
    });
  },
};

/**
 * Nelson Mandela African Institution of Science and Technology — events
 * archive (`https://nm-aist.ac.tz/event/`, WordPress). Boundary contract: an
 * intra-host link whose path is `/event/<slug>/` is one event detail page; the
 * `/event/` archive index itself is excluded.
 */
const nmAistEventsAdapter: SourceAdapter = {
  id: "nm-aist-events",
  extract(body, source) {
    return extractListingAnchors(body, source, {
      detailHref: (href, listing) =>
        /^\/event\/[^/?#]+\/?$/.test(href.pathname) &&
        href.pathname.replace(/\/+$/, "") !== listing.pathname.replace(/\/+$/, ""),
      minTitle: 16,
      maxTitle: 200,
    });
  },
};

/** Exact registry base_url → adapter. Adding a row here is the opt-in. */
const ADAPTERS: ReadonlyArray<{ key: string; adapter: SourceAdapter }> = [
  { key: "www.udsm.ac.tz/announcement", adapter: udsmAnnouncementsAdapter },
  { key: "nm-aist.ac.tz/event", adapter: nmAistEventsAdapter },
];

export const SOURCE_ADAPTER_IDS = ADAPTERS.map(({ adapter }) => adapter.id);

/** Returns the registered adapter for a source, or undefined. */
export function findSourceAdapter(
  source: Pick<SourceRecord, "base_url">
): SourceAdapter | undefined {
  const key = adapterKeyFor(source.base_url);
  if (!key) return undefined;
  return ADAPTERS.find((entry) => entry.key === key)?.adapter;
}

/**
 * Runs the source-specific adapter, if one is registered for this exact
 * base_url. Returns [] for every other source, so this is always safe to call
 * and never changes behaviour for sources without a measured fixture.
 */
export function extractSourceAdapterCandidates(
  body: string,
  source: Pick<SourceRecord, "base_url">
): RawCandidate[] {
  const adapter = findSourceAdapter(source);
  return adapter ? adapter.extract(body, source) : [];
}
