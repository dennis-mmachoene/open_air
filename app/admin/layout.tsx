import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "./_guard";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/community", label: "Community" },
  { href: "/admin/health", label: "Health" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Admin</p>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-display text-3xl text-text">Control room</h1>
          <span className="text-sm text-text-muted">{session.user.email}</span>
        </div>
      </div>

      <nav className="mt-6 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-t-lg px-3 py-2 text-sm text-text-soft transition-colors hover:bg-surface-2 hover:text-text"
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  );
}
