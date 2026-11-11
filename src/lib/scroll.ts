import { gsap } from "@/lib/gsap";

/** Gentle ease-in-out (cubic): starts soft, glides, settles. */
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Longer jumps take longer, within limits, so nothing ever whips past the eye. */
export const durationFor = (distance: number) => gsap.utils.clamp(1.1, 2.4, 0.9 + Math.abs(distance) / 3200);
