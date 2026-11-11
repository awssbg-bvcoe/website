"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

const BLOCKS = 16;
const STAGES = ["Building", "Deploying", "Live in ap-south-1"];

/** Blocks fill one at a time while the label walks build > deploy > live, then loops. */
export function DeployBar() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const label = root.current!.querySelector<HTMLElement>("[data-deploy-label]")!;
      const blocks = gsap.utils.toArray<HTMLElement>("[data-deploy-block]");
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(blocks, { opacity: 1 });
        label.textContent = STAGES[2];
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          repeat: -1,
          repeatDelay: 0.4,
          paused: true,
          onRepeat: () => {
            label.textContent = STAGES[0];
          },
        });
        tl.set(blocks, { opacity: 0.15 })
          .call(() => {
            label.textContent = STAGES[0];
          })
          .to(blocks.slice(0, 8), { opacity: 1, duration: 0.01, stagger: 0.12 })
          .call(() => {
            label.textContent = STAGES[1];
          })
          .to(blocks.slice(8), { opacity: 1, duration: 0.01, stagger: 0.09 })
          .call(() => {
            label.textContent = STAGES[2];
          })
          .to(blocks, { opacity: 0.6, duration: 0.01, repeat: 5, yoyo: true, ease: "steps(1)" }, "+=0.2")
          .to({}, { duration: 1.4 });

        const st = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom top",
            onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
          },
        });
        return () => {
          st.kill();
          tl.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="flex h-full flex-col justify-between gap-4">
      <p className="font-mono text-sm font-bold tracking-tight sm:text-base">
        <span aria-hidden="true">$ </span>
        <span data-deploy-label>{STAGES[0]}</span>
      </p>
      <div className="grid grid-cols-16 gap-1" aria-hidden="true">
        {Array.from({ length: BLOCKS }, (_, i) => (
          <span key={i} data-deploy-block className="block aspect-square bg-mint-ink opacity-15" />
        ))}
      </div>
    </div>
  );
}
