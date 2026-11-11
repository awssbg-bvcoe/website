"use client";

import { useRef } from "react";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { partnerWays, site, stats, type PartnerWay } from "@/content/site";
import { gsap, SCRAMBLE_CHARS, SplitText, useGSAP } from "@/lib/gsap";

const tone: Record<PartnerWay["tone"], string> = {
  mint: "bg-mint text-mint-ink",
  amber: "bg-amber text-grey-850",
  purple: "bg-purple text-grey-850",
  blue: "bg-blue text-grey-850",
};

const SUBJECT = "Partnership with AWS Student Builder Group, BVCOE";
const mailto = `mailto:${site.contactEmail}?subject=${encodeURIComponent(SUBJECT)}`;
const linkedin = site.socials.find((s) => s.label === "LinkedIn")?.href;

// Pixel "barcode" on the pass: bar widths in px (decorative)
const BARS = [3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 1, 1, 4, 2, 1, 3, 1, 2, 1, 4, 1, 2, 3, 1];

export function Partner() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(q("[data-partner-title]"), { type: "words,chars", mask: "chars" });
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 70%", once: true } });
        tl.from(split.chars, { yPercent: 110, duration: 0.8, stagger: { each: 0.02, from: "random" }, ease: "smooth" })
          .fromTo(q("[data-pass]"), { y: 140, rotate: 14, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: 1, ease: "back.out(1.4)" }, "<0.15")
          .fromTo(q("[data-pass-bar]"), { scaleY: 0 }, { scaleY: 1, duration: 0.02, stagger: { each: 0.025, from: "random" } }, ">-0.4")
          .fromTo(q("[data-way]"), { opacity: 0, y: 40, rotate: (i: number) => (i % 2 ? 4 : -4) }, { opacity: 1, y: 0, rotate: 0, duration: 0.6, stagger: 0.08, ease: "snap" }, "<0.1")
          .fromTo(q("[data-partner-fade]"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "snap" }, "<0.2");

        // Scanner line runs across the barcode on a loop
        const scan = gsap.fromTo(q("[data-pass-scan]"), { xPercent: -100 }, { xPercent: 900, duration: 2.4, ease: "steps(24)", repeat: -1, repeatDelay: 0.8 });

        // The email address scrambles back into place on hover
        const email = q("[data-partner-email]")[0] as HTMLElement | undefined;
        const onEnter = () => gsap.to(email!, { duration: 0.6, scrambleText: { text: site.contactEmail, chars: SCRAMBLE_CHARS, speed: 1 }, overwrite: true });
        email?.addEventListener("pointerenter", onEnter);

        return () => {
          scan.kill();
          email?.removeEventListener("pointerenter", onEnter);
          split.revert();
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="partner" aria-labelledby="partner-title" className="bg-pixel-grid relative isolate overflow-hidden bg-grey-850 px-4 py-28 [--cell:56px] sm:px-8 lg:py-36">
      <h2 id="partner-title" data-partner-title className="max-w-5xl font-mono text-[clamp(2.6rem,8vw,8rem)] leading-[0.92] font-bold tracking-tight uppercase">
        Partner <span className="text-mint">with us</span>
      </h2>
      <p data-partner-fade className="mt-6 max-w-[48ch] text-lg leading-relaxed text-paper sm:text-xl">
        Back a room full of builders. Sponsor an event, run a session or build something with students who ship on AWS.
      </p>

      <div className="mt-14 grid items-start gap-10 lg:grid-cols-12 lg:gap-8">
        {/* The partner pass */}
        <div className="lg:col-span-5">
          <div data-pass className="relative bg-mint text-mint-ink shadow-[10px_10px_0_0_var(--paper)]">
            <div className="flex items-center justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-8">
              <span className="font-mono text-sm font-bold tracking-tight uppercase">Partner pass</span>
              <BrandIcon name="chip" size={28} />
            </div>
            <p className="px-6 pt-6 font-mono text-2xl leading-tight font-bold tracking-tight sm:px-8 sm:text-3xl">
              Your brand in front of students who build on AWS.
            </p>
            <ul className="grid grid-cols-3 gap-3 px-6 pt-6 sm:px-8" aria-label="Reach">
              {stats.map((s) => (
                <li key={s.label}>
                  <span className="block font-mono text-2xl font-bold sm:text-3xl">{s.value}</span>
                  <span className="mt-1 block text-xs leading-snug">{s.label}</span>
                </li>
              ))}
            </ul>

            {/* Perforation: notches cut into both edges with a dashed tear line */}
            <div aria-hidden="true" className="relative mt-7 h-6">
              <span className="absolute top-0 -left-3 size-6 bg-grey-850" />
              <span className="absolute top-0 -right-3 size-6 bg-grey-850" />
              <span className="absolute inset-x-6 top-1/2 border-t-2 border-dashed border-mint-ink/40" />
            </div>

            <div className="px-6 pt-4 pb-7 sm:px-8 sm:pb-8">
              <div aria-hidden="true" className="relative flex h-12 items-stretch gap-[3px] overflow-hidden">
                {BARS.map((w, i) => (
                  <span key={i} data-pass-bar className="block origin-bottom bg-mint-ink" style={{ width: w * 3 }} />
                ))}
                <span data-pass-scan className="absolute inset-y-0 left-0 w-[10%] bg-paper/70 mix-blend-overlay" />
              </div>
              <a
                href={mailto}
                className="pressable mt-6 flex h-12 w-full items-center justify-center gap-2 bg-grey-850 px-6 font-bold text-mint uppercase hover:bg-mint-ink"
              >
                Write to us
              </a>
              <p className="mt-3 text-center font-mono text-sm">
                <a href={mailto} data-partner-email className="link-draw font-bold [--u-bottom:-2px] [--u-inset:0]">
                  {site.contactEmail}
                </a>
              </p>
              {linkedin && (
                <p className="mt-2 text-center text-sm">
                  or{" "}
                  <a href={linkedin} target="_blank" rel="noreferrer" className="link-draw font-bold [--u-bottom:-2px] [--u-inset:0]">
                    message us on LinkedIn
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Ways to work together */}
        <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-7" aria-label="Ways to work together">
          {partnerWays.map((w) => (
            // GSAP animates the li; hover lives on the inner div (G19)
            <li key={w.title} data-way>
              <div className="group flex h-full flex-col bg-grey-800 p-6 outline outline-1 outline-grey-700 transition-[transform,outline-color] duration-200 ease-out-strong hover:-translate-y-1 hover:outline-mint">
                <span className={`grid size-12 place-items-center ${tone[w.tone]}`}>
                  <span className="block transition-transform duration-300 ease-[steps(4)] group-hover:rotate-90">
                    <BrandIcon name={w.icon} size={20} />
                  </span>
                </span>
                <h3 className="mt-6 font-mono text-xl font-bold tracking-tight text-paper sm:text-2xl">{w.title}</h3>
                <p className="mt-2 leading-relaxed text-grey-300">{w.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
