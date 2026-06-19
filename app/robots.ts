import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = site.url.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/pricing", "/about", "/signin"],
      // Account-gated areas — keep crawlers out.
      disallow: ["/gallery", "/p/", "/c", "/studio", "/dashboard", "/account", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
