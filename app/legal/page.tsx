import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_DOCS } from "@/lib/legal";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal-meta";

export const metadata: Metadata = {
  title: "Legal & Policies",
  description: "Open Air's terms, privacy, billing, and other legal policies.",
};
export const revalidate = 86400;

export default function LegalIndexPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Legal</p>
        <h1 className="font-display text-4xl text-text">Policies &amp; terms</h1>
        <p className="text-text-soft">
          The agreements and policies that govern Open Air. Last updated {LEGAL_EFFECTIVE_DATE}.
        </p>
      </header>
      <ul className="flex flex-col divide-y divide-border rounded-card border border-border">
        {LEGAL_DOCS.map((d) => (
          <li key={d.slug}>
            <Link
              href={`/legal/${d.slug}`}
              className="flex flex-col gap-0.5 px-5 py-4 transition-colors hover:bg-surface-2"
            >
              <span className="font-medium text-text">{d.title}</span>
              <span className="text-sm text-text-soft">{d.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
