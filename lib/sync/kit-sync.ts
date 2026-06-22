import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { brandKits, brandKitAssets } from "../db/schema";
import { requireRole } from "../orgs";
import type { Token } from "./serialize";

export interface KitTokens {
  kitId: string;
  name: string;
  tokens: Token[];
}

async function kitOrg(kitId: string): Promise<string> {
  const db = getDb();
  const [k] = await db.select({ orgId: brandKits.orgId }).from(brandKits).where(eq(brandKits.id, kitId)).limit(1);
  if (!k) throw new Error("Kit not found.");
  return k.orgId;
}

/** Flatten a kit's assets into named color tokens. */
export async function kitTokens(kitId: string): Promise<KitTokens | null> {
  const db = getDb();
  const [kit] = await db.select().from(brandKits).where(eq(brandKits.id, kitId)).limit(1);
  if (!kit) return null;
  const assets = await db.select().from(brandKitAssets).where(eq(brandKitAssets.kitId, kitId));
  const tokens: Token[] = [];
  for (const a of assets) {
    const hexes = a.hexes ?? [];
    if (hexes.length === 1) {
      tokens.push({ name: a.name, hex: hexes[0] });
    } else {
      hexes.forEach((hex, i) => tokens.push({ name: `${a.name}-${i + 1}`, hex }));
    }
  }
  return { kitId, name: kit.name, tokens };
}

/** Resolve a sync token to its kit's tokens (read-only, headless consumers). */
export async function kitTokensBySyncToken(token: string): Promise<KitTokens | null> {
  if (!token) return null;
  const db = getDb();
  const [kit] = await db.select({ id: brandKits.id }).from(brandKits).where(eq(brandKits.syncToken, token)).limit(1);
  if (!kit) return null;
  return kitTokens(kit.id);
}

export async function getSyncConfig(kitId: string): Promise<{ syncToken: string | null; webhookUrl: string | null }> {
  const db = getDb();
  const [k] = await db.select({ syncToken: brandKits.syncToken, webhookUrl: brandKits.syncWebhookUrl }).from(brandKits).where(eq(brandKits.id, kitId)).limit(1);
  return { syncToken: k?.syncToken ?? null, webhookUrl: k?.webhookUrl ?? null };
}

/** Generate (or rotate) the kit's sync token. Admin/owner only. Returns it. */
export async function rotateSyncToken(kitId: string, actorId: string): Promise<string> {
  await requireRole(await kitOrg(kitId), actorId, "admin");
  const token = `oak_${randomBytes(24).toString("hex")}`;
  const db = getDb();
  await db.update(brandKits).set({ syncToken: token, updatedAt: new Date() }).where(eq(brandKits.id, kitId));
  return token;
}

export async function revokeSyncToken(kitId: string, actorId: string): Promise<void> {
  await requireRole(await kitOrg(kitId), actorId, "admin");
  const db = getDb();
  await db.update(brandKits).set({ syncToken: null, updatedAt: new Date() }).where(eq(brandKits.id, kitId));
}

export async function setWebhookUrl(kitId: string, actorId: string, url: string | null): Promise<void> {
  await requireRole(await kitOrg(kitId), actorId, "admin");
  const clean = (url ?? "").trim();
  if (clean && !/^https:\/\/.+/i.test(clean)) throw new Error("Webhook URL must start with https://");
  const db = getDb();
  await db.update(brandKits).set({ syncWebhookUrl: clean || null, updatedAt: new Date() }).where(eq(brandKits.id, kitId));
}

/** Best-effort POST to the kit's webhook when its tokens change. */
export async function fireKitWebhook(kitId: string, event: string): Promise<void> {
  try {
    const { webhookUrl } = await getSyncConfig(kitId);
    if (!webhookUrl) return;
    const data = await kitTokens(kitId);
    if (!data) return;
    const { tokensVersion } = await import("./serialize");
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "OpenAir-Sync/1" },
      body: JSON.stringify({ event, kitId, name: data.name, version: tokensVersion(data.tokens), tokenCount: data.tokens.length, at: new Date().toISOString() }),
    });
  } catch (err) {
    console.error("[sync] webhook failed", err);
  }
}
