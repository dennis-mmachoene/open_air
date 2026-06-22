import { getPlatformAdmin } from "@/lib/platform/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/platform/LoginForm";
import { ErrorNote } from "@/components/platform/ui";
import { totpLoginAction } from "@/app/sys/_actions";

export const dynamic = "force-dynamic";

export default async function SysLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; step?: string }> }) {
  const admin = await getPlatformAdmin();
  if (admin) redirect("/sys");
  const { error, step } = await searchParams;
  const totpStep = step === "totp";

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-5 text-text">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-text text-sm font-bold text-canvas">SA</span>
          <h1 className="font-display text-2xl text-text">System Administrator</h1>
          <p className="text-sm text-text-muted">
            {totpStep ? "Enter the 6-digit code from your authenticator app." : "Restricted platform console. Authorized personnel only."}
          </p>
        </div>
        <ErrorNote message={error} />
        {totpStep ? (
          <form action={totpLoginAction} className="flex flex-col gap-3">
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456 or backup code"
              autoFocus
              required
              className="rounded-xl border border-border bg-canvas px-3 py-2.5 text-center text-lg tracking-[0.3em] text-text focus:border-text focus:outline-none"
            />
            <button type="submit" className="rounded-full bg-text px-5 py-2.5 text-sm font-medium text-canvas hover:opacity-90">Verify</button>
            <a href="/sys/login" className="text-center text-xs text-text-muted underline-offset-4 hover:underline">← Start over</a>
          </form>
        ) : (
          <LoginForm />
        )}
        <p className="text-center text-xs text-text-muted">All access is logged. Sessions expire after 7 days.</p>
      </div>
    </div>
  );
}
