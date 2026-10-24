// Container demo: the slider sets the box width; CSS container queries do the rest.
// This script only reports the width and which layout is active.

import { sound } from '../effects/sound';

export default function container(root: HTMLElement) {
  const box = root.querySelector<HTMLElement>('[data-box]')!;
  const input = root.querySelector<HTMLInputElement>('[data-w]')!;
  const out = root.querySelector<HTMLOutputElement>('[data-w-out]')!;
  const mode = root.querySelector<HTMLElement>('[data-mode]')!;
  let lastMode = '';

  const report = () => {
    const w = Math.round(box.getBoundingClientRect().width);
    out.textContent = `${w}px`;
    const m = w >= 460 ? 'wide: media, text and stats' : w >= 300 ? 'medium: media beside text' : 'narrow: stacked';
    mode.textContent = m;
    if (m !== lastMode) {
      if (lastMode) sound.tick(w >= 460 ? 7 : w >= 300 ? 4 : 1);
      lastMode = m;
    }
  };
  const onInput = () => {
    box.style.setProperty('--w', `${input.value}%`);
    report();
  };
  input.addEventListener('input', onInput);
  const ro = new ResizeObserver(report);
  ro.observe(box);
  report();
  return () => {
    input.removeEventListener('input', onInput);
    ro.disconnect();
  };
}
