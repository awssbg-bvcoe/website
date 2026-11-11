"use client";

import { useEffect, useRef } from "react";

const COLS = 16;
const ROWS = 11;
const STEP_MS = 150;

/**
 * Conway's Game of Life on a tiny pixel grid, in mint. Reseeds when the
 * pattern dies out or stalls. Pauses off screen; one static frame under
 * reduced motion.
 */
export function LifeGrid({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cells = new Uint8Array(COLS * ROWS);
    let gen = 0;
    let raf = 0;
    let last = 0;
    let visible = true;

    const seed = () => {
      cells = cells.map(() => (Math.random() < 0.32 ? 1 : 0));
      gen = 0;
    };

    const step = () => {
      const next = new Uint8Array(COLS * ROWS);
      let alive = 0;
      let changed = 0;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          let n = 0;
          for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
              if (!dr && !dc) continue;
              // Wrap around the edges
              n += cells[((r + dr + ROWS) % ROWS) * COLS + ((c + dc + COLS) % COLS)];
            }
          const i = r * COLS + c;
          const v = n === 3 || (n === 2 && cells[i]) ? 1 : 0;
          next[i] = v;
          alive += v;
          if (v !== cells[i]) changed++;
        }
      }
      cells = next;
      gen++;
      if (alive < 6 || changed < 2 || gen > 90) seed();
    };

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const size = Math.min(w / COLS, h / ROWS);
      const ox = (w - size * COLS) / 2;
      const oy = (h - size * ROWS) / 2;
      for (let i = 0; i < cells.length; i++) {
        const x = ox + (i % COLS) * size;
        const y = oy + Math.floor(i / COLS) * size;
        ctx.fillStyle = cells[i] ? "#00e582" : "rgba(169,180,192,0.08)";
        ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
      }
    };

    const frame = (t: number) => {
      raf = 0;
      if (t - last >= STEP_MS) {
        last = t;
        step();
        draw();
      }
      if (visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    seed();
    for (let i = 0; i < 8; i++) step();
    draw();
    if (reduce) return;

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={`block h-full w-full ${className}`} />;
}
