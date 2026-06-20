import type { Metadata } from "next";
import { RepairTool } from "@/components/studio/RepairTool";

export const metadata: Metadata = {
  title: "Make any palette accessible",
  description:
    "Paste any palette and Open Air flags every pairing that fails WCAG AA — and offers the nearest compliant variant that preserves each colour's hue.",
};

export default function AccessiblePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Studio</p>
        <h1 className="font-display text-4xl text-text">Make it accessible</h1>
        <p className="max-w-2xl text-text-soft">
          Paste any palette — yours, a client&apos;s, a competitor&apos;s export — and we
          report every pairing that fails WCAG AA, then offer the nearest compliant
          colour that keeps the same hue.
        </p>
      </header>
      <RepairTool />
    </div>
  );
}
