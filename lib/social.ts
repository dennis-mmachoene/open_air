import { and, desc, eq, sql, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  bookmarks,
  comments,
  follows,
  publishedPalettes,
  reports,
  users,
} from "./db/schema";
import type { PublishedWithAuthor } from "./publish";

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

/* --- Follows ------------------------------------------------------------- */

/** Toggle following a creator. Returns the new state + follower total. */
export async function toggleFollow(
  followerId: string,
  followingId: string,
): Promise<{ following: boolean; followerCount: number }> {
  if (followerId === followingId) throw new Error("You can't follow yourself.");
  const db = getDb();
  const [existing] = await db
    .select({ a: follows.followerId })
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);
  if (existing) {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
  } else {
    await db.insert(follows).values({ followerId, followingId }).onConflictDoNothing();
  }
  const followerCount = await countFollowers(followingId);
  return { following: !existing, followerCount };
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ a: follows.followerId })
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);
  return Boolean(row);
}

export async function countFollowers(userId: string): Promise<number> {
  const db = getDb();
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(follows)
    .where(eq(follows.followingId, userId));
  return Number(n);
}

export async function countFollowing(userId: string): Promise<number> {
  const db = getDb();
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(follows)
    .where(eq(follows.followerId, userId));
  return Number(n);
}

/* --- Bookmarks ----------------------------------------------------------- */

/** Toggle a bookmark (save) of a published palette. */
export async function toggleBookmark(
  userId: string,
  publishedId: string,
): Promise<{ bookmarked: boolean }> {
  const db = getDb();
  const [existing] = await db
    .select({ a: bookmarks.userId })
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.publishedId, publishedId)))
    .limit(1);
  if (existing) {
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.publishedId, publishedId)));
  } else {
    await db.insert(bookmarks).values({ userId, publishedId }).onConflictDoNothing();
  }
  return { bookmarked: !existing };
}

export async function isBookmarked(userId: string, publishedId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ a: bookmarks.userId })
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.publishedId, publishedId)))
    .limit(1);
  return Boolean(row);
}

/** The palettes a user has saved, newest-saved first. */
export async function listBookmarks(userId: string): Promise<PublishedWithAuthor[]> {
  const db = getDb();
  const rows = await db
    .select(SELECT)
    .from(bookmarks)
    .innerJoin(publishedPalettes, eq(publishedPalettes.id, bookmarks.publishedId))
    .innerJoin(users, eq(users.id, publishedPalettes.userId))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt));
  return rows as PublishedWithAuthor[];
}

/** Which of the given palette ids the user has bookmarked (for list views). */
export async function bookmarkedIds(userId: string, ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const db = getDb();
  const rows = await db
    .select({ id: bookmarks.publishedId })
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), inArray(bookmarks.publishedId, ids)));
  return new Set(rows.map((r) => r.id));
}

/* --- Comments ------------------------------------------------------------ */

export interface CommentWithAuthor {
  id: string;
  body: string;
  createdAt: Date;
  authorId: string;
  authorName: string | null;
  authorHandle: string | null;
  authorImage: string | null;
}

export async function addComment(
  userId: string,
  publishedId: string,
  body: string,
): Promise<CommentWithAuthor> {
  const text = body.trim().slice(0, 1000);
  if (text.length < 1) throw new Error("Comment can't be empty.");
  const db = getDb();
  const [row] = await db.insert(comments).values({ userId, publishedId, body: text }).returning();
  const [author] = await db
    .select({ name: users.name, handle: users.handle, image: users.image })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return {
    id: row.id,
    body: row.body,
    createdAt: row.createdAt,
    authorId: userId,
    authorName: author?.name ?? null,
    authorHandle: author?.handle ?? null,
    authorImage: author?.image ?? null,
  };
}

export async function listComments(publishedId: string): Promise<CommentWithAuthor[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      authorId: comments.userId,
      authorName: users.name,
      authorHandle: users.handle,
      authorImage: users.image,
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .where(eq(comments.publishedId, publishedId))
    .orderBy(desc(comments.createdAt));
  return rows as CommentWithAuthor[];
}

/** Delete a comment. The comment author or the palette owner may remove it. */
export async function deleteComment(userId: string, commentId: string): Promise<void> {
  const db = getDb();
  const [row] = await db
    .select({ commentUser: comments.userId, publishedId: comments.publishedId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  if (!row) return;
  let allowed = row.commentUser === userId;
  if (!allowed) {
    const [pal] = await db
      .select({ owner: publishedPalettes.userId })
      .from(publishedPalettes)
      .where(eq(publishedPalettes.id, row.publishedId))
      .limit(1);
    allowed = pal?.owner === userId;
  }
  if (!allowed) throw new Error("Not allowed.");
  await db.delete(comments).where(eq(comments.id, commentId));
}

export async function countComments(publishedId: string): Promise<number> {
  const db = getDb();
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(comments)
    .where(eq(comments.publishedId, publishedId));
  return Number(n);
}

/* --- Reports ------------------------------------------------------------- */

export const REPORT_REASONS = [
  "spam",
  "offensive",
  "copyright",
  "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** File a moderation report. One open report per user per palette. */
export async function reportPalette(
  userId: string,
  publishedId: string,
  reason: string,
): Promise<void> {
  const r = (REPORT_REASONS as readonly string[]).includes(reason) ? reason : "other";
  const db = getDb();
  const [existing] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(
      and(
        eq(reports.userId, userId),
        eq(reports.publishedId, publishedId),
        eq(reports.resolved, false),
      ),
    )
    .limit(1);
  if (existing) return;
  await db.insert(reports).values({ userId, publishedId, reason: r });
}

/* --- Featured (staff picks) --------------------------------------------- */

export async function listFeatured(limit = 24): Promise<PublishedWithAuthor[]> {
  const db = getDb();
  const rows = await db
    .select(SELECT)
    .from(publishedPalettes)
    .innerJoin(users, eq(users.id, publishedPalettes.userId))
    .where(and(eq(publishedPalettes.visibility, "public"), eq(publishedPalettes.featured, true)))
    .orderBy(desc(publishedPalettes.createdAt))
    .limit(limit);
  return rows as PublishedWithAuthor[];
}

/** Admin-only: feature / unfeature a palette. */
export async function setFeatured(publishedId: string, featured: boolean): Promise<void> {
  const db = getDb();
  await db.update(publishedPalettes).set({ featured }).where(eq(publishedPalettes.id, publishedId));
}

/* --- Moderation (admin) -------------------------------------------------- */

export interface OpenReport {
  id: string;
  reason: string;
  createdAt: Date;
  publishedId: string;
  slug: string;
  name: string;
  hexes: string[];
  reporterEmail: string | null;
}

/** Open (unresolved) moderation reports, newest first. */
export async function listOpenReports(limit = 100): Promise<OpenReport[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: reports.id,
      reason: reports.reason,
      createdAt: reports.createdAt,
      publishedId: reports.publishedId,
      slug: publishedPalettes.slug,
      name: publishedPalettes.name,
      hexes: publishedPalettes.hexes,
      reporterEmail: users.email,
    })
    .from(reports)
    .innerJoin(publishedPalettes, eq(publishedPalettes.id, reports.publishedId))
    .innerJoin(users, eq(users.id, reports.userId))
    .where(eq(reports.resolved, false))
    .orderBy(desc(reports.createdAt))
    .limit(limit);
  return rows as OpenReport[];
}

/** Resolve every open report against a palette (e.g. after admin review). */
export async function resolveReports(publishedId: string): Promise<void> {
  const db = getDb();
  await db.update(reports).set({ resolved: true }).where(eq(reports.publishedId, publishedId));
}

/** Admin takedown: delete a published palette outright. */
export async function adminRemovePalette(publishedId: string): Promise<void> {
  const db = getDb();
  await db.delete(publishedPalettes).where(eq(publishedPalettes.id, publishedId));
}
