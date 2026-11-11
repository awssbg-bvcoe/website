"use client";

import Link from "next/link";
import { useRef } from "react";
import { Lockup } from "@/components/brand/Lockup";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { site } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { durationFor, easeInOutCubic } from "@/lib/scroll";

const MARQUEE = "Learn. Build. Deploy. Scale.";

function toTop() {
  if (window.__lenis) window.__lenis.scrollTo(0, { duration: durationFor(window.scrollY), easing: easeInOutCubic });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

export function Footer() {
  const links = [{ label: "AWS Builder Center", href: site.programUrl }, ...site.socials];
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const track = root.current!.querySelector<HTMLElement>("[data-marquee]")!;
        const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
        // Scrolling speeds the band up (and reverses it on scroll up), with a skew that follows velocity
        const skew = gsap.quickTo(track, "skewX", { duration: 0.4, ease: "power3" });
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const v = gsap.utils.clamp(-2500, 2500, self.getVelocity());
            gsap.to(loop, { timeScale: (v < 0 ? -1 : 1) * (1 + Math.abs(v) / 300), duration: 0.2, overwrite: true });
            gsap.to(loop, { timeScale: v < 0 ? -1 : 1, duration: 1.2, delay: 0.3 });
            skew(gsap.utils.clamp(-12, 12, -v / 150));
            gsap.delayedCall(0.25, () => skew(0));
          },
        });
        return () => {
          st.kill();
          loop.kill();
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <footer ref={root} className="relative overflow-hidden bg-mint text-mint-ink">
      <div className="flex items-start justify-between gap-6 px-4 pt-8 sm:px-8 sm:pt-10">
        <button type="button" onClick={toTop} className="pressable inline-flex h-11 items-center gap-2 bg-mint-ink px-4 text-sm whitespace-nowrap font-bold text-mint uppercase hover:bg-grey-850">
          <span aria-hidden="true">↑</span> Back to top
        </button>
        <span className="hidden sm:block">
          <Lockup compact iconClassName="text-mint-ink" />
        </span>
      </div>

      <div className="relative mt-14 select-none sm:mt-20" aria-hidden="true">
        <div data-marquee className="flex w-max font-mono text-[clamp(4rem,14vw,14rem)] leading-none font-bold tracking-tight whitespace-nowrap uppercase">
          {[0, 1].map((k) => (
            <span key={k} className="pr-[0.5em]">
              {/* Each letter pops up and inverts when the pointer passes over it */}
              {`${MARQUEE} ${MARQUEE}`.split("").map((ch, i) => (
                <span key={i} className="marquee-ch inline-block">
                  {ch === " " ? "\u00a0" : ch}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <ul className="relative mt-10 flex flex-wrap gap-2 px-4 sm:px-8" aria-label="Elsewhere">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="pressable inline-flex h-11 items-center border-2 border-mint-ink px-4 text-sm font-bold uppercase hover:bg-mint-ink hover:text-mint"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-16 flex flex-col gap-4 border-t-2 border-mint-ink/20 px-4 py-6 text-sm sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <p className="max-w-[80ch] leading-snug">
          © 2026 AWS Student Builder Group at {site.campus}, {site.city}. AWS Student Builder Groups
          exist exclusively for educational purposes. Amazon Web Services, AWS and related marks are trademarks of
          Amazon.com, Inc. or its affiliates.
        </p>
        <p className="shrink-0 font-mono text-sm">
          Made with <span aria-hidden="true">&lt;3</span>
          <span className="sr-only">love</span> by{" "}
          <a href={site.maker.href} target="_blank" rel="noreferrer" className="link-draw font-bold [--u-bottom:-2px] [--u-inset:0]">
            {site.maker.name}
          </a>
        </p>
        <Link href="/press-start" prefetch={false} className="pressable inline-flex h-10 shrink-0 items-center gap-2 bg-mint-ink px-4 font-bold text-mint uppercase hover:bg-grey-850">
          <BrandIcon name="bolt" size={14} />
          Play the 404 game
        </Link>
      </div>

      <style>{`
        .marquee-ch { transition: transform 180ms cubic-bezier(0.23, 1, 0.32, 1), color 120ms ease; }
        @media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
          .marquee-ch:hover { transform: translateY(-14%) rotate(-6deg); color: #f2f4f5; transition-duration: 60ms; }
        }
      `}</style>
    </footer>
  );
}
