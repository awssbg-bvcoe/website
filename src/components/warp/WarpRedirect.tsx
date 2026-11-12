"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { Lockup } from "@/components/brand/Lockup";
import { gsap } from "@/lib/gsap";

const DURATION = 5000; // ms until the redirect
const FLASH = 450; // ms of the closing mint flash, inside DURATION
const BLOCKS = 40;

// Mint is the one accent (brand rule); paper for depth; other kit colours only as rare sparks
const STAR_COLOURS = ["#00e582", "#00e582", "#00e582", "#00e582", "#f2f4f5", "#f2f4f5", "#f2f4f5", "#5b6878", "#5b6878"];
const SPARKS = ["#ad5cff", "#42b4ff", "#ff57e9", "#ff9900"];

type Star = { x: number; y: number; z: number; c: string; w: number };
type Ring = { z: number };

/**
 * Five-second pixel hyperspace jump, then `location.replace` to the destination.
 * Canvas: square star streaks and a twisting tunnel of square rings that speed up on a cubic
 * curve, split into magenta/blue at high speed and shake near the end. HUD: a giant digit that
 * fills with mint as each second passes, warp factor, 40-block bar, Jump now and Hold.
 */
export function WarpRedirect({
  url,
  host,
  name,
  icon,
  slug,
  preview = false,
}: {
  url: string;
  host: string;
  name: string | null;
  icon: string;
  slug: string;
  /** Admin preview: play the whole warp, never redirect, offer Replay */
  preview?: boolean;
}) {
  const label = name ?? host;
  // Destination icon; falls back to a pixel monogram when the site has none or it fails to load
  const iconRef = useRef<HTMLImageElement>(null);
  const [iconOk, setIconOk] = useState(true);
  useEffect(() => {
    // An image that failed before hydration never fires onError on the client
    const img = iconRef.current;
    if (img && img.complete && img.naturalWidth === 0) setIconOk(false);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const numWrap = useRef<HTMLSpanElement>(null);
  const numText = useRef<HTMLSpanElement>(null);
  const factorRef = useRef<HTMLSpanElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const shakeRef = useRef<HTMLDivElement>(null);

  // Clock: elapsed time survives Hold/Resume
  const clock = useRef({ banked: 0, since: 0, running: true, done: false, flashing: false });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [held, setHeld] = useState(false);
  const [arrived, setArrived] = useState(false);

  const elapsed = () => {
    const c = clock.current;
    return Math.min(DURATION, c.banked + (c.running ? performance.now() - c.since : 0));
  };

  const go = useCallback(() => {
    const c = clock.current;
    if (c.done) return;
    c.done = true;
    if (!preview) {
      window.location.replace(url);
      return;
    }
    // Preview: stop at the end, then pull the flash back so the admin can look again
    c.banked = DURATION;
    c.running = false;
    setArrived(true);
    if (flashRef.current) gsap.to(flashRef.current, { clipPath: "inset(50% 50% 50% 50%)", duration: 0.35, ease: "steps(5)", delay: 0.8 });
  }, [url, preview]);


  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(go, Math.max(0, DURATION - elapsed()));
  }, [go]);

  const replay = useCallback(() => {
    const c = clock.current;
    Object.assign(c, { banked: 0, since: performance.now(), running: true, done: false, flashing: false });
    if (flashRef.current) gsap.set(flashRef.current, { clipPath: "inset(50% 50% 50% 50%)" });
    setArrived(false);
    setHeld(false);
    schedule();
  }, [schedule]);

  const hold = useCallback(() => {
    const c = clock.current;
    if (!c.running || c.flashing || c.done) return;
    c.banked = elapsed();
    c.running = false;
    if (timer.current) clearTimeout(timer.current);
    setHeld(true);
  }, []);

  const resume = useCallback(() => {
    const c = clock.current;
    if (c.running || c.done) return;
    c.since = performance.now();
    c.running = true;
    schedule();
    setHeld(false);
  }, [schedule]);

  // Start the clock, Escape holds, and coming back via the back/forward cache never re-fires the jump
  useEffect(() => {
    const c = clock.current;
    c.since = performance.now();
    schedule();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && hold();
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      c.done = false;
      c.flashing = false;
      c.banked = DURATION - FLASH - 1;
      c.running = false;
      if (flashRef.current) gsap.set(flashRef.current, { clipPath: "inset(50% 50% 50% 50%)" });
      setHeld(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pageshow", onShow);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pageshow", onShow);
    };
  }, [schedule, hold]);

  // Visuals
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 767px)").matches;

    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#161d26";
      ctx.fillRect(0, 0, w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const spawnStar = (s: Partial<Star> = {}): Star => {
      const a = Math.random() * Math.PI * 2;
      const r = rand(0.08, 1.2);
      return { x: Math.cos(a) * r, y: Math.sin(a) * r, z: rand(0.15, 1), c: Math.random() < 0.04 ? SPARKS[(Math.random() * SPARKS.length) | 0] : STAR_COLOURS[(Math.random() * STAR_COLOURS.length) | 0], w: Math.random() < 0.12 ? 2 : 1, ...s };
    };
    const stars: Star[] = Array.from({ length: small ? 200 : 420 }, () => spawnStar());
    const RINGS = small ? 7 : 9;
    const rings: Ring[] = Array.from({ length: RINGS }, (_, i) => ({ z: 0.12 + (i / RINGS) * 1.6 }));

    let speed = 0.25;
    let rot = 0;
    let lastDigit = -1;
    let lastBlocks = -1;
    const STEP = Math.PI / 24; // rotation snaps to 7.5deg steps: pixel feel
    const snap = (v: number, g: number) => Math.round(v / g) * g;
    const blocks = barRef.current ? Array.from(barRef.current.children) as HTMLElement[] : [];

    const punch = (digit: number) => {
      const el = numText.current, wrap = numWrap.current;
      if (!el || !wrap) return;
      const text = String(digit);
      if (reduce) {
        el.textContent = text;
        return;
      }
      // Two glitch frames of random digits, then the real one lands with a kick
      let n = 0;
      const glitch = () => {
        if (n < 2) {
          el.textContent = String((Math.random() * 10) | 0);
          n++;
          gsap.delayedCall(0.05, glitch);
        } else el.textContent = text;
      };
      glitch();
      gsap.fromTo(wrap, { scale: 1.25, rotation: rand(-6, 6) }, { scale: 1, rotation: 0, duration: 0.45, ease: "back.out(2.6)", overwrite: true });
    };

    const draw = (dt: number) => {
      const c = clock.current;
      const t = elapsed();
      const p = t / DURATION;

      // Target speed: cubic ramp while running, idle drift while held
      const target = c.running ? 0.25 + 14 * p * p * p : 0.12;
      speed += (target - speed) * Math.min(1, dt * (c.running ? 8 : 3));

      const cx = w / 2, cy = h / 2;
      const f = Math.min(w, h) * 0.55;
      const fast = Math.min(1, speed / 8);

      // Persistence: longer streaks as speed rises
      ctx.fillStyle = `rgba(22,29,38,${0.55 - 0.33 * fast})`;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      // Shake in the last 1.5s
      if (c.running && p > 0.7) {
        const k = (p - 0.7) * 16;
        ctx.translate(snap(rand(-k, k), 2), snap(rand(-k, k), 2));
      }

      // Tunnel of square rings, twisting more the faster it goes
      rot += speed * dt * 0.22;
      for (const ring of rings) {
        ring.z -= speed * dt * 0.16;
        if (ring.z <= 0.06) ring.z += 1.6;
        const half = (f * 0.42) / ring.z;
        if (half > Math.max(w, h) * 1.6) continue;
        const a = snap(rot + ring.z * 1.1, STEP);
        // Far rings fade out; the whole tunnel brightens with speed but stays behind the HUD
        const alpha = Math.min(1, (1.7 - ring.z) / 1.3) * (0.18 + 0.32 * fast);
        const lw = Math.min(6, 1 + 1.2 / ring.z);
        const drawRing = (dx: number, colour: string, al: number) => {
          ctx.save();
          ctx.translate(cx + dx, cy);
          ctx.rotate(a);
          ctx.globalAlpha = al;
          ctx.strokeStyle = colour;
          ctx.lineWidth = lw;
          ctx.strokeRect(-half, -half, half * 2, half * 2);
          ctx.restore();
        };
        // A slight chromatic split only in the final stretch
        if (p > 0.75 && c.running) {
          const off = (p - 0.75) * 24;
          drawRing(-off, "#ff57e9", alpha * 0.35);
          drawRing(off, "#42b4ff", alpha * 0.35);
        }
        drawRing(0, "#00e582", alpha);
      }
      ctx.globalAlpha = 1;

      // Star streaks, snapped to a 2px grid with square caps
      ctx.lineCap = "square";
      const trail = 0.02 + 0.1 * fast;
      for (const s of stars) {
        const z0 = s.z;
        s.z -= speed * dt * 0.35;
        if (s.z <= 0.01) {
          Object.assign(s, spawnStar({ z: 1 }));
          continue;
        }
        const x1 = cx + (s.x / s.z) * f, y1 = cy + (s.y / s.z) * f;
        if (x1 < -50 || x1 > w + 50 || y1 < -50 || y1 > h + 50) {
          Object.assign(s, spawnStar({ z: 1 }));
          continue;
        }
        const zt = Math.min(1.2, z0 + trail);
        const x0 = cx + (s.x / zt) * f, y0 = cy + (s.y / zt) * f;
        ctx.strokeStyle = s.c;
        ctx.globalAlpha = Math.min(1, (1 - s.z) * 1.6);
        ctx.lineWidth = snap(s.w + (1 - s.z) * 2 * (0.6 + fast), 1) || 1;
        ctx.beginPath();
        ctx.moveTo(snap(x0, 2), snap(y0, 2));
        ctx.lineTo(snap(x1, 2), snap(y1, 2));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // Core glow, growing toward the jump
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, f * (0.25 + p * 0.6));
      g.addColorStop(0, `rgba(0,229,130,${0.06 + 0.22 * p * p})`);
      g.addColorStop(1, "rgba(0,229,130,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // HUD
      const remaining = DURATION - t;
      const digit = Math.max(c.done ? 0 : 1, Math.ceil(remaining / 1000));
      if (digit !== lastDigit) {
        lastDigit = digit;
        punch(digit);
      }
      if (factorRef.current) factorRef.current.textContent = (1 + 8.9 * p * p).toFixed(1);
      if (pctRef.current) pctRef.current.textContent = String(Math.floor(p * 100)).padStart(3, "0");
      const on = Math.floor(p * BLOCKS);
      if (on !== lastBlocks) {
        lastBlocks = on;
        blocks.forEach((b, i) => b.classList.toggle("is-on", i < on));
      }
      if (shakeRef.current && !reduce) {
        const k = c.running && p > 0.8 ? (p - 0.8) * 10 : 0;
        shakeRef.current.style.transform = k ? `translate(${snap(rand(-k, k), 1)}px, ${snap(rand(-k, k), 1)}px)` : "";
      }

      // Closing flash: a mint square opens from the centre in hard steps
      if (!reduce && c.running && !c.flashing && remaining <= FLASH && flashRef.current) {
        c.flashing = true;
        gsap.fromTo(flashRef.current, { clipPath: "inset(50% 50% 50% 50%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: FLASH / 1000, ease: "steps(7)" });
      }
    };

    let last = performance.now();
    if (reduce) {
      // One still frame of the tunnel; the HUD still counts down
      speed = 0.25;
      draw(0.016);
      const id = setInterval(() => draw(0), 200);
      return () => {
        clearInterval(id);
        window.removeEventListener("resize", resize);
      };
    }
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(dt);
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const short = `/${slug}`;

  return (
    <main id="main" className="relative isolate min-h-[100dvh] overflow-hidden bg-grey-850 text-paper">
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full" />

      {/* Pixel corner brackets */}
      {(["top-2 left-2 sm:top-3 sm:left-3", "top-2 right-2 rotate-90 sm:top-3 sm:right-3", "bottom-2 right-2 rotate-180 sm:right-3 sm:bottom-3", "bottom-2 left-2 -rotate-90 sm:bottom-3 sm:left-3"] as const).map((pos) => (
        <span key={pos} aria-hidden="true" className={`pointer-events-none absolute size-5 sm:size-8 ${pos}`}>
          <span className="absolute top-0 left-0 h-1.5 w-full bg-mint" />
          <span className="absolute top-0 left-0 h-full w-1.5 bg-mint" />
        </span>
      ))}

      <div ref={shakeRef} className="relative flex min-h-[100dvh] flex-col px-8 pt-7 pb-11 sm:px-14 sm:py-10 [@media(max-height:700px)]:pt-5 [@media(max-height:700px)]:pb-9">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4">
          <Lockup compact textClassName="max-sm:sr-only" awsClassName="max-sm:hidden" />
          <p className="font-mono text-xs font-bold tracking-wide text-grey-300 uppercase sm:text-sm">
            Warp <span ref={factorRef} className="inline-block w-[3ch] text-right text-mint">1.0</span>
          </p>
        </header>

        {/* Countdown: solid digit with the brand's hard offset shadow */}
        <div className="flex flex-1 items-center justify-center py-4 [@media(max-height:700px)]:py-2">
          <span
            ref={numWrap}
            aria-hidden="true"
            className="block font-mono text-[clamp(6rem,min(40vw,30dvh),17rem)] leading-[0.8] font-bold text-paper [text-shadow:0.06em_0.06em_0_var(--mint)]"
          >
            <span ref={numText}>5</span>
          </span>
        </div>

        {/* The warp pass */}
        <section
          aria-label="Destination"
          className="mx-auto w-full max-w-xl bg-grey-850 text-paper shadow-[6px_6px_0_0_var(--mint)] outline outline-1 outline-grey-700 sm:shadow-[8px_8px_0_0_var(--mint)]"
        >
          <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-7 sm:pt-6">
            <span className="flex items-center gap-2 font-mono text-xs font-bold tracking-wide text-grey-300 uppercase">
              <BrandIcon name="chip" size={14} className="text-mint" />
              Warp pass
              {preview && <span className="text-amber">Preview</span>}
            </span>
            <span
              className={`px-2 py-1 font-mono text-[0.7rem] font-bold tracking-wide uppercase ${held || arrived ? "bg-amber text-grey-850" : "bg-mint text-mint-ink"}`}
            >
              {arrived ? "Arrived" : held ? "On hold" : "In transit"}
            </span>
          </div>

          <dl className="grid grid-cols-[3.25rem_1fr] items-baseline gap-x-3 gap-y-2 px-5 pt-5 sm:grid-cols-[4rem_1fr] sm:px-7 [@media(max-height:700px)]:pt-3">
            <dt className="font-mono text-xs text-grey-300 uppercase">From</dt>
            <dd className="font-mono text-sm text-grey-300">{short}</dd>
            <dt className="self-center font-mono text-xs text-grey-300 uppercase">To</dt>
            <dd className="flex min-w-0 items-center gap-3 sm:gap-4">
              <DestinationIcon src={icon} ok={iconOk} onFail={() => setIconOk(false)} imgRef={iconRef} letter={label} />
              <span className="min-w-0">
                <span className="block font-mono text-[clamp(1.35rem,5.5vw,2.1rem)] leading-tight font-bold tracking-tight break-words">{label}</span>
                <span className="mt-1 block truncate font-mono text-xs text-grey-300" title={url}>
                  {name ? host : url}
                </span>
              </span>
            </dd>
          </dl>

          {/* Perforation */}
          <div aria-hidden="true" className="mx-5 mt-5 border-t-2 border-dashed border-grey-700 sm:mx-7 [@media(max-height:700px)]:mt-3" />

          <div className="px-5 pt-4 pb-5 sm:px-7 sm:pb-6">
            <div className="flex items-center gap-3">
              <div ref={barRef} aria-hidden="true" className="warp-bar grid h-3 flex-1 grid-cols-[repeat(40,1fr)] gap-[2px]">
                {Array.from({ length: BLOCKS }, (_, i) => (
                  <span key={i} className="block bg-grey-700" />
                ))}
              </div>
              <span className="w-[4ch] text-right font-mono text-xs font-bold tabular-nums">
                <span ref={pctRef}>000</span>%
              </span>
            </div>

            <div className="mt-5 grid grid-cols-[1fr_auto] gap-3 [@media(max-height:700px)]:mt-3">
              <a
                href={url}
                rel="nofollow"
                onClick={() => (clock.current.done = true)}
                className="pressable flex h-12 items-center justify-center bg-mint px-4 font-bold whitespace-nowrap text-mint-ink uppercase hover:bg-paper sm:px-5"
              >
                Jump now
              </a>
              <button
                type="button"
                onClick={arrived ? replay : held ? resume : hold}
                aria-pressed={arrived ? undefined : held}
                className="pressable flex h-12 min-w-[6.5rem] items-center justify-center px-4 font-bold whitespace-nowrap text-paper uppercase sm:min-w-[7.5rem] sm:px-5 outline outline-1 outline-grey-500 hover:outline-paper"
              >
                {arrived ? "Replay" : held ? "Resume" : "Hold"}
              </button>
            </div>
            <p className="mt-3 text-sm text-grey-300">
              {preview ? "Preview: this page will not redirect. Replay to watch it again." : "Not moving? Tap Jump now."}
            </p>
          </div>
        </section>
      </div>

      <p role="status" className="sr-only">
        {preview
          ? arrived
            ? `Preview finished. A visitor would now be on ${host}. Use Replay to watch it again.`
            : `Previewing the warp to ${host}. It will not redirect.`
          : held
            ? `Redirect to ${host} held. Use Resume or Jump now.`
            : `Redirecting to ${host} in 5 seconds. Press Escape or Hold to stop, or use Jump now.`}
      </p>

      {/* Closing flash */}
      <div ref={flashRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-10 grid place-items-center bg-mint text-mint-ink [clip-path:inset(50%_50%_50%_50%)]">
        {iconOk ? (
          <span className="grid size-28 place-items-center bg-paper p-4 shadow-[8px_8px_0_0_var(--mint-ink)] sm:size-36">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={icon} alt="" className="size-full object-contain [image-rendering:auto]" />
          </span>
        ) : (
          <BrandIcon name="chip" size={96} />
        )}
      </div>

      <style>{`
        .warp-bar > span.is-on { background: var(--mint); }
      `}</style>
    </main>
  );
}

/** Paper tile with the destination's own icon (or its first letter) and a hard mint shadow. */
function DestinationIcon({
  src,
  ok,
  onFail,
  imgRef,
  letter,
}: {
  src: string;
  ok: boolean;
  onFail: () => void;
  imgRef: React.RefObject<HTMLImageElement | null>;
  letter: string;
}) {
  return (
    <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center bg-paper shadow-[4px_4px_0_0_var(--mint)] sm:size-14">
      {ok ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={imgRef} src={src} alt="" width={40} height={40} decoding="async" onError={onFail} className="size-8 object-contain sm:size-9" />
      ) : (
        <span className="font-mono text-2xl font-bold text-grey-850 uppercase">{letter.replace(/[^a-z0-9]/gi, "").charAt(0) || "?"}</span>
      )}
    </span>
  );
}
