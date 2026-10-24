// The Range stage. Switching language: fonts load first, then every poster element is
// carried by GSAP Flip from its old layout to the new one, while the old background
// clears away in stepped cells (the site's pixel rhythm).

import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import type { RangeLang } from '../../data/range';
import { reducedMotion } from '../core/prefs';
import { sound } from '../effects/sound';

gsap.registerPlugin(Flip);

const loaded = new Map<string, Promise<void>>();

function loadFonts(lang: RangeLang) {
  if (!loaded.has(lang.id)) {
    const fam = lang.id === 'terminal' ? ['700 16px Doto'] : lang.files.map((f) => `${f.style ?? 'normal'} ${f.weight} 16px "${lang.family}"`);
    loaded.set(
      lang.id,
      Promise.all(fam.map((f) => document.fonts.load(f))).then(
        () => undefined,
        () => undefined,
      ),
    );
  }
  return loaded.get(lang.id)!;
}

export default function range(root: HTMLElement) {
  const langs: RangeLang[] = JSON.parse(document.querySelector('[data-range-json]')?.textContent || '[]');
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const stage = root.querySelector<HTMLElement>('[role="tabpanel"]')!;
  const poster = root.querySelector<HTMLElement>('[data-poster]')!;
  const wipe = root.querySelector<HTMLCanvasElement>('[data-wipe]')!;
  const spec = {
    type: root.querySelector<HTMLElement>('[data-spec-type]')!,
    colors: root.querySelector<HTMLElement>('[data-spec-colors]')!,
    grid: root.querySelector<HTMLElement>('[data-spec-grid]')!,
    note: root.querySelector<HTMLElement>('[data-spec-note]')!,
  };
  let current = 0;
  let busy = false;
  let flip: gsap.core.Timeline | null = null;

  const cellWipe = (fromColor: string, origin: { x: number; y: number } | null) => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    wipe.width = Math.round(w * dpr);
    wipe.height = Math.round(h * dpr);
    const ctx = wipe.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const size = Math.ceil(w / 24);
    const cols = Math.ceil(w / size);
    const rows = Math.ceil(h / size);
    const ox = origin?.x ?? 0;
    const oy = origin?.y ?? h / 2;
    const maxD = Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy));
    const cells: { x: number; y: number; t: number }[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) cells.push({ x: c * size, y: r * size, t: (Math.hypot(c * size - ox, r * size - oy) / maxD) * 0.75 + Math.random() * 0.2 });
    const state = { p: 0 };
    return gsap.to(state, {
      p: 1,
      duration: 0.75,
      ease: 'none',
      onUpdate: () => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = fromColor;
        for (const cell of cells) {
          const local = Math.min(1, Math.max(0, (state.p - cell.t * 0.75) / 0.25));
          const k = 1 - Math.ceil(local * 3) / 3;
          if (k <= 0) continue;
          const s = size * k;
          ctx.fillRect(cell.x + (size - s) / 2, cell.y + (size - s) / 2, s + 0.5, s + 0.5);
        }
      },
      onComplete: () => ctx.clearRect(0, 0, w, h),
    });
  };

  const writeSpec = (l: RangeLang) => {
    spec.type.textContent = l.type;
    spec.grid.textContent = l.grid;
    spec.note.textContent = l.note;
    spec.colors.innerHTML = l.colors.map((c) => `<span><i style="background:${c}"></i>${c}</span>`).join('');
  };

  async function select(i: number, origin: { x: number; y: number } | null) {
    if (i === current || busy) return;
    busy = true;
    const next = langs[i];
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
    });
    stage.setAttribute('aria-labelledby', tabs[i].id);
    await loadFonts(next);
    const oldBg = getComputedStyle(poster).backgroundColor;
    const els = poster.querySelectorAll<HTMLElement>('[data-flip]');
    if (reducedMotion()) {
      poster.dataset.lang = next.id;
    } else {
      const state = Flip.getState(els, { props: 'color,backgroundColor,borderRadius,opacity,fontSize,letterSpacing,filter,boxShadow' });
      poster.dataset.lang = next.id;
      flip?.progress(1).kill();
      flip = Flip.from(state, {
        duration: 0.85,
        ease: 'expo.inOut',
        stagger: 0.025,
        nested: true,
        absolute: false,
        scale: false,
        onComplete: () => gsap.set(els, { clearProps: 'all' }),
      });
      cellWipe(oldBg, origin);
      sound.tick(i * 2 + 1);
    }
    writeSpec(next);
    current = i;
    // warm the next language's fonts
    loadFonts(langs[(i + 1) % langs.length]);
    busy = false;
  }

  const onTab = (e: MouseEvent) => {
    const t = (e.target as HTMLElement).closest<HTMLButtonElement>('[role="tab"]');
    if (!t) return;
    const r = stage.getBoundingClientRect();
    const tr = t.getBoundingClientRect();
    select(tabs.indexOf(t), { x: tr.left + tr.width / 2 - r.left, y: 0 });
  };
  const onKey = (e: KeyboardEvent) => {
    const k = tabs.indexOf(e.target as HTMLButtonElement);
    if (k < 0) return;
    let n = -1;
    if (e.key === 'ArrowRight') n = (k + 1) % tabs.length;
    if (e.key === 'ArrowLeft') n = (k - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') n = 0;
    if (e.key === 'End') n = tabs.length - 1;
    if (n < 0) return;
    e.preventDefault();
    tabs[n].focus();
    select(n, null);
  };

  root.addEventListener('click', onTab);
  root.addEventListener('keydown', onKey);
  // warm the second language as the stage comes into view, so the first switch is instant
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) loadFonts(langs[1]);
  });
  io.observe(stage);
  loadFonts(langs[0]);

  return () => {
    io.disconnect();
    flip?.kill();
    root.removeEventListener('click', onTab);
    root.removeEventListener('keydown', onKey);
  };
}
