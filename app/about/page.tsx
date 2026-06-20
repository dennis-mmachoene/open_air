import type { Metadata } from "next";
import Link from "next/link";
import { author, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `The story behind ${site.name}, designed and built by ${author.name}.`,
};
export const revalidate = 86400;

export default function AboutPage() {
  return (
    <article className="mx-auto w-full max-w-2xl px-5 py-20 sm:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
        About
      </p>
      <h1 className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight text-text sm:text-5xl">
        {site.name}
      </h1>

      <div className="mt-8 flex flex-col gap-5 text-lg leading-relaxed text-text-soft">
        <p>
          {site.name} is a premium color exploration platform a living gallery
          of color. It is the destination where designers, developers, and
          creatives come to discover beautiful palettes, understand why colors
          work together, visualize them across real interfaces, and confidently
          decide.
        </p>
        <p>
          Two ideas define it. First, the gallery is the product: color is the
          content, and the interface stays quiet and neutral so every saturated
          pixel on screen belongs to a palette. Second, a palette becomes a UI
          library select any palette in the Showroom and watch it dress a
          complete component library and real screens in real time.
        </p>
        <p>
          It is not a color picker and not a swatch dump. It is a museum of
          color you can put to work.
        </p>
      </div>

      <hr className="my-10 border-border" />

      <p className="mt-12 text-sm text-text-muted">
        <Link href="/" className="underline-offset-4 hover:underline">
          ← Back to the gallery
        </Link>
      </p>
    </article>
  );
}
