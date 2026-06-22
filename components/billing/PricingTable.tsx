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
    blurb: "The whole gallery, open to everyone.",
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
      "Public API access (key + rate limit)",
      "Teams: shared brand kits, roles & reviews (up to 5 seats)",
    ],
    cta: "Go Pro",
    featured: true,
  },
];

export function PricingTable({ billingEnabled }: { billingEnabled: boolean }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const plan = session?.user?.plan ?? null;
  const paid = plan === "pro" || plan === "studio";

  const [interval, setInterval] = useState<Interval>("monthly");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(tier: Tier) {
    setError(null);
    if (status !== "authenticated") {
      router.push("/signin");
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

  async function manageBilling() {
    setError(null);
    setBusy("manage");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data: { url?: string; error?: string } = await res.json();
      if (data.url) window.location.assign(data.url);
      else setError(data.error ?? "Couldn't open billing.");
    } finally {
      setBusy(null);
    }
  }

  function action(tier: Tier): { label: string; onClick: () => void; disabled: boolean } {
    const busyNow = busy !== null;
    if (plan === tier.plan) {
      return { label: "Current plan", onClick: () => {}, disabled: true };
    }
    if (paid) {
      // Up/downgrades go through the Stripe billing portal.
      return { label: busy === "manage" ? "Opening…" : "Manage billing", onClick: manageBilling, disabled: busyNow };
    }
    if (tier.plan === "free") {
      return {
        label: status === "authenticated" ? "Current plan" : "Get started",
        onClick: () => router.push(status === "authenticated" ? "/gallery" : "/signin"),
        disabled: status === "authenticated",
      };
    }
    return {
      label: busy === tier.plan ? "Redirecting…" : tier.cta,
      onClick: () => startCheckout(tier),
      disabled: busyNow,
    };
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-center gap-3">
        <span className="text-sm text-text-soft">Billed</span>
        <div className="inline-flex rounded-pill border border-border bg-surface p-0.5">
          {(["monthly", "yearly"] as Interval[]).map((iv) => (
            <button
              key={iv}
              type="button"
              onClick={() => setInterval(iv)}
              className={clsx(
                "rounded-pill px-3 py-1 text-sm capitalize transition-colors ease-standard",
                iv === interval ? "bg-text text-canvas" : "text-text-soft hover:text-text",
              )}
            >
              {iv}
              {iv === "yearly" ? " · save 25%" : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-5 md:grid-cols-2">
        {TIERS.map((tier) => {
          const a = action(tier);
          const isCurrent = plan === tier.plan;
          return (
            <div
              key={tier.plan}
              className={clsx(
                "flex flex-col gap-5 rounded-card border p-6",
                tier.featured ? "border-text shadow-lg" : "border-border",
                isCurrent && "ring-2 ring-text",
              )}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl text-text">{tier.name}</h2>
                  {isCurrent ? (
                    <span className="rounded-pill bg-text px-2.5 py-0.5 text-xs font-medium text-canvas">
                      Current
                    </span>
                  ) : tier.featured ? (
                    <span className="rounded-pill bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-text">
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
                {tier.plan !== "free" ? <span className="text-sm text-text-muted">/mo</span> : null}
              </div>

              <ul className="flex flex-1 flex-col gap-2.5 text-sm text-text-soft">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-pill bg-text" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={a.onClick}
                disabled={a.disabled}
                className={clsx(
                  "rounded-pill px-4 py-2.5 text-center text-sm font-medium transition-colors ease-standard disabled:opacity-50",
                  tier.featured && !a.disabled
                    ? "bg-text text-canvas hover:opacity-90"
                    : "border border-border text-text hover:bg-surface-2",
                )}
              >
                {a.label}
              </button>
            </div>
          );
        })}
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
