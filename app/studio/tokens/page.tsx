import type { Metadata } from "next";
import { SemanticTokensTool } from "@/components/studio/SemanticTokensTool";

export const metadata: Metadata = {
  title: "Semantic design tokens",
  description:
    "Turn one brand color into a complete, accessible set of semantic design tokens — primary, surfaces, text, states, and status — for light and dark, with a full contrast matrix and CSS / Tailwind / JSON export.",
};

export default function TokensPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Studio</p>
        <h1 className="font-display text-4xl text-text">Semantic tokens</h1>
        <p className="max-w-2xl text-text-soft">
          One brand color in, a complete design-token system out — brand, surfaces,
          text, interactive states, and status colors, harmonized to your hue and
          validated for WCAG AA in both light and dark. Prove it with the contrast
          matrix, then export the full primitive → semantic hierarchy.
        </p>
      </header>
      <SemanticTokensTool />
    </div>
  );
}
