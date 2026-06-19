import { and, desc, eq, lt, or } from "drizzle-orm";
import { getDb } from "./index";
import { palettes } from "./schema";

export interface PaletteCursor {
  popularity: number;
  id: string;
}

/** Keyset (cursor) pagination over the catalog, ordered by popularity. Never
 *  uses OFFSET. Returns one extra row to compute the next cursor. */
export async function listPalettes(
  opts: { limit?: number; cursor?: PaletteCursor } = {},
) {
  const db = getDb();
  const limit = Math.min(Math.max(opts.limit ?? 24, 1), 60);

  const where = opts.cursor
    ? or(
        lt(palettes.popularity, opts.cursor.popularity),
        and(
          eq(palettes.popularity, opts.cursor.popularity),
          lt(palettes.id, opts.cursor.id),
        ),
      )
    : undefined;

  const rows = await db
    .select()
    .from(palettes)
    .where(where)
    .orderBy(desc(palettes.popularity), desc(palettes.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  const nextCursor =
    hasMore && last ? { popularity: last.popularity, id: last.id } : null;

  return { items, nextCursor };
}

export async function getPaletteBySlug(slug: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(palettes)
    .where(eq(palettes.slug, slug))
    .limit(1);
  return row ?? null;
}
