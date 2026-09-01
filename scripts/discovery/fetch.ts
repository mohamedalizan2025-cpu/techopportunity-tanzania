/**
 * Safe acquisition boundary for the discovery pipeline.
 *
 * Every byte the pipeline reads from the internet passes through
 * fetchPage(), so this file is the single place where acquisition safety
 * lives. Guards (all deterministic, no new dependencies):
 *
 * - http/https only — every other scheme (file:, ftp:, javascript:, ...)
 *   is rejected before any network I/O.
 * - Hostname SSRF screen — obvious loopback/private/link-local/reserved
 *   destinations are rejected: localhost, *.local/*.internal/*.lan,
 *   bare IPv4 literals in reserved space (0/8, 10/8, 127/8, 169.254/16,
 *   172.16/12, 192.168/16, 100.64/10), and bracketed IPv6 hosts. This is
 *   a pre-flight screen of the REQUESTED hostname; it is documented as
 *   necessary-but-not-sufficient (a hostname can still resolve to a
 *   private address — connection-level resolution checks are the
 *   documented next gate before major source expansion, §12.5).
 * - Redirect policy — manual follow, max 3 hops, EVERY hop re-validated
 *   through the same guard, so a public URL can never redirect the worker
 *   into a screened destination.
 * - Response size cap — 2 MB, aborting mid-stream; institutional pages and
 *   feeds are far smaller and a hostile oversized body must not be
 *   buffered whole.
 * - Timeout — 20 s per hop (AbortController), cleared on completion.
 * - Failure isolation — every guard failure throws a typed
 *   AcquisitionError; the runner already failure-isolates per source.
 *
 * This is NOT a crawler framework: no browser automation or URL queue. The
 * registry source/feed fetches plus the explicitly allowlisted, per-source
 * bounded one-hop detail fetches all use this same function.
 */

export class AcquisitionError extends Error {}

const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB
const REQUEST_TIMEOUT_MS = 20_000;

const USER_AGENT =
  "TechOpportunityTanzaniaDiscovery/1.0 (+https://techopportunity-tanzania.vercel.app)";

/**
 * Validates a URL for safe acquisition. Pure and exported so the guard is
 * testable without touching the network. Returns null when safe, or a
 * reason string explaining the rejection.
 */
export function acquisitionBlockReason(rawUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return "malformed URL";
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return `scheme ${parsed.protocol} is not http/https`;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "localhost.") {
    return "loopback host";
  }
  if (/\.(local|internal|lan|home|corp|private)$/.test(hostname)) {
    return "private-network hostname suffix";
  }
  if (hostname.startsWith("[") || hostname.includes(":")) {
    // IPv6 literals (bracketed or bare). A static screen cannot prove
    // these safe; the registry holds plain public domains only.
    return "IPv6 host";
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    const parts = hostname.split(".").map(Number);
    if (parts.some((p) => p > 255)) return "malformed IPv4 literal";
    const [a, b] = parts;
    const reserved =
      a === 0 || // 0.0.0.0/8
      a === 10 || // 10/8
      a === 127 || // loopback
      (a === 169 && b === 254) || // link-local
      (a === 172 && b >= 16 && b <= 31) || // 172.16/12
      (a === 192 && b === 168) || // 192.168/16
      (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
      a >= 224; // multicast + reserved
    if (reserved) return "reserved IPv4 range";
    // Bare public IPv4 literals are allowed only for explicit registry
    // entries; the screen keeps the common SSRF classes out.
  }
  return null;
}

function assertAcquirable(url: string): URL {
  const reason = acquisitionBlockReason(url);
  if (reason !== null) {
    throw new AcquisitionError(`Blocked ${url}: ${reason}`);
  }
  return new URL(url);
}

async function readCappedBody(
  response: Response,
  controller: AbortController,
  url: string
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    // Environments without a streaming body fall back to text(), which
    // still respects the abort signal via the fetch options.
    return response.text();
  }
  const decoder = new TextDecoder();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) {
        controller.abort();
        throw new AcquisitionError(
          `Response from ${url} exceeded ${MAX_RESPONSE_BYTES} bytes`
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return decoder.decode(
    chunks.length === 1 ? chunks[0] : concatBytes(chunks)
  );
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export async function fetchPage(url: string): Promise<string> {
  let current = assertAcquirable(url).toString();

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(current, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept:
            "text/html,application/rss+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "manual",
        signal: controller.signal,
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || hop === MAX_REDIRECTS) {
          throw new AcquisitionError(
            `Redirect chain for ${url} ${location ? "kept redirecting" : "had no Location header"} (hop ${hop + 1})`
          );
        }
        // Every hop is re-validated: a public page must never bounce the
        // worker into a screened destination.
        current = assertAcquirable(new URL(location, current).toString()).toString();
        continue;
      }

      if (!response.ok) {
        throw new AcquisitionError(`HTTP ${response.status} for ${current}`);
      }

      return await readCappedBody(response, controller, current);
    } finally {
      clearTimeout(timer);
    }
  }
  // Unreachable: the loop either returns or throws on the final hop.
  throw new AcquisitionError(`Redirect limit exceeded for ${url}`);
}
