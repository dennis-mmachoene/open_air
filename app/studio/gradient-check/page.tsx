import type { Metadata } from "next";
import { GradientCheckTool } from "@/components/studio/GradientCheckTool";

export const metadata: Metadata = {
  title: "Gradient accessibility",
  description:
    "Scan a gradient end to end and see exactly where overlaid text stays readable (WCAG AA) — with OKLCH interpolation that avoids muddy mid-gradient greys.",
};

export default function GradientCheckPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Studio</p>
        <h1 className="font-display text-4xl text-text">Gradient accessibility</h1>
        <p className="max-w-2xl text-text-soft">
          Most contrast checks look at two flat colors — but text often sits on a gradient.
          This scans the whole gradient and shows where your text stays readable, and where it doesn&apos;t.
        </p>
      </header>
      <GradientCheckTool />
    </div>
  );
}
