// Live readouts. Every number comes from the browser's own APIs on the visitor's device;
// nothing here is typed in by hand. Layout shifts inside [data-cls-sandbox] (demos that
// change size on purpose while you drag them) are reported separately so the main figure
// stays honest about the page itself.

import { gsap } from 'gsap';
import { frameStats } from '../core/ticker';
import { engineRef } from '../core/stage';
import { sound } from '../effects/sound';
import { firstInput } from '../core/signals';

interface Shift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources?: { node?: Node }[];
}

const metrics = { lcp: 0, cls: 0, clsSandbox: 0 };
let observing = false;
// "while loading" = before the visitor first scrolls or interacts (see signals.firstInput);
// later shifts come from sections that rearrange as you scroll through them, on purpose.

function observe() {
  if (observing) return;
  observing = true;
  try {
    new PerformanceObserver((list) => {
      const e = list.getEntries();
      metrics.lcp = e[e.length - 1].startTime / 1000;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as Shift[]) {
        if (e.hadRecentInput || e.startTime > firstInput.t) continue;
        const sandboxed = e.sources?.every((s) => s.node instanceof Element && s.node.closest('[data-cls-sandbox]'));
        if (sandboxed) metrics.clsSandbox += e.value;
        else metrics.cls += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {}
}
observe();

function network() {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const res = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const size = (r: PerformanceResourceTiming) => r.transferSize || r.encodedBodySize || 0;
  const total = (nav ? size(nav) : 0) + res.reduce((a, r) => a + size(r), 0);
  const js = res.filter((r) => /\.m?js(\?|$)/.test(r.name)).reduce((a, r) => a + size(r), 0);
  return { kb: total / 1024, js: js / 1024, requests: res.length + 1 };
}

export default function proof(root: HTMLElement) {
  const cell = (k: string) => root.querySelector<HTMLElement>(`[data-readout="${k}"] [data-value]`)!;
  const spark = root.querySelector<HTMLCanvasElement>('[data-spark]');
  const history: number[] = [];
  let visible = false;
  let liveTimer = 0;

  const show = (k: string, value: number, digits: number, animate: boolean) => {
    const el = cell(k);
    if (!animate) {
      el.textContent = value.toFixed(digits);
      return;
    }
    const o = { v: 0 };
    gsap.to(o, {
      v: value,
      duration: 1.1,
      ease: 'steps(14)',
      onUpdate: () => (el.textContent = o.v.toFixed(digits)),
      onComplete: () => (el.textContent = value.toFixed(digits)),
    });
  };

  const measure = (animate: boolean) => {
    const n = network();
    show('lcp', metrics.lcp, 2, animate);
    show('cls', metrics.cls, 3, animate);
    show('weight', n.kb, 0, animate);
    show('requests', n.requests, 0, animate);
    show('js', n.js, 0, animate);
    show('dom', document.getElementsByTagName('*').length, 0, animate);
    const st = engineRef.current?.stats();
    const vox = cell('voxels');
    if (st) show('voxels', st.instances, 0, animate);
    else vox.textContent = 'off';
    if (animate) sound.tick(6);
  };

  const drawSpark = () => {
    if (!spark) return;
    const r = spark.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    spark.width = Math.round(r.width * dpr);
    spark.height = Math.round(r.height * dpr);
    const ctx = spark.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const color = getComputedStyle(root).getPropertyValue('--leaf').trim();
    const w = r.width / 40;
    history.forEach((fps, i) => {
      const hgt = Math.max(2, (Math.min(fps, 120) / 120) * r.height);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.35 + 0.65 * (i / history.length);
      ctx.fillRect(i * w, r.height - hgt, w - 1, hgt);
    });
  };

  const live = () => {
    if (!visible) return;
    const fps = Math.round(frameStats.fps);
    cell('fps').textContent = String(fps);
    history.push(fps);
    if (history.length > 40) history.shift();
    drawSpark();
    liveTimer = window.setTimeout(live, 250);
  };

  let first = true;
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    clearTimeout(liveTimer);
    if (visible) {
      measure(first);
      first = false;
      live();
    }
  });
  io.observe(root);

  const remeasure = root.querySelector('[data-remeasure]');
  const onRemeasure = () => measure(true);
  remeasure?.addEventListener('click', onRemeasure);

  return () => {
    io.disconnect();
    clearTimeout(liveTimer);
    remeasure?.removeEventListener('click', onRemeasure);
  };
}
