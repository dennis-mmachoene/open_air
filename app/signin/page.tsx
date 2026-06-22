import type { Metadata } from "next";
import { authEnabled, emailEnabled, googleEnabled, signIn } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to save palettes and build collections.",
};

export default function SignInPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-5 py-20 sm:px-8">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-3xl text-text">Sign in to Open Air</h1>
        <p className="text-sm text-text-soft">
          Save palettes, build collections, and pick up where you left off.
        </p>
      </div>

      {!authEnabled ? (
        <div className="rounded-control border border-border bg-surface-2 p-4 text-sm text-text-soft">
          Sign-in isn&apos;t configured yet. Add a database URL and at least one
          auth provider (Google or email) to <code className="font-mono">.env.local</code>.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {googleEnabled ? (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <button
                type="submit"
                className="w-full rounded-control border border-border px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface-2"
              >
                Continue with Google
              </button>
            </form>
          ) : null}

          {emailEnabled ? (
            <form
              action={async (formData: FormData) => {
                "use server";
                await signIn("nodemailer", {
                  email: String(formData.get("email") ?? ""),
                  redirectTo: "/dashboard",
                });
              }}
              className="flex flex-col gap-2"
            >
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-control border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus-visible:border-text"
              />
              <button
                type="submit"
                className="w-full rounded-control bg-text px-4 py-2.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
              >
                Email me a sign-in link
              </button>
            </form>
          ) : null}
        </div>
      )}

      <p className="text-center text-xs text-text-muted">
        By continuing you agree to the Terms and Privacy Policy.
      </p>
    </div>
  );
}
