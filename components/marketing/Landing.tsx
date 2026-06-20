import Link from "next/link";
import { ALL_PALETTES } from "@/lib/palettes/snapshot";
import { Strata } from "@/components/palette/Strata";
import { NowShowing } from "@/components/gallery/NowShowing";

const FEATURES = [
  {
    title: "100+ curated palettes",
    body: "A living gallery of color, organized by mood, family, season and harmony — every set hand-picked and quality-checked.",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  {
    title: "Understand the why",
    body: "Computed harmony, temperature and dominant hue — plus a hue-wheel diagram and WCAG contrast for every pairing.",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 12l5-3" />
        <circle cx="12" cy="12" r="1.5" />
      </>
    ),
  },
  {
    title: "The Showroom",
    body: "Pick a palette and watch it dress a complete UI — buttons, forms, charts and whole screens — recolored in real time.",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M9 9v11" />
      </>
    ),
  },
  {
    title: "Export anywhere",
    body: "Copy any HEX, or export CSS variables and Tailwind free — with SCSS, JSON, Figma tokens, SVG, PNG and ASE on Pro.",
    icon: (
      <>
        <path d="M12 3v12" />
        <path d="M7 10l5 5 5-5" />
        <path d="M5 21h14" />
      </>
    ),
  },
];

const TIERS = [
  { name: "Free", price: "$0", note: "Browse, understand, export basics" },
  { name: "Pro", price: "$8/mo", note: "Full Showroom, all exports, generator", featured: true },
  { name: "Studio", price: "$24/mo", note: "Public API + priority requests" },
];

const FAQ = [
  {
    q: "Is Open Air free?",
    a: "Yes — the entire gallery, every palette page, and the “why it works” explanation are free forever. Pro unlocks the professional workflow: unlimited saves, all export formats, the full Showroom and the generator.",
  },
  {
    q: "Do I need an account to browse?",
    a: "No — browsing the gallery, every palette page and the “why” is open to everyone. An account lets you save palettes, build collections and export.",
  },
  {
    q: "Are the palettes accessible?",
    a: "Every palette is validated against WCAG AA contrast before it ships, so text and labels stay legible in light and dark.",
  },
  {
    q: "What can I export?",
    a: "CSS custom properties and a Tailwind theme block are free. SCSS, JSON design tokens, Figma tokens, SVG, PNG and ASE come with Pro.",
  },
];

export function Landing() {
  const heroStrata = ALL_PALETTES.slice(0, 4);
  const featured = ALL_PALETTES.slice(0, 5);

  return (
    <div className="flex flex-col">
      {/* Now Showing — the living gallery, visible to everyone */}
      <NowShowing palettes={featured} />

      {/* Hero */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-12 pt-20 text-center sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
          A living gallery of color
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl font-display text-5xl leading-[1.05] tracking-tight text-text sm:text-6xl">
          Find the colors your product deserves.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-text-soft">
          Discover beautiful palettes, understand why they work, and watch one
          dress a complete UI — before you write a line of CSS.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/gallery"
            className="rounded-full bg-text px-6 py-3 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
          >
            Explore the gallery
          </Link>
          <Link
            href="/pricing"
            className="rounded-full border border-border px-6 py-3 text-sm font-medium text-text transition-colors hover:bg-surface-2"
          >
            See pricing
          </Link>
        </div>
        <p className="mt-4 text-sm text-text-muted">
          New ·{" "}
          <Link href="/studio/extract" className="text-text underline underline-offset-4">
            Extract an accessible palette from any image →
          </Link>
        </p>

        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {heroStrata.map((p) => (
            <Link key={p.slug} href={`/p/${p.slug}`} className="group">
              <Strata
                hexes={p.swatches.map((s) => s.hex)}
                vertical
                className="h-28 transition-transform group-hover:scale-[1.02]"
              />
              <p className="mt-2 text-left text-xs text-text-muted">{p.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col gap-3 rounded-2xl border border-border p-5">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-text"
                aria-hidden="true"
              >
                {f.icon}
              </svg>
              <h3 className="font-medium text-text">{f.title}</h3>
              <p className="text-sm leading-relaxed text-text-soft">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Highlight */}
      <section className="border-y border-border bg-surface-2/40">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-5 py-16 text-center sm:px-8">
          <h2 className="max-w-2xl font-display text-3xl tracking-tight text-text sm:text-4xl">
            A palette becomes a complete UI library.
          </h2>
          <p className="max-w-xl text-text-soft">
            The Showroom dresses primitives, components, data viz and full screens
            from a single palette — so you can see exactly how color will feel in
            your product, accessibly, before committing.
          </p>
          <Link
            href="/studio"
            className="mt-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface-2"
          >
            Open the Showroom
          </Link>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8">
        <h2 className="text-center font-display text-3xl tracking-tight text-text">
          Free to browse. Worth it to work.
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`flex flex-col gap-2 rounded-2xl border p-5 ${
                t.featured ? "border-text" : "border-border"
              }`}
            >
              <span className="text-sm font-medium text-text">{t.name}</span>
              <span className="font-display text-2xl text-text">{t.price}</span>
              <span className="text-sm text-text-soft">{t.note}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link href="/pricing" className="text-sm text-text-soft underline underline-offset-4 hover:text-text">
            Compare plans →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8">
        <h2 className="font-display text-3xl tracking-tight text-text">Questions</h2>
        <dl className="mt-6 divide-y divide-border">
          {FAQ.map((item) => (
            <div key={item.q} className="py-5">
              <dt className="font-medium text-text">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-text-soft">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <section className="mx-auto mb-20 w-full max-w-5xl px-5 sm:px-8">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-surface-2/40 px-6 py-14 text-center">
          <h2 className="font-display text-3xl tracking-tight text-text">
            Start exploring color.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/gallery"
              className="rounded-full bg-text px-6 py-3 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
            >
              Browse the gallery
            </Link>
            <Link
              href="/pricing"
              className="rounded-full border border-border px-6 py-3 text-sm font-medium text-text transition-colors hover:bg-surface-2"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
