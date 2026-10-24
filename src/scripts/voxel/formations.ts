// Formation generators. Each returns exactly N instances in "units" (one mark cell = 6
// units, the 7x7 matrix spans -21..21), sorted along a Hilbert curve so instance i lands
// near instance i in every other formation and morphs stay coherent.
//
// pos  = [x, y, z, stagger 0..1]
// meta = [palette index, size in units, fill seq (-1 = none), 0]

import { CELLS, CELL, type Leaf } from '../../data/brand';

export type Tier = 'desktop' | 'mobile' | 'low';

export const PAL = { leaf: 0, gold: 1, centre: 2, dim: 3, dust: 4, leafSoft: 5 } as const;

export interface Formation {
  name: string;
  pos: Float32Array;
  meta: Float32Array;
  /** size of the formation's box in units, used to fit it into its DOM anchor */
  fit: { w: number; h: number; mode: 'contain' | 'cover' };
  /** z flattening applied to each cube (lattice tiles are thin) */
  z: number;
}

export const TIER: Record<Tier, { n: number; k3: number; layers: number; kFlat: number; lat: [number, number] }> = {
  desktop: { n: 1188, k3: 3, layers: 4, kFlat: 6, lat: [36, 33] },
  mobile: { n: 528, k3: 2, layers: 4, kFlat: 4, lat: [24, 22] },
  low: { n: 297, k3: 3, layers: 1, kFlat: 3, lat: [27, 11] },
};

interface P {
  x: number;
  y: number;
  z: number;
  w: number;
  pal: number;
  size: number;
  seq: number;
}

// deterministic randomness so every load (and every test) builds identical formations
export function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hilbert index of (x, y) on a 2^order grid. */
export function hilbert(x: number, y: number, order = 10) {
  let d = 0;
  const n = 1 << order;
  for (let s = n >> 1; s > 0; s >>= 1) {
    const rx = (x & s) > 0 ? 1 : 0;
    const ry = (y & s) > 0 ? 1 : 0;
    d += s * s * ((3 * rx) ^ ry);
    if (ry === 0) {
      if (rx === 1) {
        x = s - 1 - x;
        y = s - 1 - y;
      }
      const t = x;
      x = y;
      y = t;
    }
  }
  return d;
}

const leafPal = (leaf: Leaf) => (leaf === 'design' ? PAL.gold : leaf === 'centre' ? PAL.centre : PAL.leaf);
// gold leaf lands last, centre after it
const LEAF_RANK: Record<Leaf, number> = { strategy: 0, development: 1, growth: 2, design: 3, centre: 4 };

function pack(name: string, pts: P[], n: number, fit: Formation['fit'], z = 1): Formation {
  // exactly n points: thin out evenly, or repeat (repeats overlap perfectly and are invisible)
  let list = pts;
  if (list.length > n) {
    const step = list.length / n;
    list = Array.from({ length: n }, (_, i) => pts[Math.floor(i * step)]);
  } else if (list.length < n) {
    list = Array.from({ length: n }, (_, i) => pts[i % pts.length]);
  }
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of list) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const sx = 1023 / Math.max(1e-6, maxX - minX);
  const sy = 1023 / Math.max(1e-6, maxY - minY);
  const keyed = list.map((p) => ({ p, h: hilbert(Math.round((p.x - minX) * sx), Math.round((p.y - minY) * sy)) * 64 - p.z }));
  keyed.sort((a, b) => a.h - b.h);
  const pos = new Float32Array(n * 4);
  const meta = new Float32Array(n * 4);
  keyed.forEach(({ p }, i) => {
    pos.set([p.x, p.y, p.z, p.w], i * 4);
    meta.set([p.pal, p.size, p.seq, 0], i * 4);
  });
  return { name, pos, meta, fit, z };
}

export function clover3d(tier: Tier): Formation {
  const { n, k3: k, layers } = TIER[tier];
  const rnd = prng(11);
  const size = CELL / k;
  const pts: P[] = [];
  for (const cell of CELLS) {
    for (let l = 0; l < layers; l++) {
      for (let sy = 0; sy < k; sy++) {
        for (let sx = 0; sx < k; sx++) {
          pts.push({
            x: cell.c * CELL + (sx + 0.5) * size - 21,
            y: 21 - (cell.r * CELL + (sy + 0.5) * size),
            z: -(l + 0.5) * size,
            w: (LEAF_RANK[cell.leaf] + rnd() * 0.9 + l * 0.02) / 5,
            pal: leafPal(cell.leaf),
            size,
            seq: cell.seq,
          });
        }
      }
    }
  }
  return pack('clover3d', pts, n, { w: 42, h: 42, mode: 'contain' });
}

export function flatClover(tier: Tier): Formation {
  const { n, kFlat: k } = TIER[tier];
  const size = CELL / k;
  const pts: P[] = [];
  for (const cell of CELLS) {
    for (let sy = 0; sy < k; sy++) {
      for (let sx = 0; sx < k; sx++) {
        pts.push({
          x: cell.c * CELL + (sx + 0.5) * size - 21,
          y: 21 - (cell.r * CELL + (sy + 0.5) * size),
          z: -size * 0.5,
          w: cell.seq / 33 + ((sx + sy) / (2 * k)) * 0.03,
          pal: leafPal(cell.leaf),
          size,
          seq: cell.seq,
        });
      }
    }
  }
  return pack('flatclover', pts, n, { w: 42, h: 42, mode: 'contain' });
}

export function lattice(tier: Tier): Formation {
  const { n, lat } = TIER[tier];
  const [cols, rows] = lat;
  const rnd = prng(23);
  const pts: P[] = [];
  const maxD = Math.hypot(cols / 2, rows / 2);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c - (cols - 1) / 2) * CELL;
      const y = ((rows - 1) / 2 - r) * CELL;
      pts.push({ x, y, z: 0, w: Math.hypot(c - cols / 2, r - rows / 2) / maxD * 0.85 + rnd() * 0.15, pal: PAL.dim, size: 1.5, seq: -1 });
    }
  }
  return pack('lattice', pts, n, { w: cols * CELL, h: rows * CELL, mode: 'cover' }, 0.25);
}

export function dust(tier: Tier): Formation {
  const { n } = TIER[tier];
  const rnd = prng(37);
  const pts: P[] = [];
  for (let i = 0; i < n; i++) {
    const r = rnd();
    pts.push({
      x: (rnd() - 0.5) * 190,
      y: (rnd() - 0.5) * 110,
      z: -30 - rnd() * 90,
      w: rnd(),
      pal: r > 0.993 ? PAL.gold : r > 0.94 ? PAL.leafSoft : PAL.dust,
      size: 0.35 + rnd() * 0.6,
      seq: -1,
    });
  }
  return pack('dust', pts, n, { w: 160, h: 90, mode: 'cover' }, 1);
}

/** "Felixis" sampled from the brand font. The dots of both i's are gold. */
export function wordmark(tier: Tier, fontFamily: string): Formation {
  const { n } = TIER[tier];
  const layers = 2;
  const want = n / layers;
  const W = 1200;
  const H = 360;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const text = 'Felixis';
  const setFont = (px: number) => {
    ctx.font = `700 ${px}px ${fontFamily}`;
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${-0.05 * px}px`;
  };
  // size the word so it spans the full width of the box
  setFont(200);
  const fontSize = 200 * ((W * 0.99) / ctx.measureText(text).width);
  setFont(fontSize);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#000';
  const m = ctx.measureText(text);
  const x0 = (W - m.width) / 2;
  const baseline = H / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  ctx.fillText(text, x0, baseline);
  const xHeight = ctx.measureText('x').actualBoundingBoxAscent;
  // x ranges of the two i's, from the advance of each prefix
  const iRanges: [number, number][] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== 'i') continue;
    const a = x0 + ctx.measureText(text.slice(0, i)).width;
    const b = x0 + ctx.measureText(text.slice(0, i + 1)).width;
    iRanges.push([a, b]);
  }
  const data = ctx.getImageData(0, 0, W, H).data;
  const filled = (x: number, y: number) => data[(Math.floor(y) * W + Math.floor(x)) * 4 + 3] > 128;

  // find a sampling step that lands near the wanted count
  let lo = 2,
    hi = 40,
    step = 8;
  for (let it = 0; it < 18; it++) {
    step = (lo + hi) / 2;
    let count = 0;
    for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step) if (filled(x, y)) count++;
    if (count > want) lo = step;
    else hi = step;
  }
  const pts: P[] = [];
  const minX = x0;
  for (let l = 0; l < layers; l++) {
    for (let y = step / 2; y < H; y += step) {
      for (let x = step / 2; x < W; x += step) {
        if (!filled(x, y)) continue;
        const isDot = y < baseline - xHeight - step * 0.4 && iRanges.some(([a, b]) => x >= a && x <= b);
        pts.push({
          x: (x - W / 2) / step,
          y: (H / 2 - y) / step,
          z: -(l + 0.5) * 0.9,
          w: Math.min(1, Math.max(0, (x - minX) / m.width)) * 0.9 + l * 0.05,
          pal: isDot ? PAL.gold : PAL.centre,
          size: 0.9,
          seq: -1,
        });
      }
    }
  }
  return pack('wordmark', pts, n, { w: W / step, h: H / step, mode: 'contain' });
}

// ---------------------------------------------------------------- service glyphs

type Rect = [x: number, y: number, w: number, h: number, pal: number];

/** Fill axis-aligned rectangles (units, y up, centred on 0) with cubes. */
function blocks(name: string, tier: Tier, rects: Rect[], spacing: number, layers = 2): Formation {
  const { n } = TIER[tier];
  const rnd = prng(name.length * 97);
  const pts: P[] = [];
  for (const [x0, y0, w, h, pal] of rects) {
    for (let l = 0; l < layers; l++) {
      for (let y = y0 + spacing / 2; y < y0 + h; y += spacing) {
        for (let x = x0 + spacing / 2; x < x0 + w; x += spacing) {
          pts.push({ x, y, z: -(l + 0.5) * spacing, w: Math.min(1, (21 - y) / 42) * 0.8 + rnd() * 0.2, pal, size: spacing, seq: -1 });
        }
      }
    }
  }
  // choose a spacing that lands near n: callers pass a sensible one; pack() resamples the rest
  return pack(name, pts, n, { w: 46, h: 46, mode: 'contain' });
}

/** Strategy: a sitemap tree. Root, four children, two of them with children of their own. */
export function strategyGlyph(tier: Tier) {
  const G = PAL.leaf;
  const C = PAL.centre;
  const line = 1.2;
  const rects: Rect[] = [
    [-6, 13, 12, 6, C], // root
    [-0.6, 8, line, 5, G], // root stem
    [-18, 6.8, 36, line, G], // bus
    ...[-18, -6, 6, 18].map((cx) => [cx - 0.6, 2, line, 5.4, G] as Rect), // drops
    ...[-18, -6, 6, 18].map((cx) => [cx - 4, -4, 8, 6, G] as Rect), // children
    [-6.6, -9, line, 5, G],
    [17.4, -9, line, 5, G],
    [-10, -9.6, 8, line, G],
    [14, -9.6, 8, line, G],
    [-12, -18, 6, 5, G],
    [-5, -18, 6, 5, G],
    [12, -18, 6, 5, PAL.gold],
    [19, -18, 6, 5, G],
  ];
  return blocks('strategy', tier, rects, tier === 'desktop' ? 1.2 : 1.7);
}

/** Growth: six rising columns, the last one gold. */
export function growthGlyph(tier: Tier) {
  const heights = [8, 13, 17, 24, 30, 38];
  const rects: Rect[] = heights.map((h, i) => [-21 + i * 7.2, -19, 5.6, h, i === 5 ? PAL.gold : PAL.leaf] as Rect);
  return blocks('growth', tier, rects, tier === 'desktop' ? 1.25 : 1.75);
}

/** Text glyphs (Design "Aa", Development "</>") sampled from the brand font. */
export function textGlyph(name: string, tier: Tier, fontFamily: string, text: string, palFor: (ch: string) => number): Formation {
  const { n } = TIER[tier];
  const layers = 2;
  const W = 600;
  const H = 600;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.font = `700 200px ${fontFamily}`;
  const size = 200 * ((W * 0.92) / ctx.measureText(text).width);
  ctx.font = `700 ${Math.min(size, 520)}px ${fontFamily}`;
  const m = ctx.measureText(text);
  const x0 = (W - m.width) / 2;
  const base = H / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  // per-character colour: draw each char with its own alpha marker
  const ranges: [number, number, number][] = [];
  let x = x0;
  for (const ch of text) {
    const w = ctx.measureText(ch).width;
    ranges.push([x, x + w, palFor(ch)]);
    ctx.fillText(ch, x, base);
    x += w;
  }
  const data = ctx.getImageData(0, 0, W, H).data;
  const filled = (px: number, py: number) => data[(Math.floor(py) * W + Math.floor(px)) * 4 + 3] > 128;
  const want = n / layers;
  let lo = 2,
    hi = 60,
    step = 10;
  for (let it = 0; it < 18; it++) {
    step = (lo + hi) / 2;
    let count = 0;
    for (let y = step / 2; y < H; y += step) for (let xx = step / 2; xx < W; xx += step) if (filled(xx, y)) count++;
    if (count > want) lo = step;
    else hi = step;
  }
  const pts: P[] = [];
  const unit = 46 / (W / step);
  for (let l = 0; l < layers; l++) {
    for (let y = step / 2; y < H; y += step) {
      for (let xx = step / 2; xx < W; xx += step) {
        if (!filled(xx, y)) continue;
        const pal = ranges.find(([a, b]) => xx >= a && xx < b)?.[2] ?? PAL.leaf;
        pts.push({ x: (xx - W / 2) / step * unit, y: (H / 2 - y) / step * unit, z: -(l + 0.5) * unit, w: (xx / W) * 0.9 + l * 0.05, pal, size: unit * 0.92, seq: -1 });
      }
    }
  }
  return pack(name, pts, n, { w: 46, h: 46, mode: 'contain' });
}
