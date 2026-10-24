// Flow field: particles follow the curl of a moving noise field (divergence-free, so they
// swirl instead of bunching up). One fillRect per cell per frame on a 2D canvas.

import { onFrame } from '../core/ticker';
import { reducedMotion } from '../core/prefs';

// small, fast 3D value noise
const P = new Uint8Array(512);
{
  const p = Array.from({ length: 256 }, (_, i) => i);
  let s = 7;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
}
const fade = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const h = (x: number, y: number, z: number) => P[P[P[x & 255] + (y & 255)] + (z & 255)] / 255;
function noise(x: number, y: number, z: number) {
  const xi = Math.floor(x),
    yi = Math.floor(y),
    zi = Math.floor(z);
  const xf = fade(x - xi),
    yf = fade(y - yi),
    zf = fade(z - zi);
  const a = lerp(lerp(h(xi, yi, zi), h(xi + 1, yi, zi), xf), lerp(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), xf), yf);
  const b = lerp(lerp(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), xf), lerp(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), xf), yf);
  return lerp(a, b, zf);
}

export default function flow(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-ff-canvas]')!;
  const ctx = canvas.getContext('2d')!;
  const nIn = root.querySelector<HTMLInputElement>('[data-ff-n]')!;
  const sIn = root.querySelector<HTMLInputElement>('[data-ff-s]')!;
  const trails = root.querySelector<HTMLInputElement>('[data-ff-trails]')!;
  const MAX = 9000;
  const pos = new Float32Array(MAX * 2);
  let w = 0;
  let hgt = 0;
  let t = 0;
  let visible = false;
  const mouse = { x: -1e4, y: -1e4 };

  const scatter = () => {
    for (let i = 0; i < MAX; i++) {
      pos[i * 2] = Math.random() * w;
      pos[i * 2 + 1] = Math.random() * hgt;
    }
    ctx.fillStyle = getComputedStyle(root).getPropertyValue('--ground');
    ctx.fillRect(0, 0, w, hgt);
  };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    w = r.width;
    hgt = r.height;
    scatter();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(canvas);

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  canvas.addEventListener('pointerleave', () => (mouse.x = mouse.y = -1e4));
  root.querySelector('[data-ff-reset]')!.addEventListener('click', scatter);

  const off = onFrame('render', (_time, dt) => {
    if (!visible || !w) return;
    const css = getComputedStyle(root);
    const ground = css.getPropertyValue('--ground').trim();
    const leaf = css.getPropertyValue('--leaf').trim();
    const ink = css.getPropertyValue('--ink-2').trim();
    const gold = '#E8B422';
    const n = Number(nIn.value);
    const scale = 0.0022 / Number(sIn.value);
    root.querySelector('[data-ff-n-out]')!.textContent = String(n);
    root.querySelector('[data-ff-s-out]')!.textContent = Number(sIn.value).toFixed(1);
    if (!reducedMotion()) t += dt * 0.08;
    ctx.globalAlpha = trails.checked ? 0.08 : 1;
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, w, hgt);
    ctx.globalAlpha = 1;
    const e = 0.5;
    const speed = reducedMotion() ? 0 : 1.4;
    for (let i = 0; i < n; i++) {
      let x = pos[i * 2];
      let y = pos[i * 2 + 1];
      const sx = x * scale;
      const sy = y * scale;
      // curl of the noise field: rotate its gradient by 90 degrees
      const dndy = noise(sx, sy + e, t) - noise(sx, sy - e, t);
      const dndx = noise(sx + e, sy, t) - noise(sx - e, sy, t);
      let vx = dndy;
      let vy = -dndx;
      const len = Math.hypot(vx, vy) || 1;
      vx = (vx / len) * speed;
      vy = (vy / len) * speed;
      const mx = x - mouse.x;
      const my = y - mouse.y;
      const md = mx * mx + my * my;
      if (md < 14400) {
        const f = (1 - Math.sqrt(md) / 120) * 4;
        vx += (mx / Math.sqrt(md + 1)) * f;
        vy += (my / Math.sqrt(md + 1)) * f;
      }
      x += vx;
      y += vy;
      if (x < 0) x += w;
      if (x > w) x -= w;
      if (y < 0) y += hgt;
      if (y > hgt) y -= hgt;
      pos[i * 2] = x;
      pos[i * 2 + 1] = y;
      ctx.fillStyle = i % 97 === 0 ? gold : i % 4 === 0 ? ink : leaf;
      ctx.fillRect(x, y, 2, 2);
    }
  });
  return () => {
    off();
    ro.disconnect();
    io.disconnect();
  };
}
