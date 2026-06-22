import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/platform/auth";
import { SysShell } from "@/components/platform/SysShell";
import { SectionCard } from "@/components/platform/ui";
import { Strata } from "@/components/palette/Strata";
import { listFeed } from "@/lib/publish";
import { listOpenReports, listFeatured } from "@/lib/social";
import { resolveReportsAction, removePaletteAction, setFeaturedAction } from "@/app/sys/_actions";

export const dynamic = "force-dynamic";

export default async function SysCommunityPage() {
  const admin = await requirePlatformAdmin();
  const [reports, recent, featured] = await Promise.all([listOpenReports(), listFeed("new", 24), listFeatured(48)]);
  const featuredIds = new Set(featured.map((f) => f.id));

  return (
    <SysShell admin={admin} active="/sys/community">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl text-text">Moderation</h1>
          <p className="text-sm text-text-muted">Triage reports and curate staff picks. Every action is audit-logged.</p>
        </div>

        <SectionCard title={`Open reports (${reports.length})`}>
          {reports.length === 0 ? (
            <p className="text-sm text-text-soft">No open reports. 🎉</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {reports.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-control border border-border p-3">
                  <Strata hexes={r.hexes} className="h-9 w-16 flex-none" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/s/${r.slug}`} className="truncate text-sm text-text hover:underline">{r.name}</Link>
                    <p className="text-xs text-text-muted">Reason: {r.reason} · {r.reporterEmail ?? "unknown"}</p>
                  </div>
                  <form action={resolveReportsAction}>
                    <input type="hidden" name="id" value={r.publishedId} />
                    <button className="rounded-control border border-border px-3 py-1.5 text-xs text-text-soft hover:bg-surface-2">Dismiss</button>
                  </form>
                  <form action={removePaletteAction}>
                    <input type="hidden" name="id" value={r.publishedId} />
                    <button className="rounded-control bg-p-danger px-3 py-1.5 text-xs font-medium text-white">Remove</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Recent public palettes">
          {recent.length === 0 ? (
            <p className="text-sm text-text-soft">Nothing published yet.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recent.map((p) => {
                const on = featuredIds.has(p.id);
                return (
                  <li key={p.id} className="flex items-center gap-3 rounded-control border border-border p-3">
                    <Strata hexes={p.hexes} className="h-9 w-16 flex-none" />
                    <Link href={`/s/${p.slug}`} className="min-w-0 flex-1 truncate text-sm text-text hover:underline">{p.name}</Link>
                    <form action={setFeaturedAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="on" value={on ? "0" : "1"} />
                      <button className={on ? "rounded-control bg-text px-3 py-1.5 text-xs font-medium text-canvas" : "rounded-control border border-border px-3 py-1.5 text-xs text-text-soft hover:bg-surface-2"}>{on ? "★ Featured" : "Feature"}</button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>
    </SysShell>
  );
}
