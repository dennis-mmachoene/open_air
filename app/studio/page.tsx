import type { Metadata } from "next";
import { Showroom } from "@/components/showroom/Showroom";
import { ALL_PALETTES } from "@/lib/palettes/snapshot";
import { requireUser } from "@/lib/auth-guard";
import { getEntitlements } from "@/lib/entitlements";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "Pick any palette and watch it dress a complete UI library in real time — buttons, forms, charts, and full screens.",
};

export default async function StudioPage() {
  const user = await requireUser();
  const entitlements = await getEntitlements(user.id);
  const palettes = ALL_PALETTES.map((p) => ({
    slug: p.slug,
    name: p.name,
    roles: p.roles,
  }));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
          Studio
        </p>
        <h1 className="font-display text-4xl text-text sm:text-5xl">The Showroom</h1>
        <p className="max-w-2xl text-lg text-text-soft">
          Select any palette and watch it dress an entire UI library — primitives,
          components, data viz, and full screens — recoloured instantly.
        </p>
      </header>
      <Showroom palettes={palettes} preview={!entitlements.fullShowroom} />
    </div>
  );
}
