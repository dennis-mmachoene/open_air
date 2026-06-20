import { adminUsers } from "@/lib/admin-data";
import { PlanBadge } from "../_components";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const rows = await adminUsers(q);
  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="flex flex-col gap-5">
      <form className="flex max-w-sm gap-2" action="/admin/users">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search email or name"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus-visible:border-text"
        />
        <button className="rounded-lg bg-text px-4 py-2 text-sm font-medium text-canvas">Search</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border bg-surface-2 text-left text-text-soft">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Saves</th>
              <th className="px-4 py-3 font-medium">Onboarded</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-text-soft">
                  {q ? "No users match that search." : "No users yet (or DB not connected)."}
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="bg-surface">
                  <td className="px-4 py-3">
                    <div className="font-medium text-text">{u.name ?? "—"}</div>
                    <div className="text-text-muted">{u.email}</div>
                  </td>
                  <td className="px-4 py-3"><PlanBadge plan={u.plan} /></td>
                  <td className="px-4 py-3 text-text">{u.saves}</td>
                  <td className="px-4 py-3 text-text-soft">{u.onboarded ? "Yes" : "—"}</td>
                  <td className="px-4 py-3 text-text-muted">{fmtDate(u.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-text-muted">Showing up to 50 most-recent users.</p>
    </div>
  );
}
