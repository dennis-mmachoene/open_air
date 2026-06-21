import type { Metadata } from "next";
import { ALL_PALETTES } from "@/lib/palettes/snapshot";
import {
  currentSeason,
  trendingPalettes,
  seasonalPalettes,
  industryTrends,
  harmonyDistribution,
  familyDistribution,
} from "@/lib/trends";
import { Rail } from "@/components/gallery/Rail";

export const metadata: Metadata = {
  title: "Color trends",
  description:
    "What's trending in color on Open Air — the most popular palettes, in-season picks, industry leaders, and the harmony and color-family movements across the catalog.",
};
export const revalidate = 86400;

function Bars({ title, data }: { title: string; data: { label: string; count: number; share: number }[] }) {
  const max = data[0]?.share ?? 1;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <h3 className="font-display text-lg text-text">{title}</h3>
      <ul className="flex flex-col gap-2.5">
        {data.map((d) => (
          <li key={d.label} className="flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span className="text-text">{d.label}</span>
              <span className="text-text-muted">{Math.round(d.share * 100)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-text" style={{ width: `${(d.share / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TrendsPage() {
  const season = currentSeason();
  const trending = trendingPalettes(ALL_PALETTES, 8);
  const seasonal = seasonalPalettes(ALL_PALETTES, season, 8);
  const industries = industryTrends(ALL_PALETTES, 4).slice(0, 4);
  const harmonies = harmonyDistribution(ALL_PALETTES);
  const families = familyDistribution(ALL_PALETTES);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 py-12">
      <header className="flex flex-col gap-2 px-5 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Trends</p>
        <h1 className="font-display text-4xl text-text sm:text-5xl">What&apos;s moving in color</h1>
        <p className="max-w-2xl text-lg text-text-soft">
          The most-loved palettes on Open Air right now, in-season picks, what leads each
          industry, and the harmony and color-family movements across the catalog.
        </p>
      </header>

      <Rail title="Trending now" subtitle="Most popular across the catalog" href="/gallery" palettes={trending} />
      <Rail title={`In season · ${season}`} subtitle={`${season} palettes people are loving`} href="/gallery" palettes={seasonal} />

      <section className="flex flex-col gap-4 px-5 sm:px-8">
        <h2 className="font-display text-2xl text-text">Color movements</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Bars title="By harmony" data={harmonies} />
          <Bars title="By color family" data={families} />
        </div>
      </section>

      {industries.map((it) => (
        <Rail key={it.industry} title={`Leading in ${it.industry}`} href="/gallery" palettes={it.leaders} />
      ))}
    </div>
  );
}
