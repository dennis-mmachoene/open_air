import { adminOverview } from "@/lib/admin-data";
import { Stat, PlanBadge } from "./_components";
import { requireAdmin } from "./_guard";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const o = await adminOverview();
  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const onboardPct = o.totalUsers > 0 ? Math.round((o.onboarded / o.totalUsers) * 100) : 0;
  const paid = o.byPlan.pro + o.byPlan.studio;

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Users" value={o.totalUsers} sub={`${paid} paid · ${o.byPlan.free} free`} />
        <Stat label="Saved palettes" value={o.totalSaves} />
        <Stat label="Generated" value={o.totalGenerated} />
        <Stat label="Collections" value={o.totalCollections} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 lg:col-span-1">
          <h2 className="font-display text-lg text-text">By plan</h2>
          {(["free", "pro", "studio"] as const).map((p) => (
            <div key={p} className="flex items-center justify-between text-sm">
              <PlanBadge plan={p} />
              <span className="text-text">{o.byPlan[p]}</span>
            </div>
          ))}
          <p className="mt-2 text-xs text-text-muted">{onboardPct}% of users completed onboarding</p>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 lg:col-span-2">
          <h2 className="font-display text-lg text-text">Recent signups</h2>
          {o.recent.length === 0 ? (
            <p className="text-sm text-text-soft">No users yet (or DB not connected).</p>
          ) : (
            <ul className="divide-y divide-border">
              {o.recent.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="text-text">{u.name ?? u.email}</span>{" "}
                    {u.name ? <span className="text-text-muted">{u.email}</span> : null}
                  </span>
                  <span className="flex flex-none items-center gap-3">
                    {u.onboarded ? null : <span className="text-xs text-text-muted">new</span>}
                    <PlanBadge plan={u.plan} />
                    <span className="text-text-muted">{fmtDate(u.createdAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
