import type { Metadata } from "next";
import { OutputCheckTool } from "@/components/studio/OutputCheckTool";

export const metadata: Metadata = {
  title: "Gamut & print check",
  description:
    "Check whether a color renders everywhere — Display P3 wide-gamut headroom vs sRGB, plus a CMYK print estimate with ink coverage and an out-of-gamut warning.",
};

export default function OutputPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Studio</p>
        <h1 className="font-display text-4xl text-text">Gamut &amp; print</h1>
        <p className="max-w-2xl text-text-soft">
          Will this color hold up everywhere it ships? See its Display P3 headroom over
          sRGB, and a CMYK print estimate — ink coverage, an out-of-gamut warning, and an
          on-screen vs in-print preview.
        </p>
      </header>
      <OutputCheckTool />
    </div>
  );
}
