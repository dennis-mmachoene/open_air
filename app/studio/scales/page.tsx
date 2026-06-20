import type { Metadata } from "next";
import { TonalScaleTool } from "@/components/studio/TonalScaleTool";

export const metadata: Metadata = {
  title: "Tonal scale generator",
  description:
    "Turn one color into a complete, perceptually-smooth tonal scale (50–950) in OKLCH — with per-tone contrast, best foreground, and WCAG AA/AAA status, ready to export as CSS, Tailwind, or JSON.",
};

export default function ScalesPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Studio</p>
        <h1 className="font-display text-4xl text-text">Tonal scales</h1>
        <p className="max-w-2xl text-text-soft">
          One color in, a complete design-system ramp out — 50 to 950, perceptually
          smooth in OKLCH, every tone annotated with its best foreground and WCAG
          status. Export to CSS variables, Tailwind, or JSON.
        </p>
      </header>
      <TonalScaleTool />
    </div>
  );
}
