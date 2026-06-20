import { runHealthChecks } from "@/lib/health";
import { requireAdmin } from "../_guard";

export default async function AdminHealthPage() {
  await requireAdmin();
  const report = await runHealthChecks();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${
            report.status === "ok"
              ? "border-green-600/40 text-green-700 dark:text-green-400"
              : "border-amber-600/40 text-amber-700 dark:text-amber-400"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${report.status === "ok" ? "bg-green-600" : "bg-amber-600"}`} />
          {report.status === "ok" ? "All systems operational" : "Degraded"}
        </span>
        <span className="text-xs text-text-muted">
          {new Date(report.time).toLocaleString()}
        </span>
      </div>

      <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
        {report.checks.map((c) => (
          <li key={c.name} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${c.ok ? "bg-green-600" : c.critical ? "bg-red-600" : "bg-text-muted"}`} />
              <span className="font-medium capitalize text-text">{c.name}</span>
              {c.critical ? <span className="text-xs text-text-muted">critical</span> : null}
            </span>
            <span className="text-sm text-text-soft">{c.detail}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-text-muted">
        Public probe: <code className="rounded bg-surface-2 px-1.5 py-0.5">/api/health</code> returns the same report (503 when degraded).
      </p>
    </div>
  );
}
