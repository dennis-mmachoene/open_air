import "../load-env";
import { slugify } from "../palettes/generate";
import { buildLibrary } from "../palettes/library";
import { getDb } from "./index";
import {
  categories,
  collectionItems,
  collections,
  paletteCategories,
  paletteColors,
  palettes,
} from "./schema";

const KINDS = ["mood", "family", "industry", "style", "season"] as const;

async function main() {
  const db = getDb();
  // buildLibrary() runs the generator, which enforces the WCAG AA gate and
  // throws on any failing palette — so only AA-passing palettes are seeded.
  const lib = buildLibrary();
  console.log(`Seeding ${lib.palettes.length} palettes, ${lib.collections.length} collections…`);

  // Full rebuild of the catalog (FK-safe order).
  await db.delete(collectionItems);
  await db.delete(paletteCategories);
  await db.delete(paletteColors);
  await db.delete(collections);
  await db.delete(categories);
  await db.delete(palettes);

  // Categories — unique (kind, value).
  const catSpecs = new Map<string, { slug: string; name: string; kind: string }>();
  for (const p of lib.palettes) {
    for (const kind of KINDS) {
      for (const value of p.categories[kind]) {
        const slug = slugify(`${kind}-${value}`);
        if (!catSpecs.has(slug)) catSpecs.set(slug, { slug, name: value, kind });
      }
    }
  }
  const catRows = await db
    .insert(categories)
    .values([...catSpecs.values()])
    .returning({ id: categories.id, slug: categories.slug });
  const catId = new Map(catRows.map((c) => [c.slug, c.id]));

  // Palettes.
  const paletteRows = await db
    .insert(palettes)
    .values(
      lib.palettes.map((p) => ({
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        story: p.story,
        harmony: p.harmony,
        isPremium: p.isPremium,
        popularity: p.popularity,
        roles: p.roles,
        why: p.why,
      })),
    )
    .returning({ id: palettes.id, slug: palettes.slug });
  const palId = new Map(paletteRows.map((p) => [p.slug, p.id]));

  // Swatches + category joins.
  const colorValues = lib.palettes.flatMap((p) =>
    p.swatches.map((s) => ({
      paletteId: palId.get(p.slug)!,
      hex: s.hex,
      name: s.name,
      position: s.position,
      role: null as string | null,
    })),
  );
  await db.insert(paletteColors).values(colorValues);

  const joinValues = lib.palettes.flatMap((p) =>
    KINDS.flatMap((kind) =>
      p.categories[kind].map((value) => ({
        paletteId: palId.get(p.slug)!,
        categoryId: catId.get(slugify(`${kind}-${value}`))!,
      })),
    ),
  );
  await db.insert(paletteCategories).values(joinValues);

  // Collections + items.
  const collRows = await db
    .insert(collections)
    .values(
      lib.collections.map((c) => ({
        slug: c.slug,
        name: c.name,
        description: c.description,
        heroPaletteId: palId.get(c.heroSlug) ?? null,
      })),
    )
    .returning({ id: collections.id, slug: collections.slug });
  const collId = new Map(collRows.map((c) => [c.slug, c.id]));

  const itemValues = lib.collections.flatMap((c) =>
    c.paletteSlugs.map((slug, i) => ({
      collectionId: collId.get(c.slug)!,
      paletteId: palId.get(slug)!,
      position: i,
    })),
  );
  await db.insert(collectionItems).values(itemValues);

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
