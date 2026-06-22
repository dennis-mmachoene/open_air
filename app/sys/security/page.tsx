import Link from "next/link";
import { cookies } from "next/headers";
import { requirePlatformAdmin } from "@/lib/platform/auth";
import { SysShell } from "@/components/platform/SysShell";
import { SectionCard, ErrorNote } from "@/components/platform/ui";
import { listActiveSessions } from "@/lib/platform/sessions";
import { getAdminById } from "@/lib/platform/admins";
import { backupCodesRemaining } from "@/lib/platform/twofactor";
import { otpauthURL } from "@/lib/platform/totp";
import { getDb } from "@/lib/db";
import { platformAdmins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  revokeSessionAction,
  revokeAllOtherSessionsAction,
  startTotpAction,
  confirmTotpAction,
  disableTotpAction,
} from "@/app/sys/_actions";

export const dynamic = "force-dynamic";

export default async function SysSecurityPage({ searchParams }: { searchParams: Promise<{ enroll?: string; backup?: string; error?: string; required?: string }> }) {
  const admin = await requirePlatformAdmin({ allow2faSetup: true });
  const { enroll, backup, error, required } = await searchParams;
  const [sessions, row, remaining] = await Promise.all([
    listActiveSessions(),
    getAdminById(admin.id),
    backupCodesRemaining(admin.id),
  ]);

  // Pending enrollment secret (only read while enrolling).
  let pendingSecret: string | null = null;
  if (enroll === "1" && !row?.totpEnabled) {
    const db = getDb();
    const [a] = await db.select({ s: platformAdmins.totpSecret }).from(platformAdmins).where(eq(platformAdmins.id, admin.id)).limit(1);
    pendingSecret = a?.s ?? null;
  }

  // Backup codes shown exactly once after enrollment.
  let backupCodes: string[] = [];
  if (backup === "1") {
    const jar = await cookies();
    const raw = jar.get("oa_sys_backup")?.value;
    if (raw) backupCodes = raw.split(",");
  }

  return (
    <SysShell admin={admin} active="/sys/security">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl text-text">Security</h1>
          <p className="text-sm text-text-muted">Two-factor authentication and active administrator sessions.</p>
        </div>
        <ErrorNote message={error} />
        {required && !row?.totpEnabled ? (
          <p className="rounded-control border border-amber-600/40 bg-amber-600/5 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
            Two-factor authentication is required for platform administrators. Set it up below to access the console.
          </p>
        ) : null}

        <SectionCard title="Two-factor authentication">
          {row?.totpEnabled ? (
            <div className="flex flex-col gap-3">
              <p className="inline-flex w-fit items-center gap-2 rounded-pill border border-green-600/40 px-3 py-1 text-sm text-green-700 dark:text-green-400">
                <span className="h-2 w-2 rounded-pill bg-green-600" /> Enabled
              </p>
              <p className="text-sm text-text-soft">{remaining} backup code{remaining === 1 ? "" : "s"} remaining.</p>
              {backupCodes.length > 0 ? (
                <div className="rounded-control border border-amber-600/40 bg-amber-600/5 p-4">
                  <p className="mb-2 text-sm font-medium text-amber-700 dark:text-amber-400">Save these backup codes now — they won&apos;t be shown again.</p>
                  <ul className="grid grid-cols-2 gap-1 font-mono text-sm text-text sm:grid-cols-5">
                    {backupCodes.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                </div>
              ) : null}
              <form action={disableTotpAction}>
                <button className="w-fit rounded-pill border border-p-danger/40 px-4 py-2 text-sm font-medium text-p-danger hover:bg-p-danger/5">Disable 2FA</button>
              </form>
            </div>
          ) : pendingSecret ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text-soft">Add this account to your authenticator app, then enter a code to confirm.</p>
              <div className="rounded-control border border-border bg-canvas p-4 text-sm">
                <p className="text-text-muted">Manual key</p>
                <p className="font-mono text-text">{pendingSecret}</p>
                <p className="mt-2 break-all text-xs text-text-muted">{otpauthURL(pendingSecret, admin.email)}</p>
              </div>
              <form action={confirmTotpAction} className="flex flex-wrap items-center gap-2">
                <input name="code" inputMode="numeric" placeholder="6-digit code" required className="w-40 rounded-control border border-border bg-canvas px-3 py-2 text-center tracking-widest text-text focus:border-text focus:outline-none" />
                <button className="rounded-pill bg-text px-4 py-2 text-sm font-medium text-canvas hover:opacity-90">Confirm & enable</button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text-soft">Protect this account with a time-based one-time code (TOTP) in addition to your password.</p>
              <form action={startTotpAction}>
                <button className="w-fit rounded-pill bg-text px-4 py-2 text-sm font-medium text-canvas hover:opacity-90">Set up 2FA</button>
              </form>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title={`Active sessions (${sessions.length})`}
          action={
            <form action={revokeAllOtherSessionsAction}>
              <button className="rounded-pill border border-p-danger/40 px-3 py-1.5 text-xs font-medium text-p-danger hover:bg-p-danger/5">Revoke all & sign out</button>
            </form>
          }
        >
          <ul className="flex flex-col">
            {sessions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text">{s.adminEmail}</p>
                  <p className="truncate text-xs text-text-muted">{s.ip ?? "unknown IP"} · {s.userAgent ?? "unknown agent"}</p>
                  <p className="text-xs text-text-muted">Started {new Date(s.createdAt).toLocaleString()} · expires {new Date(s.expiresAt).toLocaleDateString()}</p>
                </div>
                <form action={revokeSessionAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className="rounded-control border border-border px-2.5 py-1 text-xs text-text-soft hover:bg-surface-2">Revoke</button>
                </form>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Account">
          <Link href="/sys/password" className="text-sm text-text underline-offset-4 hover:underline">Change your password →</Link>
        </SectionCard>
      </div>
    </SysShell>
  );
}
