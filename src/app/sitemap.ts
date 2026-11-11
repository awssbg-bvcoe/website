import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { indexableImages } from "@/lib/seo";

// One-page site: sections are #anchors, which are not separate URLs, so the sitemap has one entry.
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
  ];
}
