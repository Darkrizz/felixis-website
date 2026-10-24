// The cell cover: a full-screen grid of square cells that fills in a radial stagger from a
// point, holds, then clears. Page changes and theme switches both go through it, so every
// big change on the site looks like the same material moving.

import { reducedMotion } from '../core/prefs';

const canvas = () => document.querySelector<HTMLCanvasElement>('[data-cover]');

interface CoverOpts {
  x?: number;
  y?: number;
  color: string;
  accent?: string;
  /** fraction of cells drawn in the accent colour */
  accentShare?: number;
}

let state: {
  cells: { x: number; y: number; t: number; accent: boolean }[];
  size: number;
  color: string;
  accent: string;
  dir: 1 | -1;
  start: number;
  dur: number;
  raf: number;
} | null = null;

const FILL_MS = 420;
const STEPS = 3;

function layout(c: HTMLCanvasElement, opts: CoverOpts) {
  const w = innerWidth;
  const h = innerHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  const size = Math.ceil(Math.max(w, h) / 16);
  const cols = Math.ceil(w / size);
  const rows = Math.ceil(h / size);
  const ox = opts.x ?? w / 2;
  const oy = opts.y ?? h / 2;
  const maxD = Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy));
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const cx = col * size + size / 2;
      const cy = r * size + size / 2;
      const d = Math.hypot(cx - ox, cy - oy) / maxD;
      cells.push({ x: col * size, y: r * size, t: d * 0.72 + Math.random() * 0.22, accent: Math.random() < (opts.accentShare ?? 0.04) });
    }
  }
  return { cells, size, dpr };
}

function draw(c: HTMLCanvasElement, now: number) {
  if (!state) return;
  const ctx = c.getContext('2d')!;
  const dpr = c.width / innerWidth;
  const p = Math.min(1, (now - state.start) / state.dur);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (const cell of state.cells) {
    // each cell grows in hard steps once its moment arrives
    const local = Math.max(0, Math.min(1, (p - cell.t * 0.7) / 0.3));
    let k = Math.ceil(local * STEPS) / STEPS;
    if (state.dir === -1) k = 1 - k;
    if (k <= 0) continue;
    const s = state.size * k;
    const off = (state.size - s) / 2;
    ctx.fillStyle = cell.accent && k < 1 ? state.accent : state.color;
    ctx.fillRect(cell.x + off, cell.y + off, s + 0.5, s + 0.5);
  }
  return p >= 1;
}

function run(dir: 1 | -1): Promise<void> {
  const c = canvas();
  if (!c || !state) return Promise.resolve();
  state.dir = dir;
  state.start = performance.now();
  cancelAnimationFrame(state.raf);
  return new Promise((resolve) => {
    const tick = (now: number) => {
      const done = draw(c, now);
      if (done) {
        resolve();
        if (dir === -1) {
          c.classList.remove('is-active');
          state = null;
        }
        return;
      }
      if (state) state.raf = requestAnimationFrame(tick);
    };
    if (state) state.raf = requestAnimationFrame(tick);
  });
}

/** Fill the screen. Resolves once fully covered. */
export function cover(opts: CoverOpts): Promise<void> {
  const c = canvas();
  if (!c || reducedMotion()) return Promise.resolve();
  const { cells, size } = layout(c, opts);
  state = { cells, size, color: opts.color, accent: opts.accent ?? '#E8B422', dir: 1, start: 0, dur: FILL_MS, raf: 0 };
  c.classList.add('is-active');
  return run(1);
}

/** Clear the cover, revealing whatever changed underneath. */
export function uncover(): Promise<void> {
  if (!state) return Promise.resolve();
  // re-time the cells so the clear starts where the fill started
  return run(-1);
}

export const coverActive = () => state !== null;
