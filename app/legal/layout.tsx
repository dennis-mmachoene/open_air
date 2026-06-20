import type { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8">{children}</div>;
}
