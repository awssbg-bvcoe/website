"use client";

import { useEffect, useRef } from "react";

const CELL = 28;
const PALETTE = [
  { color: "#00e582", weight: 0.58 },
  { color: "#ad5cff", weight: 0.14 },
  { color: "#ff9900", weight: 0.1 },
  { color: "#42b4ff", weight: 0.12 },
  { color: "#ff57e9", weight: 0.06 },
];

type Drop = { col: number; row: number; speed: number; len: number; color: string };

function pickColor() {
  let r = Math.random();
  for (const p of PALETTE) {
    if ((r -= p.weight) <= 0) return p.color;
  }
  return PALETTE[0].color;
}

/**
 * Stepped "pixel rain" behind the hero: brand-coloured blocks fall a whole
 * cell at a time and leave quantised trails. The pointer scans a box of cells
 * and turns nearby drops white. Pauses off screen and in background tabs.
 */
export function PixelRain({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cols = 0;
    let rows = 0;
    let drops: Drop[] = [];
    let raf = 0;
    let last = 0;
    let visible = true;
    const pointer = { c: -99, r: -99 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / CELL);
      rows = Math.ceil(h / CELL);
      drops = drops.filter((d) => d.col < cols);
    };

    const spawn = (row = -Math.random() * rows * 0.5): Drop => ({
      col: Math.floor(Math.random() * cols),
      row,
      speed: 4 + Math.random() * 14,
      len: 3 + Math.floor(Math.random() * 9),
      color: pickColor(),
    });

    const frame = (t: number) => {
      raf = 0;
      const dt = Math.min((t - (last || t)) / 1000, 0.05);
      last = t;
      const { clientWidth: w, clientHeight: h } = canvas;
      ctx.clearRect(0, 0, w, h);

      const target = Math.floor(cols * 0.55);
      while (drops.length < target) drops.push(spawn(drops.length < target / 2 ? Math.random() * rows : undefined));

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.row += d.speed * dt;
        const head = Math.floor(d.row);
        if (head - d.len > rows) {
          drops[i] = spawn();
          continue;
        }
        const near = Math.abs(d.col - pointer.c) <= 3 && Math.abs(head - pointer.r) <= 3;
        for (let k = 0; k < d.len; k++) {
          const r = head - k;
          if (r < 0 || r >= rows) continue;
          // Alpha drops in hard steps down the trail
          ctx.globalAlpha = k === 0 ? 0.9 : Math.max(0.08, Math.round((1 - k / d.len) * 4) / 4) * 0.55;
          ctx.fillStyle = k === 0 && near ? "#f2f4f5" : d.color;
          ctx.fillRect(d.col * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        }
      }

      // Pointer scan box
      if (pointer.c >= 0) {
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = "#00e582";
        ctx.lineWidth = 2;
        ctx.strokeRect((pointer.c - 3) * CELL + 1, (pointer.r - 3) * CELL + 1, CELL * 7 - 2, CELL * 7 - 2);
        ctx.fillStyle = "#00e582";
        ctx.globalAlpha = 0.35;
        ctx.fillRect(pointer.c * CELL + 1, pointer.r * CELL + 1, CELL - 2, CELL - 2);
      }
      ctx.globalAlpha = 1;

      if (visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!raf && visible && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) {
        pointer.c = pointer.r = -99;
        return;
      }
      pointer.c = Math.floor(x / CELL);
      pointer.r = Math.floor(y / CELL);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    const ro = new ResizeObserver(resize);
    const onVis = () => start();

    resize();
    io.observe(canvas);
    ro.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    start();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
