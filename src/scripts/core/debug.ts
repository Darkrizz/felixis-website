// Test hooks, exposed only with ?fx-test. The CDP test suite drives the page through these.

import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { testMode } from './prefs';
import { engineRef, stage } from './stage';
import { getLenis, resetScroll } from './scroll';
import { frameStats } from './ticker';

const frames = (n = 2) => new Promise<void>((r) => {
  const step = () => (--n <= 0 ? r() : requestAnimationFrame(step));
  requestAnimationFrame(step);
});

export function initDebug() {
  if (!testMode) return;
  (window as unknown as { __fx: unknown }).__fx = {
    get engineLoaded() {
      return engineRef.current !== null;
    },
    get stage() {
      return { stations: stage.stations.map((s) => s.formation + '@' + s.anchor), lit: stage.lit, gold: stage.gold };
    },
    triggers: () => ScrollTrigger.getAll().map((st) => ({ id: st.vars.id, start: st.start, end: st.end, progress: st.progress, active: st.isActive })),
    stats: () => ({ ...engineRef.current?.stats(), fps: frameStats.fps }),
    async scrollTo(y: number) {
      resetScroll(y);
      ScrollTrigger.update();
      await frames(3);
    },
    async settled() {
      await document.fonts.ready;
      await frames(4);
      const lenis = getLenis();
      if (lenis) {
        for (let i = 0; i < 120 && lenis.isScrolling; i++) await frames(1);
      }
      await frames(2);
      return true;
    },
  };
}
