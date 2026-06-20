import type { Metadata } from "next";
import { ExtractTool } from "@/components/studio/ExtractTool";

export const metadata: Metadata = {
  title: "Extract a palette from an image",
  description:
    "Upload a photo, screenshot or artwork and Open Air turns its dominant colours into a harmonious, WCAG-AA accessible palette — instantly.",
};

export default function ExtractPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Studio</p>
        <h1 className="font-display text-4xl text-text">Extract from image</h1>
        <p className="max-w-2xl text-text-soft">
          Drop a brand photo or screenshot — we pull the dominant colours and turn
          them into a harmonious palette that passes WCAG AA, with the reasoning shown.
        </p>
      </header>
      <ExtractTool />
    </div>
  );
}
