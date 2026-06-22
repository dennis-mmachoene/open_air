import { desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { featureFlags } from "../db/schema";

export interface Flag {
  key: string;
  enabled: boolean;
  description: string | null;
  rolloutPercent: number;
  updatedAt: Date;
}

export async function listFlags(): Promise<Flag[]> {
  const db = getDb();
  const rows = await db.select().from(featureFlags).orderBy(desc(featureFlags.updatedAt));
  return rows as Flag[];
}

/** Read a flag's enabled state. Safe to call from anywhere (defaults false). */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  try {
    const db = getDb();
    const [row] = await db.select({ enabled: featureFlags.enabled }).from(featureFlags).where(eq(featureFlags.key, key)).limit(1);
    return Boolean(row?.enabled);
  } catch {
    return false;
  }
}

export async function upsertFlag(input: {
  key: string;
  enabled: boolean;
  description?: string | null;
  rolloutPercent?: number;
  updatedBy?: string | null;
}): Promise<void> {
  const db = getDb();
  const key = input.key.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
  if (!key) throw new Error("Flag key required.");
  const rollout = Math.max(0, Math.min(100, input.rolloutPercent ?? 100));
  await db
    .insert(featureFlags)
    .values({ key, enabled: input.enabled, description: input.description ?? null, rolloutPercent: rollout, updatedBy: input.updatedBy ?? null, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: featureFlags.key,
      set: { enabled: input.enabled, description: input.description ?? null, rolloutPercent: rollout, updatedBy: input.updatedBy ?? null, updatedAt: new Date() },
    });
}

export async function deleteFlag(key: string): Promise<void> {
  const db = getDb();
  await db.delete(featureFlags).where(eq(featureFlags.key, key));
}
