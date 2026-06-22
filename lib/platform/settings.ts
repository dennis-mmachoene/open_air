import { desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { platformSettings } from "../db/schema";

export interface Setting {
  key: string;
  value: unknown;
  description: string | null;
  updatedAt: Date;
}

export async function listSettings(): Promise<Setting[]> {
  const db = getDb();
  const rows = await db.select().from(platformSettings).orderBy(desc(platformSettings.updatedAt));
  return rows as Setting[];
}

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  try {
    const db = getDb();
    const [row] = await db.select({ value: platformSettings.value }).from(platformSettings).where(eq(platformSettings.key, key)).limit(1);
    return (row?.value as T) ?? null;
  } catch {
    return null;
  }
}

export async function setSetting(input: { key: string; value: unknown; description?: string | null; updatedBy?: string | null }): Promise<void> {
  const db = getDb();
  const key = input.key.trim();
  if (!key) throw new Error("Setting key required.");
  await db
    .insert(platformSettings)
    .values({ key, value: input.value, description: input.description ?? null, updatedBy: input.updatedBy ?? null, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: platformSettings.key,
      set: { value: input.value, description: input.description ?? null, updatedBy: input.updatedBy ?? null, updatedAt: new Date() },
    });
}

export async function deleteSetting(key: string): Promise<void> {
  const db = getDb();
  await db.delete(platformSettings).where(eq(platformSettings.key, key));
}
