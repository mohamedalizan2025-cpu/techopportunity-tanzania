import { isObviousSectionLabel } from "./validate";
import { decodeHtmlEntities } from "./normalize";

export function extractCandidatesFromRss(html: string, sourceId: string, sourceUrl: string): Array<Record<string, string | null>> {
  const candidates: Array<Record<string, string | null>> = [];
  const itemRegex = /<item[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<description>([\s\S]*?)<\/description>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(html)) !== null) {
    const title = stripHtml(match[1]);
    const url = stripHtml(match[2]);
    const description = stripHtml(match[3]);

    if (!title || !url) continue;
    candidates.push({
      title,
      url,
      description: description || title,
      sourceId,
      sourceUrl,
      discoveryMethod: "rss",
      roundup: isRoundupTitle(title) ? "true" : null,
    });
  }

  return candidates;
}

export function extractCandidatesFromJsonLd(html: string, sourceId: string, sourceUrl: string): Array<Record<string, string | null>> {
  const candidates: Array<Record<string, string | null>> = [];
  const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

  for (const script of scripts) {
    try {
      const payload = JSON.parse(script[1]);
      const items = Array.isArray(payload) ? payload : [payload];
      for (const item of items) {
        const event = item?.event || item;
        const title = stringify(event?.name || event?.title);
        const url = stringify(event?.url || event?.sameAs || event?.url || sourceUrl);
        const description = stringify(event?.description || event?.summary || "");
        if (!title || !url) continue;
        candidates.push({
          title,
          url,
          description: description || title,
          sourceId,
          sourceUrl,
          discoveryMethod: "json-ld",
          deadline: extractJsonLdDeadline(event),
          ...extractJsonLdLocation(event?.location),
        });
      }
    } catch {
      // Ignore malformed JSON-LD and carry on.
    }
  }

  return candidates;
}

/**
 * Conservative deadline extraction. ONLY explicit closing-date fields are
 * accepted, in evidence-strength order:
 *   applicationDeadline → registrationDeadline → validThrough
 * (validThrough is schema.org's structured "not active after" date).
 * startDate/endDate/pubDate are event or publication dates and are NEVER
 * treated as application deadlines. Unparseable values fall through to the
 * normalizer, which stores null.
 */
function extractJsonLdDeadline(event: Record<string, unknown> | undefined): string | null {
  if (!event) return null;
  return (
    stringify(event.applicationDeadline) ??
    stringify(event.registrationDeadline) ??
    stringify(event.validThrough)
  );
}

/**
 * Feed URLs advertised by a source page via <link rel="alternate"> with an
 * RSS/Atom type. Discovery never guesses feed paths — only advertised ones.
 */
export function discoverFeedUrls(html: string, baseUrl: string): string[] {
  const urls: string[] = [];
  for (const m of html.matchAll(/<link[^>]*type=["'][^"']*(?:rss|atom)[^"']*["'][^>]*>/gi)) {
    const href = m[0].match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    try {
      const abs = new URL(href, baseUrl).toString();
      if (!urls.includes(abs)) urls.push(abs);
    } catch {}
  }
  return urls;
}

/**
 * Roundup detection: titles that advertise MULTIPLE opportunities
 * ("30 Hot Job Opportunities", "10 Scholarships", "20 Grants").
 * Conservative: requires an explicit count + plural opportunity noun.
 */
export function isRoundupTitle(title: string): boolean {
  return /\b\d{1,4}\+?\s+[\w&\s\-']{0,40}?(jobs?|opportunities?|scholarships?|internships?|fellowships?|grants?|positions?|vacancies?|calls?)\b/i.test(
    title
  );
}

/**
 * One-hop roundup expansion: extract explicit opportunity links from a
 * fetched roundup page. An anchor qualifies ONLY when its visible text
 * (a) is descriptive (>= 12 chars), (b) is not navigation/section noise,
 * and (c) contains an actionable-opportunity signal word. Duplicate URLs,
 * in-page fragments, mailto/javascript schemes and non-http links are
 * rejected. Capped by the caller. This is NOT a crawler: exactly one page
 * is analyzed, exactly once.
 */
export function extractOpportunityLinks(html: string, baseUrl: string): Array<{ title: string; url: string }> {
  const ACTION = /\b(apply|application|deadline|scholarship|fellowship|internship|job|vacanc|position|programme|program|grant|fund|training|call|opportunit|fellowship|hackathon|competition|admission|bootcamp|course)\b/i;
  const GENERIC_TEXT = /^(click here|apply here|apply now|apply online|read more|learn more|details|more info|more information|view|website|link|see more|full details)\b/i;
  const out: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();
  for (const m of html.matchAll(/<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]{0,300}?)<\/a>/gi)) {
    const rawText = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    if (rawText.length < 12 || rawText.length > 200) continue;
    if (isObviousSectionLabel(rawText)) continue;
    // Actionable signal OR a long descriptive title (≥25 chars). Short
    // non-action anchors are almost always navigation.
    if (!ACTION.test(rawText) && rawText.length < 25) continue;
    let abs: string;
    let u: URL;
    try {
      u = new URL(m[1], baseUrl);
      if (!["http:", "https:"].includes(u.protocol)) continue;
      if (u.hash !== "" && u.pathname === new URL(baseUrl).pathname) continue;
      abs = u.toString();
    } catch {
      continue;
    }
    if (seen.has(abs)) continue;
    seen.add(abs);

    // Title: prefer the descriptive anchor text; if the anchor text is a
    // bare URL (common on copy-pasted posts) or a generic call-to-action,
    // humanize the URL slug. Skip when neither yields a meaningful title.
    let title: string | null = GENERIC_TEXT.test(rawText) || /^https?:\/\//i.test(rawText) ? null : rawText;
    if (!title) {
      const segment = u.pathname.split("/").filter(Boolean).pop() ?? "";
      const humanized = decodeURIComponent(segment)
        .replace(/\.(html?|php|aspx?)$/i, "")
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const letters = humanized.replace(/[^a-zA-Z]/g, "").length;
      // Evidence-based guards (live roundup probe 2026-08-29): file-like
      // slugs ("jobdetail.ftl") and opaque single-token slugs
      // ("detailoffre") carry no opportunity information. A humanized
      // title must read like words: letter-dense, long enough, containing
      // a space and no file-extension dot. Failing anchors are skipped —
      // the parent row is kept when no child survives, so nothing real is
      // ever silently lost.
      const readable =
        humanized.length >= 10 &&
        letters / humanized.length >= 0.5 &&
        humanized.includes(" ") &&
        !humanized.includes(".");
      title = readable ? humanized : null;
    }
    if (!title) continue;

    out.push({ title, url: abs });
    if (out.length >= 15) break;
  }
  return out;
}

/**
 * ONE-ROW-ONE-OPPORTUNITY INVARIANT
 *
 * One database row represents one actionable opportunity. A fetched page,
 * feed or (future) social post may contain one or fifty opportunities; the
 * ingestion layer decomposes them into individual candidates.
 *
 * Decomposition of a roundup parent into inner candidates is pure and
 * loss-aware: every inner candidate points back at the parent page via
 * `sourceUrl` (evidence chain: registry source → roundup page → item URL).
 * The CALLER decides suppression: a parent is dropped only when at least
 * one inner candidate survives validation/dedupe. If decomposition yields
 * nothing reliable (no qualifying links, ambiguous anchors, fetch failure)
 * the parent REMAINS a pending candidate — multi-opportunity content is
 * never silently discarded; it reaches the human moderator instead.
 */
export function roundupInnerCandidates(
  pageHtml: string,
  parent: { title: string; url: string; sourceId: string; discoveryMethod: string | null }
): Array<Record<string, string | null>> {
  return extractOpportunityLinks(pageHtml, parent.url).map((link) => ({
    title: link.title,
    url: link.url,
    description: `Listed in: ${parent.title}`,
    sourceId: parent.sourceId,
    sourceUrl: parent.url,
    // The parent page is a distinct evidence document testifying about
    // this opportunity; the registry source base is one hop further up.
    evidenceUrl: parent.url,
    referenceKind: "evidence-document",
    discoveryMethod: parent.discoveryMethod,
  }));
}

/**
 * Atom entry extraction. Evidence is the entry itself: its alternate link is
 * the opportunity URL, its title/summary the text. Atom entries carry no
 * location or application-deadline fields in practice, so none are set —
 * unknown stays unknown. Entries are recorded under the "rss" discovery
 * method (feed family) for schema compatibility.
 */
export function extractCandidatesFromAtom(body: string, sourceId: string, sourceUrl: string): Array<Record<string, string | null>> {
  const candidates: Array<Record<string, string | null>> = [];
  for (const entryMatch of body.matchAll(/<entry[\s\S]*?<\/entry>/gi)) {
    const entry = entryMatch[0];
    const title = stripHtml(entry.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    let link: string | null = null;
    for (const linkMatch of entry.matchAll(/<link[^>]*>/gi)) {
      const tag = linkMatch[0];
      const href = tag.match(/href=["']([^"']+)["']/i)?.[1] ?? null;
      if (!href) continue;
      const rel = tag.match(/rel=["']([^"']+)["']/i)?.[1] ?? "alternate";
      if (rel === "alternate") { link = href; break; }
      if (!link) link = href;
    }
    if (!title || !link) continue;
    const summary = stripHtml(entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] ?? "");
    candidates.push({
      title,
      url: link,
      description: summary || title,
      sourceId,
      sourceUrl,
      discoveryMethod: "rss",
      roundup: isRoundupTitle(title) ? "true" : null,
      venueName: null,
      address: null,
      city: null,
      region: null,
      deadline: null,
    });
  }
  return candidates;
}

/**
 * Maps schema.org Event.location into the candidate location keys the
 * normalizer already accepts. Only explicit, structured values are used —
 * a bare string is treated as a venue name unless it is a national
 * reference ("Tanzania"), which names a country, not a venue or city, and
 * is therefore rejected outright. Address parts are taken from the
 * structured PostalAddress fields. Nothing is inferred.
 */
function extractJsonLdLocation(
  location: unknown
): { venueName: string | null; address: string | null; city: string | null; region: string | null } {
  const empty = { venueName: null, address: null, city: null, region: null };
  if (!location) return empty;

  const first = Array.isArray(location) ? location[0] : location;
  if (!first) return empty;

  if (typeof first === "string") {
    const venue = stringify(first);
    if (!venue || /^tanzania$/i.test(venue.trim())) return empty;
    return { ...empty, venueName: venue };
  }

  if (typeof first !== "object") return empty;
  const obj = first as Record<string, unknown>;
  const address = typeof obj.address === "object" && obj.address !== null ? (obj.address as Record<string, unknown>) : null;
  const venueName = stringify(obj.name);
  const street = stringify(address ? address.streetAddress : obj.address);
  const city = stringify(address ? address.addressLocality : obj.addressLocality);
  const region = stringify(address ? address.addressRegion : obj.addressRegion);
  const nationalOnly =
    city !== null && /^tanzania$/i.test(city.trim()) && region === null;
  return nationalOnly
    ? { venueName, address: street, city: null, region: null }
    : { venueName, address: street, city, region };
}

export function extractCandidatesFromHtml(html: string, sourceId: string, sourceUrl: string): Array<Record<string, string | null>> {
  const candidates: Array<Record<string, string | null>> = [];
  const titleMatches = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)];

  for (const match of titleMatches) {
    const title = stripHtml(match[1]);
    if (!title || title.length < 6) continue;
    const anchor = html.slice(Math.max(0, match.index ?? 0), Math.min(html.length, (match.index ?? 0) + 500));
    const urlMatch = anchor.match(/href=["']([^"']+)["']/i);
    if (!urlMatch) continue;
    const url = sanitizeUrl(urlMatch[1], sourceUrl);
    if (!url) continue;
    candidates.push({
      title,
      url,
      description: title,
      sourceId,
      sourceUrl,
      discoveryMethod: "html",
    });
  }

  return candidates;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

function sanitizeUrl(value: string, baseUrl?: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || /^javascript:/i.test(trimmed) || /^mailto:/i.test(trimmed)) return null;
  try {
    const url = new URL(trimmed, baseUrl ?? "https://example.invalid");
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function stringify(value: unknown): string | null {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return null;
}
