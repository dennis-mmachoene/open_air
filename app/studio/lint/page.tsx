import type { Metadata } from "next";
import { LintTool } from "@/components/studio/LintTool";

export const metadata: Metadata = {
  title: "Color linter",
  description:
    "Lint a set of colors or design tokens for accessibility, exact and perceptual duplicates, over-saturation, and naming — with a score and rule-by-rule report.",
};

export default function LintPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Studio</p>
        <h1 className="font-display text-4xl text-text">Color linter</h1>
        <p className="max-w-2xl text-text-soft">
          Audit a palette or token set the way a linter audits code: invalid values, duplicate
          and perceptually-identical colors, over-saturation that shifts on wide-gamut screens,
          and weak text contrast — scored, with every rule explained.
        </p>
      </header>
      <LintTool />
    </div>
  );
}
