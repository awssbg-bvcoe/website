import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { indexableImages } from "@/lib/seo";

// Home (a one-page site: sections are #anchors, not URLs) and the /links page.
// `images` makes it an image sitemap (team portraits, advisor, share card) for Google Images.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site.url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      images: indexableImages,
    },
    {
      url: `${site.url}/links`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      images: [`${site.url}/links/opengraph-image`],
    },
  ];
}
