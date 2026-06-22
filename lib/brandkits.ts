import { randomBytes } from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { brandKits, brandKitAssets } from "./db/schema";
import { requireRole } from "./orgs";
import { writeOrgAudit } from "./org-audit";

const HEX_RE = /^#[0-9a-f]{6}$/i;

export interface BrandKit {
  id: string;
  orgId: string;
  slug: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandKitAsset {
  id: string;
  kitId: string;
  type: "color" | "palette";
  name: string;
  hexes: string[];
  notes: string | null;
  position: number;
}

function slugify(name: string): string {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
  return `${base || "kit"}-${randomBytes(2).toString("hex")}`;
}

function cleanHexes(input: string[] | undefined): string[] {
  return (input ?? []).filter((h) => HEX_RE.test(h)).slice(0, 24);
}

/** Create a brand kit. Requires admin/owner. */
export async function createKit(orgId: string, actorId: string, name: string, description?: string): Promise<BrandKit> {
  await requireRole(orgId, actorId, "admin");
  const clean = name.trim().slice(0, 60);
  if (clean.length < 2) throw new Error("Kit name must be at least 2 characters.");
  const db = getDb();
  const [row] = await db
    .insert(brandKits)
    .values({ orgId, slug: slugify(clean), name: clean, description: description?.slice(0, 280) || null, createdBy: actorId })
    .returning();
  await writeOrgAudit({ orgId, actorId, action: "kit.created", targetType: "kit", targetId: row.id, metadata: { name: clean } });
  return row as BrandKit;
}

/** All kits for a team (any member may view). */
export async function listKits(orgId: string): Promise<(BrandKit & { assetCount: number })[]> {
  const db = getDb();
  const kits = await db.select().from(brandKits).where(eq(brandKits.orgId, orgId)).orderBy(desc(brandKits.updatedAt));
  const out: (BrandKit & { assetCount: number })[] = [];
  for (const k of kits) {
    const assets = await db.select({ id: brandKitAssets.id }).from(brandKitAssets).where(eq(brandKitAssets.kitId, k.id));
    out.push({ ...(k as BrandKit), assetCount: assets.length });
  }
  return out;
}

export async function getKit(orgId: string, slug: string): Promise<(BrandKit & { assets: BrandKitAsset[] }) | null> {
  const db = getDb();
  const [kit] = await db.select().from(brandKits).where(and(eq(brandKits.orgId, orgId), eq(brandKits.slug, slug))).limit(1);
  if (!kit) return null;
  const assets = await db.select().from(brandKitAssets).where(eq(brandKitAssets.kitId, kit.id)).orderBy(asc(brandKitAssets.position), asc(brandKitAssets.createdAt));
  return { ...(kit as BrandKit), assets: assets as BrandKitAsset[] };
}

async function kitOrg(kitId: string): Promise<string> {
  const db = getDb();
  const [k] = await db.select({ orgId: brandKits.orgId }).from(brandKits).where(eq(brandKits.id, kitId)).limit(1);
  if (!k) throw new Error("Kit not found.");
  return k.orgId;
}

export async function updateKit(kitId: string, actorId: string, patch: { name?: string; description?: string }): Promise<void> {
  const orgId = await kitOrg(kitId);
  await requireRole(orgId, actorId, "admin");
  const set: Record<string, string | null> = {};
  if (patch.name !== undefined) {
    const n = patch.name.trim().slice(0, 60);
    if (n.length < 2) throw new Error("Kit name must be at least 2 characters.");
    set.name = n;
  }
  if (patch.description !== undefined) set.description = patch.description.slice(0, 280) || null;
  const db = getDb();
  await db.update(brandKits).set({ ...set, updatedAt: new Date() }).where(eq(brandKits.id, kitId));
}

export async function deleteKit(kitId: string, actorId: string): Promise<void> {
  const orgId = await kitOrg(kitId);
  await requireRole(orgId, actorId, "admin");
  const db = getDb();
  await db.delete(brandKits).where(eq(brandKits.id, kitId));
  await writeOrgAudit({ orgId, actorId, action: "kit.deleted", targetType: "kit", targetId: kitId });
}

/** Add a color (1 hex) or palette (many) to a kit. Requires admin/owner. */
export async function addAsset(kitId: string, actorId: string, input: { type?: string; name: string; hexes: string[]; notes?: string }): Promise<BrandKitAsset> {
  const orgId = await kitOrg(kitId);
  await requireRole(orgId, actorId, "admin");
  const hexes = cleanHexes(input.hexes);
  if (hexes.length < 1) throw new Error("Add at least one valid hex color.");
  const type = input.type === "palette" || hexes.length > 1 ? "palette" : "color";
  const name = input.name.trim().slice(0, 60) || (type === "palette" ? "Untitled palette" : "Untitled color");
  const db = getDb();
  const [{ max }] = await db
    .select({ max: brandKitAssets.position })
    .from(brandKitAssets)
    .where(eq(brandKitAssets.kitId, kitId))
    .orderBy(desc(brandKitAssets.position))
    .limit(1)
    .then((r) => (r.length ? r : [{ max: -1 }]));
  const [row] = await db
    .insert(brandKitAssets)
    .values({ kitId, type, name, hexes, notes: input.notes?.slice(0, 200) || null, position: (max ?? -1) + 1 })
    .returning();
  await db.update(brandKits).set({ updatedAt: new Date() }).where(eq(brandKits.id, kitId));
  return row as BrandKitAsset;
}

export async function updateAsset(assetId: string, actorId: string, patch: { name?: string; hexes?: string[]; notes?: string }): Promise<void> {
  const db = getDb();
  const [asset] = await db.select({ kitId: brandKitAssets.kitId }).from(brandKitAssets).where(eq(brandKitAssets.id, assetId)).limit(1);
  if (!asset) throw new Error("Asset not found.");
  const orgId = await kitOrg(asset.kitId);
  await requireRole(orgId, actorId, "admin");
  const set: Record<string, unknown> = {};
  if (patch.name !== undefined) set.name = patch.name.trim().slice(0, 60) || "Untitled";
  if (patch.hexes !== undefined) {
    const hexes = cleanHexes(patch.hexes);
    if (hexes.length < 1) throw new Error("Add at least one valid hex color.");
    set.hexes = hexes;
    set.type = hexes.length > 1 ? "palette" : "color";
  }
  if (patch.notes !== undefined) set.notes = patch.notes.slice(0, 200) || null;
  await db.update(brandKitAssets).set(set).where(eq(brandKitAssets.id, assetId));
  await db.update(brandKits).set({ updatedAt: new Date() }).where(eq(brandKits.id, asset.kitId));
}

export async function deleteAsset(assetId: string, actorId: string): Promise<void> {
  const db = getDb();
  const [asset] = await db.select({ kitId: brandKitAssets.kitId }).from(brandKitAssets).where(eq(brandKitAssets.id, assetId)).limit(1);
  if (!asset) return;
  const orgId = await kitOrg(asset.kitId);
  await requireRole(orgId, actorId, "admin");
  await db.delete(brandKitAssets).where(eq(brandKitAssets.id, assetId));
}
