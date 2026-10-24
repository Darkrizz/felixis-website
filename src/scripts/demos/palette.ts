// Palette demo: six steps from one hue in OKLCH, each labelled with its hex and whether
// white or ink text on it passes WCAG AA.

import { oklch, hex, contrast, type RGB } from './color';
import { sound } from '../effects/sound';

const MOODS = {
  calm: { c: 0.06, l: [0.97, 0.88, 0.74, 0.58, 0.42, 0.26] },
  bold: { c: 0.2, l: [0.96, 0.86, 0.72, 0.6, 0.46, 0.3] },
  deep: { c: 0.13, l: [0.9, 0.72, 0.55, 0.42, 0.31, 0.2] },
} as const;

const WHITE: RGB = [1, 1, 1];
const INK: RGB = [0.075, 0.125, 0.1];

export default function palette(root: HTMLElement) {
  const hueIn = root.querySelector<HTMLInputElement>('[data-hue]')!;
  const hueOut = root.querySelector<HTMLOutputElement>('[data-hue-out]')!;
  const list = root.querySelector<HTMLOListElement>('[data-swatches]')!;
  const sample = root.querySelector<HTMLElement>('[data-sample]')!;
  const note = root.querySelector<HTMLElement>('[data-sample-note]')!;
  let lastHue = -1;

  const update = () => {
    const h = Number(hueIn.value);
    const mood = (root.querySelector<HTMLInputElement>('input[name="mood"]:checked')?.value ?? 'bold') as keyof typeof MOODS;
    const m = MOODS[mood];
    hueOut.textContent = String(h);
    const steps = m.l.map((l, i) => oklch(l, m.c * (i === 0 ? 0.35 : 1), h));
    list.innerHTML = steps
      .map((rgb) => {
        const onWhite = contrast(rgb, WHITE);
        const onInk = contrast(rgb, INK);
        const text = onWhite >= onInk ? WHITE : INK;
        const best = Math.max(onWhite, onInk);
        const label = best >= 7 ? 'AAA' : best >= 4.5 ? 'AA' : 'fails';
        return `<li style="background:${hex(rgb)};color:${hex(text)}"><span>${hex(rgb)}</span><span class="pass">${best.toFixed(1)} ${label}</span></li>`;
      })
      .join('');
    // sample: lightest as ground, darkest as text, step 4 as the button
    const ground = steps[0];
    const ink = steps[5];
    const btn = steps[3];
    const btnText = contrast(btn, WHITE) >= contrast(btn, INK) ? WHITE : INK;
    sample.style.background = hex(ground);
    sample.style.color = hex(ink);
    const b = sample.querySelector<HTMLElement>('.palette__sample-btn')!;
    b.style.background = hex(btn);
    b.style.color = hex(btnText);
    note.textContent = `Text ${contrast(ground, ink).toFixed(1)}:1 · Button ${contrast(btn, btnText).toFixed(1)}:1`;
    const bucket = Math.round(h / 30);
    if (bucket !== lastHue) {
      lastHue = bucket;
      sound.tick(bucket);
    }
  };

  root.addEventListener('input', update);
  update();
  return () => root.removeEventListener('input', update);
}
