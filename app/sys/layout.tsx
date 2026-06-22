import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Administrator",
  robots: { index: false, follow: false },
};

export default function SysLayout({ children }: { children: React.ReactNode }) {
  return children;
}
