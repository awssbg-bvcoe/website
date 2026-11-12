import { findOgIcon } from "@/lib/links/icon";
import { accentFor, shareInfo, wrapLines } from "@/lib/links/share";
import { OG_SIZE, renderOg } from "@/lib/og";

export const alt = "Short link from the AWS Student Builder Group at BVCOE";
export const size = OG_SIZE;
export const contentType = "image/png";

/**
 * Share card for one short link: the destination's name as the kicker, the link's title (or its
 * /slug) as the headline, and the destination's logo on a tilted paper tile.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const info = await shareInfo((await params).slug);
  if (!info) return renderOg({ kicker: "Short link", lines: ["This link", "has ended."], accent: "amber" });

  const where = info.name ?? info.host;
  const title = info.title ?? `/${info.slug}`;
  const headline = wrapLines(title, 18, 3);
  // A one-line title gets a second, accent-coloured line saying where it goes (unless it already says so)
  const t = title.toLowerCase(), w = where.toLowerCase();
  const redundant = t.includes(w) || w.includes(t);
  const lines = headline.length === 1 && !redundant ? [headline[0], `on ${where}`.length <= 20 ? `on ${where}` : where] : headline;
  const icon = await findOgIcon(info.url, info.pinnedIcon).catch(() => null);

  try {
    return await renderOg({ kicker: where, lines, accent: accentFor(info.name), icon });
  } catch {
    // An exotic SVG Satori cannot draw must never break the preview
    return renderOg({ kicker: where, lines, accent: accentFor(info.name) });
  }
}
