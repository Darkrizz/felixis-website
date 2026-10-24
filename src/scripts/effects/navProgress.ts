// The nav clover is a scroll-progress meter: cells light in fill order (leaf by leaf,
// gold leaf second, centre last) as the page scrolls.

import { onFrame } from '../core/ticker';
import { scroll } from '../core/signals';

export function initNavProgress() {
  const cells = [...document.querySelectorAll<SVGRectElement>('[data-progress] .clover__cell')].sort(
    (a, b) => Number(a.dataset.seq) - Number(b.dataset.seq),
  );
  let lastLit = -1;
  onFrame('write', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scroll.y / max)) : 1;
    // Always show at least the first cell, and the whole mark once the page ends.
    const lit = p > 0.995 ? cells.length : Math.max(1, Math.ceil(p * cells.length));
    if (lit === lastLit) return;
    lastLit = lit;
    cells.forEach((c, i) => c.classList.toggle('is-off', i >= lit));
  });
}
