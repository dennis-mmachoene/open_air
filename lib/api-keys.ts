import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { apiKeys, users } from "./db/schema";
import { normalizePlan, type Plan } from "./plans";

function hashKey(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Create a key. The plaintext token is returned ONCE and never stored. */
export async function createApiKey(userId: string, label: string) {
  const token = `oa_${randomBytes(24).toString("hex")}`;
  const db = getDb();
  const [row] = await db
    .insert(apiKeys)
    .values({ userId, hashedKey: hashKey(token), label: label.slice(0, 60) || "API key" })
    .returning({ id: apiKeys.id });
  return { id: row?.id, token };
}

export async function listApiKeys(userId: string) {
  const db = getDb();
  return db
    .select({
      id: apiKeys.id,
      label: apiKeys.label,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(desc(apiKeys.createdAt));
}

export async function revokeApiKey(userId: string, id: string) {
  const db = getDb();
  await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
}

/** Verify a presented key and return the owner + plan, updating last-used. */
export async function verifyApiKey(
  token: string,
): Promise<{ userId: string; plan: Plan } | null> {
  const db = getDb();
  const [row] = await db
    .select({ id: apiKeys.id, userId: apiKeys.userId, plan: users.plan })
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(eq(apiKeys.hashedKey, hashKey(token)))
    .limit(1);
  if (!row) return null;
  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, row.id));
  return { userId: row.userId, plan: normalizePlan(row.plan) };
}
