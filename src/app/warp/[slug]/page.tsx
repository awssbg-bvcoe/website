import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { WarpRedirect } from "@/components/warp/WarpRedirect";
import { findActiveLink } from "@/lib/links/repo";
import { describeDestination, urlVersion } from "@/lib/links/destination";
import { isUsableSlug } from "@/lib/links/validate";

export const metadata: Metadata = {
  title: "Warping",
  robots: { index: false, follow: false },
};

/**
 * Countdown page for short links. The proxy rewrites /{slug} here for people (bots still get a
 * plain 307), so the address bar keeps the short link while the warp plays.
 */
async function Warp({ params }: { params: PageProps<"/warp/[slug]">["params"] }) {
  const slug = (await params).slug.toLowerCase();
  if (!isUsableSlug(slug)) notFound();
  const link = await findActiveLink(slug);
  if (!link) notFound();
  const { host, name } = describeDestination(link.url);
  const icon = `/warp/${slug}/icon?v=${urlVersion(link.url)}`;
  return <WarpRedirect url={link.url} host={host} name={name} icon={icon} slug={slug} />;
}

export default function WarpPage({ params }: PageProps<"/warp/[slug]">) {
  return (
    <Suspense fallback={<main id="main" className="bg-pixel-grid min-h-[100dvh] bg-grey-850 [--cell:56px]" />}>
      <Warp params={params} />
    </Suspense>
  );
}
