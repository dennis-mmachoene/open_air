import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getSavedSlugs } from "@/lib/saves";
import { normalizePlan, PLAN_FEATURES } from "@/lib/plans";
import { UsageMeter } from "@/components/billing/UsageMeter";
import { needsOnboarding } from "@/lib/onboarding";
import { listUserPalettes } from "@/lib/user-palettes";
import { Strata } from "@/components/palette/Strata";
import { listUserCollections } from "@/lib/user-collections";
import { CollectionsManager } from "@/components/dashboard/CollectionsManager";
import { ALL_PALETTES, getPalette } from "@/lib/palettes/snapshot";
import { computeTasteProfile, recommendFromTaste, describeTaste } from "@/lib/taste";
import { PaletteCard } from "@/components/gallery/PaletteCard";
import { Rail } from "@/components/gallery/Rail";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (await needsOnboarding(session.user.id)) redirect("/onboarding");

  const [savedSlugs, collections, generated] = await Promise.all([
    getSavedSlugs(session.user.id),
    listUserCollections(session.user.id),
    listUserPalettes(session.user.id),
  ]);
  const saved = savedSlugs.map(getPalette).filter((p) => p !== undefined);

  const jar = await cookies();
  const recentSlugs = (jar.get("oa_recent")?.value ?? "").split(",").filter(Boolean);
  const recent = recentSlugs
    .map(getPalette)
    .filter((p) => p !== undefined)
    .slice(0, 8);

  const taste = computeTasteProfile(saved);
  const forYou =
    saved.length > 0
      ? recommendFromTaste(taste, ALL_PALETTES, new Set([...savedSlugs, ...recentSlugs]), 8)
      : [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-4xl text-text">Your dashboard</h1>
        <p className="text-text-soft">
          Welcome back{session.user.name ? `, ${session.user.name}` : ""}.
        </p>
      </header>

      <UsageMeter
        used={savedSlugs.length}
        limit={PLAN_FEATURES[normalizePlan(session.user.plan)].savedLimit}
        plan={normalizePlan(session.user.plan)}
      />

      {/* Saved */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl text-text">Saved palettes</h2>
        {saved.length === 0 ? (
          <p className="text-text-soft">
            Nothing saved yet —{" "}
            <Link href="/" className="underline underline-offset-4">browse the gallery</Link>{" "}
            and tap the heart on any palette.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {saved.map((p) => (
              <PaletteCard key={p.slug} palette={p} />
            ))}
          </div>
        )}
      </section>

      {/* Collections */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl text-text">Collections</h2>
        <CollectionsManager
          initial={collections.map((c) => ({ id: c.id, name: c.name, itemCount: c.itemCount }))}
        />
      </section>

      {/* Generated */}
      {generated.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-2xl text-text">Generated palettes</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {generated.map((g) => (
              <div key={g.id} className="overflow-hidden rounded-card border border-border">
                <Strata hexes={g.swatches.map((s) => s.hex)} className="h-28 rounded-b-none" />
                <div className="p-3">
                  <p className="truncate font-display text-text">{g.name}</p>
                  <p className="text-xs text-text-muted">{g.harmony}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Picked for you — from your taste profile */}
      {forYou.length > 0 ? (
        <Rail title="Picked for you" subtitle={describeTaste(taste)} href="/gallery" palettes={forYou} />
      ) : null}

      {/* Recently viewed */}
      {recent.length > 0 ? (
        <Rail title="Recently viewed" palettes={recent} />
      ) : null}
    </div>
  );
}
