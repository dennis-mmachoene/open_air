import Link from "next/link";
import { site } from "@/lib/site";

/** Strata — the signature motif: stacked color bands. Here it previews the
 *  palette role-token defaults; from Phase 2 real palettes drive it. */
const strata = [
  "var(--p-c1)",
  "var(--p-c2)",
  "var(--p-c3)",
  "var(--p-c4)",
  "var(--p-c5)",
  "var(--p-c6)",
];

export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-20 sm:px-8">
      <div className="flex flex-col gap-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
          Now showing
        </p>
        <h1 className="max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight text-text sm:text-6xl">
          A living gallery of color.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-text-soft">
          {site.description} Discover palettes, understand why they work, and
          watch one dress an entire UI in the Showroom.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/studio"
            className="rounded-full bg-text px-5 py-2.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
          >
            Open the Studio
          </Link>
          <Link
            href="/about"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface-2"
          >
            The story
          </Link>
        </div>
      </div>

      {/* Strata preview */}
      <div
        className="mt-16 overflow-hidden rounded-2xl border border-border"
        aria-hidden="true"
      >
        <div className="flex h-56 w-full sm:h-72">
          {strata.map((c, i) => (
            <div key={i} className="h-full flex-1" style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm text-text-muted">
        Foundation preview · the curated library of 100+ palettes arrives in
        Phase&nbsp;2.
      </p>
    </section>
  );
}
