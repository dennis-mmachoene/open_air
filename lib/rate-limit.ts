import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "./env";

const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const limiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, "1 m"),
      prefix: "oa:api",
      analytics: false,
    })
  : null;

/**
 * In-memory sliding-window fallback. Per-instance (not distributed), but it
 * closes the denial-of-wallet hole on expensive endpoints when Upstash isn't
 * configured — previously the limiter was a no-op without Redis.
 */
const memHits = new Map<string, number[]>();

function memoryLimit(id: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (memHits.get(id) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    memHits.set(id, recent);
    return { success: false, remaining: 0 };
  }
  recent.push(now);
  memHits.set(id, recent);
  // Opportunistic cleanup so the map can't grow unbounded.
  if (memHits.size > 5000) {
    for (const [k, v] of memHits) {
      if (v.every((t) => now - t >= windowMs)) memHits.delete(k);
    }
  }
  return { success: true, remaining: limit - recent.length };
}

/**
 * Rate-limit by identifier. Uses Upstash when configured (distributed, 120/min
 * default), otherwise an in-process sliding window with the given options.
 */
export async function rateLimit(
  identifier: string,
  opts: { limit?: number; windowMs?: number } = {},
): Promise<{ success: boolean; remaining: number }> {
  const { limit = 120, windowMs = 60_000 } = opts;
  if (limiter) {
    const r = await limiter.limit(identifier);
    return { success: r.success, remaining: r.remaining };
  }
  return memoryLimit(identifier, limit, windowMs);
}

/**
 * Global daily budget ceiling — a hard cap on calls to a metered/billable
 * resource (e.g. the AI assistant) so a spike can't run up an unbounded bill.
 * Per-instance and resets at UTC midnight; pair with the per-identifier limit.
 * Returns true if the call is within budget (and consumes one unit).
 */
const budget = new Map<string, { day: string; count: number }>();

export function consumeDailyBudget(key: string, max: number): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const cur = budget.get(key);
  if (!cur || cur.day !== today) {
    budget.set(key, { day: today, count: 1 });
    return true;
  }
  if (cur.count >= max) return false;
  cur.count += 1;
  return true;
}
