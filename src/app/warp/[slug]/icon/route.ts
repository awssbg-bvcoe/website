import { describeDestination } from "@/lib/links/destination";
import { findIcon } from "@/lib/links/icon";
import { findActiveLink } from "@/lib/links/repo";
import { isUsableSlug } from "@/lib/links/validate";

/**
 * The destination's icon for the warp page. Only serves icons for real, active short links,
 * so it cannot be used as an open image proxy. The page adds ?v=<hash of the destination>
 * so CDN copies change when a link is edited.
 */
export async function GET(_req: Request, ctx: RouteContext<"/warp/[slug]/icon">) {
  const slug = (await ctx.params).slug.toLowerCase();
  const headers = {
    // Third-party SVGs are served from our origin: never let one run script or load anything
    "Content-Security-Policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex",
  };
  if (!isUsableSlug(slug)) return new Response(null, { status: 404, headers });
  const link = await findActiveLink(slug).catch(() => null);
  if (!link) return new Response(null, { status: 404, headers });

  const icon = await findIcon(link.url, describeDestination(link.url).icon);
  if (!icon) {
    return new Response(null, { status: 404, headers: { ...headers, "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
  }
  return new Response(icon.body, {
    headers: {
      ...headers,
      "Content-Type": icon.type,
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}
