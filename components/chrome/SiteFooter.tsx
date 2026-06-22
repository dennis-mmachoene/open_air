import Link from "next/link";
import { nav, site } from "@/lib/site";
import { Logo } from "@/components/chrome/Logo";

/** Global footer: navigation, legal links, and a single quiet contact line. */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-canvas">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Link href="/"><Logo /></Link>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-text-soft transition-colors hover:text-text"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/legal/terms" className="text-xs text-text-muted transition-colors hover:text-text">Terms</Link>
            <Link href="/legal/privacy" className="text-xs text-text-muted transition-colors hover:text-text">Privacy</Link>
            <Link href="/legal/cookies" className="text-xs text-text-muted transition-colors hover:text-text">Cookies</Link>
            <Link href="/trends" className="text-xs text-text-muted transition-colors hover:text-text">Trends</Link>
            <Link href="/legal" className="text-xs text-text-muted transition-colors hover:text-text">Legal</Link>
            <Link href="/status" className="text-xs text-text-muted transition-colors hover:text-text">Status</Link>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:items-end">
          {/* Contact — quiet, single line */}
          <p className="text-sm text-text-soft">
            Contact{" "}
            <a
              href={`mailto:${site.email}`}
              className="font-medium text-text underline-offset-4 hover:underline"
            >
              {site.email}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
