"use client";

import Image from "next/image";
import { useRef } from "react";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { advisor } from "@/content/team";
import { gsap, SCRAMBLE_CHARS, useGSAP } from "@/lib/gsap";

const chipTone = {
  amber: "bg-amber text-grey-850",
  mint: "bg-mint text-mint-ink",
  blue: "bg-blue text-grey-850",
  purple: "bg-purple text-grey-850",
} as const;

export function Advisor() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top 70%",
            once: true,
          },
        });
        tl
          // Portrait wipes up in hard pixel steps, the frame lands with a tilt
          .fromTo(
            q("[data-adv-frame]"),
            { y: 80, rotate: 9, opacity: 0 },
            { y: 0, rotate: 0, opacity: 1, duration: 0.9, ease: "snap" },
          )
          .fromTo(
            q("[data-adv-photo]"),
            { clipPath: "inset(100% 0% 0% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 0.8,
              ease: "steps(10)",
            },
            "<0.1",
          )
          .fromTo(
            q("[data-adv-stamp]"),
            { scale: 1.8, opacity: 0, rotate: -20 },
            {
              scale: 1,
              opacity: 1,
              rotate: -6,
              duration: 0.35,
              ease: "steps(4)",
            },
            ">-0.1",
          )
          .to(
            q("[data-adv-name]"),
            {
              duration: 0.9,
              scrambleText: {
                text: advisor.name,
                chars: SCRAMBLE_CHARS,
                speed: 0.6,
              },
            },
            "<",
          )
          .fromTo(
            q("[data-adv-fade]"),
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "snap" },
            "<0.2",
          )
          // Credential tiles switch on one after another
          .fromTo(
            q("[data-adv-chip]"),
            { opacity: 0, scale: 0.85 },
            {
              opacity: 1,
              scale: 1,
              duration: 0.25,
              stagger: 0.12,
              ease: "steps(3)",
            },
            "<0.2",
          );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="advisor"
      aria-labelledby="advisor-title"
      className="relative px-4 py-28 sm:px-8 lg:py-36"
    >
      <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
        {/* Portrait */}
        <div className="mx-auto w-full max-w-sm lg:col-span-5 lg:max-w-none">
          {/* Resting tilt lives on this wrapper; GSAP only animates the frame inside it */}
          <div className="-rotate-3">
            <div
              data-adv-frame
              className="group relative bg-paper p-3 shadow-[12px_12px_0_0_var(--mint)]"
            >
              <div
                data-adv-photo
                className="scan-hover relative aspect-[4/5] overflow-hidden bg-grey-800"
              >
                <Image
                  src={advisor.photo}
                  alt={`Portrait of ${advisor.name}`}
                  fill
                  sizes="(min-width: 1024px) 36vw, (min-width: 640px) 24rem, 90vw"
                  className="object-cover"
                />
              </div>
              <span
                data-adv-stamp
                className="absolute -top-5 -left-4 inline-flex -rotate-6 items-center gap-2 bg-grey-850 px-4 py-2.5 font-mono text-sm font-bold tracking-tight text-mint uppercase shadow-[4px_4px_0_0_rgb(0_229_130/0.35)] sm:text-base"
              >
                <BrandIcon name="chip" size={18} />
                Faculty Advisor
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-7">
          <h2
            id="advisor-title"
            data-adv-fade
            className="font-mono text-sm font-bold tracking-tight text-mint uppercase sm:text-base"
          >
            Our faculty advisor
          </h2>
          <p
            data-adv-name
            className="mt-4 font-mono text-[clamp(2.4rem,6vw,5.5rem)] leading-[0.95] font-bold tracking-tight text-paper"
          >
            {advisor.name}
          </p>
          <div data-adv-fade className="mt-6">
            <p className="text-xl font-bold text-paper sm:text-2xl">
              {advisor.role}
            </p>
            <p className="mt-1 text-sm text-grey-300 sm:text-base">
              {advisor.roleDetail}
            </p>
          </div>
          <p
            data-adv-fade
            className="mt-6 max-w-[52ch] text-lg leading-relaxed text-paper sm:text-xl"
          >
            {advisor.bio}
          </p>

          <ul
            className="mt-9 grid gap-3 sm:grid-cols-3"
            aria-label="Credentials"
          >
            {advisor.credentials.map((c) => (
              // GSAP animates the li; the hover lift lives on the inner div (G19)
              <li key={c.label} data-adv-chip>
                <div className="flex h-full items-center gap-4 bg-grey-800 p-3 pr-4 outline outline-1 outline-grey-700 transition-transform duration-200 ease-out-strong hover:-translate-y-0.5">
                  <span
                    className={`grid size-12 shrink-0 place-items-center ${chipTone[c.tone]}`}
                  >
                    <BrandIcon name={c.icon} size={20} />
                  </span>
                  <span className="font-bold leading-snug text-paper">
                    {c.label}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
