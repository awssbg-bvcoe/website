"use client";

import { useRef, type CSSProperties } from "react";
import { BrandIcon } from "@/components/brand/BrandIcon";
import type { BrandIconName } from "@/content/site";
import { Draggable, gsap, useGSAP, whenIntroDone } from "@/lib/gsap";

type Sticker = {
  icon: BrandIconName | "chip";
  x: number; // % of hero width
  y: number; // % of hero height
  size: number; // tile size in px
  rotate: number;
  depth: number; // mouse parallax strength
  tone: string;
  /** Position under 1024px; stickers without it are desktop-only. */
  mobile?: { x: number; y: number };
};

const STICKERS: Sticker[] = [
  { icon: "bolt", x: 50, y: 3, size: 76, rotate: 12, depth: 40, tone: "bg-amber text-grey-850", mobile: { x: 80, y: 22 } },
  { icon: "key", x: 86, y: 15, size: 84, rotate: -10, depth: 26, tone: "bg-purple text-grey-850" },
  { icon: "clock", x: 3, y: 46, size: 70, rotate: -14, depth: 34, tone: "bg-blue text-grey-850", mobile: { x: -4, y: 47 } },
  { icon: "double-bracket-smile", x: 27, y: 50, size: 92, rotate: 8, depth: 18, tone: "bg-mint text-mint-ink" },
  { icon: "trophy", x: 92, y: 62, size: 68, rotate: 16, depth: 44, tone: "bg-paper text-grey-850", mobile: { x: 76, y: 76 } },
  { icon: "drop", x: 58, y: 46, size: 60, rotate: -8, depth: 52, tone: "bg-magenta text-grey-850" },
  { icon: "speaker", x: 70, y: 6, size: 64, rotate: 6, depth: 30, tone: "bg-grey-800 text-mint outline outline-1 outline-grey-700" },
  { icon: "ladder", x: 38, y: 83, size: 58, rotate: -18, depth: 36, tone: "bg-amber text-grey-850", mobile: { x: 58, y: 89 } },
];

/**
 * Brand-icon stickers scattered over the hero. They burst in from the centre,
 * float, follow the mouse at different depths, can be thrown around, and spin
 * when clicked. The hero scroll timeline scatters `[data-sticker]` outward.
 */
export function Stickers({ className = "" }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const els = gsap.utils.toArray<HTMLElement>("[data-sticker]");
      const inners = els.map((el) => el.querySelector<HTMLElement>("[data-sticker-inner]")!);
      inners.forEach((inner, i) => gsap.set(inner, { rotate: STICKERS[i].rotate }));

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(inners, { scale: 0, opacity: 0 });
        const floats: gsap.core.Tween[] = [];

        const release = whenIntroDone(() => {
          const host = root.current!.getBoundingClientRect();
          inners.forEach((inner, i) => {
            const r = els[i].getBoundingClientRect();
            // Burst out from the centre of the hero
            gsap.fromTo(
              inner,
              {
                x: host.left + host.width / 2 - (r.left + r.width / 2),
                y: host.top + host.height / 2 - (r.top + r.height / 2),
                scale: 0.3,
                opacity: 0,
                rotate: STICKERS[i].rotate + gsap.utils.random(-260, 260),
              },
              {
                x: 0,
                y: 0,
                scale: 1,
                opacity: 1,
                rotate: STICKERS[i].rotate,
                duration: 1.1,
                delay: 0.35 + i * 0.05,
                ease: "back.out(1.6)",
                onComplete: () => {
                  // Idle float: each sticker on its own rhythm
                  floats.push(
                    gsap.to(inner, {
                      y: gsap.utils.random(-18, 18),
                      rotate: STICKERS[i].rotate + gsap.utils.random(-9, 9),
                      duration: gsap.utils.random(1.6, 3.2),
                      ease: "sine.inOut",
                      repeat: -1,
                      yoyo: true,
                    }),
                  );
                },
              },
            );
          });
        });

        return () => {
          release();
          floats.forEach((f) => f.kill());
        };
      });

      // Mouse parallax + drag/throw + click spin: fine pointers only
      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const movers = els.map((el) => ({
          x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3" }),
          y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3" }),
        }));
        const dragging = new Set<Element>();

        const onMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          els.forEach((el, i) => {
            if (dragging.has(el)) return;
            movers[i].x(nx * STICKERS[i].depth * 2);
            movers[i].y(ny * STICKERS[i].depth * 2);
          });
        };
        window.addEventListener("pointermove", onMove, { passive: true });

        const handles = els.map((el) => el.querySelector<HTMLElement>("[data-sticker-drag]")!);
        const drags = Draggable.create(handles, {
          type: "x,y",
          inertia: true,
          bounds: root.current,
          edgeResistance: 0.6,
          onPress() {
            dragging.add(this.target.parentElement);
            gsap.set(this.target, { zIndex: 2 });
            gsap.to(this.target, { scale: 1.15, duration: 0.2, ease: "snap", overwrite: "auto" });
          },
          onRelease() {
            dragging.delete(this.target.parentElement);
            gsap.to(this.target, { scale: 1, duration: 0.4, ease: "back.out(3)" });
          },
          onClick() {
            // Spin lives on the drag layer so it never fights the idle float
            gsap.to(this.target, { rotate: "+=360", duration: 0.7, ease: "back.out(1.4)" });
          },
        });

        return () => {
          window.removeEventListener("pointermove", onMove);
          drags.forEach((d) => d.kill());
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} aria-hidden="true" className={`pointer-events-none ${className}`}>
      {STICKERS.map((s, i) => (
        <div
          key={i}
          data-sticker
          className={`absolute left-[var(--mx)] top-[var(--my)] lg:left-[var(--x)] lg:top-[var(--y)] ${s.mobile ? "" : "hidden lg:block"}`}
          style={
            {
              "--x": `${s.x}%`,
              "--y": `${s.y}%`,
              "--mx": `${s.mobile?.x ?? s.x}%`,
              "--my": `${s.mobile?.y ?? s.y}%`,
            } as CSSProperties
          }
        >
          {/* parallax (outer) > drag + spin > burst + float */}
          <div data-sticker-drag className="relative lg:pointer-events-auto lg:cursor-grab lg:active:cursor-grabbing">
            <div
              data-sticker-inner
              className={`grid place-items-center shadow-[5px_5px_0_0_rgb(4_23_14/0.55)] ${s.tone}`}
              style={{ width: s.size, height: s.size }}
            >
              <BrandIcon name={s.icon} size={Math.round(s.size * 0.42)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
