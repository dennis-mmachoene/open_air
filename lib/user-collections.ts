import { and, count, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { palettes, userCollectionItems, userCollections } from "./db/schema";

export interface UserCollectionSummary {
  id: string;
  name: string;
  createdAt: Date;
  itemCount: number;
}

export async function listUserCollections(
  userId: string,
): Promise<UserCollectionSummary[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: userCollections.id,
      name: userCollections.name,
      createdAt: userCollections.createdAt,
      itemCount: count(userCollectionItems.paletteId),
    })
    .from(userCollections)
    .leftJoin(
      userCollectionItems,
      eq(userCollectionItems.collectionId, userCollections.id),
    )
    .where(eq(userCollections.userId, userId))
    .groupBy(userCollections.id);
  return rows
    .map((r) => ({ ...r, itemCount: Number(r.itemCount) }))
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
}

export async function createUserCollection(userId: string, name: string) {
  const db = getDb();
  const trimmed = name.trim().slice(0, 60) || "Untitled";
  const [row] = await db
    .insert(userCollections)
    .values({ userId, name: trimmed })
    .returning();
  return row;
}

export async function deleteUserCollection(userId: string, id: string) {
  const db = getDb();
  await db
    .delete(userCollections)
    .where(and(eq(userCollections.id, id), eq(userCollections.userId, userId)));
}

async function ownsCollection(userId: string, collectionId: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: userCollections.id })
    .from(userCollections)
    .where(and(eq(userCollections.id, collectionId), eq(userCollections.userId, userId)))
    .limit(1);
  return Boolean(row);
}

/** Add/remove a palette to a collection (owned by the user). Returns membership. */
export async function toggleCollectionItem(
  userId: string,
  collectionId: string,
  slug: string,
): Promise<{ inCollection: boolean }> {
  const db = getDb();
  if (!(await ownsCollection(userId, collectionId))) {
    throw new Error("Not your collection");
  }
  const [pal] = await db
    .select({ id: palettes.id })
    .from(palettes)
    .where(eq(palettes.slug, slug))
    .limit(1);
  if (!pal) throw new Error(`Unknown palette: ${slug}`);

  const [existing] = await db
    .select({ paletteId: userCollectionItems.paletteId })
    .from(userCollectionItems)
    .where(
      and(
        eq(userCollectionItems.collectionId, collectionId),
        eq(userCollectionItems.paletteId, pal.id),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .delete(userCollectionItems)
      .where(
        and(
          eq(userCollectionItems.collectionId, collectionId),
          eq(userCollectionItems.paletteId, pal.id),
        ),
      );
    return { inCollection: false };
  }

  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${userCollectionItems.position}), -1) + 1` })
    .from(userCollectionItems)
    .where(eq(userCollectionItems.collectionId, collectionId));

  await db
    .insert(userCollectionItems)
    .values({ collectionId, paletteId: pal.id, position: Number(next) });
  return { inCollection: true };
}

/** Membership of a slug across the user's collections (for the detail picker). */
export async function collectionsForSlug(userId: string, slug: string) {
  const cols = await listUserCollections(userId);
  const db = getDb();
  const [pal] = await db
    .select({ id: palettes.id })
    .from(palettes)
    .where(eq(palettes.slug, slug))
    .limit(1);
  if (!pal) return cols.map((c) => ({ ...c, inCollection: false }));
  const member = await db
    .select({ collectionId: userCollectionItems.collectionId })
    .from(userCollectionItems)
    .where(eq(userCollectionItems.paletteId, pal.id));
  const set = new Set(member.map((m) => m.collectionId));
  return cols.map((c) => ({ ...c, inCollection: set.has(c.id) }));
}

export async function collectionSlugs(
  userId: string,
  collectionId: string,
): Promise<string[]> {
  const db = getDb();
  if (!(await ownsCollection(userId, collectionId))) return [];
  const rows = await db
    .select({ slug: palettes.slug, position: userCollectionItems.position })
    .from(userCollectionItems)
    .innerJoin(palettes, eq(userCollectionItems.paletteId, palettes.id))
    .where(eq(userCollectionItems.collectionId, collectionId));
  return rows.sort((a, b) => a.position - b.position).map((r) => r.slug);
}
