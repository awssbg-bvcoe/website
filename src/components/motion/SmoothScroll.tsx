"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { gsap, reducedMotion, ScrollTrigger, whenIntroDone } from "@/lib/gsap";
import { durationFor, easeInOutCubic } from "@/lib/scroll";

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
      // In-page links are handled below with distance-based, eased scrolling
      anchors: false,
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

    // Every same-page "#section" link (nav, hero, join) glides instead of jumping
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link) return;
      const hash = link.getAttribute("href")!;
      const target = hash === "#" || hash === "#top" ? document.body : document.querySelector<HTMLElement>(hash);
      if (!target) return;
      e.preventDefault();

      const y = target === document.body ? 0 : target.getBoundingClientRect().top + window.scrollY;
      lenis.scrollTo(target === document.body ? 0 : target, {
        duration: durationFor(y - window.scrollY),
        easing: easeInOutCubic,
        onComplete: () => {
          // Move keyboard focus to the section without another jump
          if (target !== document.body) {
            if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
            target.focus({ preventScroll: true });
          }
        },
      });
      history.pushState(null, "", hash === "#" ? location.pathname : hash);
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      release();
      gsap.ticker.remove(tick);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return null;
}
