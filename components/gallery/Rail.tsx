import Link from "next/link";
import type { Palette } from "@/lib/palettes/types";
import { PaletteCard } from "./PaletteCard";

/** Horizontal, scroll-snapping row — the proven pattern for browsing many items. */
export function Rail({
  title,
  subtitle,
  href,
  palettes,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  palettes: Palette[];
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4 px-5 sm:px-8">
        <div>
          <h2 className="font-display text-2xl text-text">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-text-soft">{subtitle}</p>
          ) : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="shrink-0 text-sm text-text-soft underline-offset-4 hover:text-text hover:underline"
          >
            View all
          </Link>
        ) : null}
      </div>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:px-8 [scrollbar-width:thin]">
        {palettes.map((p) => (
          <div key={p.slug} className="w-64 shrink-0 snap-start">
            <PaletteCard palette={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
