import { requirePlatformAdmin } from "@/lib/platform/auth";
import { changePasswordAction } from "@/app/sys/_actions";
import { ErrorNote } from "@/components/platform/ui";

export const dynamic = "force-dynamic";

export default async function SysPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const admin = await requirePlatformAdmin();
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-5 text-text">
      <div className="flex w-full max-w-sm flex-col gap-5">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="font-display text-2xl text-text">{admin.mustChangePassword ? "Set a new password" : "Change password"}</h1>
          <p className="text-sm text-text-muted">Minimum 12 characters, with upper- and lower-case letters and a number.</p>
        </div>
        <ErrorNote message={error} />
        <form action={changePasswordAction} className="flex flex-col gap-3">
          <input name="password" type="password" placeholder="New password" autoComplete="new-password" required className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text focus:border-text focus:outline-none" />
          <input name="confirm" type="password" placeholder="Confirm new password" autoComplete="new-password" required className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text focus:border-text focus:outline-none" />
          <button type="submit" className="rounded-full bg-text px-5 py-2.5 text-sm font-medium text-canvas hover:opacity-90">Save password</button>
        </form>
      </div>
    </div>
  );
}
