// Live miniatures for the lab cards. Each draws one still frame on load and only animates
// while its card is hovered or focused, so six canvases cost nothing at rest.

import { CELLS } from '../../data/brand';

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, c: Palette) => void;
interface Palette {
  ground: string;
  surface: string;
  ink: string;
  ink2: string;
  leaf: string;
  gold: string;
  line: string;
}

const palette = (): Palette => {
  const s = getComputedStyle(document.documentElement);
  const v = (n: string) => s.getPropertyValue(n).trim();
  return { ground: v('--ground'), surface: v('--surface-2'), ink: v('--ink'), ink2: v('--ink-2'), leaf: v('--leaf'), gold: v('--gold'), line: v('--line-strong') };
};

const cellColor = (leaf: string, c: Palette) => (leaf === 'design' ? c.gold : leaf === 'centre' ? c.ink : c.leaf);

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (x: number) => Math.max(0, Math.min(255, Math.round(x * k)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

const DRAW: Record<string, Draw> = {
  'voxel-sandbox': (ctx, w, h, t, c) => {
    const s = Math.min(w, h) / 13;
    const ox = w / 2;
    const oy = h * 0.2;
    const sorted = [...CELLS].sort((a, b) => a.c + a.r - (b.c + b.r));
    for (const cell of sorted) {
      const lift = Math.max(0, Math.sin(t * 2.2 - (cell.c + cell.r) * 0.45)) * s * 0.9;
      const x = ox + (cell.c - cell.r) * s;
      const y = oy + (cell.c + cell.r) * s * 0.5 - lift;
      const col = cellColor(cell.leaf, c).startsWith('#') ? cellColor(cell.leaf, c) : c.leaf;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + s, y + s * 0.5);
      ctx.lineTo(x, y + s);
      ctx.lineTo(x - s, y + s * 0.5);
      ctx.fill();
      ctx.fillStyle = shade(col, 0.72);
      ctx.beginPath();
      ctx.moveTo(x - s, y + s * 0.5);
      ctx.lineTo(x, y + s);
      ctx.lineTo(x, y + s * 1.9);
      ctx.lineTo(x - s, y + s * 1.4);
      ctx.fill();
      ctx.fillStyle = shade(col, 0.5);
      ctx.beginPath();
      ctx.moveTo(x + s, y + s * 0.5);
      ctx.lineTo(x, y + s);
      ctx.lineTo(x, y + s * 1.9);
      ctx.lineTo(x + s, y + s * 1.4);
      ctx.fill();
    }
  },
  sequencer: (ctx, w, h, t, c) => {
    const s = Math.min(w / 9, h / 9);
    const ox = (w - s * 7) / 2;
    const oy = (h - s * 7) / 2;
    const head = Math.floor(t * 4) % 7;
    for (const cell of CELLS) {
      const on = (cell.seq * 7) % 5 < 2;
      const hit = cell.c === head && on;
      ctx.fillStyle = hit ? c.gold : on ? c.leaf : c.surface;
      const pad = hit ? 0 : s * 0.12;
      ctx.fillRect(ox + cell.c * s + pad, oy + cell.r * s + pad, s - pad * 2, s - pad * 2);
    }
    ctx.fillStyle = c.line;
    ctx.fillRect(ox + head * s, oy - s * 0.4, s, 2);
  },
  'make-a-mark': (ctx, w, h, t, c) => {
    const s = Math.min(w / 9, h / 9);
    const ox = (w - s * 7) / 2;
    const oy = (h - s * 7) / 2;
    ctx.strokeStyle = c.line;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 7; i++) {
      ctx.beginPath();
      ctx.moveTo(ox + i * s, oy);
      ctx.lineTo(ox + i * s, oy + 7 * s);
      ctx.moveTo(ox, oy + i * s);
      ctx.lineTo(ox + 7 * s, oy + i * s);
      ctx.stroke();
    }
    const path = [[1, 1], [2, 1], [3, 1], [3, 2], [3, 3], [4, 3], [5, 3], [5, 4], [5, 5], [4, 5], [3, 5], [2, 5], [1, 5], [1, 4], [1, 3], [2, 3]];
    const n = Math.floor((t * 6) % (path.length + 6));
    path.slice(0, Math.min(n, path.length)).forEach(([x, y], i) => {
      ctx.fillStyle = i === Math.min(n, path.length) - 1 ? c.gold : c.leaf;
      ctx.fillRect(ox + x * s + 1, oy + y * s + 1, s - 2, s - 2);
    });
  },
  'type-playground': (ctx, w, h, t, c) => {
    const family = getComputedStyle(document.body).fontFamily;
    const word = 'Felixis';
    const size = h * 0.42;
    let x = w * 0.08;
    for (let i = 0; i < word.length; i++) {
      const wgt = 400 + 300 * (0.5 + 0.5 * Math.sin(t * 2.4 - i * 0.6));
      ctx.font = `${Math.round(wgt)} ${size}px ${family}`;
      ctx.fillStyle = i === 4 ? c.gold : c.ink;
      ctx.fillText(word[i], x, h * 0.66);
      x += ctx.measureText(word[i]).width - size * 0.04;
    }
  },
  'cell-shader': (ctx, w, h, t, c) => {
    const s = Math.max(6, Math.round(w / 40));
    for (let y = 0; y < h; y += s) {
      for (let x = 0; x < w; x += s) {
        const v = Math.sin(x * 0.02 + t * 1.3) + Math.sin(y * 0.03 - t * 0.9) + Math.sin((x + y) * 0.015 + t);
        const k = (v + 3) / 6;
        ctx.fillStyle = k > 0.78 ? c.gold : k > 0.5 ? c.leaf : k > 0.3 ? c.surface : c.ground;
        const pad = k > 0.5 ? 0 : 1;
        ctx.fillRect(x + pad, y + pad, s - pad * 2, s - pad * 2);
      }
    }
  },
  'flow-field': (ctx, w, h, t, c) => {
    const n = 220;
    for (let i = 0; i < n; i++) {
      const seed = i * 12.9898;
      let x = ((Math.sin(seed) * 43758.5453) % 1 + 1) % 1 * w;
      let y = ((Math.sin(seed * 1.7) * 23421.631) % 1 + 1) % 1 * h;
      for (let k = 0; k < 14; k++) {
        const a = Math.sin(x * 0.012 + t * 0.6) * 2 + Math.cos(y * 0.014 - t * 0.4) * 2;
        x += Math.cos(a) * 3;
        y += Math.sin(a) * 3;
      }
      ctx.fillStyle = i % 37 === 0 ? c.gold : i % 3 === 0 ? c.ink2 : c.leaf;
      ctx.fillRect(((x % w) + w) % w, ((y % h) + h) % h, 3, 3);
    }
  },
};

export default function labThumbs(root: HTMLElement) {
  const cards = [...root.querySelectorAll<HTMLElement>('[data-thumb]')];
  const offs: (() => void)[] = [];
  for (const card of cards) {
    const canvas = card.querySelector('canvas')!;
    const draw = DRAW[card.dataset.thumb || ''];
    if (!draw) continue;
    let raf = 0;
    let start = 0;
    const frame = (now: number, still = false) => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(r.width * dpr)) {
        canvas.width = Math.round(r.width * dpr);
        canvas.height = Math.round(r.height * dpr);
      }
      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const c = palette();
      ctx.fillStyle = c.surface;
      ctx.fillRect(0, 0, r.width, r.height);
      draw(ctx, r.width, r.height, still ? 0.6 : (now - start) / 1000 + 0.6, c);
      if (!still) raf = requestAnimationFrame((n) => frame(n));
    };
    const play = () => {
      cancelAnimationFrame(raf);
      start = performance.now();
      raf = requestAnimationFrame((n) => frame(n));
    };
    const stop = () => cancelAnimationFrame(raf);
    card.addEventListener('pointerenter', play);
    card.addEventListener('pointerleave', stop);
    card.addEventListener('focus', play);
    card.addEventListener('blur', stop);
    document.fonts.ready.then(() => frame(0, true));
    const ro = new ResizeObserver(() => frame(0, true));
    ro.observe(canvas);
    const mo = new MutationObserver(() => frame(0, true));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    offs.push(() => {
      stop();
      ro.disconnect();
      mo.disconnect();
    });
  }
  return () => offs.forEach((f) => f());
}
