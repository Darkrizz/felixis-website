// Small DOM effects that answer the pointer or the scroll. Each returns a cleanup function;
// the router runs cleanups when the page swaps.

import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { pointer } from '../core/signals';
import { onFrame } from '../core/ticker';
import { reducedMotion } from '../core/prefs';

type Cleanup = () => void;

/** Buttons lean toward the pointer, then spring back. */
export function magnetic(el: HTMLElement): Cleanup {
  if (pointer.coarse) return () => {};
  const qx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'expo.out' });
  const qy = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'expo.out' });
  const move = (e: PointerEvent) => {
    if (reducedMotion()) return;
    const r = el.getBoundingClientRect();
    qx((e.clientX - (r.left + r.width / 2)) * 0.22);
    qy((e.clientY - (r.top + r.height / 2)) * 0.3);
  };
  const leave = () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
  };
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerleave', leave);
  return () => {
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerleave', leave);
    gsap.set(el, { clearProps: 'transform' });
  };
}

/**
 * Letters near the pointer gain weight. Each glyph box keeps the advance it had at the base
 * weight, so heavier letters never push their neighbours (no layout shift).
 */
export function weightField(el: HTMLElement): Cleanup {
  if (pointer.coarse) return () => {};
  const BASE = 600;
  const PEAK = 700;
  const LOW = 470;
  const RADIUS = 260;
  let split: SplitText | null = null;
  let chars: { el: HTMLElement; cx: number; cy: number; w: number }[] = [];
  let measuredAt = -1;
  let raf: Cleanup | null = null;

  const measure = () => {
    for (const c of chars) {
      const r = c.el.getBoundingClientRect();
      c.cx = r.left + r.width / 2;
      c.cy = r.top + r.height / 2;
    }
    measuredAt = scrollY;
  };

  const build = () => {
    split?.revert();
    split = SplitText.create(el, { type: 'words,chars', charsClass: 'wf-c', wordsClass: 'wf-w', aria: 'auto' });
    chars = (split.chars as HTMLElement[]).map((c) => ({ el: c, cx: 0, cy: 0, w: c.getBoundingClientRect().width }));
    for (const c of chars) {
      c.el.style.display = 'inline-block';
      c.el.style.width = `${c.w}px`;
      c.el.style.textAlign = 'center';
      c.el.style.fontWeight = String(BASE);
    }
    measure();
  };

  const tick = () => {
    if (reducedMotion() || !chars.length) return;
    if (Math.abs(scrollY - measuredAt) > 1) measure();
    const active = pointer.active;
    for (const c of chars) {
      let target = BASE;
      if (active) {
        const d = Math.hypot(pointer.x - c.cx, pointer.y - c.cy);
        const k = Math.max(0, 1 - d / RADIUS);
        target = LOW + (PEAK - LOW) * (k * k * (3 - 2 * k));
        if (d > RADIUS * 1.6) target = BASE;
      }
      const cur = Number(c.el.dataset.w || BASE);
      const next = cur + (target - cur) * 0.18;
      if (Math.abs(next - cur) > 0.4) {
        c.el.dataset.w = next.toFixed(1);
        c.el.style.fontWeight = next.toFixed(0);
      }
    }
  };

  let ro: ResizeObserver | null = null;
  document.fonts.ready.then(() => {
    if (!el.isConnected) return;
    build();
    raf = onFrame('write', tick);
    let first = true;
    ro = new ResizeObserver(() => {
      if (first) return void (first = false);
      build();
    });
    ro.observe(el);
  });

  return () => {
    raf?.();
    ro?.disconnect();
    split?.revert();
  };
}

/** Split a paragraph into words whose strength follows a progress value 0..1. */
export function scrubWords(el: HTMLElement) {
  const split = SplitText.create(el, { type: 'words', wordsClass: 'w', aria: 'none' });
  const words = split.words as HTMLElement[];
  const last: number[] = words.map(() => -1);
  const set = (p: number) => {
    const n = words.length;
    for (let i = 0; i < n; i++) {
      const local = Math.max(0, Math.min(1, p * (n + 6) - i));
      // CSS maps this 0..1 onto a colour that never drops below 3:1 (see --scrub-min)
      const q = Math.round(local * 50) / 50;
      if (q !== last[i]) {
        last[i] = q;
        words[i].style.setProperty('--k', String(q));
      }
    }
  };
  set(reducedMotion() ? 1 : 0);
  return { set, revert: () => split.revert() };
}
