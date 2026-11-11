"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { gsap, reducedMotion, ScrollTrigger, whenIntroDone } from "@/lib/gsap";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/** Lenis smooth scroll driven by the GSAP ticker so ScrollTrigger stays in sync. */
export function SmoothScroll() {
  useEffect(() => {
    if (reducedMotion()) return;

    const lenis = new Lenis({
      lerp: 0.1,
      autoRaf: false,
      anchors: { offset: 0 },
      prevent: (node) => node.closest("[data-lenis-prevent]") !== null,
    });
    window.__lenis = lenis;

    // Hold the page still while the intro plays
    lenis.stop();
    const release = whenIntroDone(() => lenis.start());

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      release();
      gsap.ticker.remove(tick);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return null;
}
