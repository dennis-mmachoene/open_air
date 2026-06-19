import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-guard";
import { getEntitlements } from "@/lib/entitlements";
import { GradientTool } from "@/components/studio/GradientTool";
import { UpgradeCard } from "@/components/studio/UpgradeCard";
import { ALL_PALETTES } from "@/lib/palettes/snapshot";

export const metadata: Metadata = { title: "Gradient studio" };

export default async function GradientsPage() {
  const user = await requireUser();
  const entitlements = await getEntitlements(user.id);
  const palettes = ALL_PALETTES.map((p) => ({
    slug: p.slug,
    name: p.name,
    hexes: p.swatches.map((s) => s.hex),
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Studio</p>
        <h1 className="font-display text-4xl text-text">Gradient studio</h1>
        <p className="max-w-2xl text-text-soft">
          Build linear, radial and conic gradients from any palette, interpolated
          in OKLCH. Export CSS or SVG.
        </p>
      </header>
      {entitlements.gradientStudio ? (
        <GradientTool palettes={palettes} />
      ) : (
        <UpgradeCard feature="Gradient studio" />
      )}
    </div>
  );
}
