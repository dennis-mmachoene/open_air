"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { clsx } from "@/lib/cn";

type Interval = "monthly" | "yearly";

interface Tier {
  name: string;
  plan: "free" | "pro" | "studio";
  monthly: string;
  yearly: string;
  blurb: string;
  features: string[];
  cta: string;
  featured?: boolean;
}

const TIERS: Tier[] = [
  {
    name: "Free",
    plan: "free",
    monthly: "$0",
    yearly: "$0",
    blurb: "The whole gallery, open to members.",
    features: [
      "Browse the full library + every palette page",
      "The “why it works” explanation",
      "Light/dark Showroom preview",
      "Copy any HEX · CSS + Tailwind export",
      "Save up to 5 palettes",
    ],
    cta: "Get started",
  },
  {
    name: "Pro",
    plan: "pro",
    monthly: "$8",
    yearly: "$6",
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
    plan: "studio",
    monthly: "$24",
    yearly: "$20",
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

export function PricingTable({ billingEnabled }: { billingEnabled: boolean }) {
  const { status } = useSession();
  const router = useRouter();
  const [interval, setInterval] = useState<Interval>("monthly");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(tier: Tier) {
    setError(null);
    if (status !== "authenticated") {
      router.push("/signin");
      return;
    }
    if (tier.plan === "free") {
      router.push("/gallery");
      return;
    }
    if (!billingEnabled) {
      setError("Billing isn't configured yet.");
      return;
    }
    setBusy(tier.plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: tier.plan, interval }),
      });
      const data: { url?: string; error?: string } = await res.json();
      if (data.url) window.location.assign(data.url);
      else setError(data.error ?? "Couldn't start checkout.");
    } catch {
      setError("Couldn't start checkout.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-center gap-3">
        <span className="text-sm text-text-soft">Billed</span>
        <div className="inline-flex rounded-full border border-border bg-surface p-0.5">
          {(["monthly", "yearly"] as Interval[]).map((iv) => (
            <button
              key={iv}
              type="button"
              onClick={() => setInterval(iv)}
              className={clsx(
                "rounded-full px-3 py-1 text-sm capitalize transition-colors",
                iv === interval ? "bg-text text-canvas" : "text-text-soft hover:text-text",
              )}
            >
              {iv}
              {iv === "yearly" ? " · save 25%" : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.plan}
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
              <span className="font-display text-4xl text-text">
                {interval === "monthly" ? tier.monthly : tier.yearly}
              </span>
              {tier.plan !== "free" ? (
                <span className="text-sm text-text-muted">/mo</span>
              ) : null}
            </div>

            <ul className="flex flex-1 flex-col gap-2.5 text-sm text-text-soft">
              {tier.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-text" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => choose(tier)}
              disabled={busy === tier.plan}
              className={clsx(
                "rounded-full px-4 py-2.5 text-center text-sm font-medium transition-colors disabled:opacity-50",
                tier.featured
                  ? "bg-text text-canvas hover:opacity-90"
                  : "border border-border text-text hover:bg-surface-2",
              )}
            >
              {busy === tier.plan ? "Redirecting…" : tier.cta}
            </button>
          </div>
        ))}
      </div>

      {error ? <p className="text-center text-sm text-p-danger">{error}</p> : null}
      {!billingEnabled ? (
        <p className="text-center text-sm text-text-muted">
          Stripe isn&apos;t configured in this environment yet — checkout is disabled.
        </p>
      ) : null}
    </div>
  );
}
