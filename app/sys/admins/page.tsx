import { requirePlatformAdmin } from "@/lib/platform/auth";
import { SysShell } from "@/components/platform/SysShell";
import { Input } from "@/components/ui";
import { SectionCard, ErrorNote } from "@/components/platform/ui";
import { listAdmins } from "@/lib/platform/admins";
import { createAdminAction, setAdminStatusAction, resetAdminPasswordAction } from "@/app/sys/_actions";

export const dynamic = "force-dynamic";

export default async function SysAdminsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const me = await requirePlatformAdmin();
  const { error } = await searchParams;
  const admins = await listAdmins();

  return (
    <SysShell admin={me} active="/sys/admins">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl text-text">Administrators</h1>
          <p className="text-sm text-text-muted">Platform-level accounts with access to this console. Separate from application users.</p>
        </div>
        <ErrorNote message={error} />

        <SectionCard title="Team">
          <ul className="flex flex-col">
            {admins.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">{a.name ?? a.email} {a.id === me.id ? <span className="text-text-muted">(you)</span> : null}</p>
                  <p className="truncate text-xs text-text-muted">{a.email} · {a.lastLoginAt ? `last login ${new Date(a.lastLoginAt).toLocaleDateString()}` : "never signed in"}</p>
                </div>
                <span className={`rounded-pill border px-2.5 py-0.5 text-xs ${a.status === "active" ? "border-green-600/40 text-green-700 dark:text-green-400" : "border-border text-text-muted"}`}>{a.status}</span>
                {a.id !== me.id ? (
                  <div className="flex items-center gap-2">
                    <form action={setAdminStatusAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="status" value={a.status === "active" ? "disabled" : "active"} />
                      <button className="rounded-control border border-border px-2.5 py-1 text-xs text-text-soft hover:bg-surface-2">{a.status === "active" ? "Disable" : "Enable"}</button>
                    </form>
                    <form action={resetAdminPasswordAction} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={a.id} />
                      <Input name="password" type="password" placeholder="New password" required className="w-32"  aria-label="New password"/>
                      <button className="rounded-control border border-border px-2.5 py-1 text-xs text-text-soft hover:bg-surface-2">Reset</button>
                    </form>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Add an administrator">
          <form action={createAdminAction} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Input name="name" placeholder="Name" className="min-w-0 flex-1"  aria-label="Name"/>
            <Input name="email" type="email" placeholder="email@company.com" required className="min-w-0 flex-1"  aria-label="email@company.com"/>
            <Input name="password" type="password" placeholder="Temp password (12+)" required className="min-w-0 flex-1"  aria-label="Temp password (12+)"/>
            <button className="rounded-pill bg-text px-4 py-2 text-sm font-medium text-canvas hover:opacity-90">Create</button>
          </form>
          <p className="text-xs text-text-muted">New admins must change their password at first sign-in.</p>
        </SectionCard>
      </div>
    </SysShell>
  );
}
