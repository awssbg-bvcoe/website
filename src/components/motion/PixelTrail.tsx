"use client";

import { useEffect, useRef } from "react";

const CELL = 28;
const DECAY = 0.035;

/**
 * Pixel-staircase cursor trail. Cells under the pointer light up in mint and
 * fade out. `mix-blend-mode: difference` keeps it visible on dark and light
 * panels. Desktop with a fine pointer only; off under reduced motion.
 */
export function PixelTrail() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cols = 0;
    let rows = 0;
    let life = new Float32Array(0);
    let active = 0;
    let raf = 0;
    let last: { x: number; y: number } | null = null;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(window.innerWidth / CELL);
      rows = Math.ceil(window.innerHeight / CELL);
      life = new Float32Array(cols * rows);
    };

    const light = (x: number, y: number) => {
      const c = Math.floor(x / CELL);
      const r = Math.floor(y / CELL);
      if (c < 0 || r < 0 || c >= cols || r >= rows) return;
      const i = r * cols + c;
      if (life[i] < 0.05) active++;
      life[i] = 1;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00e582";
      let alive = 0;
      for (let i = 0; i < life.length; i++) {
        const v = life[i];
        if (v <= 0) continue;
        const next = v - DECAY;
        life[i] = next > 0 ? next : 0;
        if (next <= 0) continue;
        alive++;
        // Step the alpha so the fade reads as pixel-stepped rather than smooth
        ctx.globalAlpha = Math.ceil(next * 4) / 4;
        ctx.fillRect((i % cols) * CELL, Math.floor(i / cols) * CELL, CELL, CELL);
      }
      ctx.globalAlpha = 1;
      active = alive;
      raf = active > 0 ? requestAnimationFrame(draw) : 0;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const p = { x: e.clientX, y: e.clientY };
      // Fill the gap between samples so fast moves leave a staircase, not dots
      if (last) {
        const dx = p.x - last.x;
        const dy = p.y - last.y;
        const steps = Math.ceil(Math.hypot(dx, dy) / (CELL / 2));
        for (let s = 1; s <= steps; s++) light(last.x + (dx * s) / steps, last.y + (dy * s) / steps);
      } else {
        light(p.x, p.y);
      }
      last = p;
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const onLeave = () => {
      last = null;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 hidden h-full w-full mix-blend-difference [@media(hover:hover)_and_(pointer:fine)]:block motion-reduce:hidden"
      style={{ zIndex: "var(--z-trail)" }}
    />
  );
}
