import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { toggleLinkAction } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CopyButton } from "@/components/admin/CopyButton";
import { LinkForm } from "@/components/admin/LinkForm";
import { currentAdmin } from "@/lib/auth/session";
import { listLinks, type LinkWithStats } from "@/lib/links/repo";
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
  const [links, origin] = await Promise.all([listLinks(), siteOrigin()]);
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
