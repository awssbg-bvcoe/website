"use client";

import { Fragment, useRef } from "react";
import { BrandIcon } from "@/components/brand/BrandIcon";
import type { BrandIconName } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

const TAPES: { words: string[]; icon: BrandIconName | "chip"; className: string; rotate: number; dir: 1 | -1 }[] = [
  {
    words: ["Cloud", "Serverless", "Generative AI", "Hands-on labs", "Certifications", "Career sessions"],
    icon: "bolt",
    className: "bg-mint text-mint-ink",
    rotate: -3,
    dir: -1,
  },
  {
    words: ["AWS Student Builder Group", "BVCOE New Delhi", "Learn", "Build", "Deploy", "Scale"],
    icon: "chip",
    className: "bg-purple text-grey-850",
    rotate: 2,
    dir: 1,
  },
];

/**
 * Two crossing tape marquees. Speed and direction follow scroll velocity,
 * then ease back to the idle drift.
 */
export function Tapes({ className = "" }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tweens = gsap.utils.toArray<HTMLElement>("[data-tape-track]").map((track, i) =>
          gsap.fromTo(
            track,
            { xPercent: TAPES[i].dir === -1 ? 0 : -50 },
            { xPercent: TAPES[i].dir === -1 ? -50 : 0, duration: 26 + i * 6, ease: "none", repeat: -1 },
          ),
        );

        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const boost = gsap.utils.clamp(-8, 8, self.getVelocity() / 250);
            tweens.forEach((tw) => {
              gsap.to(tw, { timeScale: (1 + Math.abs(boost)) * (boost < 0 ? -1 : 1), duration: 0.2, overwrite: true });
              gsap.to(tw, { timeScale: boost < 0 ? -1 : 1, duration: 1.2, delay: 0.25, overwrite: false });
            });
          },
        });
        return () => {
          st.kill();
          tweens.forEach((t) => t.kill());
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} aria-hidden="true" className={`pointer-events-none ${className}`}>
      {TAPES.map((tape, i) => (
        <div
          key={i}
          className={`absolute inset-x-[-15%] overflow-hidden py-2.5 ${tape.className}`}
          style={{ top: `${i * 66}px`, transform: `rotate(${tape.rotate}deg)` }}
        >
          <div data-tape-track className="flex w-max items-center font-mono text-[clamp(1rem,1.6vw,1.5rem)] font-bold whitespace-nowrap uppercase">
            {[0, 1].map((half) => (
              <div key={half} className="flex items-center">
                {[...tape.words, ...tape.words].map((w, k) => (
                  <Fragment key={`${half}-${k}`}>
                    <span className="px-5">{w}</span>
                    <BrandIcon name={tape.icon} size={18} />
                  </Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
