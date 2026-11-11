import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { isNonProductionDeploy } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // Preview deployments must never compete with the real site in search results
  if (isNonProductionDeploy) return { rules: { userAgent: "*", disallow: "/" } };

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Admin and API routes have nothing to index; short links redirect (307, noindex) on their own
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
