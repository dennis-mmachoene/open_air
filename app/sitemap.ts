import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Only public (un-gated) pages are indexable. The gallery, palette, collection
 * and studio pages now require an account, so they are intentionally excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, "");
  return ["", "/pricing", "/about"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.6,
  }));
}
