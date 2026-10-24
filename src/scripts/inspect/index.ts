// Inspect mode: the page explains itself. Overlays the real 12-column grid and the 6px
// cell lattice, outlines every [data-inspect] component, and for whatever is under the
// pointer shows its type, colour tokens, spacing and animation curves, with redline
// distances to its parent. The voxel clover switches to wireframe and reports GPU stats.

import { gsap } from 'gsap';
import { onFrame, frameStats } from '../core/ticker';
import { pointer } from '../core/signals';
import { engineRef } from '../core/stage';
import './inspect.css';

let on = false;
let root: HTMLDivElement | null = null;
let canvas: HTMLCanvasElement | null = null;
let card: HTMLDivElement | null = null;
let hud: HTMLDivElement | null = null;
let unsub: (() => void) | null = null;
let lcpEl: Element | null = null;
let hudTimer = 0;

try {
  new PerformanceObserver((l) => {
    const e = l.getEntries();
    lcpEl = (e[e.length - 1] as PerformanceEntry & { element?: Element }).element ?? lcpEl;
  }).observe({ type: 'largest-contentful-paint', buffered: true });
} catch {}

const TOKENS = ['--ink', '--ink-2', '--leaf', '--gold', '--ground', '--surface', '--surface-2', '--on-gold', '--paper', '--forest'];

function tokenMap() {
  const probe = document.createElement('span');
  document.body.appendChild(probe);
  const map = new Map<string, string>();
  for (const t of TOKENS) {
    probe.style.color = `var(${t})`;
    map.set(getComputedStyle(probe).color, t);
  }
  probe.remove();
  return map;
}

const hex = (rgb: string) => {
  const m = rgb.match(/[\d.]+/g);
  if (!m) return rgb;
  const [r, g, b, a] = m.map(Number);
  const h = '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
  return a !== undefined && a < 1 ? `${h} @${Math.round(a * 100)}%` : h;
};

function describe(el: HTMLElement, tokens: Map<string, string>) {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const family = cs.fontFamily.split(',')[0].replace(/["']/g, '').replace(/-[0-9a-f]{8,}$/i, '').trim();
  const color = tokens.get(cs.color) ? `${tokens.get(cs.color)} ${hex(cs.color)}` : hex(cs.color);
  const pad = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map((p) => parseFloat(p)).join(' ');
  const motion: string[] = [];
  for (const t of gsap.getTweensOf(el)) motion.push(`gsap ${t.duration().toFixed(2)}s ${String(t.vars.ease ?? 'power1.out')}`);
  for (const a of el.getAnimations()) {
    const timing = a.effect?.getTiming();
    motion.push(`${(a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty ?? 'animation'} ${Math.round(Number(timing?.duration) || 0)}ms ${timing?.easing ?? ''}`);
  }
  if (!motion.length && cs.transitionDuration !== '0s') {
    const props = cs.transitionProperty.split(',')[0].trim();
    motion.push(`transition ${props} ${cs.transitionDuration.split(',')[0]} ${cs.transitionTimingFunction.split(/,(?![^(]*\))/)[0]}`);
  }
  return {
    name: el.dataset.inspect || `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}`,
    rows: [
      ['Size', `${Math.round(r.width)} × ${Math.round(r.height)}`],
      ['Type', `${family} ${cs.fontWeight}`],
      ['Font', `${parseFloat(cs.fontSize).toFixed(1)} / ${cs.lineHeight === 'normal' ? 'normal' : parseFloat(cs.lineHeight).toFixed(1)}px  ${cs.letterSpacing === 'normal' ? '' : 'tracking ' + (parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize)).toFixed(3) + 'em'}`],
      ['Colour', color],
      ['Padding', pad],
      ...(motion.length ? [['Motion', motion.slice(0, 2).join('; ')]] : []),
    ] as [string, string][],
  };
}

function build() {
  root = document.createElement('div');
  root.className = 'ins';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="ins__lattice"></div>
    <div class="ins__cols"><div class="ins__cols-in">${'<span></span>'.repeat(12)}</div></div>
    <canvas class="ins__canvas"></canvas>
    <div class="ins__card"></div>
    <div class="ins__hud"></div>`;
  document.body.appendChild(root);
  canvas = root.querySelector('canvas');
  card = root.querySelector('.ins__card');
  hud = root.querySelector('.ins__hud');
}

function draw(tokens: Map<string, string>) {
  if (!canvas || !card) return;
  const w = innerWidth;
  const h = innerHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const css = getComputedStyle(document.documentElement);
  const leaf = css.getPropertyValue('--leaf').trim();
  const gold = css.getPropertyValue('--gold').trim();
  const ink = css.getPropertyValue('--ink').trim();
  ctx.font = '600 11px ' + getComputedStyle(document.body).fontFamily;
  ctx.lineWidth = 1;

  // every inspectable component on screen
  for (const el of document.querySelectorAll<HTMLElement>('[data-inspect]')) {
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > h || r.width === 0) continue;
    if (el.closest('[inert], [hidden]') || getComputedStyle(el).visibility === 'hidden') continue;
    ctx.strokeStyle = leaf;
    ctx.globalAlpha = 0.55;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(Math.round(r.left) + 0.5, Math.round(r.top) + 0.5, Math.round(r.width) - 1, Math.round(r.height) - 1);
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    const label = el.dataset.inspect!;
    const tw = ctx.measureText(label).width + 10;
    ctx.fillStyle = leaf;
    ctx.fillRect(Math.round(r.left), Math.round(r.top) - 16, tw, 16);
    ctx.fillStyle = '#13201A';
    ctx.fillText(label, Math.round(r.left) + 5, Math.round(r.top) - 4);
  }

  // the Largest Contentful Paint element
  if (lcpEl && lcpEl.isConnected) {
    const r = lcpEl.getBoundingClientRect();
    if (r.bottom > 0 && r.top < h) {
      ctx.strokeStyle = gold;
      ctx.lineWidth = 2;
      ctx.strokeRect(r.left - 3, r.top - 3, r.width + 6, r.height + 6);
      ctx.fillStyle = gold;
      ctx.fillRect(r.right - 120 + 3, r.bottom + 3, 120, 18);
      ctx.fillStyle = '#13201A';
      ctx.fillText('Largest paint (LCP)', r.right - 114 + 3, r.bottom + 16);
      ctx.lineWidth = 1;
    }
  }

  // hovered element: highlight, redlines to the parent, spec card
  const target = pointer.active ? (document.elementFromPoint(pointer.x, pointer.y) as HTMLElement | null) : null;
  const el = target?.closest<HTMLElement>('[data-inspect], h1, h2, h3, p, a, button, li, dd, dt, label, input') ?? null;
  if (!el || el.closest('.ins, .nav')) {
    card.style.opacity = '0';
    return;
  }
  const r = el.getBoundingClientRect();
  const parent = el.parentElement?.getBoundingClientRect();
  ctx.fillStyle = 'rgba(232,180,34,0.14)';
  ctx.fillRect(r.left, r.top, r.width, r.height);
  ctx.strokeStyle = gold;
  ctx.strokeRect(r.left + 0.5, r.top + 0.5, r.width - 1, r.height - 1);
  if (parent) {
    ctx.strokeStyle = gold;
    ctx.fillStyle = gold;
    const red = (x1: number, y1: number, x2: number, y2: number, d: number) => {
      if (d < 1) return;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const t = `${Math.round(d)}`;
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const tw = ctx.measureText(t).width + 8;
      ctx.fillRect(mx - tw / 2, my - 8, tw, 16);
      ctx.fillStyle = '#13201A';
      ctx.fillText(t, mx - tw / 2 + 4, my + 4);
      ctx.fillStyle = gold;
    };
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    red(cx, parent.top, cx, r.top, r.top - parent.top);
    red(cx, r.bottom, cx, parent.bottom, parent.bottom - r.bottom);
    red(parent.left, cy, r.left, cy, r.left - parent.left);
    red(r.right, cy, parent.right, cy, parent.right - r.right);
  }
  const d = describe(el, tokens);
  card.innerHTML = `<p class="ins__name">${d.name}</p>${d.rows.map(([k, v]) => `<p><span>${k}</span>${v}</p>`).join('')}`;
  const cw = card.offsetWidth;
  const ch = card.offsetHeight;
  let x = pointer.x + 18;
  let y = pointer.y + 18;
  if (x + cw > w - 8) x = pointer.x - cw - 18;
  if (y + ch > h - 8) y = pointer.y - ch - 18;
  card.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  card.style.opacity = '1';
  ctx.strokeStyle = ink;
}

function updateHud() {
  if (!hud) return;
  const st = engineRef.current?.stats();
  hud.innerHTML = `<b>Inspect</b><span>${Math.round(frameStats.fps)} fps</span>${
    st ? `<span>${st.instances} cubes</span><span>${st.calls} draw call${st.calls === 1 ? '' : 's'}</span><span>${st.triangles.toLocaleString()} triangles</span><span>DPR ${st.dpr}</span>` : '<span>WebGL off</span>'
  }<span>grid 12 col, 24px gutter, 6px cell</span><span class="ins__key">Press I to close</span>`;
  hudTimer = window.setTimeout(updateHud, 500);
}

export function toggle(force?: boolean) {
  on = force ?? !on;
  document.documentElement.classList.toggle('inspect-on', on);
  if (on) {
    if (!root) build();
    root!.hidden = false;
    const tokens = tokenMap();
    unsub = onFrame('overlay', () => draw(tokens));
    engineRef.current?.setWire(true);
    updateHud();
  } else {
    unsub?.();
    unsub = null;
    clearTimeout(hudTimer);
    if (root) root.hidden = true;
    engineRef.current?.setWire(false);
  }
  return on;
}
