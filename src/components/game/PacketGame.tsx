"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const COLS = 21;
const ROWS = 13;
const START_SPEED = 130; // ms per step
const MIN_SPEED = 60;

type Pt = { x: number; y: number };
type Dir = "up" | "down" | "left" | "right";
type Phase = "ready" | "playing" | "over";

const VEC: Record<Dir, Pt> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };
const KEYS: Record<string, Dir> = {
  ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
};

// Program icon cells (9x9) drawn as the pickup, scaled into one game cell
const CHIP: [number, number][] = [];
for (let i = 2; i <= 6; i++) CHIP.push([i, 1], [i, 7], [1, i], [7, i]);
for (const i of [2, 4, 6]) CHIP.push([i, 0], [i, 8], [0, i], [8, i]);

const BEST_EVENT = "sbg-packet-best";

function subscribeBest(cb: () => void) {
  window.addEventListener(BEST_EVENT, cb);
  return () => window.removeEventListener(BEST_EVENT, cb);
}

function readBest() {
  try {
    return Number(localStorage.getItem("sbg-packet-best") ?? 0) || 0;
  } catch {
    return 0;
  }
}

/**
 * "Packet run": steer a data packet around the grid and collect chips.
 * Every chip deploys one more block. Hit a wall or yourself and the build fails.
 */
export function PacketGame() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const best = useSyncExternalStore(subscribeBest, readBest, () => 0);

  const state = useRef({
    snake: [] as Pt[],
    dir: "right" as Dir,
    queue: [] as Dir[],
    food: { x: 0, y: 0 } as Pt,
    speed: START_SPEED,
    acc: 0,
    last: 0,
    raf: 0,
    phase: "ready" as Phase,
    score: 0,
  });

  const loopRef = useRef<(t: number) => void>(() => {});


  const placeFood = useCallback(() => {
    const s = state.current;
    const free: Pt[] = [];
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) if (!s.snake.some((p) => p.x === x && p.y === y)) free.push({ x, y });
    if (free.length === 0) return false;
    s.food = free[Math.floor(Math.random() * free.length)];
    return true;
  }, []);

  const draw = useCallback(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const cell = c.width / COLS;
    const s = state.current;

    ctx.fillStyle = "#161d26";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "rgba(169,180,192,0.12)";
    ctx.lineWidth = 1;
    for (let x = 1; x < COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(Math.round(x * cell) + 0.5, 0);
      ctx.lineTo(Math.round(x * cell) + 0.5, c.height);
      ctx.stroke();
    }
    for (let y = 1; y < ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, Math.round(y * cell) + 0.5);
      ctx.lineTo(c.width, Math.round(y * cell) + 0.5);
      ctx.stroke();
    }

    // Chip pickup
    const u = cell / 11;
    ctx.fillStyle = "#ff9900";
    for (const [cx, cy] of CHIP) ctx.fillRect(s.food.x * cell + u + cx * u, s.food.y * cell + u + cy * u, u, u);

    // Packet trail
    s.snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? "#f2f4f5" : "#00e582";
      const inset = i === 0 ? 1 : 2;
      ctx.fillRect(p.x * cell + inset, p.y * cell + inset, cell - inset * 2, cell - inset * 2);
    });
  }, []);

  const reset = useCallback(() => {
    const s = state.current;
    const mid = Math.floor(ROWS / 2);
    s.snake = [{ x: 5, y: mid }, { x: 4, y: mid }, { x: 3, y: mid }];
    s.dir = "right";
    s.queue = [];
    s.speed = START_SPEED;
    s.acc = 0;
    s.score = 0;
    setScore(0);
    placeFood();
    draw();
  }, [draw, placeFood]);

  const end = useCallback(() => {
    const s = state.current;
    s.phase = "over";
    setPhase("over");
    cancelAnimationFrame(s.raf);
    if (s.score > readBest()) {
      try {
        localStorage.setItem("sbg-packet-best", String(s.score));
      } catch {}
      window.dispatchEvent(new Event(BEST_EVENT));
    }
  }, []);

  const step = useCallback(() => {
    const s = state.current;
    const nextDir = s.queue.shift();
    if (nextDir && nextDir !== OPPOSITE[s.dir]) s.dir = nextDir;
    const v = VEC[s.dir];
    const head = { x: s.snake[0].x + v.x, y: s.snake[0].y + v.y };
    const ate = head.x === s.food.x && head.y === s.food.y;
    const body = ate ? s.snake : s.snake.slice(0, -1);
    if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS || body.some((p) => p.x === head.x && p.y === head.y)) {
      end();
      return;
    }
    s.snake = [head, ...body];
    if (ate) {
      s.score += 1;
      setScore(s.score);
      s.speed = Math.max(MIN_SPEED, s.speed - 4);
      // A full board ends the run
      if (!placeFood()) end();
    }
  }, [end, placeFood]);

  const loop = useCallback(
    (t: number) => {
      const s = state.current;
      if (s.phase !== "playing") return;
      if (!s.last) s.last = t;
      // Clamp so a backgrounded tab doesn't replay hundreds of steps at once
      s.acc += Math.min(t - s.last, 100);
      s.last = t;
      while (s.acc >= s.speed && s.phase === "playing") {
        s.acc -= s.speed;
        step();
      }
      draw();
      if (s.phase === "playing") s.raf = requestAnimationFrame((next) => loopRef.current(next));
    },
    [draw, step],
  );
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  const start = useCallback(() => {
    const s = state.current;
    reset();
    s.phase = "playing";
    s.last = 0;
    setPhase("playing");
    cancelAnimationFrame(s.raf);
    s.raf = requestAnimationFrame(loop);
    // The start button unmounts; keep focus on the game for keyboard play
    board.current?.focus({ preventScroll: true });
  }, [loop, reset]);

  const turn = useCallback((d: Dir) => {
    const s = state.current;
    if (s.phase !== "playing") return;
    const lastQueued = s.queue[s.queue.length - 1] ?? s.dir;
    if (d !== lastQueued && d !== OPPOSITE[lastQueued] && s.queue.length < 3) s.queue.push(d);
  }, []);

  // Size the canvas to its box at device resolution
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const fit = () => {
      const w = c.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cell = Math.floor((w * dpr) / COLS);
      c.width = cell * COLS;
      c.height = cell * ROWS;
      draw();
    };
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    const s = state.current;
    reset();
    fit();
    return () => {
      ro.disconnect();
      cancelAnimationFrame(s.raf);
    };
  }, [draw, reset]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Only steer when focus is on the game itself or nowhere in particular,
      // so links and buttons keep their normal keyboard behaviour
      const target = e.target as HTMLElement | null;
      const inGame = !!target && !!board.current?.contains(target);
      if (!inGame && target !== document.body) return;
      const d = KEYS[e.code];
      if (d) {
        e.preventDefault();
        if (state.current.phase !== "playing") start();
        turn(d);
        return;
      }
      if ((e.code === "Space" || e.code === "Enter") && state.current.phase !== "playing") {
        e.preventDefault();
        start();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [start, turn]);

  // Swipe controls
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    let origin: Pt | null = null;
    const down = (e: PointerEvent) => {
      origin = { x: e.clientX, y: e.clientY };
      if (state.current.phase !== "playing") start();
    };
    const up = (e: PointerEvent) => {
      if (!origin) return;
      const dx = e.clientX - origin.x;
      const dy = e.clientY - origin.y;
      origin = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
    };
    c.addEventListener("pointerdown", down);
    c.addEventListener("pointerup", up);
    return () => {
      c.removeEventListener("pointerdown", down);
      c.removeEventListener("pointerup", up);
    };
  }, [start, turn]);

  const pad = (d: Dir, label: string, area: string) => (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        // Touch: act on press for lower latency
        e.preventDefault();
        if (state.current.phase !== "playing") start();
        turn(d);
      }}
      onClick={(e) => {
        // Keyboard and assistive tech activation (pointer presses report detail > 0)
        if (e.detail !== 0) return;
        if (state.current.phase !== "playing") start();
        turn(d);
      }}
      className={`pressable grid size-14 place-items-center bg-grey-800 font-mono text-xl text-mint outline outline-1 outline-grey-700 active:bg-grey-700 ${area}`}
    >
      <span aria-hidden="true">{{ up: "↑", down: "↓", left: "←", right: "→" }[d]}</span>
    </button>
  );

  return (
    <div className="w-full">
      <div className="mb-3 flex items-end justify-between font-mono text-sm">
        <p>
          Deployed <span className="text-mint tabular-nums">{String(score).padStart(3, "0")}</span>
        </p>
        <p className="text-grey-300">
          Best <span className="tabular-nums">{String(best).padStart(3, "0")}</span>
        </p>
      </div>
      <div
        ref={board}
        tabIndex={0}
        role="application"
        aria-label="Packet run game. Use arrow keys or WASD to steer."
        aria-describedby="packet-status"
        className="relative focus-visible:outline-offset-4"
      >
        <canvas
          ref={canvas}
          className="block aspect-[21/13] w-full touch-none outline outline-1 outline-grey-700"
          aria-hidden="true"
        />
        <p id="packet-status" className="sr-only" role="status">
          {phase === "over" ? `Build failed. You deployed ${score}.` : phase === "playing" ? "Game running." : "Ready."}
        </p>
        {phase !== "playing" && (
          <div className="absolute inset-0 grid place-items-center bg-grey-850/80 p-6 text-center">
            <div>
              <p className="font-mono text-2xl font-bold sm:text-3xl">{phase === "over" ? "Build failed." : "Packet run"}</p>
              <p className="mx-auto mt-3 max-w-[34ch] text-grey-300">
                {phase === "over"
                  ? `You deployed ${score} ${score === 1 ? "chip" : "chips"}. Try again?`
                  : "Collect chips, avoid the walls and your own trail. Arrow keys, WASD or swipe."}
              </p>
              <button
                type="button"
                onClick={start}
                className="pressable mt-6 inline-flex h-12 items-center bg-mint px-6 font-bold text-mint-ink uppercase hover:bg-paper"
              >
                {phase === "over" ? "Redeploy" : "Press start"}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="mt-5 grid w-fit grid-cols-3 gap-1 [grid-template-areas:'._up_.'_'left_down_right'] sm:hidden mx-auto">
        {pad("up", "Up", "[grid-area:up]")}
        {pad("left", "Left", "[grid-area:left]")}
        {pad("down", "Down", "[grid-area:down]")}
        {pad("right", "Right", "[grid-area:right]")}
      </div>
    </div>
  );
}
