import type { Metadata } from "next";
import Link from "next/link";
import { ALL_COLLECTIONS, palettesInCollection } from "@/lib/palettes/snapshot";
import { Strata } from "@/components/palette/Strata";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Curated editorial collections of color palettes — Coastal Mornings, Golden Hour, Jewel Box and more.",
};

export default async function CollectionsIndexPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
          Collections
        </p>
        <h1 className="font-display text-4xl text-text sm:text-5xl">
          Editorial collections
        </h1>
        <p className="max-w-2xl text-lg text-text-soft">
          Curated sets of palettes, each with its own story.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_COLLECTIONS.map((c) => {
          const preview = palettesInCollection(c.slug).slice(0, 4);
          return (
            <Link
              key={c.slug}
              href={`/c/${c.slug}`}
              className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition-shadow hover:shadow-lg"
            >
              <div className="grid grid-cols-2 gap-1.5">
                {preview.map((p) => (
                  <Strata key={p.slug} hexes={p.swatches.map((s) => s.hex)} className="h-12" />
                ))}
              </div>
              <div>
                <h2 className="font-display text-xl text-text">{c.name}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-text-soft">{c.description}</p>
                <p className="mt-2 text-xs text-text-muted">
                  {c.paletteSlugs.length} palettes
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
