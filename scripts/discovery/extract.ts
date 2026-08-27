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
