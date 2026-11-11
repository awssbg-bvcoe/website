"use client";

import { Fragment, useRef } from "react";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { ProgramVisual } from "@/components/programs/ProgramVisual";
import { programs, type Program } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";

// `badge`: the label block in the card's top-left, inverted against the card for contrast
const tones: Record<Program["tone"], { card: string; tag: string; ghost: string; badge: string }> = {
  mint: { card: "bg-mint text-mint-ink", tag: "border-mint-ink/40", ghost: "text-mint-ink/10", badge: "bg-grey-850 text-mint shadow-[5px_5px_0_0_rgb(4_23_14/0.35)]" },
  paper: { card: "bg-paper text-grey-850", tag: "border-grey-850/30", ghost: "text-grey-850/[0.07]", badge: "bg-grey-850 text-paper shadow-[5px_5px_0_0_var(--mint)]" },
  purple: { card: "bg-purple text-grey-850", tag: "border-grey-850/40", ghost: "text-grey-850/10", badge: "bg-grey-850 text-purple shadow-[5px_5px_0_0_rgb(22_29_38/0.35)]" },
  dark: { card: "bg-grey-800 text-paper outline outline-1 outline-grey-700", tag: "border-grey-500", ghost: "text-mint/10", badge: "bg-mint text-mint-ink shadow-[5px_5px_0_0_rgb(0_229_130/0.25)]" },
};

function ProgramCard({ program }: { program: Program }) {
  const t = tones[program.tone];
  return (
    <article
      aria-labelledby={`program-${program.id}`}
      className={`relative flex min-h-[min(32rem,70dvh)] w-full max-w-6xl sm:min-h-[min(40rem,78dvh)] flex-col justify-between overflow-hidden p-6 sm:p-10 lg:p-14 ${t.card}`}
    >
      <BrandIcon name={program.icon} size={420} className={`absolute -right-16 -bottom-20 hidden sm:block ${t.ghost}`} />
      <div className={`relative inline-flex w-fit items-center gap-3.5 px-4 py-3 sm:gap-4 sm:px-5 sm:py-3.5 ${t.badge}`}>
        <BrandIcon name={program.icon} size={30} className="sm:hidden" />
        <BrandIcon name={program.icon} size={38} className="hidden sm:inline-block" />
        <span className="font-mono text-xl leading-none font-bold tracking-tight uppercase sm:text-[1.75rem]">{program.label}</span>
      </div>
      <div className="relative mt-10 grid items-end gap-10 sm:mt-16 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
      {/* Container query: the title scales with its own column, so the longest word ("Certification", 13 mono chars) always fits */}
      <div className="@container min-w-0">
        <h3 id={`program-${program.id}`} className="font-mono text-[clamp(2rem,11cqi,5rem)] leading-[0.95] font-bold tracking-tight">
          {program.title}
        </h3>
        <ul className="mt-7 flex flex-wrap gap-2" aria-label={`${program.title} topics`}>
          {program.tags.map((tag) => (
            <li key={tag} className={`border px-3 py-1.5 text-sm font-bold ${t.tag}`}>
              {tag}
            </li>
          ))}
        </ul>
        <p className="mt-7 max-w-[46ch] text-lg leading-relaxed sm:text-xl">{program.body}</p>
      </div>
      <div aria-hidden="true" className="relative w-full min-w-0 max-w-md lg:max-w-none">
        <ProgramVisual id={program.id} />
      </div>
      </div>
    </article>
  );
}

export function Programs() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-stack-card]");
        // Cards hold with CSS sticky (motion-safe:sticky), not a ScrollTrigger pin: phones run momentum
        // scrolling on the compositor, and a JS pin applied a frame late, so cards jumped (G21).
        // A stuck element moves, so it cannot be a trigger; each card has a zero-height marker in flow instead.
        const marks = gsap.utils.toArray<HTMLElement>("[data-stack-mark]");

        cards.forEach((card, i) => {
          const inner = card.querySelector<HTMLElement>("[data-stack-inner]")!;

          // Each card lands with a sticker tilt and settles flat
          gsap.fromTo(
            inner,
            { rotate: i % 2 ? 5 : -5, yPercent: 8 },
            {
              rotate: 0,
              yPercent: 0,
              ease: "none",
              scrollTrigger: { trigger: marks[i], start: "top bottom", end: "top top", scrub: true },
            },
          );

          if (i === cards.length - 1) return;
          // Card stays opaque; a shade layer darkens it as the next one covers it
          const shade = card.querySelector<HTMLElement>("[data-stack-shade]")!;
          gsap
            .timeline({ scrollTrigger: { trigger: marks[i + 1], start: "top 60%", end: "top top", scrub: true } })
            .to(inner, { scale: 0.92, ease: "none" }, 0)
            .to(shade, { opacity: 0.65, ease: "none" }, 0);
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="programs" aria-labelledby="programs-title" className="relative">
      <div className="px-4 pt-28 pb-6 sm:px-8 lg:pt-40">
        <h2 id="programs-title" className="max-w-5xl font-mono text-[clamp(2.5rem,7vw,7rem)] leading-[0.95] font-bold tracking-tight">
          Four ways to <span className="text-mint">build</span> with us
        </h2>
      </div>
      <div>
        {programs.map((program, i) => (
          <Fragment key={program.id}>
          <div data-stack-mark aria-hidden="true" />
          <div
            data-stack-card
            className="relative flex min-h-[100dvh] items-center justify-center px-4 py-10 sm:px-8 motion-safe:sticky motion-safe:top-0"
            style={{ zIndex: i + 1 }}
          >
            <div data-stack-inner className="relative w-full max-w-6xl will-change-transform">
              <ProgramCard program={program} />
              <div data-stack-shade aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grey-850 opacity-0" />
            </div>
          </div>
          </Fragment>
        ))}
      </div>
    </section>
  );
}
