type RateLimitEntry = { count: number; resetAt: number };
type UpstashPipelineItem = { result?: unknown; error?: string };

const store = new Map<string, RateLimitEntry>();

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  return url && token ? { url, token } : null;
}

async function runUpstashPipeline(
  commands: Array<Array<string | number>>,
): Promise<UpstashPipelineItem[]> {
  const config = getUpstashConfig();
  if (!config) {
    return [];
  }

  const response = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Upstash rate limit request failed: ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) {
    throw new Error("Upstash rate limit response was not an array.");
  }

  return data as UpstashPipelineItem[];
}

async function checkUpstashRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<boolean | null> {
  if (!getUpstashConfig()) {
    return null;
  }

  try {
    const redisKey = `rate-limit:${key}`;
    const [incrementResult, ttlResult] = await runUpstashPipeline([
      ["INCR", redisKey],
      ["PTTL", redisKey],
    ]);

    if (incrementResult?.error || ttlResult?.error) {
      throw new Error(incrementResult?.error ?? ttlResult?.error);
    }

    const count = Number(incrementResult?.result);
    const ttl = Number(ttlResult?.result);

    if (!Number.isFinite(count)) {
      throw new Error("Upstash rate limit counter was invalid.");
    }

    if (count === 1 || ttl < 0) {
      await runUpstashPipeline([["PEXPIRE", redisKey, windowMs]]);
    }

    return count <= maxRequests;
  } catch (error) {
    console.error("Upstash rate limiter failed; falling back to in-process.", error);
    return null;
  }
}

function checkInProcessRateLimit(
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

/**
 * Distributed rate limiter when Upstash Redis REST is configured.
 * Falls back to in-process limits for local development and single-instance deploys.
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<boolean> {
  const upstashResult = await checkUpstashRateLimit(key, maxRequests, windowMs);

  if (upstashResult !== null) {
    return upstashResult;
  }

  return checkInProcessRateLimit(key, maxRequests, windowMs);
}

export function rateLimitResponse() {
  return new Response(
    JSON.stringify({ error: "Pārāk daudz pieprasījumu. Mēģini vēlāk." }),
    { status: 429, headers: { "Content-Type": "application/json" } },
  );
}
