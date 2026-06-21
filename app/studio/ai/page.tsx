import type { Metadata } from "next";
import { AiDirectorTool } from "@/components/studio/AiDirectorTool";

export const metadata: Metadata = {
  title: "AI color director",
  description:
    "Describe your brand and get a complete, accessible color system — base color, tonal scales, and semantic tokens — with a rationale and conversational refinement. The AI chooses the seed; the engine guarantees the accessibility.",
};

export default function AiPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Studio</p>
        <h1 className="font-display text-4xl text-text">AI color director</h1>
        <p className="max-w-2xl text-text-soft">
          Describe your brand in plain language and get a complete, accessible color
          system — not a random palette. The AI interprets your intent into a seed
          color; Open Air builds and validates the full token system around it. Then
          refine conversationally: warmer, more trustworthy, better for finance.
        </p>
      </header>
      <AiDirectorTool />
    </div>
  );
}
