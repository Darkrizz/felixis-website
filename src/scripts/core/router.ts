// Page lifecycle under Astro's ClientRouter. The nav, the WebGL canvas and the cover are
// persisted; everything page-specific is built on astro:page-load and torn down before swap.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cover, uncover, coverActive } from '../effects/cover';
import { magnetic, weightField } from '../effects/fx';
import { onMotionChange, PIN_QUERY } from './prefs';
import { resetScroll, resizeScroll, scrollToTarget } from './scroll';
import { engineRef, setStage } from './stage';
import { sound } from '../effects/sound';
import { bindDemos } from '../demos/registry';

type Cleanup = () => void;

type PageModule = { default: () => Cleanup | void };

const PAGES: Record<string, () => Promise<PageModule>> = {
  home: () => import('../pages/home'),
  service: () => import('../pages/service'),
  lab: () => import('../pages/generic'),
  experiment: () => import('../pages/generic'),
  start: () => import('../pages/generic'),
  '404': () => import('../pages/generic'),
};

let cleanups: Cleanup[] = [];
let ctx: gsap.Context | null = null;
let lastClick: { x: number; y: number } | null = null;
let generation = 0;

const root = document.documentElement;

function bindEffects() {
  const out: Cleanup[] = [];
  document.querySelectorAll<HTMLElement>('main [data-fx], footer [data-fx]').forEach((el) => {
    const fx = el.dataset.fx;
    if (fx === 'magnetic') out.push(magnetic(el));
    if (fx === 'weight-field') out.push(weightField(el));
  });
  // Persisted nav: magnetic CTA binds once.
  document.querySelectorAll<HTMLElement>('.nav [data-fx="magnetic"]:not([data-bound])').forEach((el) => {
    el.dataset.bound = '1';
    magnetic(el);
  });
  return out;
}

function markCurrent() {
  const path = location.pathname;
  document.querySelectorAll<HTMLAnchorElement>('.nav__link, .menu__links a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    const current = href !== '/' && path.startsWith(href);
    if (current) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

async function initPage() {
  const gen = ++generation;
  const page = root.dataset.page || 'home';
  markCurrent();
  ctx = gsap.context(() => {});
  cleanups.push(...bindEffects());
  cleanups.push(bindDemos(document));

  // Smooth in-page links that target sections ("How we work").
  const onClick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-scroll-to]');
    if (!a) return;
    const target = document.getElementById(a.dataset.scrollTo!);
    if (!target) return;
    e.preventDefault();
    const heading = target.querySelector<HTMLElement>('h2, h1');
    if (heading && !heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    scrollToTarget(target, heading);
  };
  document.addEventListener('click', onClick);
  cleanups.push(() => document.removeEventListener('click', onClick));

  const load = PAGES[page];
  if (load) {
    const mod = await load();
    if (gen !== generation) return;
    ctx.add(() => {
      const c = mod.default();
      if (c) cleanups.push(c);
    });
  } else {
    setStage([{ formation: 'clover3d', anchor: 'hero', pose: 'tilt' }]);
  }
  ScrollTrigger.sort();
  await document.fonts.ready;
  if (gen !== generation) return;
  ScrollTrigger.refresh();
}

function teardownPage() {
  generation++;
  cleanups.forEach((fn) => fn());
  cleanups = [];
  ctx?.revert();
  ctx = null;
  ScrollTrigger.getAll().forEach((st) => st.kill());
}

export function initRouter() {
  addEventListener('pointerdown', (e) => (lastClick = { x: e.clientX, y: e.clientY }), { capture: true, passive: true });

  document.addEventListener('astro:before-preparation', (ev) => {
    const e = ev as Event & { loader: () => Promise<void> };
    const original = e.loader;
    const ground = getComputedStyle(root).getPropertyValue('--ground').trim() || '#13201A';
    sound.tick(5);
    e.loader = async () => {
      await Promise.all([original(), cover({ x: lastClick?.x, y: lastClick?.y, color: ground })]);
    };
  });

  document.addEventListener('astro:before-swap', (ev) => {
    const e = ev as Event & { newDocument: Document };
    engineRef.current?.freezeForSwap();
    teardownPage();
    // Keep runtime state on <html> across the swap (Astro copies the new document's attributes).
    const next = e.newDocument.documentElement;
    next.dataset.theme = root.dataset.theme;
    const keep = [...root.classList].filter((c) => c !== 'preload' && c !== 'preload-page' && c !== 'scrolled');
    next.className = keep.join(' ');
  });

  document.addEventListener('astro:after-swap', () => {
    resetScroll(0);
    resizeScroll();
  });

  document.addEventListener('astro:page-load', async () => {
    await initPage();
    if (coverActive()) await uncover();
  });

  onMotionChange(() => {
    teardownPage();
    initPage();
  });

  // Pages choose their layout (pinned sections or stacked) when they build. If the viewport
  // crosses that boundary later (DevTools device mode, a rotated tablet, a resized window),
  // rebuild the page so it never keeps the desktop choreography at phone size.
  const layout = matchMedia(PIN_QUERY);
  let rebuild = 0;
  layout.addEventListener('change', () => {
    clearTimeout(rebuild);
    rebuild = window.setTimeout(() => {
      teardownPage();
      initPage();
    }, 150);
  });
}
