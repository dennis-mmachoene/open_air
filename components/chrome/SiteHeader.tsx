import Link from "next/link";
import { nav, site } from "@/lib/site";
import { AuthNav } from "@/components/auth/AuthNav";

/**
 * Quiet, near-neutral top bar. Contributes no loud color of its own so every
 * saturated pixel on screen belongs to a palette.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link
          href="/"
          className="font-display text-xl font-medium tracking-tight text-text"
          aria-label={`${site.name} — home`}
        >
          {site.name}
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-sm text-text-soft transition-colors hover:bg-surface-2 hover:text-text"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
