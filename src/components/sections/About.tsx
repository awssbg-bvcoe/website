"use client";

import { useRef } from "react";
import { DeployBar } from "@/components/about/DeployBar";
import { LedMatrix } from "@/components/about/LedMatrix";
import { LifeGrid } from "@/components/about/LifeGrid";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { stats } from "@/content/site";
import { gsap, SCRAMBLE_CHARS, SplitText, useGSAP } from "@/lib/gsap";

/** "1,000+" -> { n: 1000, suffix: "+" } so the counter can tick up to the real value. */
function parseStat(value: string) {
  const n = Number(value.replace(/[^\d]/g, ""));
  return { n, suffix: value.replace(/[\d,]/g, "") };
}

// Decorative pixel staircases at the section edges (cells in a 24px grid)
const STAIRS = [
  { side: "left-0 top-24", speed: -120, cells: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2], [2, 3], [3, 3]], tone: "bg-purple" },
  { side: "right-0 bottom-16", speed: 160, cells: [[3, 0], [2, 0], [2, 1], [1, 1], [1, 2], [0, 2], [0, 3]], tone: "bg-mint" },
  { side: "right-[38%] top-10", speed: -60, cells: [[0, 0], [1, 0], [1, 1]], tone: "bg-amber" },
];

export function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Title lines rise in; autoSplit re-splits once webfonts settle
        const split = SplitText.create(q("[data-about-title]"), {
          type: "lines",
          mask: "lines",
          aria: "none",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 105,
              duration: 0.9,
              stagger: 0.08,
              scrollTrigger: { trigger: root.current, start: "top 75%", once: true },
            }),
        });

        // "AWS." gets a mint block wiped in behind it, in hard steps
        gsap.fromTo(
          q("[data-aws-block]"),
          { scaleX: 0 },
          { scaleX: 1, duration: 0.6, ease: "steps(6)", delay: 0.5, scrollTrigger: { trigger: root.current, start: "top 75%", once: true } },
        );
        // The AWS word sits outside the split text, so its own reveal and glitch can't clash with SplitText
        gsap.from(q("[data-aws]"), {
          yPercent: 60,
          rotate: -8,
          opacity: 0,
          duration: 0.7,
          ease: "back.out(2)",
          delay: 0.35,
          scrollTrigger: { trigger: root.current, start: "top 75%", once: true },
        });
        const aws = q("[data-aws-word]")[0] as HTMLElement;
        const glitch = gsap.to(aws, {
          duration: 0.5,
          scrambleText: { text: "AWS.", chars: SCRAMBLE_CHARS, speed: 1 },
          repeat: -1,
          repeatDelay: 3.2,
          delay: 2,
        });

        // Paragraph words light up as you scroll through
        const words = SplitText.create(q("[data-about-body]"), { type: "words", aria: "none" });
        gsap.fromTo(
          words.words,
          { opacity: 0.55 },
          {
            opacity: 1,
            stagger: 0.05,
            ease: "none",
            scrollTrigger: { trigger: q("[data-about-body]")[0], start: "top 85%", end: "bottom 45%", scrub: true },
          },
        );

        // Cells fly in from scattered offsets and snap into the grid
        const cells = q("[data-cell]") as HTMLElement[];
        gsap.from(cells, {
          x: () => gsap.utils.random(-240, 240),
          y: () => gsap.utils.random(-160, 220),
          rotate: () => gsap.utils.random(-35, 35),
          scale: 0.6,
          opacity: 0,
          duration: 1,
          ease: "back.out(1.4)",
          stagger: { each: 0.06, from: "random" },
          scrollTrigger: { trigger: q("[data-bento]")[0], start: "top 80%", once: true },
        });

        // Stats tick up in steps to their real values
        (q("[data-count]") as HTMLElement[]).forEach((el) => {
          const { n, suffix } = parseStat(el.dataset.count ?? "0");
          const state = { v: 0 };
          gsap.to(state, {
            v: n,
            duration: 1.6,
            ease: `steps(${Math.min(n, 24)})`,
            delay: 0.4,
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
            onUpdate: () => {
              el.textContent = Math.round(state.v).toLocaleString("en-US") + suffix;
            },
          });
        });

        // Edge staircases drift at different speeds
        (q("[data-stair]") as HTMLElement[]).forEach((el) => {
          gsap.to(el, {
            y: Number(el.dataset.speed),
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
          });
        });

        return () => {
          glitch.kill();
          split.revert();
          words.revert();
        };
      });

      // Mint spotlight follows the cursor over the bento
      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const bento = q("[data-bento]")[0] as HTMLElement;
        const light = q("[data-spotlight]")[0] as HTMLElement;
        const setX = gsap.quickSetter(light, "--sx", "px");
        const setY = gsap.quickSetter(light, "--sy", "px");
        const move = (e: PointerEvent) => {
          const r = bento.getBoundingClientRect();
          setX(e.clientX - r.left);
          setY(e.clientY - r.top);
        };
        const enter = () => gsap.to(light, { opacity: 1, duration: 0.25 });
        const leave = () => gsap.to(light, { opacity: 0, duration: 0.4 });
        bento.addEventListener("pointermove", move);
        bento.addEventListener("pointerenter", enter);
        bento.addEventListener("pointerleave", leave);
        return () => {
          bento.removeEventListener("pointermove", move);
          bento.removeEventListener("pointerenter", enter);
          bento.removeEventListener("pointerleave", leave);
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="about" aria-labelledby="about-title" className="relative isolate overflow-hidden px-4 py-28 sm:px-8 lg:py-40">
      {STAIRS.map((s, i) => (
        <div key={i} data-stair data-speed={s.speed} aria-hidden="true" className={`pointer-events-none absolute -z-10 hidden lg:block ${s.side}`}>
          {s.cells.map(([c, r], k) => (
            <span key={k} className={`absolute size-6 ${s.tone} opacity-70`} style={{ left: c * 24, top: r * 24 }} />
          ))}
        </div>
      ))}

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-6">
          <h2 id="about-title" className="font-mono text-[clamp(2.25rem,5.2vw,5rem)] leading-[1.05] font-bold tracking-tight">
            <span data-about-title className="block">
              Students who
            </span>{" "}
            {/* "build on AWS." stays one line so no word is ever stranded */}
            <span className="mt-1 inline-block whitespace-nowrap">
              build on{" "}
              <span data-aws className="relative isolate inline-block px-[0.12em] text-mint-ink">
                <span data-aws-block aria-hidden="true" className="absolute inset-0 -z-10 origin-left bg-mint" />
                <span data-aws-word>AWS.</span>
              </span>
            </span>
          </h2>
          <p data-about-body className="mt-8 max-w-[52ch] text-lg leading-relaxed text-paper sm:text-xl">
            AWS Student Builder Groups, formerly AWS Cloud Clubs, are student-led communities where students explore,
            create and innovate with AWS. Ours meets at BVCOE, New Delhi.
          </p>
          <div data-cell className="mt-10 -rotate-1 bg-grey-850 p-3 shadow-[6px_6px_0_0_var(--purple)] outline outline-1 outline-grey-700">
            <LedMatrix />
          </div>
        </div>

        {/* Pixel bento: mirrors the kit's banner grid of colour blocks */}
        <div data-bento className="relative grid grid-cols-2 gap-px bg-grey-700 outline outline-1 outline-grey-700 sm:grid-cols-4 lg:col-span-6">
          <div data-cell className="col-span-2 flex min-h-48 flex-col justify-between bg-mint p-6 text-mint-ink sm:min-h-56">
            <BrandIcon name="teams" size={36} />
            <p className="font-mono text-2xl leading-tight font-bold sm:text-3xl">Open to every discipline, year and major.</p>
          </div>
          <div data-cell aria-hidden="true" className="hidden bg-grey-850 p-3 sm:block">
            <LifeGrid />
          </div>
          <div data-cell aria-hidden="true" className="eq hidden items-end justify-center gap-1.5 bg-purple p-5 sm:flex">
            {[0.9, 1.3, 0.7, 1.1, 0.8, 1.4, 1].map((d, i) => (
              <span key={i} className="eq-bar block w-2.5 origin-bottom bg-grey-850" style={{ animationDuration: `${d}s`, animationDelay: `${i * -0.17}s` }} />
            ))}
          </div>
          {stats.map((stat, i) => (
            <div key={stat.label} data-cell className={`flex min-h-44 flex-col justify-end bg-grey-850 p-6 ${i === 0 ? "col-span-2" : "col-span-1"} sm:min-h-52`}>
              <p className="font-mono text-[clamp(2.5rem,5vw,4.25rem)] leading-none font-bold text-paper tabular-nums">
                <span className="sr-only">{stat.value}</span>
                <span data-count={stat.value} aria-hidden="true">
                  {stat.value}
                </span>
              </p>
              <p className="mt-3 text-sm leading-snug text-grey-300 sm:text-base">{stat.label}</p>
            </div>
          ))}
          <div data-cell aria-hidden="true" className="hidden place-items-center bg-amber text-grey-850 sm:grid">
            <span className="key-spin block">
              <BrandIcon name="key" size={30} />
            </span>
          </div>
          <div data-cell aria-hidden="true" className="hidden place-items-center bg-grey-850 text-mint sm:grid">
            <span className="chip-pulse block">
              <BrandIcon name="chip" size={44} />
            </span>
          </div>
          <div data-cell className="col-span-2 hidden min-h-28 bg-mint p-5 text-mint-ink sm:block">
            <DeployBar />
          </div>

          <div
            data-spotlight
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay"
            style={{ background: "radial-gradient(circle 180px at var(--sx, 50%) var(--sy, 50%), rgb(0 229 130 / 0.55), transparent 70%)" }}
          />
        </div>
      </div>

      <style>{`
        .eq-bar { height: 70%; animation: eq-bounce 1s steps(5) infinite alternate; }
        @keyframes eq-bounce { 0% { transform: scaleY(0.15); } 100% { transform: scaleY(1); } }
        .key-spin { animation: key-spin 4.8s steps(4) infinite; }
        @keyframes key-spin { to { transform: rotate(360deg); } }
        .chip-pulse { animation: chip-pulse 1.6s steps(2) infinite; }
        @keyframes chip-pulse { 50% { transform: scale(1.18); } }
        @media (prefers-reduced-motion: reduce) {
          .eq-bar, .key-spin, .chip-pulse { animation: none; }
        }
      `}</style>
    </section>
  );
}
