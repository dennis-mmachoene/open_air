import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-guard";
import { getEntitlements } from "@/lib/entitlements";
import { GeneratorTool } from "@/components/studio/GeneratorTool";
import { UpgradeCard } from "@/components/studio/UpgradeCard";

export const metadata: Metadata = { title: "Palette generator" };

export default async function GeneratePage() {
  const user = await requireUser();
  const entitlements = await getEntitlements(user.id);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Studio</p>
        <h1 className="font-display text-4xl text-text">Palette generator</h1>
        <p className="max-w-2xl text-text-soft">
          Pick a base hue and harmony — the OKLCH engine spaces the ramp, assigns
          roles, and checks WCAG AA. Nudge and save.
        </p>
      </header>
      {entitlements.generator ? <GeneratorTool /> : <UpgradeCard feature="The palette generator" />}
    </div>
  );
}
