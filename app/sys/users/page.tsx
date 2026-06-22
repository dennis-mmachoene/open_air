import { requirePlatformAdmin } from "@/lib/platform/auth";
import { SysShell } from "@/components/platform/SysShell";
import { PlanBadge } from "@/components/platform/ui";
import { adminUsers } from "@/lib/admin-data";
import { setUserPlanAction } from "@/app/sys/_actions";

export const dynamic = "force-dynamic";

export default async function SysUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const admin = await requirePlatformAdmin();
  const { q = "" } = await searchParams;
  const rows = await adminUsers(q);
  const fmt = (d: Date) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <SysShell admin={admin} active="/sys/users">
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="font-display text-2xl text-text">Users</h1>
          <p className="text-sm text-text-muted">Application accounts. Override a plan to comp or correct billing.</p>
        </div>
        <form className="flex max-w-sm gap-2" action="/sys/users">
          <input name="q" defaultValue={q} placeholder="Search email or name" className="min-w-0 flex-1 rounded-control border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-text" />
          <button className="rounded-control bg-text px-4 py-2 text-sm font-medium text-canvas">Search</button>
        </form>

        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b border-border bg-surface-2 text-left text-text-soft">
              <tr>
                <th className="px-4 py-2 font-medium">User</th>
                <th className="px-4 py-2 font-medium">Joined</th>
                <th className="px-4 py-2 font-medium">Plan</th>
                <th className="px-4 py-2 font-medium">Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-text-muted">No users (or DB not connected).</td></tr>
              ) : rows.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2"><div className="flex flex-col"><span className="text-text">{u.name ?? "—"}</span><span className="text-xs text-text-muted">{u.email}</span></div></td>
                  <td className="px-4 py-2 text-text-soft">{fmt(u.createdAt)}</td>
                  <td className="px-4 py-2"><PlanBadge plan={u.plan} /></td>
                  <td className="px-4 py-2">
                    <form action={setUserPlanAction} className="flex items-center gap-1">
                      <input type="hidden" name="userId" value={u.id} />
                      <select name="plan" defaultValue={u.plan} className="rounded-control border border-border bg-canvas px-2 py-1 text-xs text-text focus:border-text focus:outline-none">
                        <option value="free">free</option>
                        <option value="pro">pro</option>
                        <option value="studio">studio</option>
                      </select>
                      <button className="rounded-control border border-border px-2.5 py-1 text-xs text-text-soft hover:bg-surface-2">Apply</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SysShell>
  );
}
