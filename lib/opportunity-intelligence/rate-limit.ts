const WINDOW_MS = 60_000;
const MAX_REQUESTS = 8;

const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkOpportunityInsightRateLimit(
  key: string,
  now = Date.now(),
  max = MAX_REQUESTS
): { allowed: boolean; retryAfterSeconds: number } {
  if (buckets.size > 10_000) {
    for (const [storedKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(storedKey);
    }
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (bucket.count >= max) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1_000)),
    };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
