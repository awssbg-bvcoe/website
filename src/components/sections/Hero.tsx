"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { CliTicker } from "@/components/hero/CliTicker";
import { PixelRain } from "@/components/hero/PixelRain";
import { Stickers } from "@/components/hero/Stickers";
import { Tapes } from "@/components/hero/Tapes";
import type { SceneProgress } from "@/components/three/ChipScene";
import { site } from "@/content/site";
import { gsap, SCRAMBLE_CHARS, SplitText, useGSAP, whenIntroDone } from "@/lib/gsap";

const ChipScene = dynamic(() => import("@/components/three/ChipScene"), { ssr: false });

const GLITCH_FILLS = ["#ff9900", "#ff57e9", "#42b4ff", "#f2f4f5"];

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const progress = useRef<SceneProgress>({ value: 0 });

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const q = gsap.utils.selector(root);

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(q("[data-hero-row]"), { type: "chars", mask: "chars", aria: "none" });
        const chars = split.chars as HTMLElement[];
        chars.forEach((c) => (c.dataset.c = c.textContent ?? ""));

        gsap.set(chars, { yPercent: 110 });
        gsap.set(q("[data-hero-card]"), { opacity: 0, yPercent: 18, rotate: -14 });
        gsap.set(q("[data-hero-fade]"), { opacity: 0, y: 16 });
        gsap.set(q("[data-hero-pop]"), { opacity: 0, scale: 0.8 });
        gsap.set(q("[data-hero-tapes]"), { opacity: 0, scaleX: 0.6 });

        const glitches: gsap.core.Tween[] = [];
        let glitchCall: gsap.core.Tween | undefined;

        // Random letters scramble and flash a brand colour, forever
        const glitch = () => {
          const c = gsap.utils.random(chars);
          if (c.dataset.c && c.dataset.c.trim()) {
            const fill = gsap.utils.random(GLITCH_FILLS);
            glitches.push(
              gsap.to(c, {
                duration: 0.45,
                scrambleText: { text: c.dataset.c, chars: SCRAMBLE_CHARS, speed: 1 },
                onStart: () => {
                  c.style.webkitTextFillColor = fill;
                },
                onComplete: () => {
                  c.style.webkitTextFillColor = "";
                },
              }),
            );
            if (glitches.length > 40) glitches.splice(0, 20);
          }
          glitchCall = gsap.delayedCall(gsap.utils.random(0.25, 1.1), glitch);
        };

        const intro = gsap.timeline({
          paused: true,
          onComplete: () => {
            // Let letters leave their masks once they're in, so they can dodge the cursor
            split.masks.forEach((m) => ((m as HTMLElement).style.overflow = "visible"));
            glitch();
          },
        });
        intro
          .to(chars, { yPercent: 0, duration: 0.9, stagger: { each: 0.022, from: "random" }, ease: "smooth" })
          .to(q("[data-hero-tapes]"), { opacity: 1, scaleX: 1, duration: 0.8, ease: "snap" }, 0.2)
          .to(q("[data-hero-card]"), { opacity: 1, yPercent: 0, rotate: -6, duration: 1.1, ease: "snap" }, 0.25)
          .to(q("[data-hero-fade]"), { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "snap" }, 0.55)
          .to(q("[data-hero-pop]"), { opacity: 1, scale: 1, duration: 0.7, ease: "back.out(2)" }, 0.7);

        // Hovering a row scrambles the whole row
        const rows = q("[data-hero-row]") as HTMLElement[];
        const onRowEnter = (e: Event) => {
          const rowChars = (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>("[data-c]");
          rowChars.forEach((c, i) =>
            gsap.to(c, {
              duration: 0.5,
              delay: i * 0.02,
              scrambleText: { text: c.dataset.c ?? "", chars: SCRAMBLE_CHARS },
              overwrite: "auto",
            }),
          );
        };
        rows.forEach((r) => r.addEventListener("pointerenter", onRowEnter));

        const release = whenIntroDone(() => intro.play());
        return () => {
          release();
          glitchCall?.kill();
          glitches.forEach((g) => g.kill());
          rows.forEach((r) => r.removeEventListener("pointerenter", onRowEnter));
          split.revert();
        };
      });

      // Letters dodge the cursor; CTAs are magnetic (fine pointers only)
      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const pointer = { x: -9999, y: -9999 };
        const onMove = (e: PointerEvent) => {
          pointer.x = e.clientX;
          pointer.y = e.clientY;
        };
        window.addEventListener("pointermove", onMove, { passive: true });

        let movers: { el: HTMLElement; y: gsap.QuickToFunc; r: gsap.QuickToFunc }[] = [];
        const tick = () => {
          if (!movers.length) {
            movers = (q("[data-c]") as HTMLElement[]).map((el) => ({
              el,
              y: gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" }),
              r: gsap.quickTo(el, "rotation", { duration: 0.5, ease: "power3" }),
            }));
            if (!movers.length) return;
          }
          for (const m of movers) {
            const b = m.el.getBoundingClientRect();
            const dx = b.left + b.width / 2 - pointer.x;
            const dy = b.top + b.height / 2 - pointer.y;
            const d = Math.hypot(dx, dy);
            const f = d < 220 ? 1 - d / 220 : 0;
            m.y((dy >= 0 ? 1 : -1) * f * 70);
            m.r(f * (dx >= 0 ? 18 : -18));
          }
        };
        gsap.ticker.add(tick);

        const magnets = q("[data-magnet]") as HTMLElement[];
        const handlers = magnets.map((el) => {
          const mx = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
          const my = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });
          const move = (e: PointerEvent) => {
            const b = el.getBoundingClientRect();
            mx((e.clientX - (b.left + b.width / 2)) * 0.35);
            my((e.clientY - (b.top + b.height / 2)) * 0.35);
          };
          const leave = () => {
            mx(0);
            my(0);
          };
          el.addEventListener("pointermove", move);
          el.addEventListener("pointerleave", leave);
          return () => {
            el.removeEventListener("pointermove", move);
            el.removeEventListener("pointerleave", leave);
          };
        });

        return () => {
          window.removeEventListener("pointermove", onMove);
          gsap.ticker.remove(tick);
          handlers.forEach((h) => h());
        };
      });

      // Desktop: pin, rows split apart, stickers scatter, card fills the screen
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const card = q("[data-hero-card]")[0] as HTMLElement;

        // Offset that moves the card's centre to the viewport centre *at the moment the pin starts*.
        // On short screens the pin starts once the hero's bottom reaches the viewport bottom, not at its top.
        const fill = () => {
          const r = card.getBoundingClientRect();
          const hero = root.current!;
          const heroTop = hero.getBoundingClientRect().top + window.scrollY;
          const pinScroll = heroTop + Math.max(0, hero.offsetHeight - window.innerHeight);
          const cardCentreAtPin = r.top + window.scrollY + r.height / 2 - pinScroll;
          return {
            scale: Math.max(window.innerWidth / card.offsetWidth, window.innerHeight / card.offsetHeight) * 1.02,
            x: window.innerWidth / 2 - (r.left + r.width / 2),
            y: window.innerHeight / 2 - cardCentreAtPin,
          };
        };
        let target = fill();

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            // Short screens: the hero is taller than the viewport, so pin once its bottom reaches the bottom
            start: () => (root.current!.offsetHeight > window.innerHeight + 2 ? "bottom bottom" : "top top"),
            end: "+=170%",
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefreshInit: () => {
              gsap.set(card, { clearProps: "x,y,scale" });
              target = fill();
            },
            onUpdate: (self) => {
              progress.current.value = self.progress;
            },
          },
        });

        const stickers = q("[data-sticker]") as HTMLElement[];
        // Outward push from the hero centre, as a percentage of the sticker's own size.
        // Uses xPercent/yPercent so it composes with the x/y mouse parallax.
        const away = (i: number, axis: "x" | "y") => {
          const host = root.current!.getBoundingClientRect();
          const b = stickers[i].getBoundingClientRect();
          if (!b.width) return 0;
          return axis === "x"
            ? ((b.left + b.width / 2 - (host.left + host.width / 2)) * 1.4 * 100) / b.width
            : ((b.top + b.height / 2 - (host.top + host.height / 2)) * 1.4 * 100) / b.height;
        };

        // Every tween states its start explicitly (fromTo, immediateRender off). The timeline is
        // built while the intro still holds these elements hidden; plain .to() would record that
        // hidden state as "start" and scrolling back to the top would hide them again.
        const rest = { immediateRender: false };
        const rows = q("[data-hero-row]");
        tl.fromTo(rows[0], { xPercent: 0 }, { xPercent: -14, duration: 0.6, ...rest }, 0)
          .fromTo(rows[1], { xPercent: 0 }, { xPercent: 14, duration: 0.6, ...rest }, 0)
          .fromTo(q("[data-hero-type]"), { opacity: 1 }, { opacity: 0, duration: 0.5, ...rest }, 0)
          .fromTo(q("[data-hero-fade]"), { opacity: 1, y: 0 }, { opacity: 0, y: -24, duration: 0.3, ...rest }, 0)
          .fromTo(
            q("[data-hero-tapes]"),
            { yPercent: 0, rotate: 0, opacity: 1, scaleX: 1 },
            { yPercent: 160, rotate: 6, opacity: 0, scaleX: 1, duration: 0.5, ...rest },
            0,
          )
          .fromTo(
            q("[data-hero-pop]"),
            { opacity: 1, x: 0, rotate: 0, scale: 1 },
            { opacity: 0, x: -120, rotate: -20, scale: 1, duration: 0.4, ...rest },
            0,
          )
          .fromTo(
            stickers,
            { xPercent: 0, yPercent: 0, rotate: 0, opacity: 1 },
            {
              xPercent: (i: number) => away(i, "x"),
              yPercent: (i: number) => away(i, "y"),
              rotate: () => gsap.utils.random(-120, 120),
              opacity: 0,
              duration: 0.55,
              ...rest,
            },
            0,
          )
          .fromTo(
            card,
            { rotate: -6, x: 0, y: 0, scale: 1, opacity: 1, yPercent: 0 },
            { rotate: 0, x: () => target.x, y: () => target.y, scale: () => target.scale, opacity: 1, yPercent: 0, duration: 0.7, ...rest },
            0,
          )
          // End state: frame corners snap in, the tag stamps, lines type in pixel by pixel,
          // and a mint block wipes in behind "building"
          .fromTo(q("[data-hero-statement]"), { opacity: 0 }, { opacity: 1, duration: 0.01, ...rest }, 0.58)
          .fromTo(
            q("[data-hero-corner]"),
            { opacity: 0, scale: 2.2 },
            { opacity: 1, scale: 1, duration: 0.12, ease: "steps(4)", stagger: 0.02, ...rest },
            0.58,
          )
          .fromTo(q("[data-st-tag]"), { scaleX: 0 }, { scaleX: 1, duration: 0.08, ease: "steps(5)", ...rest }, 0.6)
          .fromTo(
            q("[data-st-line]"),
            { clipPath: "inset(0% 100% 0% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 0.14, ease: "steps(14)", stagger: 0.08, ...rest },
            0.63,
          )
          .fromTo(q("[data-st-block]"), { scaleX: 0 }, { scaleX: 1, duration: 0.08, ease: "steps(6)", ...rest }, 0.82)
          .to({}, { duration: 0.15 });

        return () => {
          progress.current.value = 0;
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  const kick = () => {
    progress.current.kick = performance.now();
  };

  return (
    <section
      ref={root}
      id="top"
      aria-labelledby="hero-title"
      className="relative isolate min-h-[100dvh] overflow-hidden px-4 pt-28 pb-10 sm:px-8 lg:pt-32"
    >
      <PixelRain className="opacity-55" />


      <h1 id="hero-title" data-hero-type className="pointer-events-none relative z-[5] font-mono text-display font-bold uppercase">
        <span className="sr-only">Learn. Build. Deploy. Scale.</span>
        <span aria-hidden="true">
          <span data-hero-row className="pointer-events-auto block w-fit whitespace-nowrap text-paper">
            Learn. Build.
          </span>
          <span data-hero-row className="pointer-events-auto block w-fit whitespace-nowrap text-mint text-outline">
            Deploy. Scale.
          </span>
        </span>
      </h1>
      {/* Ribbons sit in flow right under the headline so they never overlap it, whatever the viewport height */}
      <div data-hero-tapes className="pointer-events-none relative z-[1] mt-[clamp(4.5rem,9vh,6.5rem)] hidden h-32 lg:block">
        <Tapes className="absolute inset-0" />
      </div>

      <Stickers className="absolute inset-0 z-[3]" />

      <div className="relative mt-10 flex flex-col gap-10 lg:static lg:mt-0 lg:block">
        <div
          data-hero-card
          onClick={kick}
          className="relative z-[4] aspect-[4/3] w-full origin-center -rotate-3 cursor-pointer overflow-hidden bg-grey-800 shadow-[10px_10px_0_0_var(--mint)] lg:absolute lg:right-[5vw] lg:bottom-[9vh] lg:w-[min(46vw,44rem)] lg:-rotate-6"
        >
          <div className="bg-pixel-grid absolute inset-0 [--cell:40px]" />
          <ChipScene progress={progress} />
        </div>

        <div data-hero-pop className="absolute bottom-[12vh] left-[calc(min(28rem,30vw)+4.5rem)] z-[4] hidden rotate-3 lg:block">
          <CliTicker />
        </div>

        <div
          data-hero-statement
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 bottom-[12vh] z-[5] hidden opacity-0 lg:block"
        >
          <span data-st-tag className="inline-block origin-left bg-mint px-3 py-1.5 font-mono text-sm font-bold tracking-tight text-mint-ink">
            AWS Student Builder Group / BVCOE
          </span>
          <p className="mt-5 font-mono text-[clamp(2rem,5.2vw,5.5rem)] leading-[1.06] font-bold tracking-tight text-paper [text-shadow:0_4px_24px_rgb(22_29_38/0.8)]">
            <span data-st-line className="block w-fit">
              Learn cloud
            </span>
            <span data-st-line className="block w-fit">
              by{" "}
              <span className="relative isolate inline-block px-[0.1em] text-mint-ink [text-shadow:none]">
                <span data-st-block className="absolute inset-0 -z-10 origin-left bg-mint" />
                building
              </span>{" "}
              on it.
            </span>
          </p>
        </div>

        {/* Pixel corner brackets framing the full-screen end state */}
        {(["top-24 left-6", "top-24 right-6 rotate-90", "bottom-6 right-6 rotate-180", "bottom-6 left-6 -rotate-90"] as const).map((pos) => (
          <span
            key={pos}
            data-hero-corner
            aria-hidden="true"
            className={`pointer-events-none absolute z-[5] hidden size-10 opacity-0 lg:block ${pos}`}
          >
            <span className="absolute top-0 left-0 h-2.5 w-10 bg-mint" />
            <span className="absolute top-0 left-0 h-10 w-2.5 bg-mint" />
          </span>
        ))}

        <div className="relative z-[5] max-w-md lg:mt-10 lg:max-w-[min(28rem,30vw)]">
          <p data-hero-fade className="bg-grey-850/70 text-lg leading-relaxed text-grey-300 sm:text-xl">
            A student-led AWS community at BVCOE, New Delhi. Hands-on cloud and AI, open to every branch and year.
          </p>
          <div data-hero-fade className="mt-7 flex flex-wrap items-center gap-3">
            <a
              data-magnet
              href={site.joinUrl}
              target="_blank"
              rel="noreferrer"
              className="pressable inline-flex h-12 items-center bg-mint px-6 font-bold text-mint-ink uppercase shadow-[5px_5px_0_0_var(--paper)] hover:bg-paper hover:shadow-[5px_5px_0_0_var(--mint)]"
            >
              Join the group
            </a>
            <a
              data-magnet
              href="#programs"
              className="pressable inline-flex h-12 items-center border border-grey-500 bg-grey-850 px-6 font-bold text-paper uppercase hover:border-paper"
            >
              See programs
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
