import "server-only";

/**
 * Finds the best icon for a link's destination, server-side, so visitors' browsers never
 * talk to a third party: (0) pinned product artwork for known destinations, (1) the icons the page declares (largest apple-touch-icon, then SVG,
 * then sized icons), (2) /apple-touch-icon.png at the origin, (3) Google's favicon service.
 * Destinations are created by allowlisted admins only; private hosts are still never fetched.
 */
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
const HTML_LIMIT = 600_000;
const ICON_LIMIT = 512_000;

export type Icon = { body: ArrayBuffer; type: string };

// Per-instance memory cache (the CDN caches the route too)
const memo = new Map<string, { at: number; icon: Icon | null }>();
const MEMO_MS = 6 * 60 * 60 * 1000;

function isPrivateHost(host: string) {
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const [a, b] = host.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  return host.includes(":") || host.startsWith("["); // IPv6 literals: never needed for real sites
}

async function readLimited(res: Response, limit: number) {
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < limit) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
  }
  reader.cancel().catch(() => {});
  const out = new Uint8Array(Math.min(size, limit));
  let off = 0;
  for (const c of chunks) {
    const part = c.subarray(0, Math.min(c.length, out.length - off));
    out.set(part, off);
    off += part.length;
    if (off >= out.length) break;
  }
  return out;
}

function attr(tag: string, name: string) {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? (m[2] ?? m[3] ?? m[4] ?? "").trim() : null;
}

/** Icon candidates declared in the HTML, best first. */
function candidates(html: string, base: string) {
  const out: { href: string; score: number }[] = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (attr(tag, "rel") ?? "").toLowerCase();
    if (!/\b(icon|apple-touch-icon|apple-touch-icon-precomposed)\b/.test(rel)) continue;
    const href = attr(tag, "href") ?? attr(tag, "data-default-icon");
    if (!href || href.startsWith("data:")) continue;
    let abs: string;
    try {
      abs = new URL(href, base).toString();
    } catch {
      continue;
    }
    const size = Math.max(0, ...(attr(tag, "sizes") ?? "").split(/\s+/).map((s) => parseInt(s, 10) || 0));
    const svg = /svg/i.test(attr(tag, "type") ?? "") || /\.svg(\?|$)/i.test(abs);
    const score = rel.includes("apple-touch-icon") ? 1000 + (size || 180) : svg ? 900 : size >= 64 ? 500 + size : size || 16;
    out.push({ href: abs, score });
  }
  return out.sort((a, b) => b.score - a.score);
}

async function fetchImage(url: string, minBytes = 0): Promise<Icon | null> {
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol) || isPrivateHost(u.hostname)) return null;
    const res = await fetch(u, { headers: { "User-Agent": UA, Accept: "image/*" }, redirect: "follow", signal: AbortSignal.timeout(3500) });
    if (!res.ok) return null;
    let type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!type.startsWith("image/")) {
      if (/\.ico(\?|$)/i.test(url)) type = "image/x-icon";
      else return null;
    }
    const bytes = await readLimited(res, ICON_LIMIT + 1);
    if (bytes.length > ICON_LIMIT || bytes.length < Math.max(64, minBytes)) return null;
    return { body: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, type };
  } catch {
    return null;
  }
}

export async function findIcon(destination: string, pinned?: string | null): Promise<Icon | null> {
  const key = destination;
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < MEMO_MS) return hit.icon;

  // 0. Pinned official artwork for known products (see destination.ts)
  let icon: Icon | null = pinned ? await fetchImage(pinned) : null;
  if (icon) {
    memo.set(key, { at: Date.now(), icon });
    return icon;
  }
  const dest = new URL(destination);
  if (!isPrivateHost(dest.hostname)) {
    // 1. Icons the destination page declares (after redirects, e.g. forms.gle -> docs.google.com)
    try {
      const res = await fetch(dest, { headers: { "User-Agent": UA, Accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(4000) });
      const finalUrl = res.url || destination;
      if (res.ok && (res.headers.get("content-type") ?? "").includes("html")) {
        const html = new TextDecoder().decode(await readLimited(res, HTML_LIMIT));
        for (const c of candidates(html, finalUrl).slice(0, 4)) {
          icon = await fetchImage(c.href);
          if (icon) break;
        }
      }
      // 2. Conventional touch icon at the final origin
      if (!icon) icon = await fetchImage(new URL("/apple-touch-icon.png", finalUrl).toString(), 400);
    } catch {
      /* fall through */
    }
    // 3. Google's favicon service (server-side; 404 means "no icon")
    if (!icon) icon = await fetchImage(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(dest.hostname)}&sz=128`);
  }

  memo.set(key, { at: Date.now(), icon });
  if (memo.size > 500) memo.delete(memo.keys().next().value!);
  return icon;
}

/**
 * The destination icon as a data URI that Satori (OG images) can draw: PNG, JPEG or SVG only.
 * WebP/ICO icons (Instagram serves WebP) fall back to Google's 128px PNG for the same host.
 */
export async function findOgIcon(destination: string, pinned?: string | null): Promise<string | null> {
  const ok = (i: Icon | null) => i && /^image\/(png|jpeg|svg\+xml)$/.test(i.type);
  let icon = await findIcon(destination, pinned);
  if (!ok(icon)) {
    const host = new URL(destination).hostname;
    icon = await fetchImage(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`);
  }
  if (!icon || !ok(icon)) return null;
  return `data:${icon.type};base64,${Buffer.from(icon.body).toString("base64")}`;
}
