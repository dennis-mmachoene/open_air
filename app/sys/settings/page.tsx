import { requirePlatformAdmin } from "@/lib/platform/auth";
import { SysShell } from "@/components/platform/SysShell";
import { SectionCard, ErrorNote } from "@/components/platform/ui";
import { listSettings } from "@/lib/platform/settings";
import { setSettingAction, deleteSettingAction } from "@/app/sys/_actions";

export const dynamic = "force-dynamic";

export default async function SysSettingsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const admin = await requirePlatformAdmin();
  const { error } = await searchParams;
  const settings = await listSettings();

  return (
    <SysShell admin={admin} active="/sys/settings">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl text-text">Platform settings</h1>
          <p className="text-sm text-text-muted">Global key/value configuration, stored as JSON. Read via <code>getSetting(key)</code>.</p>
        </div>
        <ErrorNote message={error} />

        <SectionCard title="Settings">
          {settings.length === 0 ? (
            <p className="text-sm text-text-muted">No settings defined.</p>
          ) : (
            <ul className="flex flex-col">
              {settings.map((s) => (
                <li key={s.key} className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text"><code>{s.key}</code></p>
                    <p className="truncate text-xs text-text-muted">{JSON.stringify(s.value)}</p>
                    {s.description ? <p className="text-xs text-text-muted">{s.description}</p> : null}
                  </div>
                  <form action={deleteSettingAction}>
                    <input type="hidden" name="key" value={s.key} />
                    <button className="text-xs text-text-muted hover:text-p-danger">Delete</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Set a value">
          <form action={setSettingAction} className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <input name="key" placeholder="setting_key" required className="min-w-0 flex-1 rounded-control border border-border bg-canvas px-3 py-2 text-sm text-text focus:border-text focus:outline-none" />
              <input name="value" placeholder='Value (JSON: true, 42, "text", {…})' required className="min-w-0 flex-[2] rounded-control border border-border bg-canvas px-3 py-2 text-sm text-text focus:border-text focus:outline-none" />
              <button className="rounded-pill bg-text px-4 py-2 text-sm font-medium text-canvas hover:opacity-90">Save</button>
            </div>
            <input name="description" placeholder="Description (optional)" className="rounded-control border border-border bg-canvas px-3 py-2 text-sm text-text focus:border-text focus:outline-none" />
          </form>
        </SectionCard>
      </div>
    </SysShell>
  );
}
