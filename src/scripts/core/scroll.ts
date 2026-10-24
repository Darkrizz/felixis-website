// Lenis smooth scroll wired into ScrollTrigger and the shared ticker.
// Under reduced motion Lenis is never created and the browser scrolls natively.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { reducedMotion, onMotionChange } from './prefs';
import { scroll } from './signals';

let lenis: Lenis | null = null;
let rafFn: ((t: number) => void) | null = null;

function create() {
  if (lenis || reducedMotion()) return;
  lenis = new Lenis({
    autoRaf: false,
    lerp: 0.1,
    smoothWheel: true,
    syncTouch: false,
    anchors: false,
    stopInertiaOnNavigate: true,
    prevent: (node: HTMLElement) => !!node.closest('dialog, [data-lenis-prevent]'),
  });
  lenis.on('scroll', ScrollTrigger.update);
  rafFn = (t: number) => lenis?.raf(t * 1000);
  gsap.ticker.add(rafFn, false, true);
}

function destroy() {
  if (!lenis) return;
  if (rafFn) gsap.ticker.remove(rafFn);
  lenis.destroy();
  lenis = null;
  rafFn = null;
}

export function initScroll() {
  ScrollTrigger.config({ ignoreMobileResize: true, limitCallbacks: true });
  create();
  onMotionChange((reduced) => {
    if (reduced) destroy();
    else create();
    ScrollTrigger.refresh();
  });
  // Native scroll still feeds the shared signal (and covers the no-Lenis path).
  gsap.ticker.add(() => {
    const y = lenis ? lenis.animatedScroll : scrollY;
    const v = lenis ? lenis.velocity : 0;
    scroll.y = y;
    scroll.v += (Math.max(-1, Math.min(1, v / 40)) - scroll.v) * 0.15;
    document.documentElement.classList.toggle('scrolled', y > 24);
  });
}

export const getLenis = () => lenis;

export function stopScroll() {
  lenis?.stop();
}
export function startScroll() {
  lenis?.start();
}

/** Jump without animation, e.g. after a page swap. */
export function resetScroll(y = 0) {
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo(0, y);
}

export function resizeScroll() {
  lenis?.resize();
}

/** Scroll to a section (or a position inside a pinned one) and move focus there. */
export function scrollToTarget(target: HTMLElement | number, focusEl?: HTMLElement | null) {
  const done = () => focusEl?.focus({ preventScroll: true });
  const offset = typeof target === 'number' ? 0 : -16;
  if (lenis && !reducedMotion()) {
    lenis.scrollTo(target, { offset, duration: 1.2, onComplete: done });
  } else {
    const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY + offset;
    window.scrollTo({ top: y, behavior: 'auto' });
    done();
  }
}
