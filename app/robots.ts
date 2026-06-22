import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = site.url.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Only private/account areas stay out of the index.
      disallow: ["/dashboard", "/account", "/sys", "/admin", "/orgs", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
