// The four leaves. On desktop the section pins for five screens: an overview, then one step
// per service. The active panel swells (CSS grid tracks animate), and the clover beside the
// panels lights that leaf's eight cells as you scroll. Scroll is the single source of truth:
// clicking a panel scrolls to its step.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { stage } from '../core/stage';
import { sound } from '../effects/sound';
import { scrollToTarget } from '../core/scroll';
import { SERVICES } from '../../data/services';

const OVERVIEW = 0.08;
const STEP = 0.2;
const DONE = OVERVIEW + STEP * 4; // 0.88

export function leaves(section: HTMLElement, opts: { pin: boolean; reduced: boolean }) {
  const grid = section.querySelector<HTMLElement>('[data-leaves-grid]')!;
  const panels = [...grid.querySelectorAll<HTMLElement>('.leaf')];
  const buttons = [...grid.querySelectorAll<HTMLButtonElement>('[data-leaf-btn]')];
  const stepN = section.querySelector<HTMLElement>('[data-step-n]')!;
  const stepName = section.querySelector<HTMLElement>('[data-step-name]')!;
  const svgCells = [...section.querySelectorAll<SVGRectElement>('[data-lit-svg] .clover__cell')];
  let active = -2;
  let complete = false;
  let lastLitCell = -1;

  const setLitSvg = (lit: number) => {
    const n = Math.floor(lit);
    if (n === lastLitCell) return;
    if (n > lastLitCell && lastLitCell >= 0) sound.tick(n);
    lastLitCell = n;
    svgCells.forEach((c) => c.classList.toggle('is-off', Number(c.dataset.seq) >= n));
  };

  const setActive = (i: number) => {
    if (i === active) return;
    active = i;
    grid.dataset.active = String(i);
    const col = i % 2;
    const row = Math.floor(i / 2);
    const big = 'minmax(0, 3.2fr)';
    const small = 'minmax(0, 1fr)';
    const even = 'minmax(0, 1fr)';
    if (i < 0) {
      grid.style.setProperty('--c1', even);
      grid.style.setProperty('--c2', even);
      grid.style.setProperty('--r1', even);
      grid.style.setProperty('--r2', even);
    } else {
      grid.style.setProperty('--c1', col === 0 ? big : small);
      grid.style.setProperty('--c2', col === 1 ? big : small);
      grid.style.setProperty('--r1', row === 0 ? big : small);
      grid.style.setProperty('--r2', row === 1 ? big : small);
    }
    panels.forEach((p, k) => {
      const on = k === i;
      p.classList.toggle('is-active', on);
      p.classList.toggle('is-small', i >= 0 && !on);
      p.classList.toggle('is-done', i >= 0 && k < i);
      const body = p.querySelector<HTMLElement>('.leaf__body');
      if (body) body.inert = !on;
      buttons[k].setAttribute('aria-expanded', String(on));
    });
    stepN.textContent = i < 0 ? '00' : SERVICES[i].n;
    stepName.textContent = i < 0 ? 'Four stages, one clover' : `${SERVICES[i].name}, step ${i + 1} of 4`;
  };

  const progressToLit = (p: number) => Math.max(0, Math.min(32, ((p - OVERVIEW) / (DONE - OVERVIEW)) * 32)) + (p > DONE + 0.03 ? 1 : 0);

  const setComplete = (on: boolean) => {
    if (on === complete) return;
    complete = on;
    gsap.to(stage, { gold: on ? 1 : 0, duration: on ? 0.9 : 0.4, ease: on ? 'expo.out' : 'power2.out' });
    if (on) {
      sound.arpeggio();
      stepN.textContent = '04';
      stepName.textContent = 'All four leaves. That is the clover.';
    }
  };

  if (!opts.pin) {
    // stacked layout: every panel open, clover lights as the list scrolls past
    section.classList.remove('is-pinned');
    panels.forEach((p) => {
      p.classList.remove('is-active', 'is-small', 'is-done');
      const body = p.querySelector<HTMLElement>('.leaf__body');
      if (body) body.inert = false;
    });
    const st = ScrollTrigger.create({
      id: 'leaves',
      trigger: grid,
      start: 'top 70%',
      end: 'bottom 70%',
      onUpdate: (self) => {
        const lit = opts.reduced ? 33 : Math.min(33, self.progress * 34);
        stage.lit = lit;
        setLitSvg(lit);
        const i = Math.min(3, Math.floor(self.progress * 4));
        stepN.textContent = SERVICES[i].n;
        stepName.textContent = SERVICES[i].name;
      },
    });
    if (opts.reduced) setLitSvg(33);
    return () => st.kill();
  }

  section.classList.add('is-pinned');
  setActive(-1);
  const st = ScrollTrigger.create({
    id: 'leaves',
    trigger: section,
    start: 'top top',
    end: '+=500%',
    pin: true,
    pinSpacing: true,
    onUpdate: (self) => {
      const p = self.progress;
      // step bands with a little hysteresis so a panel never flickers at a boundary
      let target = p < OVERVIEW ? -1 : Math.min(3, Math.floor((p - OVERVIEW) / STEP));
      if (target !== active && active >= 0 && target >= 0) {
        const edge = OVERVIEW + STEP * Math.max(target, active);
        if (Math.abs(p - edge) < 0.012) target = active;
      }
      setActive(target);
      const lit = progressToLit(p);
      stage.lit = lit;
      setLitSvg(lit);
      setComplete(p > DONE + 0.04);
    },
  });

  const onClick = (e: Event) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-leaf-btn]');
    if (!b) return;
    const i = Number(b.dataset.leafBtn);
    const y = st.start + (OVERVIEW + STEP * i + STEP * 0.5) * (st.end - st.start);
    scrollToTarget(y, panels[i].querySelector<HTMLElement>('.leaf__body'));
  };
  grid.addEventListener('click', onClick);

  return () => {
    grid.removeEventListener('click', onClick);
    st.kill();
    section.classList.remove('is-pinned');
    ['--c1', '--c2', '--r1', '--r2'].forEach((p) => grid.style.removeProperty(p));
  };
}
