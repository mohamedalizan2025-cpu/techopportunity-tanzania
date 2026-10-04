/* Tech Opportunity service worker: installability + static resilience.
 *
 * Cache policy (privacy-first, freshness-first):
 * - PRECACHED: /offline shell + app icons only.
 * - CACHE-FIRST: same-origin static assets (/_next/static/*, /icons/*, font
 *   files). These are content-hashed or brand assets; never user data.
 * - NAVIGATIONS: network-first; on failure serve the /offline fallback.
 *   Cached opportunity pages are NEVER served as current data.
 * - EVERYTHING ELSE (APIs, auth, staff routes, account pages, POSTs):
 *   network-only passthrough, never cached, never served stale.
 *
 * In particular this worker never stores or serves: Profile, Saved,
 * Activity, For You output, moderation, published-management, campaigns,
 * staff APIs, AI responses, auth/session data, deadlines, or eligibility.
 */

const STATIC_CACHE = "techopportunity-static-v1";
const STATIC_PREFIXES = ["/_next/static/", "/icons/", "/covers/"];
const STATIC_SUFFIXES = [".woff", ".woff2", ".ttf", ".otf"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        cache.addAll(["/offline", "/icons/icon-192.png", "/icons/icon-512.png"])
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key.startsWith("techopportunity-"))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(pathname) {
  if (STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return STATIC_SUFFIXES.some((suffix) => pathname.endsWith(suffix));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline").then(
          (fallback) =>
            fallback ||
            new Response("You are offline.", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            })
        )
      )
    );
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response && response.ok) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
  }
  // All other same-origin requests (APIs, auth, account and staff pages):
  // network-only passthrough. Never cached, never served stale.
});
