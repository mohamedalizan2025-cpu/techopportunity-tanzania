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
 * Maps schema.org Event.location into the candidate location keys the
 * normalizer already accepts. Only explicit, structured values are used —
 * a bare string is treated as a venue name; address parts are taken from
 * the structured PostalAddress fields. Nothing is inferred.
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
    return venue ? { ...empty, venueName: venue } : empty;
  }

  if (typeof first !== "object") return empty;
  const obj = first as Record<string, unknown>;
  const address = typeof obj.address === "object" && obj.address !== null ? (obj.address as Record<string, unknown>) : null;
  const venueName = stringify(obj.name);
  const street = stringify(address ? address.streetAddress : obj.address);
  const city = stringify(address ? address.addressLocality : obj.addressLocality);
  const region = stringify(address ? address.addressRegion : obj.addressRegion);
  return { venueName, address: street, city, region };
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
