/** Lowercase letters, digits and inner hyphens; 1 to 64 chars; must start and end alphanumeric. */
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

/**
 * Paths a short link may never take, because a real route, file or reserved word owns them.
 * Keep in sync with src/app (top-level routes) and public/ (top-level files).
 */
export const RESERVED = new Set([
  "about",
  "programs",
  "team",
  "join",
  "admin",
  "api",
  "press-start",
  "opengraph-image",
  "twitter-image",
  "icon",
  "icons",
  "apple-icon",
  "llms",
  "warp",
  "og",
  "favicon",
  "brand",
  "robots",
  "sitemap",
  "manifest",
  "login",
  "logout",
  "links",
  "static",
  "assets",
  "next",
]);

export type LinkInput = {
  slug: string;
  url: string;
  note: string | null;
  expiresAt: Date | null;
  enabled: boolean;
  /** /links page card */
  title: string | null;
  description: string | null;
  listed: boolean;
  featured: boolean;
};

export type FieldErrors = Partial<Record<"slug" | "url" | "note" | "expiresAt" | "title" | "description", string>>;

export function isUsableSlug(slug: string) {
  return SLUG_RE.test(slug) && !RESERVED.has(slug);
}

/**
 * Validates and normalises admin input. URLs must be absolute http(s); `javascript:`, `data:`
 * and any other scheme are rejected, as are links back to this site's own short links (loops).
 */
export function parseLinkInput(form: FormData, siteHost: string | null): { value?: LinkInput; errors?: FieldErrors } {
  const errors: FieldErrors = {};
  const slug = String(form.get("slug") ?? "").trim().toLowerCase();
  const rawUrl = String(form.get("url") ?? "").trim();
  const note = String(form.get("note") ?? "").trim() || null;
  const rawExpiry = String(form.get("expiresAt") ?? "").trim();
  const enabled = form.get("enabled") !== "off";
  const title = String(form.get("title") ?? "").trim().replace(/\s+/g, " ") || null;
  const description = String(form.get("description") ?? "").trim().replace(/\s+/g, " ") || null;
  const listed = form.get("listed") === "on";
  const featured = form.get("featured") === "on";

  if (!SLUG_RE.test(slug)) errors.slug = "Use 1 to 64 lowercase letters, digits or hyphens (no hyphen at the start or end).";
  else if (RESERVED.has(slug)) errors.slug = `"${slug}" is reserved by the site. Pick another.`;

  let url: URL | null = null;
  try {
    url = new URL(rawUrl);
  } catch {
    errors.url = "Enter a full link that starts with https://";
  }
  if (url) {
    if (url.protocol !== "https:" && url.protocol !== "http:") errors.url = "Only http and https links are allowed.";
    else if (rawUrl.length > 2048) errors.url = "That link is longer than 2048 characters.";
    else if (siteHost && url.host === siteHost && SLUG_RE.test(url.pathname.slice(1))) errors.url = "A short link cannot point to another short link.";
  }

  if (note && note.length > 280) errors.note = "Keep the note under 280 characters.";
  if (title && title.length > 80) errors.title = "Keep the title under 80 characters.";
  else if (listed && !title) errors.title = "Add a title to show this link on /links.";
  if (description && description.length > 140) errors.description = "Keep the description under 140 characters.";

  let expiresAt: Date | null = null;
  if (rawExpiry) {
    const d = new Date(rawExpiry);
    if (Number.isNaN(d.getTime())) errors.expiresAt = "That date is not valid.";
    else if (d.getTime() <= Date.now()) errors.expiresAt = "Pick a time in the future, or leave it empty.";
    else expiresAt = d;
  }

  if (Object.keys(errors).length) return { errors };
  return { value: { slug, url: url!.toString(), note, expiresAt, enabled, title, description, listed, featured: listed && featured } };
}

/** Coarse device class from a user agent. The UA itself is never stored. */
export function deviceClass(ua: string | null): "desktop" | "mobile" | "tablet" | "bot" | "unknown" {
  if (!ua) return "unknown";
  const s = ua.toLowerCase();
  if (/bot|crawler|spider|slurp|facebookexternalhit|whatsapp|telegrambot|discordbot|preview|curl|wget|python-requests/.test(s)) return "bot";
  if (/ipad|tablet|(android(?!.*mobile))/.test(s)) return "tablet";
  if (/mobi|iphone|android/.test(s)) return "mobile";
  return "desktop";
}

/** Host of the referrer only (never the full URL, which can carry personal data). */
export function referrerHost(ref: string | null): string | null {
  if (!ref) return null;
  try {
    return new URL(ref).host.slice(0, 255) || null;
  } catch {
    return null;
  }
}

/**
 * Link-preview crawlers (chat apps and social networks). They get the warp page, whose metadata
 * carries the link's own share card; every other bot or script gets a plain 307.
 */
export function isPreviewBot(ua: string | null) {
  if (!ua) return false;
  return /facebookexternalhit|facebot|meta-externalagent|twitterbot|whatsapp|telegrambot|discordbot|slackbot|slack-imgproxy|linkedinbot|skypeuripreview|pinterest|redditbot|embedly|iframely|vkshare|snapchat|viber|line-poker|kakaotalk|mastodon|bluesky|google-inspectiontool|googleother|bingpreview|applebot|microsoftpreview|teams/i.test(ua);
}
