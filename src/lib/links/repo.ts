import "server-only";
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
};

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

export async function createLink(input: LinkInput, by: string) {
  const rows = (await sql()`
    insert into links (slug, url, note, enabled, expires_at, created_by)
    values (${input.slug}, ${input.url}, ${input.note}, ${input.enabled}, ${input.expiresAt}, ${by})
    returning id`) as { id: number }[];
  return rows[0].id;
}

export async function updateLink(id: number, input: LinkInput) {
  const before = await getLink(id);
  await sql()`
    update links set slug = ${input.slug}, url = ${input.url}, note = ${input.note},
      enabled = ${input.enabled}, expires_at = ${input.expiresAt}, updated_at = now()
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
