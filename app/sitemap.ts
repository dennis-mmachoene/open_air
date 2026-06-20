import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { ALL_COLLECTIONS, ALL_PALETTES, allCategories } from "@/lib/palettes/snapshot";

/** Public catalog is indexable again: home, marketing, every palette, every
 *  collection and category. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, "");
  const staticRoutes = ["", "/gallery", "/c", "/pricing", "/about", "/terms", "/privacy"].map(
    (path) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.6 }),
  );
  const palettes = ALL_PALETTES.map((p) => ({
    url: `${base}/p/${p.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
  const groups = [...ALL_COLLECTIONS, ...allCategories()].map((c) => ({
    url: `${base}/c/${c.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...staticRoutes, ...palettes, ...groups];
}
