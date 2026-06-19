import type { Metadata } from "next";
import Link from "next/link";
import { clsx } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Open Air is free to browse. Upgrade to Pro for the full Showroom, every export format, the generator and accessibility center — or Studio for teams and API access.",
};

interface Tier {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  cta: string;
  featured?: boolean;
}

const TIERS: Tier[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "The whole gallery, open to everyone.",
    features: [
      "Browse the full library + every palette page",
      "The “why it works” explanation",
      "Light/dark Showroom preview",
      "Copy any HEX · CSS + Tailwind export",
      "Save up to 5 palettes",
    ],
    cta: "Start browsing",
  },
  {
    name: "Pro",
    price: "$8",
    cadence: "/mo · or $72/yr",
    blurb: "For designers and developers shipping real work.",
    features: [
      "Unlimited saves + personal collections",
      "The full Showroom — every specimen & screen",
      "All export formats (SCSS, JSON, Figma, SVG, PNG, ASE)",
      "Gradient studio · Accessibility center",
      "Palette generator · no upgrade prompts",
    ],
    cta: "Go Pro",
    featured: true,
  },
  {
    name: "Studio",
    price: "$24",
    cadence: "/mo · up to 5 seats",
    blurb: "For teams building a shared system.",
    features: [
      "Everything in Pro",
      "Shared team collections + brand kits",
      "Public API access (key + rate limit)",
      "Priority palette requests",
    ],
    cta: "Start a team",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-16 sm:px-8">
      <header className="flex flex-col gap-3 text-center">
        <h1 className="font-display text-4xl text-text sm:text-5xl">
          Generous to browse. Worth it to work.
        </h1>
        <p className="mx-auto max-w-xl text-lg text-text-soft">
          The gallery and the “why” stay free forever. Pay only for the
          professional workflow — saving at scale, dev/design exports, and teams.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={clsx(
              "flex flex-col gap-5 rounded-2xl border p-6",
              tier.featured ? "border-text shadow-lg" : "border-border",
            )}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl text-text">{tier.name}</h2>
                {tier.featured ? (
                  <span className="rounded-full bg-text px-2.5 py-0.5 text-xs font-medium text-canvas">
                    Most popular
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-text-soft">{tier.blurb}</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="font-display text-4xl text-text">{tier.price}</span>
              <span className="text-sm text-text-muted">{tier.cadence}</span>
            </div>

            <ul className="flex flex-1 flex-col gap-2.5 text-sm text-text-soft">
              {tier.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-text" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/studio"
              className={clsx(
                "rounded-full px-4 py-2.5 text-center text-sm font-medium transition-colors",
                tier.featured
                  ? "bg-text text-canvas hover:opacity-90"
                  : "border border-border text-text hover:bg-surface-2",
              )}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-text-muted">
        Checkout and billing arrive shortly — these plans are the structure we&apos;re building toward.
      </p>
    </div>
  );
}
