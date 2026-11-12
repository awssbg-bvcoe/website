import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { moveLinkAction, toggleLinkAction } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CopyButton } from "@/components/admin/CopyButton";
import { LinkForm } from "@/components/admin/LinkForm";
import { currentAdmin } from "@/lib/auth/session";
import { listLinks, listPageLinksForAdmin, type LinkWithStats } from "@/lib/links/repo";
import { siteOrigin } from "@/lib/site-origin";

const fmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

function status(link: LinkWithStats) {
  if (!link.enabled) return { text: "Off", tone: "text-grey-300 border-grey-500" };
  if (link.expires_at && new Date(link.expires_at) <= new Date()) return { text: "Expired", tone: "text-amber border-amber" };
  return { text: "Live", tone: "text-mint border-mint" };
}

async function Dashboard() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  const [links, pageLinks, origin] = await Promise.all([listLinks(), listPageLinksForAdmin(), siteOrigin()]);
  const host = origin.replace(/^https?:\/\//, "");
  const totals = links.reduce((a, l) => ({ all: a.all + l.total, week: a.week + l.last7 }), { all: 0, week: 0 });

  return (
    <>
      <AdminHeader login={admin} />
      <main id="main" className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h1 className="font-mono text-4xl font-bold tracking-tight sm:text-5xl">Short links</h1>
          <dl className="flex gap-8 font-mono">
            <div>
              <dt className="text-xs text-grey-300 uppercase">Links</dt>
              <dd className="text-3xl font-bold">{links.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-grey-300 uppercase">Clicks, 7 days</dt>
              <dd className="text-3xl font-bold text-mint">{totals.week.toLocaleString("en-IN")}</dd>
            </div>
            <div>
              <dt className="text-xs text-grey-300 uppercase">All time</dt>
              <dd className="text-3xl font-bold">{totals.all.toLocaleString("en-IN")}</dd>
            </div>
          </dl>
        </div>

        <section aria-labelledby="new-link" className="mt-10 bg-grey-850 p-6 outline outline-1 outline-grey-700 sm:p-8">
          <h2 id="new-link" className="mb-6 font-mono text-xl font-bold">
            New link
          </h2>
          <LinkForm origin={origin} />
        </section>

        <section aria-labelledby="page-order" className="mt-10 bg-grey-850 p-6 outline outline-1 outline-grey-700 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="page-order" className="font-mono text-xl font-bold">
              On <span className="text-mint">/links</span>
            </h2>
            <a href="/links" target="_blank" rel="noopener" className="link-draw text-sm font-bold [--u-bottom:-2px] [--u-inset:0]">
              Open the page<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
          {pageLinks.length === 0 ? (
            <p className="mt-4 text-sm text-grey-300">Nothing yet. Tick &quot;Show on /links&quot; on a link and give it a title.</p>
          ) : (
            <ol className="mt-5 flex flex-col gap-2">
              {pageLinks.map((l, i) => {
                const prev = pageLinks[i - 1];
                const next = pageLinks[i + 1];
                const canUp = Boolean(prev && prev.featured === l.featured);
                const canDown = Boolean(next && next.featured === l.featured);
                const live = l.enabled && (!l.expires_at || new Date(l.expires_at) > new Date());
                return (
                  <li key={l.id} className="flex items-center gap-3 bg-grey-800 py-2 pr-2 pl-4">
                    <span className="w-6 font-mono text-sm text-grey-300">{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{l.title}</span>
                      <span className="block truncate font-mono text-xs text-grey-300">
                        /{l.slug}
                        {l.featured && <span className="ml-2 text-mint">featured</span>}
                        {!live && <span className="ml-2 text-amber">hidden: link is off or expired</span>}
                      </span>
                    </span>
                    {(["up", "down"] as const).map((dir) => (
                      <form key={dir} action={moveLinkAction}>
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="dir" value={dir} />
                        <button
                          type="submit"
                          disabled={dir === "up" ? !canUp : !canDown}
                          className="pressable grid size-11 place-items-center border border-grey-500 font-mono font-bold hover:border-mint hover:text-mint disabled:pointer-events-none disabled:opacity-30"
                        >
                          <span aria-hidden="true">{dir === "up" ? "\u2191" : "\u2193"}</span>
                          <span className="sr-only">
                            Move {l.title} {dir}
                          </span>
                        </button>
                      </form>
                    ))}
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section aria-labelledby="all-links" className="mt-10">
          <h2 id="all-links" className="sr-only">
            All links
          </h2>
          {links.length === 0 ? (
            <p className="bg-grey-850 p-8 text-grey-300 outline outline-1 outline-grey-700">
              No links yet. Create the first one above, for example <span className="font-mono text-paper">/workshop</span> for your next event form.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {links.map((link) => {
                const st = status(link);
                const short = `${origin}/${link.slug}`;
                return (
                  <li key={link.id} className="grid gap-4 bg-grey-850 p-5 outline outline-1 outline-grey-700 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link href={`/admin/links/${link.id}`} className="link-draw font-mono text-lg font-bold text-paper [--u-bottom:-2px] [--u-inset:0]">
                          {host}/{link.slug}
                        </Link>
                        <span className={`border px-2 py-0.5 text-xs font-bold uppercase ${st.tone}`}>{st.text}</span>
                        {link.listed && <span className="bg-purple px-2 py-0.5 text-xs font-bold text-grey-850 uppercase">{link.featured ? "Featured on /links" : "On /links"}</span>}
                      </div>
                      <p className="mt-1 truncate text-sm text-grey-300" title={link.url}>
                        {link.url}
                      </p>
                      {link.note && <p className="mt-1 text-sm text-paper/80">{link.note}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                      <p className="font-mono text-sm">
                        <span className="text-xl font-bold text-paper">{link.last7}</span> <span className="text-grey-300">7d</span>
                        <span className="mx-2 text-grey-500">/</span>
                        <span className="text-paper">{link.total}</span> <span className="text-grey-300">total</span>
                      </p>
                      <p className="text-xs text-grey-300">{link.last_click ? `Last ${fmt.format(new Date(link.last_click))}` : "No clicks yet"}</p>
                      <div className="flex gap-2">
                        <CopyButton text={short} />
                        <form action={toggleLinkAction}>
                          <input type="hidden" name="id" value={link.id} />
                          <button type="submit" className="pressable inline-flex h-11 items-center border border-grey-500 px-3 text-xs font-bold uppercase hover:border-paper">
                            {link.enabled ? "Turn off" : "Turn on"}
                          </button>
                        </form>
                        <a
                          href={`/warp/${link.slug}?preview`}
                          target="_blank"
                          rel="noopener"
                          className="pressable inline-flex h-11 items-center border border-grey-500 px-3 text-xs font-bold uppercase hover:border-mint hover:text-mint"
                        >
                          Preview<span className="sr-only"> the warp page for /{link.slug} (opens in a new tab)</span>
                        </a>
                        <Link href={`/admin/links/${link.id}`} className="pressable inline-flex h-11 items-center bg-grey-700 px-3 text-xs font-bold uppercase hover:bg-mint hover:text-mint-ink">
                          Stats and edit
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

function Skeleton() {
  return (
    <main id="main" aria-busy="true" className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <div className="h-12 w-64 animate-pulse bg-grey-800" />
      <div className="mt-10 h-56 animate-pulse bg-grey-800" />
      <div className="mt-10 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse bg-grey-800" />
        ))}
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <Dashboard />
    </Suspense>
  );
}
