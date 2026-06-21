import type { Metadata } from "next";
import { VizRepairTool } from "@/components/studio/VizRepairTool";

export const metadata: Metadata = {
  title: "Repair a chart palette",
  description:
    "Paste an existing chart or dashboard palette and Open Air fixes the colors that collapse under color-vision deficiencies — minimally, preserving the rest of your palette.",
};

export default function VizRepairPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Studio</p>
        <h1 className="font-display text-4xl text-text">Repair a chart palette</h1>
        <p className="max-w-2xl text-text-soft">
          Inherited a chart palette where some series look alike — especially for
          colorblind viewers? Paste it in and we&apos;ll nudge only the conflicting
          colors until every series is distinguishable, keeping the rest intact.
        </p>
      </header>
      <VizRepairTool />
    </div>
  );
}
