"use client";

import { useRef } from "react";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { site, type BrandIconName } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";

const perks: { icon: BrandIconName; text: string }[] = [
  { icon: "wrench", text: "Hands-on events through the year" },
  { icon: "trophy", text: "Study groups for AWS certifications" },
  { icon: "teams", text: "A place in the wider AWS Builder Community" },
];

/** Program icon cells on its 9x9 grid, in ring order, for the chase behind the card. */
function chipRing() {
  const cells: [number, number][] = [];
  for (let i = 2; i <= 6; i++) cells.push([i, 1], [i, 7], [1, i], [7, i]);
  for (const i of [2, 4, 6]) cells.push([i, 0], [i, 8], [0, i], [8, i]);
  return cells.sort(
    (a, b) => Math.atan2(a[1] - 4, a[0] - 4) - Math.atan2(b[1] - 4, b[0] - 4),
  );
}
const RING = chipRing();
const BURST_COLOURS = [
  "#00e582",
  "#ff9900",
  "#ad5cff",
  "#42b4ff",
  "#ff57e9",
  "#f2f4f5",
];

export function Join() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // The moment: each title line fills from outline to solid as the section scrolls through
        gsap.fromTo(
          q("[data-fill]"),
          { clipPath: "inset(0% 100% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            ease: "steps(16)",
            stagger: 0.35,
            scrollTrigger: {
              trigger: q("[data-join-title]")[0],
              start: "top 80%",
              end: "bottom 35%",
              scrub: true,
            },
          },
        );

        gsap.from(q("[data-join-card]"), {
          y: 120,
          rotate: 9,
          opacity: 0,
          duration: 1,
          ease: "snap",
          scrollTrigger: {
            trigger: q("[data-join-card]")[0],
            start: "top 85%",
            once: true,
          },
        });
        gsap.from(q("[data-join-perk]"), {
          opacity: 0,
          x: -24,
          duration: 0.5,
          stagger: 0.08,
          ease: "snap",
          scrollTrigger: {
            trigger: q("[data-join-perk]")[0],
            start: "top 85%",
            once: true,
          },
        });
      });

      // Pixel burst from the CTA on hover and press
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const btn = q("[data-burst]")[0] as HTMLElement;
        const layer = q("[data-burst-layer]")[0] as HTMLElement;
        let last = 0;
        const burst = (count: number) => {
          const now = performance.now();
          if (now - last < 250) return;
          last = now;
          const b = btn.getBoundingClientRect();
          const l = layer.getBoundingClientRect();
          for (let i = 0; i < count; i++) {
            const px = document.createElement("span");
            px.className = "pointer-events-none absolute size-2.5";
            px.style.background = gsap.utils.random(BURST_COLOURS);
            px.style.left = `${b.left - l.left + b.width / 2}px`;
            px.style.top = `${b.top - l.top + b.height / 2}px`;
            layer.appendChild(px);
            const a = gsap.utils.random(0, Math.PI * 2);
            const d = gsap.utils.random(50, 150);
            gsap.to(px, {
              x: Math.cos(a) * d,
              y: Math.sin(a) * d,
              rotate: gsap.utils.random(-180, 180),
              opacity: 0,
              duration: gsap.utils.random(0.5, 0.9),
              ease: "power3.out",
              onComplete: () => px.remove(),
            });
          }
        };
        const onEnter = () => burst(14);
        const onDown = () => {
          last = 0;
          burst(26);
        };
        btn.addEventListener("pointerenter", onEnter);
        btn.addEventListener("pointerdown", onDown);
        return () => {
          btn.removeEventListener("pointerenter", onEnter);
          btn.removeEventListener("pointerdown", onDown);
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  const titleLine = (text: string, fill: string) => (
    <span className="relative block w-fit">
      <span className="text-outline block text-grey-500">{text}</span>
      <span data-fill className={`absolute inset-0 block ${fill}`}>
        {text}
      </span>
    </span>
  );

  return (
    <section
      ref={root}
      id="join"
      aria-labelledby="join-title"
      className="bg-pixel-grid relative isolate overflow-hidden bg-grey-850 px-4 py-28 [--cell:72px] sm:px-8 lg:py-40"
    >
      <h2
        id="join-title"
        data-join-title
        className="font-mono text-[clamp(3rem,11vw,11rem)] leading-[0.9] font-bold tracking-tight uppercase"
      >
        <span className="sr-only">Build with us</span>
        <span aria-hidden="true">
          {titleLine("Build", "text-paper")}
          {titleLine("with us", "text-mint")}
        </span>
      </h2>

      <div className="mt-14 grid items-start gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-6 lg:pt-6">
          <ul className="flex flex-col gap-5">
            {perks.map((perk) => (
              // GSAP animates the li; the hover nudge lives on the inner div so the two never share a transform
              <li key={perk.text} data-join-perk>
                <div className="group flex items-center gap-4 text-lg transition-transform duration-300 ease-out-strong hover:translate-x-1.5 sm:text-xl">
                  <span className="grid size-12 shrink-0 place-items-center bg-grey-800 text-mint outline outline-1 outline-grey-700 transition-colors duration-200 group-hover:bg-mint group-hover:text-mint-ink">
                    <BrandIcon name={perk.icon} size={18} />
                  </span>
                  {perk.text}
                </div>
              </li>
            ))}
          </ul>
          {/* A light chases round the program icon's outline in the space under the list */}
          <div
            aria-hidden="true"
            className="chip-chase pointer-events-none relative mt-16 hidden size-[324px] lg:block"
          >
            {RING.map(([c, r], i) => (
              <span
                key={`${c}-${r}`}
                className="absolute size-[32px] outline outline-1 outline-grey-700"
                style={{
                  left: c * 36,
                  top: r * 36,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative lg:col-span-5 lg:col-start-8">
          <div
            data-join-card
            className="march relative bg-paper p-7 text-grey-850 shadow-[10px_10px_0_0_var(--mint)] sm:p-10"
          >
            <BrandIcon name="chip" size={44} className="text-grey-850" />
            <p className="mt-8 font-mono text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
              Membership is open to any learner aged 18+ who is ready to build.
            </p>
            <p className="mt-4 text-base leading-relaxed text-grey-700">
              Every discipline, every year. No cloud experience needed, just
              curiosity.
            </p>
            <a
              data-burst
              href={site.joinUrl}
              target="_blank"
              rel="noreferrer"
              className="pressable mt-8 inline-flex h-12 items-center bg-grey-850 px-6 font-bold text-mint uppercase hover:bg-mint hover:text-mint-ink"
            >
              Join the group
            </a>
          </div>
        </div>
      </div>

      <div
        data-burst-layer
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      />

      <style>{`
        .chip-chase span { animation: chip-chase 3.2s steps(1) infinite; }
        @keyframes chip-chase { 0% { background: #00e582; } 6% { background: rgb(0 229 130 / 0.35); } 12%, 100% { background: transparent; } }
        .march::before {
          content: ""; position: absolute; inset: -6px; pointer-events: none;
          background:
            linear-gradient(90deg, #00e582 50%, transparent 0) top / 16px 3px repeat-x,
            linear-gradient(90deg, #00e582 50%, transparent 0) bottom / 16px 3px repeat-x,
            linear-gradient(0deg, #00e582 50%, transparent 0) left / 3px 16px repeat-y,
            linear-gradient(0deg, #00e582 50%, transparent 0) right / 3px 16px repeat-y;
          animation: march 0.8s steps(4) infinite;
        }
        @keyframes march { to { background-position: 16px 0, -16px 100%, 0 -16px, 100% 16px; } }
        @media (prefers-reduced-motion: reduce) {
          .chip-chase span, .march::before { animation: none; }
        }
      `}</style>
    </section>
  );
}
