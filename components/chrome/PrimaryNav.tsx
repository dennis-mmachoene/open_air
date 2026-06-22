"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { clsx } from "@/lib/cn";
import { APP_NAV, MARKETING_NAV } from "@/lib/nav";

export function PrimaryNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const items = session?.user ? APP_NAV : MARKETING_NAV;

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
              "rounded-pill px-3 py-1.5 text-sm transition-colors",
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
