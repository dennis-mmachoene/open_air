import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/platform/auth";
import { SysShell } from "@/components/platform/SysShell";
import { Stat, SectionCard, PlanBadge } from "@/components/platform/ui";
import { adminOverview } from "@/lib/admin-data";
import { runHealthChecks } from "@/lib/health";
import { listAudit } from "@/lib/platform/audit";
import { countActiveAdmins } from "@/lib/platform/admins";
import { listOpenReports } from "@/lib/social";

export const dynamic = "force-dynamic";

export default async function SysDashboard() {
  const admin = await requirePlatformAdmin();
  const [o, health, recentAudit, admins, reports] = await Promise.all([
    adminOverview(),
    runHealthChecks(),
    listAudit({ limit: 8 }),
    countActiveAdmins(),
    listOpenReports(),
  ]);
  const paid = o.byPlan.pro + o.byPlan.studio;

  return (
    <SysShell admin={admin} active="/sys">
      <div className="flex flex-col gap-6">
        {admin.mustChangePassword ? (
          <div className="rounded-xl border border-amber-600/40 bg-amber-600/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            Your password was set by bootstrap or reset. <Link href="/sys/password" className="font-medium underline">Set a new password →</Link>
          </div>
        ) : null}

        <div>
          <h1 className="font-display text-2xl text-text">Platform overview</h1>
          <p className="text-sm text-text-muted">The state of the system at a glance.</p>
        </div>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Application users" value={o.totalUsers} sub={`${paid} paid · ${o.byPlan.free} free`} />
          <Stat label="Saved palettes" value={o.totalSaves} />
          <Stat label="Platform admins" value={admins} />
          <Stat label="Open reports" value={reports.length} />
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SectionCard title="System health">
            <div className="flex flex-col gap-2">
              <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${health.status === "ok" ? "border-green-600/40 text-green-700 dark:text-green-400" : "border-amber-600/40 text-amber-700 dark:text-amber-400"}`}>
                <span className={`h-2 w-2 rounded-full ${health.status === "ok" ? "bg-green-600" : "bg-amber-600"}`} />
                {health.status === "ok" ? "All systems operational" : "Degraded"}
              </span>
              <ul className="mt-1 flex flex-col gap-1 text-sm">
                {health.checks.map((c) => (
                  <li key={c.name} className="flex items-center justify-between">
                    <span className="capitalize text-text-soft">{c.name}</span>
                    <span className={c.ok ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}>{c.ok ? "ok" : "degraded"}</span>
                  </li>
                ))}
              </ul>
              <Link href="/sys/security" className="mt-1 text-xs text-text-muted underline-offset-4 hover:underline">Security & sessions →</Link>
            </div>
          </SectionCard>

          <SectionCard title="Plans">
            <div className="flex flex-col gap-2">
              {(["free", "pro", "studio"] as const).map((p) => (
                <div key={p} className="flex items-center justify-between text-sm">
                  <PlanBadge plan={p} />
                  <span className="text-text">{o.byPlan[p]}</span>
                </div>
              ))}
              <Link href="/sys/billing" className="mt-1 text-xs text-text-muted underline-offset-4 hover:underline">Billing oversight →</Link>
            </div>
          </SectionCard>

          <SectionCard title="Recent activity" action={<Link href="/sys/audit" className="text-xs text-text-muted underline-offset-4 hover:underline">Full log →</Link>}>
            {recentAudit.length === 0 ? (
              <p className="text-sm text-text-muted">No activity recorded yet.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {recentAudit.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-text-soft">{a.action}</span>
                    <span className="shrink-0 text-xs text-text-muted">{new Date(a.createdAt).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </SysShell>
  );
}
