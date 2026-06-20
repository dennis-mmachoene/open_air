import Link from "next/link";
import { site } from "@/lib/site";
import { AuthNav } from "@/components/auth/AuthNav";
import { PrimaryNav } from "@/components/chrome/PrimaryNav";
import { MobileNav } from "@/components/chrome/MobileNav";
import { Logo } from "@/components/chrome/Logo";

/**
 * Quiet, near-neutral top bar. Contributes no loud color of its own so every
 * saturated pixel on screen belongs to a palette.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" aria-label={`${site.name} — home`}>
          <Logo />
        </Link>

        <PrimaryNav />

        <div className="flex items-center gap-2">
          <AuthNav />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
