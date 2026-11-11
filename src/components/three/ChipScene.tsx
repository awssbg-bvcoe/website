"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

/**
 * Cells of the AWS Student Builder Group program icon on its native 9x9 grid
 * (the kit SVG is 3000 units square, built from 333.33-unit steps).
 */
function chipCells() {
  const cells: [number, number][] = [];
  for (let i = 2; i <= 6; i++) {
    cells.push([i, 1], [i, 7], [1, i], [7, i]);
  }
  for (const i of [2, 4, 6]) {
    cells.push([i, 0], [i, 8], [0, i], [8, i]);
  }
  return cells;
}

const MINT = new THREE.Color("#00e582");
const TILE = new THREE.Color("#2a3542");
const TILE_HOT = new THREE.Color("#3b4a5b");
const PACKET = new THREE.Color("#f2f4f5");

/** `value`: hero scroll progress 0..1. `kick`: timestamp of the last manual rebuild. */
export type SceneProgress = { value: number; kick?: number };

/**
 * Voxel version of the program icon floating over a field of grid tiles.
 * Pointer tilts the chip and lifts nearby tiles; `progress` (0..1, driven by
 * the hero ScrollTrigger) bursts the chip apart as the card fills the screen.
 */
export default function ChipScene({ progress }: { progress: MutableRefObject<SceneProgress> }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      // No WebGL: the card keeps its grid background
      return;
    }
    const baseDpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(Math.min(baseDpr, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 24);

    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(-6, 8, 12);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x42b4ff, 1.2);
    rim.position.set(8, -6, -4);
    scene.add(rim);

    // Chip voxels
    const cells = chipCells();
    const cube = new THREE.BoxGeometry(0.94, 0.94, 0.94);
    const chipMat = new THREE.MeshStandardMaterial({ color: MINT, roughness: 0.45, metalness: 0.05, emissive: MINT, emissiveIntensity: 0.12 });
    const chip = new THREE.InstancedMesh(cube, chipMat, cells.length);
    const chipGroup = new THREE.Group();
    chipGroup.add(chip);
    scene.add(chipGroup);

    const base = cells.map(([c, r]) => new THREE.Vector3(c - 4, 4 - r, 0));
    const scatter = base.map((p) => {
      const dir = p.clone().setZ(0).normalize();
      return new THREE.Vector3(dir.x * (5 + Math.random() * 7), dir.y * (5 + Math.random() * 7), 2 + Math.random() * 5);
    });
    const spin = base.map(() => new THREE.Euler(Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 2 - 1));
    // Per-cube random "pop" (a quick jump towards the camera)
    const popAt = new Float32Array(base.length).fill(-10);
    const PULSE_EVERY = 5.5; // seconds between automatic rebuilds
    const PULSE_LEN = 1.4;

    // Grid tiles behind the chip
    const COLS = 25;
    const ROWS = 17;
    const tileGeo = new THREE.BoxGeometry(0.96, 0.96, 0.2);
    const tileMat = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0 });
    const tiles = new THREE.InstancedMesh(tileGeo, tileMat, COLS * ROWS);
    const tileLift = new Float32Array(COLS * ROWS);
    for (let i = 0; i < COLS * ROWS; i++) tiles.setColorAt(i, TILE);

    // Tiles that light up in the chip pattern at the end of the scroll (right of centre)
    const litDelay = new Float32Array(COLS * ROWS).fill(-1);
    for (const [c, r] of cells) litDelay[(r + 4) * COLS + (c + 13)] = Math.random() * 0.6;
    tiles.position.z = -3;
    scene.add(tiles);

    // Lit chip-pattern tiles in ring order around the chip centre, so a bright "packet" can run around it
    const ring = cells
      .map(([c, r]) => ({ i: (r + 4) * COLS + (c + 13), a: Math.atan2(r - 4, c - 4) }))
      .sort((a, b) => a.a - b.a)
      .map((o) => o.i);
    const ringPos = new Int16Array(COLS * ROWS).fill(-1);
    ring.forEach((tileIndex, k) => (ringPos[tileIndex] = k));
    const chipCentre = { x: 13 + 4 - (COLS - 1) / 2, y: (ROWS - 1) / 2 - (4 + 4) };

    // Particles rising off the lit tiles at the end of the scroll
    const SPARKS = 48;
    const sparkGeo = new THREE.BoxGeometry(0.26, 0.26, 0.26);
    const sparkMat = new THREE.MeshBasicMaterial({ color: MINT });
    const sparks = new THREE.InstancedMesh(sparkGeo, sparkMat, SPARKS);
    sparks.position.z = -3;
    const sparkSeed = Array.from({ length: SPARKS }, () => ({
      tile: ring[Math.floor(Math.random() * ring.length)],
      offset: Math.random(),
      speed: 0.25 + Math.random() * 0.45,
      drift: (Math.random() - 0.5) * 0.8,
    }));
    scene.add(sparks);

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(1, 1, 1);
    const v = new THREE.Vector3();
    const e = new THREE.Euler();
    const tmpColor = new THREE.Color();

    const pointer = new THREE.Vector2(0, 0);
    const pointerWorld = new THREE.Vector3(999, 999, 0);
    const tilt = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 3);

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(plane, pointerWorld);
    };
    const onLeave = () => {
      pointer.set(0, 0);
      pointerWorld.set(999, 999, 0);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      // Keep the chip a similar size across card aspect ratios
      camera.position.z = camera.aspect < 1 ? 24 / camera.aspect : 24;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    });
    io.observe(el);

    const t0 = performance.now();
    let raf = 0;

    // The card is CSS-scaled up to about 2.5x as it fills the screen. Render the buffer at the
    // on-screen size (not the layout size) so the end state stays sharp; cap the pixel count.
    let currentRatio = renderer.getPixelRatio();
    const syncResolution = () => {
      const layoutW = el.clientWidth;
      if (!layoutW) return;
      const shownW = el.getBoundingClientRect().width;
      const scale = Math.max(1, shownW / layoutW);
      const maxRatio = (window.innerWidth * baseDpr) / layoutW; // never more pixels than the screen
      const next = Math.min(Math.min(baseDpr, 1.75) * scale, maxRatio, 4);
      if (Math.abs(next - currentRatio) / currentRatio > 0.08) {
        currentRatio = next;
        renderer.setPixelRatio(next);
        renderer.setSize(el.clientWidth, el.clientHeight, false);
      }
    };

    function frame() {
      raf = 0;
      syncResolution();
      const t = (performance.now() - t0) / 1000;
      const p = THREE.MathUtils.clamp(progress.current.value, 0, 1);
      // Automatic rebuild pulse, or a manual one from a click (kick)
      const kickAge = progress.current.kick ? (performance.now() - progress.current.kick) / 1000 : 99;
      const cycle = t % PULSE_EVERY;
      const phase = kickAge < PULSE_LEN ? kickAge : cycle > PULSE_EVERY - PULSE_LEN ? cycle - (PULSE_EVERY - PULSE_LEN) : -1;
      const pulse = phase >= 0 ? Math.sin((phase / PULSE_LEN) * Math.PI) ** 2 * (kickAge < PULSE_LEN ? 0.75 : 0.45) : 0;
      if (Math.random() < 0.06) popAt[Math.floor(Math.random() * popAt.length)] = t;

      const burst = Math.min(1, THREE.MathUtils.smoothstep(p, 0.3, 0.75) + pulse * (1 - p));
      const shrink = 1 - THREE.MathUtils.smoothstep(p, 0.55, 0.85);
      const reveal = THREE.MathUtils.smoothstep(p, 0.6, 0.95);

      // Springy tilt towards the pointer
      tilt.x += (pointer.y * 0.35 - tilt.x) * 0.06;
      tilt.y += (pointer.x * 0.5 - tilt.y) * 0.06;
      chipGroup.rotation.set(-tilt.x + Math.sin(t * 0.6) * 0.05, tilt.y + Math.sin(t * 0.4) * 0.08 + burst * 0.8, pulse * 0.6);
      chipGroup.scale.setScalar(1 + p * 0.35);

      for (let i = 0; i < base.length; i++) {
        v.copy(base[i]).lerp(scatter[i], burst);
        v.z += Math.sin(t * 1.4 + i * 0.6) * 0.12 * (1 - burst);
        const pop = t - popAt[i];
        if (pop < 0.5) v.z += Math.sin((pop / 0.5) * Math.PI) * 1.4;
        q.setFromEuler(e.set(spin[i].x * burst, spin[i].y * burst, spin[i].z * burst));
        m.compose(v, q, s.setScalar(Math.max(shrink, 0.0001)));
        chip.setMatrixAt(i, m);
      }
      chip.instanceMatrix.needsUpdate = true;

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const i = r * COLS + c;
          const x = c - (COLS - 1) / 2;
          const y = (ROWS - 1) / 2 - r;
          const d = Math.hypot(x - pointerWorld.x, y - pointerWorld.y);
          // Quantised falloff keeps the lift blocky, like the brand grid
          const target = d < 3.2 ? Math.ceil((1 - d / 3.2) * 3) / 3 : 0;
          tileLift[i] += (target - tileLift[i]) * 0.12;
          const wave = Math.sin(t * 0.9 + (x + y) * 0.35) * 0.08 * (1 - burst);
          // Ripple radiating out from the chip once the pattern is revealed (quantised height)
          const dc = Math.hypot(x - chipCentre.x, y - chipCentre.y);
          const ripple = reveal > 0 ? Math.round(Math.max(0, Math.sin(dc * 0.9 - t * 5)) * 3) / 3 * 0.35 * reveal : 0;
          // Lit tiles flip on in a hard step, staggered, like pixels switching on
          const lit = litDelay[i] >= 0 && reveal > litDelay[i] * 0.6 + 0.2 ? 1 : 0;
          m.makeTranslation(x, y, tileLift[i] * 1.1 + wave + ripple + lit * 0.45);
          tiles.setMatrixAt(i, m);
          tmpColor.copy(TILE).lerp(TILE_HOT, Math.max(tileLift[i], ripple * 1.6));
          if (lit) {
            tmpColor.copy(MINT);
            // A bright packet (3 tiles long) runs around the ring
            const k = ringPos[i];
            const head = (t * 9) % ring.length;
            const behind = (head - k + ring.length) % ring.length;
            if (k >= 0 && behind < 3) tmpColor.copy(PACKET).lerp(MINT, behind / 3);
          }
          tiles.setColorAt(i, tmpColor);
        }
      }
      tiles.instanceMatrix.needsUpdate = true;
      if (tiles.instanceColor) tiles.instanceColor.needsUpdate = true;

      // Sparks rise from lit tiles, shrinking as they climb; hidden until the reveal
      for (let k = 0; k < SPARKS; k++) {
        const sd = sparkSeed[k];
        const life = (t * sd.speed + sd.offset) % 1;
        const tx = (sd.tile % COLS) - (COLS - 1) / 2;
        const ty = (ROWS - 1) / 2 - Math.floor(sd.tile / COLS);
        const size = reveal > 0.5 ? (1 - life) * reveal : 0;
        v.set(tx + sd.drift * life, ty + life * 0.6, 0.6 + life * 5);
        m.compose(v, q.identity(), s.setScalar(Math.max(size, 0.0001)));
        sparks.setMatrixAt(k, m);
      }
      sparks.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      chip.dispose();
      tiles.dispose();
      sparks.dispose();
      sparkGeo.dispose();
      sparkMat.dispose();
      cube.dispose();
      tileGeo.dispose();
      chipMat.dispose();
      tileMat.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [progress]);

  return <div ref={host} className="absolute inset-0" aria-hidden="true" />;
}
