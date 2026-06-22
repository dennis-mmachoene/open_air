import Link from "next/link";

export function UpgradeCard({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-card border border-border bg-surface-2 p-8">
      <h2 className="font-display text-2xl text-text">{feature} is a Pro feature</h2>
      <p className="max-w-md text-text-soft">
        Upgrade to Pro to unlock the generator, gradient studio, accessibility
        center and every export format.
      </p>
      <Link
        href="/pricing"
        className="rounded-pill bg-text px-5 py-2.5 text-sm font-medium text-canvas transition-opacity ease-standard hover:opacity-90"
      >
        Go Pro
      </Link>
    </div>
  );
}
