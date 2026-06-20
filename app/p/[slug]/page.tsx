import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ALL_PALETTES, getPalette, categorySlug } from "@/lib/palettes/snapshot";
import { relatedPalettes } from "@/lib/palettes/query";
import { CopyHex } from "@/components/palette/CopyHex";
import { WhyDiagram } from "@/components/palette/WhyDiagram";
import { ExportGate } from "@/components/palette/ExportGate";
import { PaletteCard } from "@/components/gallery/PaletteCard";
import { ShowroomGate } from "@/components/palette/ShowroomGate";
import { SaveButton } from "@/components/palette/SaveButton";
import { CollectionPicker } from "@/components/palette/CollectionPicker";
import { RecordView } from "@/components/palette/RecordView";
import { AccessibilityGate } from "@/components/palette/AccessibilityGate";

// Snapshot-driven content — statically pre-render every palette and revalidate
// daily. Pro gating resolves on the client (see the *Gate components), so the
// page no longer needs per-request auth.
export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams(): { slug: string }[] {
  return ALL_PALETTES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const palette = getPalette(slug);
  if (!palette) return { title: "Palette not found" };
  return {
    title: `${palette.name} — ${palette.tagline}`,
    description: palette.story,
    openGraph: {
      title: `${palette.name} · Open Air`,
      description: palette.story,
    },
  };
}

const KIND_LABELS: Record<string, string> = {
  mood: "Mood",
  family: "Family",
  industry: "Industry",
  style: "Style",
  season: "Season",
};

export default async function PalettePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const palette = getPalette(slug);
  if (!palette) notFound();

  const related = relatedPalettes(slug, 4);
  const hexes = palette.swatches.map((s) => s.hex);

  return (
    <article className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-5 py-12 sm:px-8">
      {/* Hero strata */}
      <header className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
            {palette.harmony}
          </p>
          <h1 className="font-display text-4xl text-text sm:text-5xl">{palette.name}</h1>
          <p className="max-w-2xl text-lg text-text-soft">{palette.story}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SaveButton slug={palette.slug} />
          <CollectionPicker slug={palette.slug} />
        </div>
        <CopyHex swatches={palette.swatches} />
        <p className="text-sm text-text-muted">Click any band to copy its hex.</p>
        <RecordView slug={palette.slug} />
      </header>

      {/* Why */}
      <section className="flex flex-col gap-6">
        <h2 className="font-display text-2xl text-text">Why these colours work</h2>
        <div className="grid gap-8 sm:grid-cols-[220px_1fr] sm:items-center">
          <div className="flex justify-center">
            <WhyDiagram hexes={hexes} />
          </div>
          <p className="text-lg leading-relaxed text-text-soft">{palette.why.rationale}</p>
        </div>
      </section>

      {/* Showroom — this palette dressing a complete UI library */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-2xl text-text">In the Showroom</h2>
          <p className="text-sm text-text-soft">
            {palette.name} driving a live component library. Open the{" "}
            <a href="/studio" className="underline underline-offset-4">Studio</a> for the full surface.
          </p>
        </div>
        <ShowroomGate
          palettes={[{ slug: palette.slug, name: palette.name, roles: palette.roles }]}
          lockedSlug={palette.slug}
        />
      </section>

      {/* Accessibility */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl text-text">Accessibility</h2>
        <AccessibilityGate
          rolesLight={palette.roles.light}
          swatches={palette.swatches}
          pairings={palette.why.contrast}
        />
      </section>

      {/* Export */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl text-text">Export</h2>
        <ExportGate
          roles={palette.roles.light}
          swatches={palette.swatches}
          name={palette.name}
          slug={palette.slug}
        />
      </section>

      {/* Categories */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl text-text">Tagged</h2>
        <div className="flex flex-wrap gap-2">
          {(["mood", "family", "industry", "style", "season"] as const).flatMap((kind) =>
            palette.categories[kind].map((value) => (
              <Link
                key={`${kind}-${value}`}
                href={`/c/${categorySlug(kind, value)}`}
                className="rounded-full border border-border px-3 py-1 text-sm text-text-soft transition-colors hover:border-text hover:text-text"
              >
                <span className="text-text-muted">{KIND_LABELS[kind]}:</span> {value}
              </Link>
            )),
          )}
        </div>
      </section>

      {/* Related */}
      {related.length ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-2xl text-text">Related palettes</h2>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <PaletteCard key={p.slug} palette={p} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
