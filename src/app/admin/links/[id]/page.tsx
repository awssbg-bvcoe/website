import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { Suspense } from "react";
import { toggleLinkAction } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Breakdown, ClicksChart } from "@/components/admin/ClicksChart";
import { CopyButton } from "@/components/admin/CopyButton";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { LinkForm } from "@/components/admin/LinkForm";
import { currentAdmin } from "@/lib/auth/session";
import { getLink, linkStats } from "@/lib/links/repo";
import { siteOrigin } from "@/lib/site-origin";

/** ISO timestamp to the `datetime-local` value in IST, which is what admins type in. */
function toLocalInput(iso: string | null) {
  if (!iso) return null;
  const d = new Date(new Date(iso).getTime() + 330 * 60_000);
  return d.toISOString().slice(0, 16);
}

async function LinkDetail({ params }: { params: PageProps<"/admin/links/[id]">["params"] }) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const [link, origin] = await Promise.all([getLink(id), siteOrigin()]);
  if (!link) notFound();
  const stats = await linkStats(id);
  const short = `${origin}/${link.slug}`;
  const qr = await QRCode.toString(short, { type: "svg", margin: 1, color: { dark: "#161d26", light: "#f2f4f5" } });

  return (
    <>
      <AdminHeader login={admin} />
      <main id="main" className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <Link href="/admin" className="link-draw text-sm text-grey-300 [--u-bottom:-2px] [--u-inset:0]">
          All links
        </Link>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-mono text-3xl font-bold tracking-tight break-all sm:text-4xl">/{link.slug}</h1>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={short} label="Copy link" />
            <a
              href={`/warp/${link.slug}?preview`}
              target="_blank"
              rel="noopener"
              className="pressable inline-flex h-11 items-center bg-grey-700 px-4 text-sm font-bold uppercase hover:bg-mint hover:text-mint-ink"
            >
              Preview warp<span className="sr-only"> (opens in a new tab)</span>
            </a>
            <form action={toggleLinkAction}>
              <input type="hidden" name="id" value={link.id} />
              <button type="submit" className="pressable inline-flex h-11 items-center border border-grey-500 px-4 text-sm font-bold uppercase hover:border-paper">
                {link.enabled ? "Turn off" : "Turn on"}
              </button>
            </form>
          </div>
        </div>
        <p className="mt-2 text-sm text-grey-300">
          Goes to <span className="break-all text-paper">{link.url}</span>
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_18rem]">
          <section aria-label="Clicks" className="bg-grey-850 p-6 outline outline-1 outline-grey-700 sm:p-8">
            <ClicksChart data={stats.daily} />
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              <Breakdown title="Referrers" rows={stats.referrers} empty="No referrers yet." />
              <Breakdown title="Countries" rows={stats.countries} empty="No clicks yet." />
              <Breakdown title="Devices" rows={stats.devices} empty="No clicks yet." />
            </div>
            <p className="mt-8 text-xs text-grey-300">
              Bots and link previews are left out of every number above ({stats.bots} so far). No IP addresses or full referrer URLs are stored.
            </p>
          </section>

          <section aria-labelledby="qr" className="bg-grey-850 p-6 outline outline-1 outline-grey-700">
            <h2 id="qr" className="font-mono text-lg font-bold">
              QR code
            </h2>
            <div className="mt-4 bg-paper p-3 [&_svg]:h-auto [&_svg]:w-full" role="img" aria-label={`QR code for ${short}`} dangerouslySetInnerHTML={{ __html: qr }} />
            <a
              href={`/api/admin/qr/${link.slug}`}
              download={`${link.slug}-qr.svg`}
              className="pressable mt-4 flex h-11 items-center justify-center bg-mint px-4 text-sm font-bold text-mint-ink uppercase hover:bg-paper"
            >
              Download SVG
            </a>
          </section>
        </div>

        <section aria-labelledby="edit" className="mt-6 bg-grey-850 p-6 outline outline-1 outline-grey-700 sm:p-8">
          <h2 id="edit" className="mb-6 font-mono text-xl font-bold">
            Edit
          </h2>
          <LinkForm
            origin={origin}
            initial={{
              id: link.id,
              slug: link.slug,
              url: link.url,
              note: link.note,
              expiresAt: toLocalInput(link.expires_at),
              enabled: link.enabled,
              title: link.title,
              description: link.description,
              listed: link.listed,
              featured: link.featured,
            }}
          />
          <div className="mt-8 border-t border-grey-700 pt-6">
            <DeleteButton id={link.id} slug={link.slug} />
          </div>
        </section>
      </main>
    </>
  );
}

export default function LinkPage({ params }: PageProps<"/admin/links/[id]">) {
  return (
    <Suspense fallback={<main id="main" aria-busy="true" className="mx-auto h-96 max-w-6xl animate-pulse bg-grey-800" />}>
      <LinkDetail params={params} />
    </Suspense>
  );
}
