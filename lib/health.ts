import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { env } from "./env";

export interface HealthCheck {
  name: string;
  ok: boolean;
  detail: string;
  critical: boolean;
}

export interface HealthReport {
  status: "ok" | "degraded";
  checks: HealthCheck[];
  time: string;
}

export async function runHealthChecks(): Promise<HealthReport> {
  const checks: HealthCheck[] = [];

  // Database — the only critical dependency.
  if (!env.DATABASE_URL) {
    checks.push({ name: "database", ok: false, detail: "DATABASE_URL not set", critical: true });
  } else {
    try {
      const db = getDb();
      await db.execute(sql`select 1`);
      checks.push({ name: "database", ok: true, detail: "reachable", critical: true });
    } catch {
      checks.push({ name: "database", ok: false, detail: "query failed", critical: true });
    }
  }

  // Config presence — informational (no secrets leaked, just booleans).
  const cfg: Array<[string, boolean]> = [
    ["auth", Boolean(env.AUTH_SECRET)],
    ["email", Boolean(env.AUTH_EMAIL_SERVER)],
    ["stripe", Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET)],
    ["ratelimit", Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)],
    ["ai", Boolean(env.GEMINI_API_KEY)],
  ];
  for (const [name, ok] of cfg) {
    checks.push({ name, ok, detail: ok ? "configured" : "not configured", critical: false });
  }

  const status = checks.every((c) => c.ok || !c.critical) ? "ok" : "degraded";
  return { status, checks, time: new Date().toISOString() };
}
