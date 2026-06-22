import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/platform/auth";
import { SysShell } from "@/components/platform/SysShell";
import { listAudit, auditActions } from "@/lib/platform/audit";

export const dynamic = "force-dynamic";

export default async function SysAuditPage({ searchParams }: { searchParams: Promise<{ action?: string }> }) {
  const admin = await requirePlatformAdmin();
  const { action } = await searchParams;
  const [rows, actions] = await Promise.all([listAudit({ action, limit: 200 }), auditActions()]);

  return (
    <SysShell admin={admin} active="/sys/audit">
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="font-display text-2xl text-text">Audit log</h1>
          <p className="text-sm text-text-muted">Every administrative action, append-only.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link href="/sys/audit" className={!action ? "rounded-pill bg-text px-3 py-1 text-canvas" : "rounded-pill border border-border px-3 py-1 text-text-soft hover:bg-surface-2"}>All</Link>
          {actions.map((a) => (
            <Link key={a} href={`/sys/audit?action=${encodeURIComponent(a)}`} className={action === a ? "rounded-pill bg-text px-3 py-1 text-canvas" : "rounded-pill border border-border px-3 py-1 text-text-soft hover:bg-surface-2"}>{a}</Link>
          ))}
        </div>

        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border bg-surface-2 text-left text-text-soft">
              <tr>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Actor</th>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Target</th>
                <th className="px-4 py-2 font-medium">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-text-muted">No entries.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-text-soft">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-text-soft">{r.actorLabel ?? "—"}</td>
                  <td className="px-4 py-2"><code className="text-text">{r.action}</code></td>
                  <td className="px-4 py-2 text-text-muted">{r.targetType ? `${r.targetType}${r.targetId ? `:${r.targetId.slice(0, 8)}` : ""}` : "—"}</td>
                  <td className="px-4 py-2 text-text-muted">{r.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SysShell>
  );
}
