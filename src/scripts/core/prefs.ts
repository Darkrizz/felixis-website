// User preferences that change behaviour site-wide. The inline head script applies them
// before first paint; this module keeps them in sync afterwards.

const root = document.documentElement;

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* storage blocked: preference lasts for this page only */
  }
};

const mq = matchMedia('(prefers-reduced-motion: reduce)');
const listeners = new Set<(reduced: boolean) => void>();

export const reducedMotion = () => root.classList.contains('motion-reduce');

export function setReducedMotion(reduce: boolean, persist = true) {
  root.classList.toggle('motion-reduce', reduce);
  root.classList.toggle('motion-full', !reduce);
  if (persist) write('fx-motion', reduce ? 'reduce' : 'full');
  listeners.forEach((fn) => fn(reduce));
}

export const onMotionChange = (fn: (reduced: boolean) => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

mq.addEventListener('change', () => {
  if (!read('fx-motion')) setReducedMotion(mq.matches, false);
});

export const theme = () => (root.dataset.theme === 'light' ? 'light' : 'dark');
/** The light theme is a per-visit choice; every new visit starts dark (sessionStorage, not localStorage). */
export const saveTheme = (t: 'light' | 'dark') => {
  try {
    sessionStorage.setItem('fx-theme', t);
  } catch {
    /* storage blocked: the theme lasts until the next page load */
  }
};

export const soundOn = () => read('fx-sound') === 'on';
export const saveSound = (on: boolean) => write('fx-sound', on ? 'on' : 'off');

export const saveData = () => Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);

export const testMode = /[?&]fx-test\b/.test(location.search);

/** Viewports that get the pinned, scroll-driven layouts; smaller ones get stacked sections. */
export const PIN_QUERY = '(min-width: 1024px) and (min-height: 640px)';
