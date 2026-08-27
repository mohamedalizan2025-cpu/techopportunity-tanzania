/**
 * Smallest practical in-memory rate limiter for the assistant route.
 * Per-instance fixed window — appropriate for MVP scale on a single
 * Vercel region; deliberately NOT distributed infrastructure.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 15;

const buckets = new Map<string, { count: number; resetAt: number }>();

function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit(key: string, max = MAX_REQUESTS_PER_WINDOW): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  if (buckets.size > 10_000) prune(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (bucket.count >= max) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
