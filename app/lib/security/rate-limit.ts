type RateLimitEntry = { count: number; resetAt: number };

const store = new Map<string, RateLimitEntry>();

/**
 * Simple in-process rate limiter (resets on server restart).
 * Returns true if the request is allowed, false if the limit is exceeded.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

export function rateLimitResponse() {
  return new Response(
    JSON.stringify({ error: "Pārāk daudz pieprasījumu. Mēģini vēlāk." }),
    { status: 429, headers: { "Content-Type": "application/json" } },
  );
}
