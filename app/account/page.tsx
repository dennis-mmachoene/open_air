import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth, signOut } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ManageBillingButton } from "@/components/billing/ManageBillingButton";
import { DeleteAccount } from "@/components/account/DeleteAccount";
import { ProfileForm } from "@/components/community/ProfileForm";
import { getOwnProfile } from "@/lib/publish";

export const metadata: Metadata = { title: "Account" };

async function getPlan(userId: string): Promise<string> {
  const db = getDb();
  const [row] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.plan ?? "free";
}

async function doSignOut() {
  "use server";
  await signOut({ redirectTo: "/" });
}

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  studio: "Studio",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  const plan = await getPlan(session.user.id);
  const profile = await getOwnProfile(session.user.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-12 sm:px-8">
      <h1 className="font-display text-4xl text-text">Account</h1>

      <dl className="divide-y divide-border rounded-xl border border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <dt className="text-sm text-text-muted">Name</dt>
          <dd className="text-text">{session.user.name ?? "—"}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <dt className="text-sm text-text-muted">Email</dt>
          <dd className="text-text">{session.user.email}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <dt className="text-sm text-text-muted">Plan</dt>
          <dd>
            <span className="rounded-full bg-surface-2 px-3 py-1 text-sm text-text">
              {PLAN_LABEL[plan] ?? plan}
            </span>
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-3">
        {plan === "free" ? (
          <a
            href="/pricing"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-2"
          >
            Upgrade plan
          </a>
        ) : (
          <ManageBillingButton />
        )}
        <a
          href="/account/api"
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-2"
        >
          API keys
        </a>
        <form action={doSignOut}>
          <button className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-2">
            Sign out
          </button>
        </form>
      </div>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="font-display text-xl text-text">Creator profile</h2>
        <p className="text-sm text-text-soft">
          Set a handle to publish palettes and get a public profile at /u/your-handle.
        </p>
        <ProfileForm initial={{ handle: profile?.handle ?? null, bio: profile?.bio ?? null, website: profile?.website ?? null }} />
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="font-display text-xl text-text">Your data</h2>
        <div className="flex flex-wrap items-center gap-4">
          <a
            href="/api/account/export"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-2"
          >
            Export my data
          </a>
          <DeleteAccount />
        </div>
        <p className="text-xs text-text-muted">
          Export a JSON copy of everything, or permanently delete your account
          (GDPR / POPIA).
        </p>
      </section>
    </div>
  );
}
