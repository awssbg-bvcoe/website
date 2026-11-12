import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { findActiveLink, recordClick } from "@/lib/links/repo";
import { deviceClass, isUsableSlug, referrerHost } from "@/lib/links/validate";

/**
 * Short links: /{slug} shows the warp countdown (people) or answers with a 307 (bots) when an active link exists.
 * Everything else (real routes, reserved names, unknown slugs) continues to the app,
 * so a miss lands on the 404 page with the Packet run game.
 */
export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const path = request.nextUrl.pathname;

  // Fast gate for the admin area: no session cookie, straight to sign-in. Pages and actions
  // still verify the session against the database themselves; this only saves a render.
  if (path === "/admin" || (path.startsWith("/admin/") && !path.startsWith("/admin/login"))) {
    if (!request.cookies.has(SESSION_COOKIE)) return NextResponse.redirect(new URL("/admin/login", request.url));
    return NextResponse.next();
  }

  const slug = path.slice(1).toLowerCase();
  if (!isUsableSlug(slug)) return NextResponse.next();

  let link: Awaited<ReturnType<typeof findActiveLink>> = null;
  try {
    link = await findActiveLink(slug);
  } catch (err) {
    // Database trouble must never take the site down: fall through to the app.
    console.error("short link lookup failed", err);
    return NextResponse.next();
  }
  if (!link) return NextResponse.next();

  const device = deviceClass(request.headers.get("user-agent"));
  if (request.method === "GET") {
    // Record after the response is sent; never block or fail the redirect on analytics.
    event.waitUntil(
      recordClick(link.id, {
        referrerHost: referrerHost(request.headers.get("referer")),
        country: request.headers.get("x-vercel-ip-country"),
        device,
      }).catch((err) => console.error("click record failed", err)),
    );
  }

  // People get the warp countdown page (rewrite, so the address bar keeps the short link).
  // Bots, link-preview crawlers (WhatsApp, Discord, ...), HEAD requests and `?direct` get a plain
  // 307, so previews show the destination and scripts are not slowed down.
  const direct = request.method !== "GET" || device === "bot" || device === "unknown" || request.nextUrl.searchParams.has("direct");
  const res = direct ? NextResponse.redirect(link.url, 307) : NextResponse.rewrite(new URL(`/warp/${slug}`, request.url));
  // Every hit must reach us so it is counted and edits apply at once
  res.headers.set("Cache-Control", "private, no-store");
  res.headers.set("X-Robots-Tag", "noindex");
  return res;
}

export const config = {
  // Single path segment only; files with a dot and Next internals never match
  matcher: ["/:slug((?!_next)[^/.]+)", "/admin/:path*"],
};
