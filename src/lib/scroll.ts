import { gsap } from "@/lib/gsap";

/** Gentle ease-in-out (cubic): starts soft, glides, settles. */
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Longer jumps take longer, within limits, so nothing ever whips past the eye. */
export const durationFor = (distance: number) => gsap.utils.clamp(1.1, 2.4, 0.9 + Math.abs(distance) / 3200);

/** Scroll the page to `y`: Lenis glide when it is running, a native jump otherwise (reduced motion or no Lenis). */
export function scrollTarget(y: number, instant = false) {
  const lenis = window.__lenis;
  if (lenis && !instant) {
    lenis.scrollTo(y, { duration: gsap.utils.clamp(0.5, 1.1, Math.abs(y - window.scrollY) / 1600), easing: easeInOutCubic });
  } else {
    window.scrollTo({ top: y, behavior: "auto" });
  }
}
