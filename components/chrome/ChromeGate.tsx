"use client";

import { usePathname } from "next/navigation";

/** Hides the marketing/app chrome on the isolated System Administrator console. */
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/sys")) return null;
  return <>{children}</>;
}
