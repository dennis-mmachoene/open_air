"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { clsx } from "@/lib/cn";
import { APP_NAV, MARKETING_NAV } from "@/lib/nav";
import { useState } from "react";

export function MobileNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const authed = Boolean(session?.user);
  const items = authed ? APP_NAV : MARKETING_NAV;
  const plan = session?.user?.plan ?? "free";
  const isAdmin = session?.user?.isAdmin;
  const close = () => setOpen(false);

  // Lock scroll, trap focus, Escape to close, restore focus on close.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const trigger = triggerRef.current;

    const panel = panelRef.current;
    const focusables = panel
      ? panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        )
      : null;
    focusables?.[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "Tab" && focusables && focusables.length > 0) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  const linkCls = (href: string) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return clsx(
      "rounded-lg px-3 py-3 text-base transition-colors",
      active ? "bg-surface-2 font-medium text-text" : "text-text-soft hover:bg-surface-2 hover:text-text",
    );
  };

  return (
    <div className="shrink-0 md:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text transition-colors hover:bg-surface-2"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-text/40 backdrop-blur-sm"
          />
          <div
            ref={panelRef}
            className="absolute right-0 top-0 flex h-full w-[min(86vw,20rem)] flex-col gap-1 overflow-y-auto border-l border-border bg-canvas p-4 shadow-2xl"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-lg text-text">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-text transition-colors hover:bg-surface-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <nav aria-label="Mobile" className="flex flex-col gap-0.5">
              {items.map((item) => (
                <Link key={item.href} href={item.href} onClick={close} className={linkCls(item.href)}>
                  {item.label}
                </Link>
              ))}
            </nav>

            <hr className="my-3 border-border" />

            {authed ? (
              <div className="flex flex-col gap-0.5">
                <div className="px-3 pb-2">
                  <p className="truncate text-sm font-medium text-text">
                    {session?.user?.name ?? "Your account"}
                  </p>
                  {session?.user?.email ? (
                    <p className="truncate text-xs text-text-muted">{session.user.email}</p>
                  ) : null}
                  <span className="mt-1 inline-flex rounded-full border border-border px-2 py-0.5 text-[11px] font-medium capitalize text-text-soft">
                    {plan} plan
                  </span>
                </div>
                <Link href="/account" onClick={close} className={linkCls("/account")}>Account &amp; billing</Link>
                {plan === "free" ? (
                  <Link href="/pricing" onClick={close} className={linkCls("/pricing")}>Upgrade to Pro</Link>
                ) : null}
                {isAdmin ? <Link href="/admin" onClick={close} className={linkCls("/admin")}>Admin console</Link> : null}
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-lg px-3 py-3 text-left text-base text-text-soft transition-colors hover:bg-surface-2 hover:text-text"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 px-1">
                <Link
                  href="/signin"
                  onClick={close}
                  className="rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium text-text transition-colors hover:bg-surface-2"
                >
                  Sign in
                </Link>
                <Link
                  href="/pricing"
                  onClick={close}
                  className="rounded-full bg-text px-4 py-2.5 text-center text-sm font-medium text-canvas transition-opacity hover:opacity-90"
                >
                  Go Pro
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
