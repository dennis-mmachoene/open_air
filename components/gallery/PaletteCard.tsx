import Link from "next/link";
import type { Palette } from "@/lib/palettes/types";
import { Strata } from "@/components/palette/Strata";
import { CopyButton } from "@/components/ui/CopyButton";

/** Colour-dominant card. Plain (non-async) component so it renders in both the
 *  server grid and the client infinite-scroll grid. */
export function PaletteCard({ palette }: { palette: Palette }) {
  const hexes = palette.swatches.map((s) => s.hex);
  return (
    <div className="group relative">
      <Link
        href={`/p/${palette.slug}`}
        className="block rounded-card border border-border bg-surface transition-shadow ease-standard hover:shadow-lg focus-visible:shadow-lg"
      >
        <Strata
          hexes={hexes}
          className="h-40 rounded-b-none transition-[height] duration-300 group-hover:h-44"
        />
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg text-text">{palette.name}</h3>
            <p className="mt-0.5 truncate text-xs uppercase tracking-wide text-text-muted">
              {palette.tagline}
            </p>
          </div>
        </div>
      </Link>
      <div className="pointer-events-none absolute right-3 top-3 opacity-0 transition-opacity ease-standard group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 [@media(hover:none)]:pointer-events-auto">
        <CopyButton
          value={hexes.join(", ")}
          label="Copy"
          copiedLabel="Copied"
          title="Copy hex values"
          className="pointer-events-auto bg-canvas/90 px-3 py-1 text-text shadow-sm backdrop-blur hover:bg-canvas"
        />
      </div>
    </div>
  );
}
