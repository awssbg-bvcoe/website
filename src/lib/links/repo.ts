import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { sql } from "@/lib/db";
import type { LinkInput } from "./validate";

export type LinkRow = {
  id: number;
  slug: string;
  url: string;
  note: string | null;
  enabled: boolean;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  title: string | null;
  description: string | null;
  listed: boolean;
  featured: boolean;
  sort_order: number;
};

/** Cache tag for the public /links page; admin writes call `updateTag(LINKS_PAGE_TAG)`. */
export const LINKS_PAGE_TAG = "links-page";

export type PageLink = Pick<LinkRow, "id" | "slug" | "url" | "title" | "description" | "featured">;

export type LinkWithStats = LinkRow & { total: number; last7: number; last_click: string | null };

// Per-instance lookup cache for the redirect path. Fluid Compute reuses instances, so hot links skip
// the database. Admin writes clear the entry on the instance that made them; other instances pick
// the change up within TTL_MS.
const TTL_MS = 30_000;
const cache = new Map<string, { at: number; link: Pick<LinkRow, "id" | "url"> | null }>();

export function forgetSlug(slug: string) {
  cache.delete(slug);
}

/** Active (enabled, not expired) link for a slug, or null. */
export async function findActiveLink(slug: string) {
  const hit = cache.get(slug);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.link;
  const rows = (await sql()`
    select id, url from links
    where slug = ${slug} and enabled and (expires_at is null or expires_at > now())
    limit 1`) as Pick<LinkRow, "id" | "url">[];
  const link = rows[0] ?? null;
  cache.set(slug, { at: Date.now(), link });
  if (cache.size > 2000) cache.delete(cache.keys().next().value!);
  return link;
}

export async function recordClick(linkId: number, meta: { referrerHost: string | null; country: string | null; device: string }) {
  await sql()`
    insert into link_clicks (link_id, referrer_host, country, device)
    values (${linkId}, ${meta.referrerHost}, ${meta.country}, ${meta.device})`;
}

export async function listLinks(): Promise<LinkWithStats[]> {
  return (await sql()`
    select l.*,
      count(c.id)::int as total,
      count(c.id) filter (where c.clicked_at > now() - interval '7 days')::int as last7,
      max(c.clicked_at) as last_click
    from links l
    left join link_clicks c on c.link_id = l.id and c.device <> 'bot'
    group by l.id
    order by l.created_at desc`) as LinkWithStats[];
}

export async function getLink(id: number) {
  const rows = (await sql()`select * from links where id = ${id}`) as LinkRow[];
  return rows[0] ?? null;
}

export async function slugTaken(slug: string, exceptId?: number) {
  const rows = await sql()`select 1 from links where slug = ${slug} and id <> ${exceptId ?? -1} limit 1`;
  return rows.length > 0;
}

export async function getLinkBySlug(slug: string) {
  const rows = (await sql()`select * from links where slug = ${slug}`) as LinkRow[];
  return rows[0] ?? null;
}

export async function createLink(input: LinkInput, by: string) {
  const rows = (await sql()`
    insert into links (slug, url, note, enabled, expires_at, created_by, title, description, listed, featured, sort_order)
    values (${input.slug}, ${input.url}, ${input.note}, ${input.enabled}, ${input.expiresAt}, ${by},
      ${input.title}, ${input.description}, ${input.listed}, ${input.featured},
      coalesce((select max(sort_order) + 1 from links), 0))
    returning id`) as { id: number }[];
  return rows[0].id;
}

export async function updateLink(id: number, input: LinkInput) {
  const before = await getLink(id);
  await sql()`
    update links set slug = ${input.slug}, url = ${input.url}, note = ${input.note},
      enabled = ${input.enabled}, expires_at = ${input.expiresAt},
      title = ${input.title}, description = ${input.description}, listed = ${input.listed}, featured = ${input.featured},
      updated_at = now()
    where id = ${id}`;
  if (before) forgetSlug(before.slug);
  forgetSlug(input.slug);
}

/** Flip enabled in one statement, so two quick clicks can never write a stale whole row. */
export async function toggleLink(id: number) {
  const rows = (await sql()`
    update links set enabled = not enabled, updated_at = now() where id = ${id} returning slug`) as { slug: string }[];
  if (rows[0]) forgetSlug(rows[0].slug);
}

/** Links with a card on /links, in page order (featured first). Live links only. */
export async function listPageLinksForAdmin() {
  return (await sql()`
    select id, slug, url, title, description, featured, enabled, expires_at from links
    where listed order by featured desc, sort_order, id`) as (PageLink & { enabled: boolean; expires_at: string | null })[];
}

/**
 * Cached data for the public /links page. Expired and disabled links drop off on their own
 * within the cache lifetime; admin edits refresh it at once through the tag.
 */
export async function getPageLinks(): Promise<PageLink[] | null> {
  "use cache";
  cacheTag(LINKS_PAGE_TAG);
  try {
    const rows = (await sql()`
      select id, slug, url, title, description, featured from links
      where listed and enabled and title is not null and (expires_at is null or expires_at > now())
      order by featured desc, sort_order, id`) as PageLink[];
    cacheLife("minutes");
    return rows;
  } catch (err) {
    // Never cache an outage for long (also keeps builds working without a database)
    console.error("links page query failed", err);
    cacheLife("seconds");
    return null;
  }
}

/**
 * Move a listed link one place up or down within its group (featured or not). The new order is
 * written in a single UPDATE, so concurrent moves can never leave duplicate positions half-saved.
 */
export async function moveLink(id: number, dir: -1 | 1) {
  const rows = (await sql()`
    select id, featured from links where listed order by featured desc, sort_order, id`) as { id: number; featured: boolean }[];
  const i = rows.findIndex((r) => Number(r.id) === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= rows.length || rows[i].featured !== rows[j].featured) return false;
  [rows[i], rows[j]] = [rows[j], rows[i]];
  const ids = rows.map((r) => Number(r.id));
  const order = ids.map((_, k) => k);
  await sql()`
    update links set sort_order = v.pos
    from unnest(${ids}::bigint[], ${order}::int[]) as v(id, pos)
    where links.id = v.id`;
  return true;
}

export async function deleteLink(id: number) {
  const rows = (await sql()`delete from links where id = ${id} returning slug`) as { slug: string }[];
  if (rows[0]) forgetSlug(rows[0].slug);
}

export type LinkStats = {
  daily: { day: string; clicks: number }[];
  referrers: { name: string; clicks: number }[];
  countries: { name: string; clicks: number }[];
  devices: { name: string; clicks: number }[];
  bots: number;
};

export async function linkStats(id: number): Promise<LinkStats> {
  const q = sql();
  const [daily, referrers, countries, devices, bots] = await Promise.all([
    q`select to_char(d, 'YYYY-MM-DD') as day, coalesce(c.n, 0)::int as clicks
      from generate_series((now() at time zone 'Asia/Kolkata')::date - 29, (now() at time zone 'Asia/Kolkata')::date, interval '1 day') d
      left join (
        select (clicked_at at time zone 'Asia/Kolkata')::date as day, count(*) as n
        from link_clicks where link_id = ${id} and device <> 'bot' and clicked_at > now() - interval '31 days'
        group by 1
      ) c on c.day = d::date
      order by d`,
    q`select coalesce(referrer_host, 'Direct or app') as name, count(*)::int as clicks
      from link_clicks where link_id = ${id} and device <> 'bot' group by 1 order by 2 desc limit 8`,
    q`select coalesce(country, 'Unknown') as name, count(*)::int as clicks
      from link_clicks where link_id = ${id} and device <> 'bot' group by 1 order by 2 desc limit 8`,
    q`select device as name, count(*)::int as clicks
      from link_clicks where link_id = ${id} and device <> 'bot' group by 1 order by 2 desc`,
    q`select count(*)::int as n from link_clicks where link_id = ${id} and device = 'bot'`,
  ]);
  return {
    daily: daily as LinkStats["daily"],
    referrers: referrers as LinkStats["referrers"],
    countries: countries as LinkStats["countries"],
    devices: devices as LinkStats["devices"],
    bots: (bots[0] as { n: number }).n,
  };
}
