import { ALL_COLLECTIONS, ALL_PALETTES } from "./snapshot";
import type { Palette } from "./types";

export type CategoryKind = keyof Palette["categories"];

export interface PaletteFilter {
  mood?: string;
  family?: string;
  industry?: string;
  style?: string;
  season?: string;
  harmony?: string;
  collection?: string;
  dark?: boolean;
  q?: string;
}

export interface QueryResult {
  items: Palette[];
  nextCursor: string | null;
  total: number;
}

const KINDS: CategoryKind[] = ["mood", "family", "industry", "style", "season"];

function haystack(p: Palette): string {
  return [
    p.name,
    p.tagline,
    p.story,
    ...KINDS.flatMap((k) => p.categories[k]),
  ]
    .join(" ")
    .toLowerCase();
}

function matches(p: Palette, f: PaletteFilter): boolean {
  for (const k of KINDS) {
    const v = f[k];
    if (v && !p.categories[k].includes(v)) return false;
  }
  if (f.harmony && p.harmony !== f.harmony) return false;
  if (typeof f.dark === "boolean" && p.dark !== f.dark) return false;
  if (f.collection) {
    const c = ALL_COLLECTIONS.find((x) => x.slug === f.collection);
    if (!c || !c.paletteSlugs.includes(p.slug)) return false;
  }
  if (f.q && !haystack(p).includes(f.q.trim().toLowerCase())) return false;
  return true;
}

/**
 * Filter + search + keyset-paginate the static catalog. Ordered by popularity
 * (desc) then slug for a stable cursor. Cursor is the last slug of the page —
 * no OFFSET, consistent with the DB read path.
 */
export function queryPalettes(
  filter: PaletteFilter = {},
  opts: { limit?: number; cursor?: string | null } = {},
): QueryResult {
  const limit = Math.min(Math.max(opts.limit ?? 24, 1), 60);

  const all = ALL_PALETTES.filter((p) => matches(p, filter)).sort(
    (a, b) => b.popularity - a.popularity || a.slug.localeCompare(b.slug),
  );

  let start = 0;
  if (opts.cursor) {
    const i = all.findIndex((p) => p.slug === opts.cursor);
    start = i >= 0 ? i + 1 : 0;
  }

  const items = all.slice(start, start + limit);
  const end = start + limit;
  const nextCursor = end < all.length ? (items.at(-1)?.slug ?? null) : null;

  return { items, nextCursor, total: all.length };
}

/** Up to `n` palettes related to `slug` — same collection first, then shared mood. */
export function relatedPalettes(slug: string, n = 6): Palette[] {
  const palette = ALL_PALETTES.find((p) => p.slug === slug);
  if (!palette) return [];
  const collection = ALL_COLLECTIONS.find((c) => c.paletteSlugs.includes(slug));
  const score = (p: Palette): number => {
    if (p.slug === slug) return -1;
    let s = 0;
    if (collection?.paletteSlugs.includes(p.slug)) s += 3;
    s += p.categories.mood.filter((m) => palette.categories.mood.includes(m)).length;
    if (p.harmony === palette.harmony) s += 1;
    return s;
  };
  return [...ALL_PALETTES]
    .filter((p) => p.slug !== slug)
    .sort((a, b) => score(b) - score(a) || b.popularity - a.popularity)
    .slice(0, n);
}
