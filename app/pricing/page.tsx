import type { Metadata } from "next";
import { PricingTable } from "@/components/billing/PricingTable";
import { billingEnabled } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Open Air is free to browse. Upgrade to Pro for the full Showroom, every export format, the generator and accessibility center — or Studio for teams and API access.",
};
export const revalidate = 86400;

export default function PricingPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-16 sm:px-8">
      <header className="flex flex-col gap-3 text-center">
        <h1 className="font-display text-4xl text-text sm:text-5xl">
          Generous to browse. Worth it to work.
        </h1>
        <p className="mx-auto max-w-xl text-lg text-text-soft">
          The gallery and the “why” come with every account. Pay only for the
          professional workflow — saving at scale, dev/design exports, and teams.
        </p>
      </header>
      <PricingTable billingEnabled={billingEnabled} />
    </div>
  );
}
