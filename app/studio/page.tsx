import type { Metadata } from "next";
import Link from "next/link";
import { Showroom } from "@/components/showroom/Showroom";
import { ALL_PALETTES } from "@/lib/palettes/snapshot";
import { auth } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "Create, systematize, and validate color: generate and extract palettes, build token systems, check accessibility, and re-theme a whole UI in the Showroom.",
};

type Tool = { href: string; label: string; blurb: string };
type Group = { title: string; intro: string; tools: Tool[] };

const GROUPS: Group[] = [
  {
    title: "Create",
    intro: "Start a palette from an idea, a photo, or scratch.",
    tools: [
      { href: "/studio/ai", label: "AI director", blurb: "Describe a project → a full system" },
      { href: "/studio/generate", label: "Generator", blurb: "Build a palette from scratch" },
      { href: "/studio/extract", label: "Extract from image", blurb: "Pull colors out of a photo" },
      { href: "/studio/gradients", label: "Gradients", blurb: "Build a smooth, even gradient" },
    ],
  },
  {
    title: "Systematize",
    intro: "Turn one color into a complete, reusable system.",
    tools: [
      { href: "/studio/scales", label: "Tonal scales", blurb: "One color → a 50–950 ramp" },
      { href: "/studio/tokens", label: "Semantic tokens", blurb: "A full token set + contrast grid" },
      { href: "/studio/elevation", label: "Elevation", blurb: "A shadow system tinted to your color" },
    ],
  },
  {
    title: "Validate",
    intro: "Check it works for everyone — and fix it if it doesn't.",
    tools: [
      { href: "/studio/lint", label: "Color linter", blurb: "Audit a palette for issues" },
      { href: "/studio/accessible", label: "Make accessible", blurb: "Fix a palette to pass contrast (AA)" },
      { href: "/studio/stress", label: "Stress test", blurb: "Check color-blindness, low light & glare" },
      { href: "/studio/output", label: "Gamut & print", blurb: "Wide-gamut headroom + print (CMYK) preview" },
    ],
  },
  {
    title: "Data viz",
    intro: "Color that stays clear in charts and graphs.",
    tools: [
      { href: "/studio/dataviz", label: "Data-viz palettes", blurb: "Chart-ready, color-blind-safe sets" },
      { href: "/studio/viz-repair", label: "Repair a chart", blurb: "Fix clashing colors in a chart" },
      { href: "/studio/gradient-check", label: "Gradient a11y", blurb: "Where text stays readable on a gradient" },
    ],
  },
];

export default async function StudioPage() {
  const session = await auth();
  const authed = Boolean(session?.user);
  const entitlements = session?.user ? await getEntitlements(session.user.id) : null;
  const palettes = ALL_PALETTES.map((p) => ({ slug: p.slug, name: p.name, roles: p.roles }));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-5 py-10 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Studio</p>
        <h1 className="font-display text-4xl text-text sm:text-5xl">Tools for building with color</h1>
        <p className="max-w-2xl text-lg text-text-soft">
          Create palettes, turn them into systems, validate them for everyone, and preview the
          result on a real UI — all client-side.
        </p>
      </header>

      <div className="flex flex-col gap-8">
        {GROUPS.map((g) => (
          <section key={g.title} className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="font-display text-xl text-text">{g.title}</h2>
              <p className="text-sm text-text-muted">{g.intro}</p>
            </div>
            <nav aria-label={`${g.title} tools`} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {g.tools.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4 transition-colors ease-standard hover:border-text"
                >
                  <span className="font-medium text-text">{t.label}</span>
                  <span className="text-xs text-text-soft">{t.blurb}</span>
                </Link>
              ))}
            </nav>
          </section>
        ))}
      </div>

      <section className="flex flex-col gap-4 border-t border-border pt-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Showroom</p>
          <h2 className="font-display text-3xl text-text">See any palette on a real UI</h2>
          <p className="max-w-2xl text-text-soft">
            Pick a palette and watch it re-theme an entire interface — primitives, components,
            data viz, and full screens — instantly.
          </p>
        </div>
        <Showroom
          palettes={palettes}
          lockedSlug={authed ? undefined : palettes[0]?.slug}
          preview={!entitlements?.fullShowroom}
        />
      </section>
    </div>
  );
}
