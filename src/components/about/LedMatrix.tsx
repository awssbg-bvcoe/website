"use client";

import { useEffect, useRef } from "react";

// 5x7 pixel font, rows top to bottom
const GLYPHS: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  N: ["10001", "10001", "11001", "10101", "10011", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  " ": ["000", "000", "000", "000", "000", "000", "000"],
};

const MESSAGE = "LEARN + BUILD + DEPLOY + SCALE + HANDS-ON CLOUD AND AI + OPEN TO EVERY BRANCH + ";
const ROWS = 9; // 7 glyph rows + 1 padding top and bottom
const CELL = 12;
const STEP_MS = 70;

/** Column bitmap of the whole message (1 = lit). */
function buildColumns() {
  const cols: number[][] = [];
  for (const ch of MESSAGE) {
    const g = GLYPHS[ch] ?? GLYPHS[" "];
    for (let x = 0; x < g[0].length; x++) cols.push(g.map((row) => Number(row[x])));
    cols.push([0, 0, 0, 0, 0, 0, 0]); // letter spacing
  }
  return cols;
}

/**
 * LED pixel-matrix ticker in the brand palette. Words scroll left one column
 * at a time; moving the pointer over it paints pixels that fade out in steps.
 * Static first frame under reduced motion; pauses off screen.
 */
export function LedMatrix({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const message = buildColumns();

    let cols = 0;
    let offset = 0;
    let paint = new Float32Array(0);
    let raf = 0;
    let last = 0;
    let visible = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(ROWS * CELL * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.floor(w / CELL);
      paint = new Float32Array(cols * ROWS);
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.clientWidth, ROWS * CELL);
      for (let c = 0; c < cols; c++) {
        const col = message[(c + offset) % message.length];
        for (let r = 0; r < ROWS; r++) {
          const lit = r > 0 && r < 8 ? col[r - 1] : 0;
          const p = paint[r * cols + c];
          if (p > 0) {
            ctx.fillStyle = "#ff9900";
            ctx.globalAlpha = Math.ceil(p * 3) / 3;
          } else if (lit) {
            ctx.fillStyle = "#00e582";
            ctx.globalAlpha = 1;
          } else {
            ctx.fillStyle = "#a9b4c0";
            ctx.globalAlpha = 0.08;
          }
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        }
      }
      ctx.globalAlpha = 1;
    };

    const frame = (t: number) => {
      raf = 0;
      if (t - last >= STEP_MS) {
        last = t;
        offset = (offset + 1) % message.length;
        for (let i = 0; i < paint.length; i++) if (paint[i] > 0) paint[i] = Math.max(0, paint[i] - 0.06);
        draw();
      }
      if (visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const c = Math.floor((e.clientX - r.left) / CELL);
      const row = Math.floor(((e.clientY - r.top) / r.height) * ROWS);
      for (let dc = -1; dc <= 1; dc++)
        for (let dr = -1; dr <= 1; dr++) {
          const cc = c + dc;
          const rr = row + dr;
          if (cc >= 0 && cc < cols && rr >= 0 && rr < ROWS) paint[rr * cols + cc] = 1;
        }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    if (reduce) return () => ro.disconnect();

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);
    canvas.addEventListener("pointermove", onMove);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`block w-full touch-none ${className}`}
      style={{ height: ROWS * CELL }}
    />
  );
}
