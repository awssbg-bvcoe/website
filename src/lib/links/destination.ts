/**
 * Friendly names for the destinations the group links to most, so the warp page can say
 * "Google Forms" instead of "docs.google.com". Unknown hosts fall back to the bare host.
 */
type Rule = { host: RegExp; path?: RegExp; name: string; icon?: string };

// Google product icons: a form or doc page often answers our server with a sign-in or error
// page (generic "G" icon), so these are pinned to Google's official product artwork.
const gIcon = (p: string) => `https://www.gstatic.com/images/branding/product/2x/${p}_2020q4_96dp.png`;

const RULES: Rule[] = [
  { host: /^builder\.aws\.com$/, name: "AWS Builder Center" },
  { host: /^docs\.google\.com$/, path: /^\/forms\//, name: "Google Forms", icon: gIcon("forms") },
  { host: /^forms\.gle$/, name: "Google Forms", icon: gIcon("forms") },
  { host: /^docs\.google\.com$/, path: /^\/document\//, name: "Google Docs", icon: gIcon("docs") },
  { host: /^docs\.google\.com$/, path: /^\/spreadsheets\//, name: "Google Sheets", icon: gIcon("sheets") },
  { host: /^docs\.google\.com$/, path: /^\/presentation\//, name: "Google Slides", icon: gIcon("slides") },
  { host: /^drive\.google\.com$/, name: "Google Drive", icon: gIcon("drive") },
  { host: /^meet\.google\.com$/, name: "Google Meet", icon: gIcon("meet") },
  { host: /^chat\.whatsapp\.com$/, name: "WhatsApp group" },
  { host: /^(wa\.me|api\.whatsapp\.com|whatsapp\.com)$/, name: "WhatsApp" },
  { host: /^instagram\.com$/, name: "Instagram" },
  { host: /^linkedin\.com$/, name: "LinkedIn" },
  { host: /^(youtube\.com|youtu\.be)$/, name: "YouTube" },
  { host: /^github\.com$/, name: "GitHub" },
  { host: /^(discord\.gg|discord\.com)$/, name: "Discord" },
  { host: /^(x\.com|twitter\.com)$/, name: "X" },
  { host: /^(lu\.ma|luma\.com)$/, name: "Luma" },
  { host: /^unstop\.com$/, name: "Unstop" },
  { host: /^devfolio\.co$/, name: "Devfolio" },
  { host: /^(notion\.so|.+\.notion\.site)$/, name: "Notion" },
  { host: /^(aws\.amazon\.com|.+\.aws\.amazon\.com)$/, name: "AWS" },
  { host: /^skillbuilder\.aws$/, name: "AWS Skill Builder" },
];

export function describeDestination(url: string) {
  const u = new URL(url);
  const host = u.hostname.replace(/^(www|m)\./, "");
  const rule = RULES.find((r) => r.host.test(host) && (!r.path || r.path.test(u.pathname)));
  return { host, name: rule?.name ?? null, icon: rule?.icon ?? null };
}

/** Short stable hash of the destination, used to version the icon URL so CDN caches follow edits. */
export function urlVersion(url: string) {
  let h = 5381;
  for (let i = 0; i < url.length; i++) h = ((h << 5) + h + url.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
