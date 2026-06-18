import Link from "next/link";
import { author, nav, site, social } from "@/lib/site";

/**
 * Global footer. Carries the hard-requirement attribution to Dennis Ramara as
 * a single quiet line, with real anchors (rel="me noopener") and accessible
 * labels for each social destination.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-canvas">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Link href="/" className="font-display text-lg text-text">
            {site.name}
          </Link>
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
        </div>

        <div className="flex flex-col gap-2 md:items-end">
          {/* Attribution — quiet, single line */}
          <p className="text-sm text-text-soft">
            Designed &amp; built by{" "}
            <a
              href={author.links.github}
              rel="me noopener"
              target="_blank"
              className="font-medium text-text underline-offset-4 hover:underline"
            >
              {author.name}
            </a>
          </p>
          <div className="flex items-center gap-3">
            {social.map((s) => (
              <a
                key={s.href}
                href={s.href}
                rel="me noopener"
                target="_blank"
                aria-label={s.label}
                className="text-sm text-text-muted transition-colors hover:text-text"
              >
                {s.short}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
