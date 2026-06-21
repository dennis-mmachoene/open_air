import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { paletteLikes, publishedPalettes, users } from "./db/schema";

export const LICENSES = [
  { id: "all-rights-reserved", label: "All rights reserved" },
  { id: "attribution", label: "Attribution required" },
  { id: "commercial", label: "Commercial use allowed" },
  { id: "personal", label: "Personal use only" },
  { id: "public-domain", label: "Public domain" },
] as const;
export type LicenseId = (typeof LICENSES)[number]["id"];
const LICENSE_IDS = new Set(LICENSES.map((l) => l.id));

export type Visibility = "public" | "unlisted" | "private";
const VISIBILITIES = new Set<Visibility>(["public", "unlisted", "private"]);

const HEX_RE = /^#[0-9a-f]{6}$/i;

export interface PublishInput {
  name: string;
  hexes: string[];
  description?: string;
  rationale?: string;
  harmony?: string;
  a11yScore?: number;
  license?: string;
  tags?: string[];
  visibility?: string;
}

function slugify(name: string): string {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "palette"}-${suffix}`;
}

export function isValidHandle(handle: string): boolean {
  return /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])$/.test(handle);
}

/** Publish a palette. Caller must have already checked the publish entitlement. */
export async function publishPalette(userId: string, input: PublishInput) {
  const db = getDb();
  const hexes = (input.hexes ?? []).filter((h) => HEX_RE.test(h)).slice(0, 12);
  if (hexes.length < 2) throw new Error("A palette needs at least two colors.");
  const name = (input.name ?? "").trim().slice(0, 80) || "Untitled palette";
  const license = LICENSE_IDS.has(input.license as LicenseId) ? input.license! : "all-rights-reserved";
  const visibility = VISIBILITIES.has(input.visibility as Visibility) ? (input.visibility as Visibility) : "public";
  const tags = Array.isArray(input.tags) ? input.tags.filter((t) => typeof t === "string").slice(0, 8) : [];

  const [row] = await db
    .insert(publishedPalettes)
    .values({
      userId,
      slug: slugify(name),
      name,
      description: input.description?.slice(0, 500) ?? null,
      rationale: input.rationale?.slice(0, 500) ?? null,
      hexes,
      harmony: input.harmony ?? null,
      a11yScore: Math.max(0, Math.min(100, Math.round(input.a11yScore ?? 0))),
      license,
      tags,
      visibility,
    })
    .returning();
  return row;
}

export interface PublishedWithAuthor {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  rationale: string | null;
  hexes: string[];
  harmony: string | null;
  a11yScore: number;
  license: string;
  tags: string[];
  visibility: string;
  likeCount: number;
  createdAt: Date;
  authorId: string;
  authorName: string | null;
  authorHandle: string | null;
}

const SELECT = {
  id: publishedPalettes.id,
  slug: publishedPalettes.slug,
  name: publishedPalettes.name,
  description: publishedPalettes.description,
  rationale: publishedPalettes.rationale,
  hexes: publishedPalettes.hexes,
  harmony: publishedPalettes.harmony,
  a11yScore: publishedPalettes.a11yScore,
  license: publishedPalettes.license,
  tags: publishedPalettes.tags,
  visibility: publishedPalettes.visibility,
  likeCount: publishedPalettes.likeCount,
  createdAt: publishedPalettes.createdAt,
  authorId: publishedPalettes.userId,
  authorName: users.name,
  authorHandle: users.handle,
} as const;

export async function getPublishedBySlug(slug: string): Promise<PublishedWithAuthor | null> {
  const db = getDb();
  const [row] = await db
    .select(SELECT)
    .from(publishedPalettes)
    .innerJoin(users, eq(users.id, publishedPalettes.userId))
    .where(eq(publishedPalettes.slug, slug))
    .limit(1);
  return (row as PublishedWithAuthor) ?? null;
}

export type FeedSort = "new" | "top";

/** Public inspiration feed. */
export async function listFeed(sort: FeedSort = "new", limit = 24, offset = 0): Promise<PublishedWithAuthor[]> {
  const db = getDb();
  const rows = await db
    .select(SELECT)
    .from(publishedPalettes)
    .innerJoin(users, eq(users.id, publishedPalettes.userId))
    .where(eq(publishedPalettes.visibility, "public"))
    .orderBy(sort === "top" ? desc(publishedPalettes.likeCount) : desc(publishedPalettes.createdAt))
    .limit(limit)
    .offset(offset);
  return rows as PublishedWithAuthor[];
}

/** An author's published palettes. Owners see all; others see public only. */
export async function listByAuthor(authorId: string, viewerId?: string): Promise<PublishedWithAuthor[]> {
  const db = getDb();
  const where =
    viewerId === authorId
      ? eq(publishedPalettes.userId, authorId)
      : and(eq(publishedPalettes.userId, authorId), eq(publishedPalettes.visibility, "public"));
  const rows = await db
    .select(SELECT)
    .from(publishedPalettes)
    .innerJoin(users, eq(users.id, publishedPalettes.userId))
    .where(where)
    .orderBy(desc(publishedPalettes.createdAt));
  return rows as PublishedWithAuthor[];
}

export async function deletePublished(userId: string, id: string): Promise<void> {
  const db = getDb();
  await db.delete(publishedPalettes).where(and(eq(publishedPalettes.id, id), eq(publishedPalettes.userId, userId)));
}

/** Toggle a like; keeps the denormalized count in sync. Returns new state. */
export async function toggleLike(userId: string, publishedId: string): Promise<{ liked: boolean; likeCount: number }> {
  const db = getDb();
  const [existing] = await db
    .select({ userId: paletteLikes.userId })
    .from(paletteLikes)
    .where(and(eq(paletteLikes.userId, userId), eq(paletteLikes.publishedId, publishedId)))
    .limit(1);

  if (existing) {
    await db.delete(paletteLikes).where(and(eq(paletteLikes.userId, userId), eq(paletteLikes.publishedId, publishedId)));
  } else {
    await db.insert(paletteLikes).values({ userId, publishedId }).onConflictDoNothing();
  }

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(paletteLikes)
    .where(eq(paletteLikes.publishedId, publishedId));
  const likeCount = Number(n);
  await db.update(publishedPalettes).set({ likeCount }).where(eq(publishedPalettes.id, publishedId));
  return { liked: !existing, likeCount };
}

export async function hasLiked(userId: string, publishedId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ userId: paletteLikes.userId })
    .from(paletteLikes)
    .where(and(eq(paletteLikes.userId, userId), eq(paletteLikes.publishedId, publishedId)))
    .limit(1);
  return Boolean(row);
}

/** --- Creator profiles ---------------------------------------------------- */

export interface Profile {
  id: string;
  name: string | null;
  handle: string | null;
  bio: string | null;
  website: string | null;
  image: string | null;
}

export async function getProfileByHandle(handle: string): Promise<Profile | null> {
  const db = getDb();
  const [row] = await db
    .select({ id: users.id, name: users.name, handle: users.handle, bio: users.bio, website: users.website, image: users.image })
    .from(users)
    .where(eq(users.handle, handle))
    .limit(1);
  return row ?? null;
}

export async function getOwnProfile(userId: string): Promise<Profile | null> {
  const db = getDb();
  const [row] = await db
    .select({ id: users.id, name: users.name, handle: users.handle, bio: users.bio, website: users.website, image: users.image })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

export interface ProfileUpdate {
  handle?: string;
  bio?: string;
  website?: string;
}

/** Update a creator profile. Throws on an invalid or taken handle. */
export async function updateProfile(userId: string, update: ProfileUpdate): Promise<Profile> {
  const db = getDb();
  const set: Record<string, string | null> = {};
  if (update.handle !== undefined) {
    const h = update.handle.trim().toLowerCase();
    if (h && !isValidHandle(h)) throw new Error("Handle must be 3–30 chars: letters, numbers, - or _.");
    if (h) {
      const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.handle, h)).limit(1);
      if (taken && taken.id !== userId) throw new Error("That handle is taken.");
    }
    set.handle = h || null;
  }
  if (update.bio !== undefined) set.bio = update.bio.slice(0, 300) || null;
  if (update.website !== undefined) set.website = update.website.slice(0, 200) || null;

  await db.update(users).set(set).where(eq(users.id, userId));
  return (await getOwnProfile(userId))!;
}
