import Link from "next/link";
import { logoutAction } from "@/app/sys/_actions";
import type { PlatformAdmin } from "@/lib/platform/auth";

const NAV = [
  { href: "/sys", label: "Dashboard", exact: true },
  { href: "/sys/admins", label: "Administrators" },
  { href: "/sys/users", label: "Users" },
  { href: "/sys/billing", label: "Billing" },
  { href: "/sys/community", label: "Moderation" },
  { href: "/sys/audit", label: "Audit log" },
  { href: "/sys/flags", label: "Feature flags" },
  { href: "/sys/settings", label: "Settings" },
  { href: "/sys/security", label: "Security" },
];

export function SysShell({
  admin,
  active,
  children,
}: {
  admin: PlatformAdmin;
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas text-text">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-0 md:flex-row">
        <aside className="shrink-0 border-b border-border md:min-h-screen md:w-60 md:border-b-0 md:border-r">
          <div className="flex flex-col gap-1 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-control bg-text text-xs font-bold text-canvas">SA</span>
              <div className="leading-tight">
                <p className="font-display text-sm text-text">System Admin</p>
                <p className="text-[11px] text-text-muted">Platform console</p>
              </div>
            </div>
            <nav className="flex flex-row flex-wrap gap-1 md:flex-col">
              {NAV.map((n) => {
                const on = n.exact ? active === n.href : active.startsWith(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={
                      on
                        ? "rounded-control bg-surface-2 px-3 py-2 text-sm font-medium text-text"
                        : "rounded-control px-3 py-2 text-sm text-text-soft transition-colors hover:bg-surface-2 hover:text-text"
                    }
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
            <p className="text-xs text-text-muted">
              Signed in as <span className="text-text-soft">{admin.email}</span>
              <span className="ml-2 rounded-pill border border-border px-2 py-0.5 capitalize">{admin.role.replace("_", " ")}</span>
            </p>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-xs text-text-muted underline-offset-4 hover:text-text-soft hover:underline">Exit to site</Link>
              <form action={logoutAction}>
                <button className="rounded-pill border border-border px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-surface-2">Sign out</button>
              </form>
            </div>
          </header>
          <div className="p-5 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
