import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { WarpRedirect } from "@/components/warp/WarpRedirect";
import { site } from "@/content/site";
import { currentAdmin } from "@/lib/auth/session";
import { describeDestination, urlVersion } from "@/lib/links/destination";
import { findActiveLink, getLinkBySlug } from "@/lib/links/repo";
import { shareInfo } from "@/lib/links/share";
import { isUsableSlug } from "@/lib/links/validate";

/**
 * Per-link metadata. Link-preview crawlers are sent here by the proxy, so WhatsApp, Discord, X and
 * LinkedIn show the link's own card (title, destination, logo) from ./opengraph-image.tsx.
 */
export async function generateMetadata({ params }: PageProps<"/warp/[slug]">): Promise<Metadata> {
  const info = await shareInfo((await params).slug);
  const robots = { index: false, follow: false };
  if (!info) return { title: "Warping", robots };
  const where = info.name ?? info.host;
  const title = info.title ?? `/${info.slug}`;
  const description = info.description ?? `Opens ${where}. Shared by the ${site.name} at BVCOE.`;
  return {
    title,
    description,
    robots,
    alternates: { canonical: `/${info.slug}` },
    openGraph: { title, description, url: `/${info.slug}`, siteName: site.shortName, type: "website", locale: "en_IN" },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * Countdown page for short links. The proxy rewrites /{slug} here for people (bots still get a
 * plain 307), so the address bar keeps the short link while the warp plays.
 * `?preview` (from /admin) plays the warp without redirecting; admins can preview links that are
 * off or expired too.
 */
async function Warp({ params, searchParams }: PageProps<"/warp/[slug]">) {
  const slug = (await params).slug.toLowerCase();
  const preview = "preview" in (await searchParams);
  if (!isUsableSlug(slug)) notFound();

  let link: { url: string } | null = await findActiveLink(slug);
  if (!link && preview && (await currentAdmin())) link = await getLinkBySlug(slug);
  if (!link) notFound();

  const { host, name } = describeDestination(link.url);
  const icon = `/warp/${slug}/icon?v=${urlVersion(link.url)}`;
  return <WarpRedirect url={link.url} host={host} name={name} icon={icon} slug={slug} preview={preview} />;
}

export default function WarpPage(props: PageProps<"/warp/[slug]">) {
  return (
    <Suspense fallback={<main id="main" className="bg-pixel-grid min-h-[100dvh] bg-grey-850 [--cell:56px]" />}>
      <Warp {...props} />
    </Suspense>
  );
}
