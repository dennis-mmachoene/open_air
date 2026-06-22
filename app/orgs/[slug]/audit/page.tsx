import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { getOrgBySlug, getMembership } from "@/lib/orgs";
import { listOrgAudit, orgAuditActions, countOrgAudit } from "@/lib/org-audit";

export const metadata: Metadata = { title: "Audit log", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OrgAuditPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ action?: string }> }) {
  const { slug } = await params;
  const { action } = await searchParams;
  const user = await requireUser();
  const org = await getOrgBySlug(slug);
  if (!org) notFound();
  const role = await getMembership(org.id, user.id);
  if (role !== "owner" && role !== "admin") notFound();

  const [rows, actions, total] = await Promise.all([
    listOrgAudit(org.id, { action, limit: 200 }),
    orgAuditActions(org.id),
    countOrgAudit(org.id),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-2">
        <Link href={`/orgs/${slug}`} className="text-xs text-text-muted underline-offset-4 hover:underline">← {org.name}</Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl text-text">Audit log</h1>
            <p className="text-sm text-text-muted">{total} recorded {total === 1 ? "event" : "events"} for this team.</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={`/api/orgs/${slug}/audit/export?format=csv`} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-2">Export CSV</a>
            <a href={`/api/orgs/${slug}/audit/export?format=json`} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-2">Export JSON</a>
          </div>
        </div>
      </header>

      {actions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link href={`/orgs/${slug}/audit`} className={!action ? "rounded-full bg-text px-3 py-1 text-canvas" : "rounded-full border border-border px-3 py-1 text-text-soft hover:bg-surface-2"}>All</Link>
          {actions.map((a) => (
            <Link key={a} href={`/orgs/${slug}/audit?action=${encodeURIComponent(a)}`} className={action === a ? "rounded-full bg-text px-3 py-1 text-canvas" : "rounded-full border border-border px-3 py-1 text-text-soft hover:bg-surface-2"}>{a}</Link>
          ))}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-text-soft">No activity recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border bg-surface-2 text-left text-text-soft">
              <tr>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Actor</th>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-text-soft">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-text-soft">{r.actorLabel ?? "—"}</td>
                  <td className="px-4 py-2"><code className="text-text">{r.action}</code></td>
                  <td className="px-4 py-2 text-text-muted">{r.targetType ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
