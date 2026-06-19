import { COLLECTION_DEFS } from "./data/collections";
import { generatePalette } from "./generate";
import type { Collection, Palette, Snapshot } from "./types";

/**
 * Generate the entire palette library from the curated collection anchors.
 * Throws on a duplicate slug or any palette that fails the AA gate, so the
 * build/seed fails loudly rather than shipping a broken palette.
 */
export function buildLibrary(): { palettes: Palette[]; collections: Collection[] } {
  const palettes: Palette[] = [];
  const collections: Collection[] = [];
  const seen = new Set<string>();
  let popularity = COLLECTION_DEFS.reduce((n, c) => n + c.palettes.length, 0);

  for (const def of COLLECTION_DEFS) {
    const slugs: string[] = [];
    for (const spec of def.palettes) {
      const palette = generatePalette({ ...spec, popularity: popularity-- }, def.tags);
      if (seen.has(palette.slug)) {
        throw new Error(`Duplicate palette slug: ${palette.slug}`);
      }
      seen.add(palette.slug);
      palettes.push(palette);
      slugs.push(palette.slug);
    }
    collections.push({
      slug: def.slug,
      name: def.name,
      description: def.description,
      story: def.story,
      heroSlug: slugs[0],
      paletteSlugs: slugs,
    });
  }

  return { palettes, collections };
}

export function buildSnapshot(): Snapshot {
  const { palettes, collections } = buildLibrary();
  return {
    generatedAt: new Date().toISOString(),
    count: palettes.length,
    palettes,
    collections,
  };
}
