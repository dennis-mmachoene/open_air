"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { clsx } from "@/lib/cn";

/** Marketing nav for signed-out visitors (the storefront). */
const MARKETING = [
  { label: "Gallery", href: "/gallery" },
  { label: "Collections", href: "/c" },
  { label: "Studio", href: "/studio" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

/** App nav for signed-in users (their working surfaces). */
const APP = [
  { label: "Gallery", href: "/gallery" },
  { label: "Collections", href: "/c" },
  { label: "Studio", href: "/studio" },
  { label: "Dashboard", href: "/dashboard" },
];

export function PrimaryNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const items = session?.user ? APP : MARKETING;

  return (
    <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "rounded-full px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-surface-2 font-medium text-text"
                : "text-text-soft hover:bg-surface-2 hover:text-text",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
