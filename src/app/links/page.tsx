import type { Metadata } from "next";
import QRCode from "qrcode";
import { LinksPage } from "@/components/links/LinksPage";
import { site } from "@/content/site";
import { describeDestination, urlVersion } from "@/lib/links/destination";
import { getPageLinks } from "@/lib/links/repo";

export const metadata: Metadata = {
  title: "Links",
  description: "Every link from the AWS Student Builder Group at BVCOE, New Delhi: events, forms, groups and socials, one tap away.",
  alternates: { canonical: "/links" },
  openGraph: { url: "/links", title: `Links | ${site.shortName}` },
};

/**
 * Public link-in-bio page. Data comes from `getPageLinks()` ("use cache", tagged), so the page is
 * served from cache and refreshed the moment an admin saves, reorders, toggles or deletes a link.
 */
export default async function Page() {
  const pageUrl = `${site.url}/links`;
  const [rows, qr] = await Promise.all([
    getPageLinks(),
    QRCode.toString(pageUrl, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#161d26", light: "#f2f4f5" } }),
  ]);

  const links =
    rows?.map((l) => {
      const d = describeDestination(l.url);
      return {
        id: Number(l.id),
        // Through the short link so clicks are counted; ?direct skips the warp countdown
        href: `/${l.slug}?direct`,
        title: l.title ?? l.slug,
        description: l.description,
        featured: l.featured,
        site: d.name ?? d.host,
        icon: `/warp/${l.slug}/icon?v=${urlVersion(l.url)}`,
      };
    }) ?? null;

  return <LinksPage links={links} qrSvg={qr} pageUrl={pageUrl} />;
}
