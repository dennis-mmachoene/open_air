/**
 * Shared site constants — single source of truth for identity, attribution,
 * and primary navigation. Imported by the header, footer, /about and metadata.
 */

export const site = {
  name: "Open Air",
  tagline: "A living gallery of color",
  description:
    "Open Air is a premium color exploration platform — discover beautiful palettes, understand why they work, and watch them dress a complete UI library.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

/** Open Air is designed and built by Dennis Ramara. */
export const author = {
  name: "Dennis Ramara",
  links: {
    linkedin: "https://www.linkedin.com/in/dennis-mmachoene-ramara",
    instagram: "https://instagram.com/dennismachoene",
    instagramHandle: "@dennismachoene",
    github: "https://github.com/dennis-mmachoene",
  },
} as const;

export const social = [
  { label: "Dennis Ramara on LinkedIn", short: "LinkedIn", href: author.links.linkedin },
  { label: "Dennis Ramara on Instagram", short: "Instagram", href: author.links.instagram },
  { label: "Dennis Ramara on GitHub", short: "GitHub", href: author.links.github },
] as const;

/** Primary navigation. Some destinations land in later phases. */
export const nav = [
  { label: "Gallery", href: "/" },
  { label: "Collections", href: "/c" },
  { label: "Studio", href: "/studio" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
] as const;
