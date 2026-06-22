"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { clsx } from "@/lib/cn";

const PLAN_LABEL: Record<string, string> = { pro: "Pro", studio: "Studio" };

export function AuthNav() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the dropdown on outside-click or Escape.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (status === "loading") {
    return <span className="h-8 w-24 animate-pulse rounded-full bg-surface-2" />;
  }

  // ---- Signed out: marketing CTAs ----
  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
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
      </div>
    );
  }

  const user = session.user;
  const plan = user.plan ?? "free";
  const planLabel = PLAN_LABEL[plan];
  const initials =
    user.name?.slice(0, 2).toUpperCase() ??
    user.email?.slice(0, 2).toUpperCase() ??
    "OA";

  // ---- Signed in: plan chip + avatar menu ----
  return (
    <div className="flex items-center gap-2">
      {planLabel ? (
        <span
          className="hidden rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-text sm:inline-flex"
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

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account menu"
          className={clsx(
            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-shadow",
            "bg-text text-canvas",
            open && "ring-2 ring-text ring-offset-2 ring-offset-canvas",
          )}
        >
          {initials}
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute right-0 top-10 z-50 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
          >
            <div className="border-b border-border px-4 py-3">
              <p className="truncate text-sm font-medium text-text">
                {user.name ?? "Your account"}
              </p>
              {user.email ? (
                <p className="truncate text-xs text-text-muted">{user.email}</p>
              ) : null}
              <span className="mt-2 inline-flex rounded-full border border-border px-2 py-0.5 text-[11px] font-medium capitalize text-text-soft">
                {planLabel ?? "Free"} plan
              </span>
            </div>

            <div className="flex flex-col py-1">
              <MenuLink href="/dashboard" onClick={() => setOpen(false)}>
                Dashboard
              </MenuLink>
              <MenuLink href="/bookmarks" onClick={() => setOpen(false)}>
                Saved palettes
              </MenuLink>
              <MenuLink href="/account" onClick={() => setOpen(false)}>
                Account &amp; billing
              </MenuLink>
              {plan === "free" ? (
                <MenuLink href="/pricing" onClick={() => setOpen(false)}>
                  Upgrade to Pro
                </MenuLink>
              ) : null}
            </div>

            <div className="border-t border-border py-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full px-4 py-2 text-left text-sm text-text-soft transition-colors hover:bg-surface-2 hover:text-text"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="px-4 py-2 text-sm text-text-soft transition-colors hover:bg-surface-2 hover:text-text"
    >
      {children}
    </Link>
  );
}
