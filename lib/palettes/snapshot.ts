import snapshotJson from "./snapshot.json";
import type { Collection, Palette, Snapshot } from "./types";

/**
 * Static, build-time palette snapshot. The public/marketing read paths consume
 * this (statically generated + ISR), so the gallery works with no live DB; the
 * database is the source of truth for seeding and for user data only.
 *
 * Regenerate with: npm run palettes:snapshot
 */
const snapshot = snapshotJson as unknown as Snapshot;

export const ALL_PALETTES: Palette[] = snapshot.palettes;
export const ALL_COLLECTIONS: Collection[] = snapshot.collections;

const bySlug = new Map(ALL_PALETTES.map((p) => [p.slug, p]));
const collBySlug = new Map(ALL_COLLECTIONS.map((c) => [c.slug, c]));

export function getPalette(slug: string): Palette | undefined {
  return bySlug.get(slug);
}

export function getCollection(slug: string): Collection | undefined {
  return collBySlug.get(slug);
}

export function palettesInCollection(slug: string): Palette[] {
  const c = collBySlug.get(slug);
  if (!c) return [];
  return c.paletteSlugs
    .map((s) => bySlug.get(s))
    .filter((p): p is Palette => Boolean(p));
}

export type CategoryKind = keyof Palette["categories"];

export function palettesByCategory(kind: CategoryKind, value: string): Palette[] {
  return ALL_PALETTES.filter((p) => p.categories[kind].includes(value));
}

/** Distinct category values present in the library, by kind. */
export function categoryValues(kind: CategoryKind): string[] {
  const set = new Set<string>();
  for (const p of ALL_PALETTES) for (const v of p.categories[kind]) set.add(v);
  return [...set].sort();
}
