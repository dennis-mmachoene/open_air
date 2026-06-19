"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function AuthNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="h-8 w-16 animate-pulse rounded-full bg-surface-2" />;
  }

  if (!session?.user) {
    return (
      <Link
        href="/signin"
        className="hidden rounded-full px-3 py-1.5 text-sm text-text-soft transition-colors hover:text-text sm:inline-flex"
      >
        Sign in
      </Link>
    );
  }

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
        className="text-sm text-text-muted transition-colors hover:text-text"
      >
        Sign out
      </button>
    </div>
  );
}
