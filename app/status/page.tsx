import type { Metadata } from "next";
import Link from "next/link";
import { runHealthChecks } from "@/lib/health";

export const metadata: Metadata = {
  title: "System Status",
  description: "Live operational status of Open Air's services.",
};
export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  database: "Database",
  auth: "Authentication",
  email: "Email delivery",
  stripe: "Billing (Stripe)",
  ratelimit: "Rate limiting",
  ai: "AI assistant",
};

export default async function StatusPage() {
  const report = await runHealthChecks();
  const ok = report.status === "ok";

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-16 sm:px-8">
      <header className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Status</p>
        <h1 className="font-display text-4xl text-text">System status</h1>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${
              ok
                ? "border-green-600/40 text-green-700 dark:text-green-400"
                : "border-amber-600/40 text-amber-700 dark:text-amber-400"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${ok ? "bg-green-600" : "bg-amber-600"}`} />
            {ok ? "All systems operational" : "Some systems degraded"}
          </span>
          <span className="text-xs text-text-muted">
            Checked {new Date(report.time).toLocaleString()}
          </span>
        </div>
      </header>

      <ul className="mt-8 divide-y divide-border rounded-2xl border border-border bg-surface">
        {report.checks.map((c) => (
          <li key={c.name} className="flex items-center justify-between gap-3 px-5 py-4">
            <span className="flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  c.ok ? "bg-green-600" : c.critical ? "bg-red-600" : "bg-text-muted"
                }`}
              />
              <span className="text-text">{LABELS[c.name] ?? c.name}</span>
            </span>
            <span className="text-sm text-text-soft">
              {c.ok ? "Operational" : c.critical ? "Outage" : "Not configured"}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-sm text-text-muted">
        Components marked &ldquo;not configured&rdquo; are optional integrations that
        aren&rsquo;t enabled in this environment. For incidents or questions, contact{" "}
        <a href="mailto:openair.mailer@gmail.com" className="text-text underline underline-offset-4">
          openair.mailer@gmail.com
        </a>
        .
      </p>
      <p className="mt-4 text-sm text-text-muted">
        <Link href="/" className="underline-offset-4 hover:underline">← Back to Open Air</Link>
      </p>
    </div>
  );
}
