import Link from "next/link";
import { contentInsights } from "@/lib/admin-data";
import { Strata } from "@/components/palette/Strata";
import { Bar } from "../_components";

export default async function AdminContentPage() {
  const { topSaved, byHarmony, byIndustry } = await contentInsights();
  const maxInd = byIndustry[0]?.weight ?? 0;
  const maxHarm = byHarmony[0]?.n ?? 0;
  const empty = topSaved.length === 0 && byHarmony.length === 0 && byIndustry.length === 0;

  if (empty) {
    return <p className="text-sm text-text-soft">No activity yet (or DB not connected).</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 lg:col-span-1">
        <h2 className="font-display text-lg text-text">Most saved</h2>
        {topSaved.length === 0 ? (
          <p className="text-sm text-text-soft">No saves yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {topSaved.map((p) => (
              <li key={p.slug} className="flex items-center gap-3">
                <Strata hexes={p.hexes} className="h-9 w-16 flex-none" />
                <Link href={`/p/${p.slug}`} className="min-w-0 flex-1 truncate text-sm text-text hover:underline">
                  {p.name}
                </Link>
                <span className="flex-none text-sm text-text-muted">{p.saves}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 lg:col-span-1">
        <h2 className="font-display text-lg text-text">Popular use-cases</h2>
        <p className="text-xs text-text-muted">By industry tag, weighted by saves.</p>
        {byIndustry.length === 0 ? (
          <p className="text-sm text-text-soft">No saves yet.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {byIndustry.map((i) => (
              <li key={i.label} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span className="text-text">{i.label}</span>
                  <span className="text-text-muted">{i.weight}</span>
                </div>
                <Bar value={i.weight} max={maxInd} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 lg:col-span-1">
        <h2 className="font-display text-lg text-text">Generator harmonies</h2>
        <p className="text-xs text-text-muted">Across user-generated palettes.</p>
        {byHarmony.length === 0 ? (
          <p className="text-sm text-text-soft">Nothing generated yet.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {byHarmony.map((h) => (
              <li key={h.harmony} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span className="capitalize text-text">{h.harmony}</span>
                  <span className="text-text-muted">{h.n}</span>
                </div>
                <Bar value={h.n} max={maxHarm} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
