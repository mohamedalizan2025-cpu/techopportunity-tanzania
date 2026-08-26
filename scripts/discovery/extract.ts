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
        });
      }
    } catch {
      // Ignore malformed JSON-LD and carry on.
    }
  }

  return candidates;
}

export function extractCandidatesFromHtml(html: string, sourceId: string, sourceUrl: string): Array<Record<string, string | null>> {
  const candidates: Array<Record<string, string | null>> = [];
  const titleMatches = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)];

  for (const match of titleMatches) {
    const title = stripHtml(match[1]);
    if (!title || title.length < 6) continue;
    const anchor = html.slice(Math.max(0, match.index ?? 0), Math.min(html.length, (match.index ?? 0) + 500));
    const urlMatch = anchor.match(/href=["']([^"']+)["']/i);
    const url = urlMatch ? sanitizeUrl(urlMatch[1]) : sourceUrl;
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

function sanitizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || /^javascript:/i.test(trimmed) || /^mailto:/i.test(trimmed)) return null;
  try {
    const url = new URL(trimmed, "https://example.com");
    return url.origin === "https://example.com" && !trimmed.startsWith("/") ? null : trimmed;
  } catch {
    return null;
  }
}

function stringify(value: unknown): string | null {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return null;
}
