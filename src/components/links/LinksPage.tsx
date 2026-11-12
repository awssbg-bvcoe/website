"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { Lockup } from "@/components/brand/Lockup";
import { PixelRain } from "@/components/hero/PixelRain";
import { Tapes } from "@/components/hero/Tapes";
import { PixelTrail } from "@/components/motion/PixelTrail";
import { site } from "@/content/site";
import { gsap, SCRAMBLE_CHARS, useGSAP } from "@/lib/gsap";

export type PageLinkCard = {
  id: number;
  href: string;
  title: string;
  description: string | null;
  featured: boolean;
  site: string;
  icon: string;
};

// The title: one solid brand block per letter, as on the kit's banner
const LETTERS = [
  { ch: "L", tile: "bg-mint text-mint-ink", rot: -6 },
  { ch: "I", tile: "bg-purple text-grey-850", rot: 4 },
  { ch: "N", tile: "bg-amber text-grey-850", rot: -3 },
  { ch: "K", tile: "bg-blue text-grey-850", rot: 5 },
  { ch: "S", tile: "bg-magenta text-grey-850", rot: -4 },
];
const BURST = ["#00e582", "#ad5cff", "#ff9900", "#42b4ff", "#ff57e9", "#f2f4f5"];

/** 6x6 pixel arrow (decorative), drawn with cells so it steps like everything else. */
const ARROW = ["..xx..", "...xx.", "xxxxxx", "xxxxxx", "...xx.", "..xx.."];
function PixelArrow() {
  return (
    <span aria-hidden="true" className="grid grid-cols-6">
      {ARROW.join("").split("").map((c, i) => (
        <span key={i} className={`size-[3px] sm:size-1 ${c === "x" ? "bg-current" : ""}`} />
      ))}
    </span>
  );
}

function SiteIcon({ src, letter, className = "" }: { src: string; letter: string; className?: string }) {
  const img = useRef<HTMLImageElement>(null);
  const [ok, setOk] = useState(true);
  useEffect(() => {
    // An image that failed before hydration never fires onError
    if (img.current?.complete && img.current.naturalWidth === 0) setOk(false);
  }, []);
  return (
    <span data-icon aria-hidden="true" className={`grid shrink-0 place-items-center bg-paper ${className}`}>
      {ok ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={img} src={src} alt="" width={40} height={40} loading="lazy" decoding="async" onError={() => setOk(false)} className="size-[62%] object-contain" />
      ) : (
        <span className="font-mono text-xl font-bold text-grey-850 uppercase">{letter.replace(/[^a-z0-9]/gi, "").charAt(0) || "?"}</span>
      )}
    </span>
  );
}

function LinkCard({ link, index }: { link: PageLinkCard; index: number }) {
  const num = String(index + 1).padStart(2, "0");
  if (link.featured) {
    return (
      <li data-card data-featured className="relative [perspective:900px]">
        <a
          href={link.href}
          data-tilt
          className="group dash-march relative flex items-center gap-4 bg-mint px-5 pt-7 pb-6 text-mint-ink shadow-[8px_8px_0_0_var(--paper)] transition-shadow duration-200 hover:shadow-[12px_12px_0_0_var(--paper)] sm:gap-5 sm:p-7"
        >
          <span className="absolute -top-3 right-4 -rotate-3 bg-amber px-2.5 py-1 font-mono text-xs font-bold tracking-wide text-grey-850 uppercase shadow-[3px_3px_0_0_var(--grey-850)] sm:right-6">
            Featured
          </span>
          <SiteIcon src={link.icon} letter={link.title} className="size-14 self-start shadow-[5px_5px_0_0_var(--grey-850)] transition-transform duration-300 ease-[steps(4)] group-hover:-rotate-6 sm:size-20 sm:self-center" />
          <span className="min-w-0 flex-1">
            <span className="block font-mono text-[0.7rem] font-bold tracking-wide uppercase opacity-70">
              <span data-num aria-hidden="true">{num}</span> / {link.site}
            </span>
            <span className="mt-1 block font-mono text-[1.6rem] leading-tight font-bold tracking-tight sm:text-3xl">{link.title}</span>
            {link.description && <span className="mt-2 block text-base leading-snug">{link.description}</span>}
          </span>
          <span className="hidden size-14 shrink-0 place-items-center bg-grey-850 text-mint transition-transform duration-200 ease-[steps(3)] group-hover:translate-x-1 sm:grid">
            <PixelArrow />
          </span>
        </a>
      </li>
    );
  }
  return (
    <li data-card className="relative [perspective:900px]">
      <a
        href={link.href}
        data-tilt
        className="group scan-hover relative flex items-center gap-4 bg-grey-850 p-4 outline outline-1 outline-grey-700 shadow-[6px_6px_0_0_var(--grey-700)] transition-[box-shadow,outline-color] duration-200 hover:shadow-[8px_8px_0_0_var(--mint)] hover:outline-mint sm:gap-5 sm:p-5"
      >
        <span data-num aria-hidden="true" className="hidden w-7 font-mono text-sm font-bold text-grey-500 sm:block">
          {num}
        </span>
        <SiteIcon src={link.icon} letter={link.title} className="size-12 shadow-[4px_4px_0_0_var(--mint)] transition-transform duration-300 ease-[steps(4)] group-hover:-rotate-6 sm:size-14" />
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-lg leading-tight font-bold tracking-tight text-paper sm:text-xl">{link.title}</span>
          {link.description && <span className="mt-1 line-clamp-2 block text-sm leading-snug text-grey-300">{link.description}</span>}
          {link.site.toLowerCase() !== link.title.toLowerCase() && <span className="mt-1 block font-mono text-xs text-grey-500">{link.site}</span>}
        </span>
        <span className="grid size-11 shrink-0 place-items-center bg-grey-800 text-paper transition-[background-color,color,transform] duration-200 ease-[steps(3)] group-hover:translate-x-1 group-hover:bg-mint group-hover:text-mint-ink sm:size-12">
          <PixelArrow />
        </span>
      </a>
    </li>
  );
}

const noopSubscribe = () => () => {};

function QrPass({ qrSvg, pageUrl }: { qrSvg: string; pageUrl: string }) {
  const [copied, setCopied] = useState(false);
  // Native share sheet where the browser has one (phones); false during SSR
  const canShare = useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator.share === "function",
    () => false,
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the URL is visible on the card */
    }
  };
  const share = () => navigator.share?.({ title: `${site.name} at BVCOE`, url: pageUrl }).catch(() => {});
  // Render the SVG onto a canvas at 1024px for a crisp PNG
  const download = () => {
    const img = new Image();
    const blob = new Blob([qrSvg], { type: "image/svg+xml" });
    const src = URL.createObjectURL(blob);
    img.onload = () => {
      const size = 1024;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#f2f4f5";
      ctx.fillRect(0, 0, size, size);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 32, 32, size - 64, size - 64);
      URL.revokeObjectURL(src);
      const a = document.createElement("a");
      a.download = "awssbg-bvcoe-links-qr.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = src;
  };

  const btn = "pressable flex h-11 items-center justify-center gap-2 px-4 text-sm font-bold uppercase";
  return (
    <section data-reveal aria-labelledby="qr-title" className="bg-grey-850 shadow-[8px_8px_0_0_var(--purple)] outline outline-1 outline-grey-700">
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <h2 id="qr-title" className="flex items-center gap-2 font-mono text-xs font-bold tracking-wide text-grey-300 uppercase">
          <BrandIcon name="chip" size={14} className="text-purple" />
          Share this page
        </h2>
        <span className="bg-purple px-2 py-1 font-mono text-[0.7rem] font-bold text-grey-850 uppercase">Scan me</span>
      </div>
      <div className="grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-5 px-5 pt-5 sm:grid-cols-[10rem_1fr]">
        <div
          className="relative bg-paper p-2 [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
          role="img"
          aria-label={`QR code for ${pageUrl}`}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <p className="min-w-0 font-mono text-sm leading-snug text-paper">
          <span className="block break-all">{pageUrl.replace(/^https?:\/\//, "").replace(/\/links$/, "")}</span>
          <span className="block text-mint">/links</span>
        </p>
      </div>
      <div aria-hidden="true" className="mx-5 mt-5 border-t-2 border-dashed border-grey-700" />
      <div className="flex flex-wrap gap-2 p-5">
        <button type="button" onClick={copy} className={`${btn} bg-mint text-mint-ink hover:bg-paper`}>
          {copied ? "Copied" : "Copy link"}
        </button>
        {canShare && (
          <button type="button" onClick={share} className={`${btn} outline outline-1 outline-grey-500 hover:outline-paper`}>
            Share
          </button>
        )}
        <button type="button" onClick={download} className={`${btn} outline outline-1 outline-grey-500 hover:outline-paper`}>
          Download QR
        </button>
        <span role="status" className="sr-only">
          {copied ? "Link copied" : ""}
        </span>
      </div>
    </section>
  );
}

export function LinksPage({ links, qrSvg, pageUrl }: { links: PageLinkCard[] | null; qrSvg: string; pageUrl: string }) {
  const root = useRef<HTMLElement>(null);
  const burstLayer = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Title tiles drop in from random heights and spins, then bob on their own clocks
        const tiles = q("[data-tile]") as HTMLElement[];
        const intro = gsap.timeline({ defaults: { ease: "back.out(2.2)" } });
        intro
          .from(tiles, { yPercent: () => gsap.utils.random(-260, -160), rotation: () => gsap.utils.random(-120, 120), opacity: 0, duration: 0.8, stagger: { each: 0.07, from: "random" } })
          .from(q("[data-sub]"), { opacity: 0, y: 16, duration: 0.5, ease: "snap" }, "-=0.3")
          .from(q("[data-card]"), { opacity: 0, x: (i: number) => (i % 2 ? 70 : -70), rotation: (i: number) => (i % 2 ? 5 : -5), duration: 0.7, stagger: 0.06 }, "-=0.35")
          .from(q("[data-reveal]"), { opacity: 0, y: 40, rotation: 3, duration: 0.7, stagger: 0.08 }, "-=0.5");

        const bobs = tiles.map((t, i) =>
          gsap.to(t, { y: -7, duration: 1.2 + i * 0.17, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.2 + i * 0.1 }),
        );

        // Glitch: a random tile flashes paper and its letter scrambles
        let glitch: gsap.core.Tween | null = null;
        const tick = () => {
          const t = tiles[(Math.random() * tiles.length) | 0];
          const letter = t.querySelector<HTMLElement>("[data-letter]")!;
          const ch = letter.dataset.letter!;
          gsap.timeline()
            .set(t, { backgroundColor: "#f2f4f5" })
            .to(letter, { duration: 0.35, scrambleText: { text: ch, chars: "AWSLINK01", speed: 1 } }, 0)
            .set(t, { clearProps: "backgroundColor" }, 0.12);
          glitch = gsap.delayedCall(gsap.utils.random(0.9, 2), tick);
        };
        glitch = gsap.delayedCall(2.2, tick);

        // Clicking a tile spins it a full turn
        const spins = tiles.map((t) => {
          const onClick = () => gsap.to(t, { rotation: "+=360", duration: 0.6, ease: "steps(8)" });
          t.addEventListener("click", onClick);
          return () => t.removeEventListener("click", onClick);
        });

        return () => {
          bobs.forEach((b) => b.kill());
          glitch?.kill();
          spins.forEach((off) => off());
        };
      });

      // Fine pointers: cards tilt toward the cursor and their number scrambles on hover
      mm.add("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)", () => {
        const offs = (q("[data-tilt]") as HTMLElement[]).map((el) => {
          const rx = gsap.quickTo(el, "rotationX", { duration: 0.4, ease: "power3" });
          const ry = gsap.quickTo(el, "rotationY", { duration: 0.4, ease: "power3" });
          const num = el.querySelector<HTMLElement>("[data-num]");
          const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            ry(((e.clientX - r.left) / r.width - 0.5) * 8);
            rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
          };
          const enter = () => num && gsap.to(num, { duration: 0.4, scrambleText: { text: num.textContent!, chars: SCRAMBLE_CHARS, speed: 1 } });
          const leave = () => {
            rx(0);
            ry(0);
          };
          el.addEventListener("pointermove", move);
          el.addEventListener("pointerenter", enter);
          el.addEventListener("pointerleave", leave);
          return () => {
            el.removeEventListener("pointermove", move);
            el.removeEventListener("pointerenter", enter);
            el.removeEventListener("pointerleave", leave);
          };
        });
        return () => offs.forEach((off) => off());
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  // Pixel burst from the tap point on every card press (the link still navigates normally)
  const burst = (e: React.PointerEvent) => {
    if (!(e.target as HTMLElement).closest("[data-card] a") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layer = burstLayer.current;
    if (!layer) return;
    for (let i = 0; i < 14; i++) {
      const px = document.createElement("span");
      const s = 6 + ((Math.random() * 3) | 0) * 3;
      Object.assign(px.style, { position: "fixed", left: `${e.clientX}px`, top: `${e.clientY}px`, width: `${s}px`, height: `${s}px`, background: BURST[i % BURST.length] });
      layer.appendChild(px);
      const a = (i / 14) * Math.PI * 2 + Math.random() * 0.4;
      const d = 50 + Math.random() * 70;
      gsap.to(px, { x: Math.cos(a) * d, y: Math.sin(a) * d, rotation: gsap.utils.random(-180, 180), opacity: 0, duration: 0.6, ease: "steps(6)", onComplete: () => px.remove() });
    }
  };

  const socials = [
    ...site.socials.map((s) => ({ label: s.label, href: s.href, external: true })),
    { label: "Email", href: `mailto:${site.contactEmail}`, external: false },
  ];

  return (
    <main ref={root} id="main" onPointerDown={burst} className="relative isolate min-h-[100dvh] overflow-x-clip bg-grey-850 text-paper">
      <div aria-hidden="true" className="fixed inset-0 -z-10 opacity-45">
        <PixelRain />
      </div>
      <div aria-hidden="true" className="bg-pixel-grid pointer-events-none fixed inset-0 -z-10 opacity-60 [--cell:56px]" />

      <header className="relative z-10 flex items-center justify-between gap-4 px-4 pt-5 sm:px-8">
        <Link href="/" className="flex h-12 items-center bg-grey-850/90 px-3 text-paper">
          <Lockup compact textClassName="max-sm:sr-only" awsClassName="max-sm:hidden" />
          <span className="sr-only">Back to the main site</span>
        </Link>
        <Link href="/" className="pressable flex h-11 items-center bg-grey-800 px-4 text-sm font-bold uppercase outline outline-1 outline-grey-700 hover:bg-mint hover:text-mint-ink">
          Main site
        </Link>
      </header>

      {/* Crossing tapes under the header */}
      <div className="relative mt-6 h-[130px] overflow-hidden sm:mt-8">
        <Tapes className="absolute inset-x-0 top-6" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pt-8 pb-16 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:pt-12">
        {/* Left: title, QR, socials (sticky on desktop) */}
        <div className="flex flex-col gap-8 lg:sticky lg:top-8 lg:col-span-5 lg:self-start">
          <div>
            <h1 className="sr-only">AWS Student Builder Group at BVCOE: links</h1>
            <div aria-hidden="true" className="flex gap-2 sm:gap-3">
              {LETTERS.map((l) => (
                <span
                  key={l.ch}
                  data-tile
                  className={`grid size-[clamp(3.4rem,16vw,5.5rem)] cursor-pointer place-items-center font-mono text-[clamp(2.2rem,10vw,3.75rem)] font-bold shadow-[5px_5px_0_0_var(--paper)] select-none lg:size-[clamp(3.4rem,6.4vw,5.5rem)] lg:text-[clamp(2.2rem,4vw,3.75rem)] ${l.tile}`}
                  style={{ rotate: `${l.rot}deg` }}
                >
                  <span data-letter={l.ch}>{l.ch}</span>
                </span>
              ))}
            </div>
            <p data-sub className="mt-8 max-w-[34ch] text-lg leading-relaxed text-paper sm:text-xl">
              Every link from the <span className="font-bold text-mint">AWS Student Builder Group</span> at BVCOE. One tap away.
            </p>
          </div>

          <div className="hidden flex-col gap-8 lg:flex">
            <QrPass qrSvg={qrSvg} pageUrl={pageUrl} />
            <Socials items={socials} />
          </div>
        </div>

        {/* Right: the links */}
        <div className="lg:col-span-7">
          {links === null ? (
            <p data-reveal className="bg-grey-850 p-6 text-grey-300 outline outline-1 outline-grey-700">
              The links are taking a breather. Try again in a moment.
            </p>
          ) : links.length === 0 ? (
            <p data-reveal className="bg-grey-850 p-6 text-grey-300 outline outline-1 outline-grey-700">
              Links are on their way. Follow us below for now.
            </p>
          ) : (
            <ul aria-label="Links" className="flex flex-col gap-4 sm:gap-5">
              {links.map((link, i) => (
                <LinkCard key={link.id} link={link} index={i} />
              ))}
            </ul>
          )}

          <div className="mt-12 flex flex-col gap-8 lg:hidden">
            <QrPass qrSvg={qrSvg} pageUrl={pageUrl} />
            <Socials items={socials} />
          </div>
        </div>
      </div>

      <footer className="relative border-t border-grey-700 bg-grey-850/90 px-4 py-6 text-center text-sm text-grey-300 sm:px-8">
        Made with <span aria-hidden="true" className="text-mint">&lt;3</span>
        <span className="sr-only">love</span> by{" "}
        <a href={site.maker.href} target="_blank" rel="noreferrer" className="link-draw font-bold text-paper [--u-bottom:-2px] [--u-inset:0]">
          {site.maker.name}
        </a>
      </footer>

      <div ref={burstLayer} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50" />
      <PixelTrail />

      <style>{`
        /* Featured cards: a dashed paper border marches round the card in hard steps */
        .dash-march::before {
          content: ""; position: absolute; inset: 6px; pointer-events: none;
          background:
            linear-gradient(90deg, var(--mint-ink) 50%, transparent 0) repeat-x top / 14px 2px,
            linear-gradient(90deg, var(--mint-ink) 50%, transparent 0) repeat-x bottom / 14px 2px,
            linear-gradient(0deg, var(--mint-ink) 50%, transparent 0) repeat-y left / 2px 14px,
            linear-gradient(0deg, var(--mint-ink) 50%, transparent 0) repeat-y right / 2px 14px;
          opacity: 0.35;
        }
        @media (prefers-reduced-motion: no-preference) {
          .dash-march::before { animation: dash-march 0.8s steps(4) infinite; }
        }
        @keyframes dash-march {
          to { background-position: 14px 0, -14px 100%, 0 -14px, 100% 14px; }
        }
      `}</style>
    </main>
  );
}

function Socials({ items }: { items: { label: string; href: string; external: boolean }[] }) {
  return (
    <nav data-reveal aria-label="Follow us" className="flex flex-wrap gap-2">
      {items.map((s) => (
        <a
          key={s.label}
          href={s.href}
          {...(s.external ? { target: "_blank", rel: "noreferrer" } : {})}
          className="pressable flex h-11 items-center bg-grey-800 px-4 font-mono text-sm font-bold uppercase outline outline-1 outline-grey-700 hover:bg-paper hover:text-grey-850"
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}
