import { requirePlatformAdmin } from "@/lib/platform/auth";
import { SysShell } from "@/components/platform/SysShell";
import { SectionCard, ErrorNote } from "@/components/platform/ui";
import { listFlags } from "@/lib/platform/flags";
import { upsertFlagAction, deleteFlagAction } from "@/app/sys/_actions";

export const dynamic = "force-dynamic";

export default async function SysFlagsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const admin = await requirePlatformAdmin();
  const { error } = await searchParams;
  const flags = await listFlags();

  return (
    <SysShell admin={admin} active="/sys/flags">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl text-text">Feature flags</h1>
          <p className="text-sm text-text-muted">Toggle platform capabilities without a deploy. Read anywhere via <code>isFeatureEnabled(key)</code>.</p>
        </div>
        <ErrorNote message={error} />

        <SectionCard title="Flags">
          {flags.length === 0 ? (
            <p className="text-sm text-text-muted">No flags yet. Create one below.</p>
          ) : (
            <ul className="flex flex-col">
              {flags.map((f) => (
                <li key={f.key} className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text"><code>{f.key}</code></p>
                    {f.description ? <p className="text-xs text-text-muted">{f.description}</p> : null}
                    <p className="text-xs text-text-muted">Rollout {f.rolloutPercent}%</p>
                  </div>
                  <form action={upsertFlagAction}>
                    <input type="hidden" name="key" value={f.key} />
                    <input type="hidden" name="description" value={f.description ?? ""} />
                    <input type="hidden" name="rolloutPercent" value={f.rolloutPercent} />
                    <input type="hidden" name="enabled" value={f.enabled ? "0" : "1"} />
                    <button className={f.enabled ? "rounded-pill bg-green-600 px-3 py-1.5 text-xs font-medium text-white" : "rounded-pill border border-border px-3 py-1.5 text-xs text-text-soft hover:bg-surface-2"}>
                      {f.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </form>
                  <form action={deleteFlagAction}>
                    <input type="hidden" name="key" value={f.key} />
                    <button className="text-xs text-text-muted hover:text-p-danger">Delete</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Create / update a flag">
          <form action={upsertFlagAction} className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <input name="key" placeholder="flag_key" required className="min-w-0 flex-1 rounded-control border border-border bg-canvas px-3 py-2 text-sm text-text focus:border-text focus:outline-none" />
              <input name="rolloutPercent" type="number" min="0" max="100" defaultValue={100} className="w-24 rounded-control border border-border bg-canvas px-3 py-2 text-sm text-text focus:border-text focus:outline-none" />
              <input type="hidden" name="enabled" value="1" />
              <button className="rounded-pill bg-text px-4 py-2 text-sm font-medium text-canvas hover:opacity-90">Save (enabled)</button>
            </div>
            <input name="description" placeholder="Description (optional)" className="rounded-control border border-border bg-canvas px-3 py-2 text-sm text-text focus:border-text focus:outline-none" />
          </form>
        </SectionCard>
      </div>
    </SysShell>
  );
}
