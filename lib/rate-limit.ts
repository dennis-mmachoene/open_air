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

/** Rate-limit by identifier. Allows everything when Upstash isn't configured. */
export async function rateLimit(
  identifier: string,
): Promise<{ success: boolean; remaining: number }> {
  if (!limiter) return { success: true, remaining: Number.POSITIVE_INFINITY };
  const r = await limiter.limit(identifier);
  return { success: r.success, remaining: r.remaining };
}
