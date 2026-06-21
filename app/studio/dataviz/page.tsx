import type { Metadata } from "next";
import { DataVizTool } from "@/components/studio/DataVizTool";

export const metadata: Metadata = {
  title: "Data visualization palettes",
  description:
    "Production-ready chart palettes — categorical (colorblind-safe Okabe–Ito), sequential, and diverging — perceptually uniform in OKLCH, with a color-vision-deficiency safety check and CSS / JS / JSON export.",
};

export default function DataVizPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Studio</p>
        <h1 className="font-display text-4xl text-text">Data-viz palettes</h1>
        <p className="max-w-2xl text-text-soft">
          Chart-ready palettes that hold up in production — categorical sets built on
          the colorblind-safe Okabe–Ito palette, plus perceptually-uniform sequential
          and diverging scales, each checked against color-vision deficiencies.
        </p>
      </header>
      <DataVizTool />
    </div>
  );
}
