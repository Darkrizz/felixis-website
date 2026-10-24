// Positioning map: x = quiet..loud, y = experimental..classic (top to bottom).
import { sound } from '../effects/sound';

const QUADS = [
  { title: 'Considered and unusual', text: 'Small studios and architects live here: odd grids, restrained colour and motion that rewards a second look.' },
  { title: 'Built to be noticed', text: 'Launches and culture brands: kinetic type, strong colour, 3D and sound. Hard to ignore, easy to overdo.' },
  { title: 'Trusted and calm', text: 'Private banks and law firms: serif type, wide margins, almost no motion. Quiet confidence does the selling.' },
  { title: 'Confident heritage', text: 'Big type and a bold palette, but nothing that would surprise a long-time customer. Familiar, only louder.' },
];

const bar = (v: number) => {
  const n = Math.round(v * 6) + 1;
  return Array.from({ length: 7 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
};

export default function positioning(root: HTMLElement) {
  const map = root.querySelector<HTMLElement>('[data-map]')!;
  const dot = root.querySelector<HTMLButtonElement>('[data-dot]')!;
  const quads = [...root.querySelectorAll<HTMLElement>('.pos__quad')];
  const title = root.querySelector<HTMLElement>('[data-pos-title]')!;
  const text = root.querySelector<HTMLElement>('[data-pos-text]')!;
  const motion = root.querySelector<HTMLElement>('[data-pos-motion]')!;
  const type = root.querySelector<HTMLElement>('[data-pos-type]')!;
  const colour = root.querySelector<HTMLElement>('[data-pos-colour]')!;
  let x = 0.3;
  let y = 0.62;
  let lastQ = -1;
  let dragging = false;

  const set = (nx: number, ny: number) => {
    x = Math.min(1, Math.max(0, nx));
    y = Math.min(1, Math.max(0, ny));
    dot.style.setProperty('--x', x.toFixed(3));
    dot.style.setProperty('--y', y.toFixed(3));
    const q = (y < 0.5 ? 0 : 2) + (x < 0.5 ? 0 : 1);
    quads.forEach((el, i) => el.classList.toggle('is-on', i === q));
    if (q !== lastQ) {
      lastQ = q;
      title.textContent = QUADS[q].title;
      text.textContent = QUADS[q].text;
      sound.tick(q * 2 + 2);
    }
    // loudness drives motion and colour; the classic end raises type contrast
    motion.innerHTML = bar(x);
    colour.innerHTML = bar(x * 0.7 + (1 - y) * 0.3);
    type.innerHTML = bar(y * 0.6 + x * 0.4);
  };

  const fromEvent = (e: PointerEvent) => {
    const r = map.getBoundingClientRect();
    set((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  };
  const down = (e: PointerEvent) => {
    dragging = true;
    map.setPointerCapture(e.pointerId);
    fromEvent(e);
  };
  const move = (e: PointerEvent) => dragging && fromEvent(e);
  const up = () => (dragging = false);
  const key = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.03;
    const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (!d[e.key]) return;
    e.preventDefault();
    set(x + d[e.key][0], y + d[e.key][1]);
  };
  map.addEventListener('pointerdown', down);
  map.addEventListener('pointermove', move);
  map.addEventListener('pointerup', up);
  map.addEventListener('pointercancel', up);
  dot.addEventListener('keydown', key);
  set(x, y);
  return () => {
    map.removeEventListener('pointerdown', down);
    map.removeEventListener('pointermove', move);
    dot.removeEventListener('keydown', key);
  };
}
