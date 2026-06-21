import type { Metadata } from "next";
import { ElevationTool } from "@/components/studio/ElevationTool";

export const metadata: Metadata = {
  title: "Elevation & shadows",
  description:
    "Generate a tinted elevation system — layered, brand-hued box-shadows plus dark-mode surface overlays — ready to export as CSS.",
};

export default function ElevationPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Studio</p>
        <h1 className="font-display text-4xl text-text">Elevation</h1>
        <p className="max-w-2xl text-text-soft">
          Shadows shouldn&apos;t be pure black. Generate a five-level elevation system whose
          shadows are faintly tinted with your brand hue, plus surface overlays for dark mode.
        </p>
      </header>
      <ElevationTool />
    </div>
  );
}
