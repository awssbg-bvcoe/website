"use client";

import Image from "next/image";
import { useRef } from "react";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { advisor } from "@/content/team";
import { gsap, SCRAMBLE_CHARS, SplitText, useGSAP } from "@/lib/gsap";

const chipTone = {
  amber: "bg-amber text-grey-850",
  mint: "bg-mint text-mint-ink",
  blue: "bg-blue text-grey-850",
  purple: "bg-purple text-grey-850",
} as const;

// Small stickers round the portrait, one per credential (position in % of the portrait column)
const STICKERS = [
  { icon: "trophy", tone: "bg-amber text-grey-850", x: "-8%", y: "64%", size: 56, rotate: -12, depth: 26 },
  { icon: "bolt", tone: "bg-mint text-mint-ink", x: "88%", y: "-6%", size: 50, rotate: 14, depth: 40 },
  { icon: "speaker", tone: "bg-blue text-grey-850", x: "92%", y: "72%", size: 52, rotate: 8, depth: 18 },
] as const;

const GLITCH_FILLS = ["#ff9900", "#42b4ff", "#00e582", "#ff57e9"];

export function Advisor() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        let split: SplitText | undefined;
        let glitchCall: gsap.core.Tween | undefined;
        let cycle: gsap.core.Timeline | undefined;

        // A random letter of the name glitches every so often, flashing a brand colour
        const glitch = () => {
          const chars = (split?.chars ?? []) as HTMLElement[];
          const c = chars.length ? gsap.utils.random(chars) : null;
          if (c && c.textContent?.trim()) {
            const original = c.textContent;
            const fill = gsap.utils.random(GLITCH_FILLS);
            gsap.to(c, {
              duration: 0.4,
              scrambleText: { text: original, chars: SCRAMBLE_CHARS, speed: 1 },
              onStart: () => {
                c.style.color = fill;
              },
              onComplete: () => {
                c.style.color = "";
              },
            });
          }
          glitchCall = gsap.delayedCall(gsap.utils.random(0.9, 2.2), glitch);
        };

        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
          onComplete: () => {
            // words + chars: each word stays whole when the name wraps (chars alone can break "Pu / ri")
            split = SplitText.create(q("[data-adv-name]"), { type: "words,chars", aria: "none" });
            glitch();
            // A mint highlight walks across the credential tiles, one at a time
            const tiles = q("[data-adv-tile]") as HTMLElement[];
            cycle = gsap.timeline({ repeat: -1 });
            tiles.forEach((t) => {
              cycle!
                .to(t, { outlineColor: "#00e582", duration: 0.01 })
                .fromTo(t.querySelector("[data-adv-icon]"), { scale: 1 }, { scale: 1.15, duration: 0.3, ease: "steps(3)", yoyo: true, repeat: 1 }, "<")
                .to(t, { outlineColor: "#2a3542", duration: 0.01 }, "+=1.4");
            });
          },
        });
        tl
          // Portrait wipes up in hard pixel steps, the frame lands with a tilt
          .fromTo(q("[data-adv-frame]"), { y: 80, rotate: 9, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: 0.9, ease: "snap" })
          .fromTo(q("[data-adv-photo]"), { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "steps(10)" }, "<0.1")
          .fromTo(q("[data-adv-corner]"), { opacity: 0, scale: 2.2 }, { opacity: 1, scale: 1, duration: 0.3, ease: "steps(4)", stagger: 0.05 }, ">-0.2")
          .fromTo(q("[data-adv-stamp]"), { scale: 1.8, opacity: 0, rotate: -20 }, { scale: 1, opacity: 1, rotate: -6, duration: 0.35, ease: "steps(4)" }, "<")
          .fromTo(
            q("[data-adv-sticker-inner]"),
            { scale: 0.2, opacity: 0, rotate: () => gsap.utils.random(-200, 200) },
            { scale: 1, opacity: 1, rotate: 0, duration: 0.8, stagger: 0.08, ease: "back.out(1.8)" },
            "<",
          )
          .to(q("[data-adv-name]"), { duration: 0.9, scrambleText: { text: advisor.name, chars: SCRAMBLE_CHARS, speed: 0.6 } }, "<")
          .fromTo(q("[data-adv-fade]"), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "snap" }, "<0.2")
          // Credential tiles switch on one after another
          .fromTo(q("[data-adv-chip]"), { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.25, stagger: 0.12, ease: "steps(3)" }, "<0.2");

        // Stickers float on their own rhythm
        const floats = (q("[data-adv-sticker-float]") as HTMLElement[]).map((el) =>
          gsap.to(el, { y: gsap.utils.random(-12, 12), duration: gsap.utils.random(1.8, 3), ease: "sine.inOut", repeat: -1, yoyo: true }),
        );

        // Depth: the portrait and the ghost chip drift against each other while scrolling through
        const drift = gsap
          .timeline({ scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } })
          .fromTo(q("[data-adv-portrait]"), { y: 40 }, { y: -40, ease: "none" }, 0)
          .fromTo(q("[data-adv-ghost]"), { y: -60 }, { y: 60, ease: "none" }, 0);

        return () => {
          glitchCall?.kill();
          cycle?.kill();
          floats.forEach((f) => f.kill());
          drift.scrollTrigger?.kill();
          drift.kill();
          split?.revert();
        };
      });

      // Stickers follow the pointer at different depths (fine pointers only)
      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const els = q("[data-adv-sticker]") as HTMLElement[];
        const movers = els.map((el) => ({ x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3" }), y: gsap.quickTo(el, "y", { duration: 0.8, ease: "power3" }) }));
        const onMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          els.forEach((_, i) => {
            movers[i].x(nx * STICKERS[i].depth * 2);
            movers[i].y(ny * STICKERS[i].depth * 2);
          });
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        return () => window.removeEventListener("pointermove", onMove);
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="advisor" aria-labelledby="advisor-title" className="relative isolate overflow-hidden px-4 py-28 sm:px-8 lg:py-36">
      <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
        {/* Portrait */}
        <div data-adv-portrait className="relative ml-2 w-full max-w-[15rem] sm:max-w-[17rem] lg:col-span-4 lg:ml-4 lg:max-w-[21rem]">
          {/* Ghost program icon turning in 90° steps behind the portrait */}
          <div data-adv-ghost aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 text-grey-800">
            <span className="ghost-spin block">
              <BrandIcon name="chip" size={460} />
            </span>
          </div>

          {/* Resting tilt lives on this wrapper; GSAP only animates the frame inside it */}
          <div className="-rotate-3">
            <div data-adv-frame className="group relative bg-paper p-3 shadow-[12px_12px_0_0_var(--mint)]">
              <div data-adv-photo className="scan-hover relative aspect-[4/5] overflow-hidden bg-grey-800">
                <Image
                  src={advisor.photo}
                  alt={`Portrait of ${advisor.name}`}
                  fill
                  sizes="(min-width: 1024px) 21rem, (min-width: 640px) 17rem, 15rem"
                  className="object-cover"
                />
              </div>
              {/* Mint pixel corner brackets snap round the frame */}
              {(["-top-3 -right-3 rotate-90", "-right-3 -bottom-3 rotate-180", "-bottom-3 -left-3 -rotate-90"] as const).map((pos) => (
                <span key={pos} data-adv-corner aria-hidden="true" className={`pointer-events-none absolute size-7 ${pos}`}>
                  <span className="absolute top-0 left-0 h-2 w-7 bg-mint" />
                  <span className="absolute top-0 left-0 h-7 w-2 bg-mint" />
                </span>
              ))}
              <span
                data-adv-stamp
                className="absolute -top-5 -left-4 inline-flex -rotate-6 items-center gap-2 bg-grey-850 px-4 py-2.5 font-mono text-sm font-bold tracking-tight text-mint uppercase shadow-[4px_4px_0_0_rgb(0_229_130/0.35)] sm:text-base"
              >
                <BrandIcon name="chip" size={18} />
                Faculty Advisor
              </span>
            </div>
          </div>

          {/* Credential stickers: parallax (outer) > float > pop-in */}
          {STICKERS.map((s) => (
            <div key={s.icon} data-adv-sticker aria-hidden="true" className="pointer-events-none absolute" style={{ left: s.x, top: s.y }}>
              {/* Resting tilt is the CSS `rotate` property here; GSAP spins the inner tile and floats this wrapper on `y` */}
              <div data-adv-sticker-float style={{ rotate: `${s.rotate}deg` }}>
                <div
                  data-adv-sticker-inner
                  className={`grid place-items-center shadow-[4px_4px_0_0_rgb(4_23_14/0.55)] ${s.tone}`}
                  style={{ width: s.size, height: s.size }}
                >
                  <BrandIcon name={s.icon} size={Math.round(s.size * 0.42)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="lg:col-span-8">
          <h2 id="advisor-title" data-adv-fade className="font-mono text-sm font-bold tracking-tight text-mint uppercase sm:text-base">
            Our faculty advisor
          </h2>
          <p data-adv-name className="mt-4 font-mono text-[clamp(2.4rem,6vw,5.5rem)] leading-[0.95] font-bold tracking-tight text-paper">
            {advisor.name}
          </p>
          <div data-adv-fade className="mt-6">
            <p className="text-xl font-bold text-paper sm:text-2xl">{advisor.role}</p>
            <p className="mt-1 text-sm text-grey-300 sm:text-base">{advisor.roleDetail}</p>
          </div>
          <p data-adv-fade className="mt-6 max-w-[52ch] text-lg leading-relaxed text-paper sm:text-xl">
            {advisor.bio}
          </p>

          <ul className="mt-9 grid gap-3 sm:grid-cols-3" aria-label="Credentials">
            {advisor.credentials.map((c) => (
              // GSAP animates the li; the hover lift lives on the inner div (G19)
              <li key={c.label} data-adv-chip>
                <div
                  data-adv-tile
                  className="group/tile flex h-full items-center gap-4 bg-grey-800 p-3 pr-4 outline outline-1 outline-grey-700 transition-transform duration-200 ease-out-strong hover:-translate-y-0.5"
                >
                  <span data-adv-icon className={`grid size-12 shrink-0 place-items-center ${chipTone[c.tone]}`}>
                    <span className="block transition-transform duration-300 ease-[steps(4)] group-hover/tile:rotate-90">
                      <BrandIcon name={c.icon} size={20} />
                    </span>
                  </span>
                  <span className="leading-snug font-bold text-paper">{c.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <style>{`
        .ghost-spin { animation: ghost-spin 12s steps(4) infinite; }
        @keyframes ghost-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .ghost-spin { animation: none; } }
      `}</style>
    </section>
  );
}
