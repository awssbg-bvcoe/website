import "server-only";
import type { OgAccent } from "@/lib/og";
import { describeDestination } from "./destination";
import { getLinkBySlug } from "./repo";
import { isUsableSlug } from "./validate";

/** What a short link's share card and metadata say. `null` when the link does not exist or is not live. */
export async function shareInfo(rawSlug: string) {
  const slug = rawSlug.toLowerCase();
  if (!isUsableSlug(slug)) return null;
  const link = await getLinkBySlug(slug).catch(() => null);
  if (!link || !link.enabled || (link.expires_at && new Date(link.expires_at) <= new Date())) return null;
  const d = describeDestination(link.url);
  return {
    slug,
    url: link.url,
    title: link.title,
    description: link.description,
    host: d.host,
    name: d.name,
    pinnedIcon: d.icon,
  };
}

// Card accent per destination, picked from the kit's block colours
const ACCENTS: [RegExp, OgAccent][] = [
  [/^Google/, "purple"],
  [/^WhatsApp/, "mint"],
  [/^Instagram/, "magenta"],
  [/^(AWS|LinkedIn|Discord|X)\b/, "blue"],
  [/^(YouTube|Unstop|Devfolio|Luma)/, "amber"],
];
export const accentFor = (name: string | null): OgAccent => ACCENTS.find(([re]) => name && re.test(name))?.[1] ?? "mint";

/** Wrap text into at most `max` lines of about `width` characters, breaking at spaces; ends on a whole word + "..." when cut. */
export function wrapLines(text: string, width = 18, max = 3) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length <= width || !line) line = next;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  const out = lines.map((l) => (l.length > width + 6 ? `${l.slice(0, width + 2)}...` : l));
  if (out.length <= max) return out;
  let last = out[max - 1];
  while (last.length + 3 > width && last.includes(" ")) last = last.slice(0, last.lastIndexOf(" "));
  return [...out.slice(0, max - 1), `${last}...`];
}
