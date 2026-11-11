"use client";

import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

let registered = false;

if (typeof window !== "undefined" && !registered) {
  gsap.registerPlugin(
    useGSAP,
    ScrollTrigger,
    SplitText,
    ScrambleTextPlugin,
    CustomEase,
    Draggable,
    InertiaPlugin,
  );
  CustomEase.create("smooth", "0.5,0,0,1");
  CustomEase.create("natural", "0.8,0,0.2,1");
  CustomEase.create("snap", "0.23,1,0.32,1");
  gsap.defaults({ ease: "smooth", duration: 0.8 });
  // Mobile address-bar show/hide resizes the viewport; do not re-layout pins for it
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
}

/** Glyphs used for scramble effects: mono-friendly, matches the pixel brand. */
export const SCRAMBLE_CHARS = "01<>/[]{}#=+*_";

export const PRELOADER_DONE = "sbg:preloader-done";

export function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Resolves once the intro has cleared the screen (or immediately when it never ran). */
export function whenIntroDone(cb: () => void) {
  const root = document.documentElement;
  if (root.dataset.introDone === "1") {
    cb();
    return () => {};
  }
  const handler = () => cb();
  window.addEventListener(PRELOADER_DONE, handler, { once: true });
  return () => window.removeEventListener(PRELOADER_DONE, handler);
}

export { gsap, ScrollTrigger, SplitText, Draggable, useGSAP };
