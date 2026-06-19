import { NowShowing } from "@/components/gallery/NowShowing";
import { Rail } from "@/components/gallery/Rail";
import { FilterBar, type Facet } from "@/components/gallery/FilterBar";
import { InfiniteGrid } from "@/components/gallery/InfiniteGrid";
import {
  ALL_COLLECTIONS,
  categoryValues,
  palettesInCollection,
} from "@/lib/palettes/snapshot";
import { queryPalettes, type PaletteFilter } from "@/lib/palettes/query";

const HARMONIES = ["Monochromatic", "Analogous", "Complementary", "Triadic"];

const RAIL_COLLECTIONS = [
  "coastal-mornings",
  "golden-hour",
  "jewel-box",
  "forest-bathing",
];

function readFilter(sp: Record<string, string | string[] | undefined>): PaletteFilter {
  const one = (k: string) => {
    const v = sp[k];
    return typeof v === "string" ? v : undefined;
  };
  return {
    mood: one("mood"),
    family: one("family"),
    industry: one("industry"),
    style: one("style"),
    season: one("season"),
    harmony: one("harmony"),
    collection: one("collection"),
    q: one("q"),
  };
}

function toQueryString(filter: PaletteFilter): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) {
    if (typeof v === "string" && v) sp.set(k, v);
  }
  return sp.toString();
}

export function GalleryHome({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filter = readFilter(searchParams);
  const filtering = Object.values(filter).some(Boolean);

  const featured = queryPalettes({}, { limit: 5 }).items;
  const explore = queryPalettes(filter, { limit: 24 });

  const facets: Facet[] = [
    { kind: "mood", label: "Mood", values: categoryValues("mood") },
    { kind: "family", label: "Family", values: categoryValues("family") },
    { kind: "season", label: "Season", values: categoryValues("season") },
    { kind: "harmony", label: "Harmony", values: HARMONIES },
  ];

  return (
    <div className="flex flex-col gap-16 pb-20">
      {!filtering ? <NowShowing palettes={featured} /> : null}

      {!filtering ? (
        <div className="flex flex-col gap-14">
          {RAIL_COLLECTIONS.map((slug) => {
            const collection = ALL_COLLECTIONS.find((c) => c.slug === slug);
            if (!collection) return null;
            return (
              <Rail
                key={slug}
                title={collection.name}
                subtitle={collection.description}
                href={`/c/${slug}`}
                palettes={palettesInCollection(slug).slice(0, 8)}
              />
            );
          })}
        </div>
      ) : null}

      <section className="flex flex-col gap-6">
        <div className="px-5 sm:px-8">
          <h2 className="font-display text-2xl text-text">
            {filtering ? "Results" : "Explore all"}
          </h2>
          <p className="mt-1 text-sm text-text-soft">
            {explore.total} {explore.total === 1 ? "palette" : "palettes"}
          </p>
        </div>
        <FilterBar facets={facets} />
        <InfiniteGrid
          key={toQueryString(filter)}
          initial={explore.items}
          total={explore.total}
          query={toQueryString(filter)}
        />
      </section>
    </div>
  );
}
