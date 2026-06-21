import type { Metadata } from "next";
import Link from "next/link";
import { Showroom } from "@/components/showroom/Showroom";
import { ALL_PALETTES } from "@/lib/palettes/snapshot";
import { auth } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "Pick any palette and watch it dress a complete UI library in real time — buttons, forms, charts, and full screens.",
};

const TOOLS = [
  { href: "/studio/ai", label: "AI director", blurb: "Brief → a full system" },
  { href: "/studio/scales", label: "Tonal scales", blurb: "One color → a 50–950 system" },
  { href: "/studio/tokens", label: "Semantic tokens", blurb: "A full token system + matrix" },
  { href: "/studio/stress", label: "Stress test", blurb: "CVD, low-light & glare scorecard" },
  { href: "/studio/output", label: "Gamut & print", blurb: "P3 headroom + CMYK estimate" },
  { href: "/studio/dataviz", label: "Data-viz palettes", blurb: "Chart-ready, colorblind-safe" },
  { href: "/studio/gradient-check", label: "Gradient a11y", blurb: "Readable-text regions" },
  { href: "/studio/elevation", label: "Elevation", blurb: "Tinted shadow system" },
  { href: "/studio/viz-repair", label: "Repair a chart", blurb: "Fix colorblind conflicts" },
  { href: "/studio/generate", label: "Generator", blurb: "Build a palette from scratch" },
  { href: "/studio/extract", label: "Extract from image", blurb: "Pull colors from a photo" },
  { href: "/studio/gradients", label: "Gradients", blurb: "Perceptual gradient studio" },
  { href: "/studio/accessible", label: "Make accessible", blurb: "Repair any palette for AA" },
];

export default async function StudioPage() {
  const session = await auth();
  const authed = Boolean(session?.user);
  const entitlements = session?.user ? await getEntitlements(session.user.id) : null;
  const palettes = ALL_PALETTES.map((p) => ({
    slug: p.slug,
    name: p.name,
    roles: p.roles,
  }));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
          Studio
        </p>
        <h1 className="font-display text-4xl text-text sm:text-5xl">The Showroom</h1>
        <p className="max-w-2xl text-lg text-text-soft">
          Select any palette and watch it dress an entire UI library — primitives,
          components, data viz, and full screens — recoloured instantly.
        </p>
      </header>

      <nav aria-label="Studio tools" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {TOOLS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-text"
          >
            <span className="font-medium text-text">{t.label}</span>
            <span className="text-xs text-text-soft">{t.blurb}</span>
          </Link>
        ))}
      </nav>

      <Showroom
        palettes={palettes}
        lockedSlug={authed ? undefined : palettes[0]?.slug}
        preview={!entitlements?.fullShowroom}
      />
    </div>
  );
}
