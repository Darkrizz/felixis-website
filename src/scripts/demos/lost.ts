// 404 game: the gold cell hops between empty grid positions; each catch fills two cells of
// the missing leaf. Four catches complete the clover.

import { CELLS } from '../../data/brand';
import { sound } from '../effects/sound';
import { reducedMotion } from '../core/prefs';

export default function lost(board: HTMLElement) {
  const gold = board.querySelector<HTMLButtonElement>('[data-nf-gold]')!;
  const slots = [...board.querySelectorAll<HTMLElement>('[data-slot]')].sort((a, b) => Number(a.dataset.slot) - Number(b.dataset.slot));
  const score = document.querySelector<HTMLElement>('[data-nf-score]');
  const taken = new Set(CELLS.map((c) => `${c.c}:${c.r}`));
  const empty: [number, number][] = [];
  for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) if (!taken.has(`${c}:${r}`)) empty.push([c, r]);
  let caught = 0;
  let timer = 0;

  const hop = () => {
    const [c, r] = empty[Math.floor(Math.random() * empty.length)];
    gold.style.gridColumn = String(c + 1);
    gold.style.gridRow = String(r + 1);
    sound.tick(c + r);
    // slower when motion is reduced, so it can still be caught by keyboard
    timer = window.setTimeout(hop, reducedMotion() ? 2600 : Math.max(520, 1050 - caught * 140));
  };

  const catchIt = () => {
    caught++;
    slots.slice(0, caught * 2).forEach((s) => s.classList.add('is-filled'));
    if (score) score.textContent = caught >= 4 ? 'All four caught. The clover is whole again.' : `${caught} of 4 caught`;
    if (caught >= 4) {
      clearTimeout(timer);
      gold.hidden = true;
      sound.arpeggio();
      return;
    }
    sound.tick(9);
    clearTimeout(timer);
    hop();
  };

  gold.addEventListener('click', catchIt);
  hop();
  return () => clearTimeout(timer);
}
