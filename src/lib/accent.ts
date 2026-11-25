/**
 * Site accent colour. Mint by default; the core team section swaps it for the colour of the member on
 * stage (and the hidden square on the stage can keep it after the section). CSS follows through the
 * `--mint` variable (every `*-mint` utility reads it); canvases and three.js read `getAccent()` per frame.
 */
export const DEFAULT_ACCENT = "#00e582";
export const ACCENT_EVENT = "sbg:accent";

let current = DEFAULT_ACCENT;
let version = 0;

export const getAccent = () => current;
/** Bumps on every change, so frame loops can cheaply check whether to re-read the colour. */
export const accentVersion = () => version;

export function setAccent(hex: string | null) {
  const next = hex ?? DEFAULT_ACCENT;
  if (next === current) return;
  current = next;
  version += 1;
  const root = document.documentElement;
  if (next === DEFAULT_ACCENT) root.style.removeProperty("--mint");
  else root.style.setProperty("--mint", next);
  // Browser chrome / Discord embed colour follows too
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next);
  window.dispatchEvent(new CustomEvent(ACCENT_EVENT, { detail: next }));
}
