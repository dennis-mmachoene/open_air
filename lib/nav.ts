export interface NavItem {
  label: string;
  href: string;
}

/** Marketing nav for signed-out visitors (the storefront). */
export const MARKETING_NAV: NavItem[] = [
  { label: "Gallery", href: "/gallery" },
  { label: "Collections", href: "/c" },
  { label: "Studio", href: "/studio" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

/** App nav for signed-in users (their working surfaces). */
export const APP_NAV: NavItem[] = [
  { label: "Gallery", href: "/gallery" },
  { label: "Collections", href: "/c" },
  { label: "Studio", href: "/studio" },
  { label: "Dashboard", href: "/dashboard" },
];
