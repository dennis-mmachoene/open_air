/**
 * Shared site constants — single source of truth for identity, contact, and
 * primary navigation. Imported by the header, footer, /about and metadata.
 */

export const site = {
  name: "Open Air",
  tagline: "A living gallery of color",
  description:
    "Open Air is a premium color exploration platform — discover beautiful palettes, understand why they work, and watch them dress a complete UI library.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "openair.mailer@gmail.com",
} as const;

/** Operating identity for attribution and metadata. */
export const author = {
  name: "Open Air",
  email: "openair.mailer@gmail.com",
} as const;

/** No external social profiles. */
export const social = [] as const;

/** Primary navigation. */
export const nav = [
  { label: "Gallery", href: "/gallery" },
  { label: "Collections", href: "/c" },
  { label: "Studio", href: "/studio" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
] as const;
