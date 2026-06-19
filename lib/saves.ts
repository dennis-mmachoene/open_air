import { and, count, eq } from "drizzle-orm";
import { getDb } from "./db";
import { palettes, savedPalettes, users } from "./db/schema";
import { normalizePlan, PLAN_FEATURES } from "./plans";

export const FREE_SAVE_LIMIT = 5;

export interface ToggleResult {
  saved: boolean;
  count: number;
  limitReached?: boolean;
}

async function countSaves(userId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: count() })
    .from(savedPalettes)
    .where(eq(savedPalettes.userId, userId));
  return Number(row?.n ?? 0);
}

/** Slugs the user has saved, newest first. */
export async function getSavedSlugs(userId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ slug: palettes.slug, createdAt: savedPalettes.createdAt })
    .from(savedPalettes)
    .innerJoin(palettes, eq(savedPalettes.paletteId, palettes.id))
    .where(eq(savedPalettes.userId, userId));
  return rows
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map((r) => r.slug);
}

export async function isSaved(userId: string, slug: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: savedPalettes.paletteId })
    .from(savedPalettes)
    .innerJoin(palettes, eq(savedPalettes.paletteId, palettes.id))
    .where(and(eq(savedPalettes.userId, userId), eq(palettes.slug, slug)))
    .limit(1);
  return Boolean(row);
}

/** Toggle a save, enforcing the Free-tier 5-save limit server-side. */
export async function toggleSave(userId: string, slug: string): Promise<ToggleResult> {
  const db = getDb();
  const [pal] = await db
    .select({ id: palettes.id })
    .from(palettes)
    .where(eq(palettes.slug, slug))
    .limit(1);
  if (!pal) throw new Error(`Unknown palette: ${slug}`);

  const [existing] = await db
    .select({ paletteId: savedPalettes.paletteId })
    .from(savedPalettes)
    .where(and(eq(savedPalettes.userId, userId), eq(savedPalettes.paletteId, pal.id)))
    .limit(1);

  if (existing) {
    await db
      .delete(savedPalettes)
      .where(and(eq(savedPalettes.userId, userId), eq(savedPalettes.paletteId, pal.id)));
    return { saved: false, count: await countSaves(userId) };
  }

  const [user] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const current = await countSaves(userId);
  const limit = PLAN_FEATURES[normalizePlan(user?.plan)].savedLimit;
  if (limit !== null && current >= limit) {
    return { saved: false, count: current, limitReached: true };
  }

  await db.insert(savedPalettes).values({ userId, paletteId: pal.id });
  return { saved: true, count: current + 1 };
}
