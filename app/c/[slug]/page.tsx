import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaletteCard } from "@/components/gallery/PaletteCard";
import {
  ALL_COLLECTIONS,
  allCategories,
  categoryBySlug,
  getCollection,
  palettesByCategory,
  palettesInCollection,
} from "@/lib/palettes/snapshot";

// Snapshot-driven and public — statically pre-render every collection and
// category, revalidating daily so a new snapshot deploy refreshes them.
export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams(): { slug: string }[] {
  return [
    ...ALL_COLLECTIONS.map((c) => ({ slug: c.slug })),
    ...allCategories().map((c) => ({ slug: c.slug })),
  ];
}

function resolve(slug: string) {
  const collection = getCollection(slug);
  if (collection) {
    return {
      kind: "collection" as const,
      title: collection.name,
      description: collection.description,
      story: collection.story,
      palettes: palettesInCollection(slug),
    };
  }
  const category = categoryBySlug(slug);
  if (category) {
    return {
      kind: "category" as const,
      title: category.value,
      description: `${category.count} ${category.value} palettes`,
      story: `Every palette tagged ${category.value} in the Open Air library.`,
      palettes: palettesByCategory(category.kind, category.value),
    };
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = resolve(slug);
  if (!data) return { title: "Not found" };
  return {
    title: data.title,
    description: data.description,
    openGraph: { title: `${data.title} · Open Air`, description: data.description },
  };
}

export default async function CollectionOrCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = resolve(slug);
  if (!data) notFound();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
          {data.kind === "collection" ? "Collection" : "Category"}
        </p>
        <h1 className="font-display text-4xl text-text sm:text-5xl">{data.title}</h1>
        <p className="max-w-2xl text-lg text-text-soft">{data.story}</p>
        <p className="text-sm text-text-muted">
          {data.palettes.length} {data.palettes.length === 1 ? "palette" : "palettes"}
        </p>
      </header>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.palettes.map((p) => (
          <PaletteCard key={p.slug} palette={p} />
        ))}
      </div>
    </div>
  );
}
