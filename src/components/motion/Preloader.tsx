"use client";

import { useRef } from "react";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { gsap, PRELOADER_DONE, SCRAMBLE_CHARS, useGSAP } from "@/lib/gsap";

function setPageInert(on: boolean) {
  document.querySelectorAll<HTMLElement>("body > :not(.preloader):not(script)").forEach((el) => {
    el.inert = on;
  });
}

/** Idempotent: safe to call from the timeline, cleanup and the fallback timer. */
function finishIntro() {
  setPageInert(false);
  if (document.documentElement.dataset.introDone === "1") return;
  document.documentElement.dataset.introDone = "1";
  try {
    sessionStorage.setItem("sbg-seen", "1");
  } catch {}
  window.dispatchEvent(new Event(PRELOADER_DONE));
}

/**
 * First-visit intro: scrambled wordmark, a counter that tracks font loading,
 * then a wipe upward. Hidden by CSS on repeat visits and under reduced motion.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || getComputedStyle(el).display === "none") {
        finishIntro();
        return;
      }

      let alive = true;
      // Keep the page out of the tab order while the overlay covers it
      setPageInert(true);
      // Never leave the page locked if fonts stall or the timeline is killed
      const fallback = window.setTimeout(finishIntro, 5000);
      const counter = { v: 0 };
      const count = el.querySelector<HTMLElement>("[data-count]");
      const fontsReady = document.fonts?.ready ?? Promise.resolve();

      const tl = gsap.timeline({ paused: true });
      tl.from("[data-corner]", { scale: 0.6, opacity: 0, duration: 0.5, stagger: 0.05, ease: "snap" })
        .from("[data-chip]", { scale: 0.85, opacity: 0, duration: 0.6, ease: "snap" }, "<0.1")
        .to(
          "[data-word]",
          {
            duration: 1.1,
            scrambleText: { text: "{original}", chars: SCRAMBLE_CHARS, speed: 0.6, revealDelay: 0.25 },
          },
          "<",
        )
        .to(
          counter,
          {
            v: 100,
            duration: 1.3,
            ease: "natural",
            onUpdate: () => {
              if (count) count.textContent = String(Math.round(counter.v)).padStart(3, "0");
            },
          },
          "<",
        )
        .addLabel("exit")
        .to(el, { clipPath: "inset(0 0 100% 0)", duration: 0.8, ease: "natural" }, "exit+=0.15")
        .add(() => {
          finishIntro();
        }, "exit+=0.45")
        .set(el, { display: "none" });

      fontsReady.then(() => {
        if (alive) tl.play();
      });

      return () => {
        alive = false;
        window.clearTimeout(fallback);
        finishIntro();
      };
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      className="preloader fixed inset-0 grid place-items-center bg-grey-850"
      style={{ zIndex: "var(--z-preloader)", clipPath: "inset(0 0 0 0)" }}
      aria-hidden="true"
    >
      <div className="relative grid aspect-square w-[min(68vw,22rem)] place-items-center">
        {(["top-0 left-0", "top-0 right-0 rotate-90", "bottom-0 right-0 rotate-180", "bottom-0 left-0 -rotate-90"] as const).map(
          (pos) => (
            <span key={pos} data-corner className={`absolute ${pos} block size-6`}>
              <span className="absolute top-0 left-0 h-2 w-6 bg-mint" />
              <span className="absolute top-0 left-0 h-6 w-2 bg-mint" />
            </span>
          ),
        )}
        <div className="flex flex-col items-center gap-6 text-center">
          <span data-chip>
            <BrandIcon name="chip" size={72} className="text-mint" />
          </span>
          <p data-word className="font-mono text-sm font-bold tracking-tight text-paper sm:text-base">
            AWS Student Builder Group
          </p>
        </div>
      </div>
      <p className="absolute right-5 bottom-5 font-mono text-sm text-grey-300 tabular-nums sm:right-8 sm:bottom-8">
        <span data-count>000</span>
      </p>
    </div>
  );
}
