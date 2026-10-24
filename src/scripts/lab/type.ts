// Type playground: axes follow the pointer with a soft lag; scroll velocity leans the type.

import { onFrame } from '../core/ticker';
import { pointer, scroll } from '../core/signals';
import { reducedMotion } from '../core/prefs';

const FONTS = {
  anybody: { a1: 'Width', a1min: 50, a1max: 150, wmin: 100, wmax: 900, a3: 'Slant' },
  familjen: { a1: 'Tracking', a1min: -8, a1max: 8, wmin: 400, wmax: 700, a3: 'Slant' },
  doto: { a1: 'Roundness', a1min: 0, a1max: 100, wmin: 100, wmax: 900, a3: 'Slant' },
} as const;

export default function type(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>('[data-tp-stage]')!;
  const text = root.querySelector<HTMLElement>('[data-tp-text]')!;
  const ax1 = root.querySelector<HTMLElement>('[data-ax1]')!;
  const ax1Name = root.querySelector<HTMLElement>('[data-ax1-name]')!;
  const ax2 = root.querySelector<HTMLElement>('[data-ax2]')!;
  const ax3 = root.querySelector<HTMLElement>('[data-ax3]')!;
  let font: keyof typeof FONTS = 'anybody';
  const cur = { a: 0.5, w: 0.5, s: 0 };

  const onFont = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.name !== 'tpf') return;
    font = input.value as keyof typeof FONTS;
    root.dataset.font = font;
    ax1Name.textContent = FONTS[font].a1;
  };

  const off = onFrame('write', () => {
    if (reducedMotion()) return;
    const r = stage.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const inside = pointer.active && pointer.x >= r.left && pointer.x <= r.right && pointer.y >= r.top && pointer.y <= r.bottom;
    const ta = inside ? (pointer.x - r.left) / r.width : 0.5;
    const tw = inside ? (pointer.y - r.top) / r.height : 0.5;
    const ts = Math.max(-1, Math.min(1, scroll.v * 2.2));
    cur.a += (ta - cur.a) * 0.12;
    cur.w += (tw - cur.w) * 0.12;
    cur.s += (ts - cur.s) * 0.1;
    const f = FONTS[font];
    const a = f.a1min + (f.a1max - f.a1min) * cur.a;
    const w = f.wmin + (f.wmax - f.wmin) * cur.w;
    const slant = cur.s * -12;
    if (font === 'anybody') {
      text.style.fontVariationSettings = `'wdth' ${a.toFixed(1)}, 'wght' ${w.toFixed(0)}`;
      text.style.letterSpacing = '';
    } else if (font === 'doto') {
      text.style.fontVariationSettings = `'ROND' ${a.toFixed(0)}, 'wght' ${w.toFixed(0)}`;
      text.style.letterSpacing = '';
    } else {
      text.style.fontVariationSettings = `'wght' ${w.toFixed(0)}`;
      text.style.letterSpacing = `${(a / 100).toFixed(3)}em`;
    }
    text.style.transform = `skewX(${slant.toFixed(2)}deg)`;
    ax1.textContent = a.toFixed(0);
    ax2.textContent = w.toFixed(0);
    ax3.textContent = `${slant.toFixed(0)}°`;
  });

  root.addEventListener('change', onFont);
  text.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      text.blur();
    }
  });
  return () => {
    off();
    root.removeEventListener('change', onFont);
  };
}
