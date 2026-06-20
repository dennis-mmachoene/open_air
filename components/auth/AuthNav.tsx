"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

const PLAN_LABEL: Record<string, string> = { pro: "Pro", studio: "Studio" };

export function AuthNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="h-8 w-24 animate-pulse rounded-full bg-surface-2" />;
  }

  // Logged out
  if (!session?.user) {
    return (
      <>
        <Link
          href="/signin"
          className="hidden rounded-full px-3 py-1.5 text-sm text-text-soft transition-colors hover:text-text sm:inline-flex"
        >
          Sign in
        </Link>
        <Link
          href="/pricing"
          className="rounded-full bg-text px-4 py-1.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
        >
          Go Pro
        </Link>
      </>
    );
  }

  const plan = session.user.plan ?? "free";
  const planLabel = PLAN_LABEL[plan];
  const initials =
    session.user.name?.slice(0, 2).toUpperCase() ??
    session.user.email?.slice(0, 2).toUpperCase() ??
    "OA";

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/dashboard"
        className="hidden rounded-full px-3 py-1.5 text-sm text-text-soft transition-colors hover:text-text sm:inline-flex"
      >
        Dashboard
      </Link>

      {planLabel ? (
        <span
          className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-text"
          title={`You're on the ${planLabel} plan`}
        >
          {planLabel}
        </span>
      ) : (
        <Link
          href="/pricing"
          className="rounded-full bg-text px-4 py-1.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
        >
          Go Pro
        </Link>
      )}

      <Link
        href="/account"
        aria-label="Account"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-text text-xs font-medium text-canvas"
      >
        {initials}
      </Link>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="hidden text-sm text-text-muted transition-colors hover:text-text sm:inline-flex"
      >
        Sign out
      </button>
    </div>
  );
}
