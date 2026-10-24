// Make a mark: paint a 7x7 grid, preview at icon sizes, export a tidy SVG whose cells are
// merged into horizontal runs (fewer shapes, no seams).

import { CELLS } from '../../data/brand';
import { sound } from '../effects/sound';

const INK: Record<string, string> = { leaf: '#4CB27A', gold: '#E8B422', paper: '#EEF1EA' };

export default function mark(root: HTMLElement) {
  const grid = root.querySelector<HTMLElement>('[data-grid]')!;
  const px = [...root.querySelectorAll<HTMLButtonElement>('.mam__px')];
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const state: (string | null)[] = Array(49).fill(null);
  let painting: string | null | undefined;

  const ink = () => {
    const v = root.querySelector<HTMLInputElement>('input[name="ink"]:checked')?.value ?? 'leaf';
    return v === 'erase' ? null : v;
  };

  const svg = (bg?: string) => {
    const rects: string[] = [];
    for (let r = 0; r < 7; r++) {
      let c = 0;
      while (c < 7) {
        const v = state[r * 7 + c];
        if (!v) {
          c++;
          continue;
        }
        let end = c;
        while (end + 1 < 7 && state[r * 7 + end + 1] === v) end++;
        rects.push(`<rect x="${11 + c * 6}" y="${11 + r * 6}" width="${(end - c + 1) * 6}" height="6" fill="${INK[v]}"/>`);
        c = end + 1;
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" shape-rendering="crispEdges">${bg ? `<rect width="64" height="64" fill="${bg}"/>` : ''}${rects.join('')}</svg>`;
  };

  const render = () => {
    px.forEach((b, i) => {
      const v = state[i];
      b.style.background = v ? INK[v] : '';
      b.setAttribute('aria-label', `Row ${Math.floor(i / 7) + 1}, column ${(i % 7) + 1}, ${v ?? 'empty'}`);
    });
    const out = svg();
    root.querySelectorAll<HTMLElement>('[data-pv]').forEach((el) => (el.innerHTML = out));
  };

  const paint = (b: HTMLButtonElement) => {
    const i = Number(b.dataset.r) * 7 + Number(b.dataset.c);
    const v = painting === undefined ? ink() : painting;
    if (state[i] === v) return;
    state[i] = v;
    sound.tick(Number(b.dataset.r) + Number(b.dataset.c));
    render();
  };

  const down = (e: PointerEvent) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.mam__px');
    if (!b) return;
    e.preventDefault();
    const i = Number(b.dataset.r) * 7 + Number(b.dataset.c);
    // pressing a cell that already has this ink erases instead, like most pixel editors
    painting = state[i] === ink() ? null : ink();
    paint(b);
  };
  const move = (e: PointerEvent) => {
    if (painting === undefined) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const b = el?.closest<HTMLButtonElement>('.mam__px');
    if (b && grid.contains(b)) paint(b);
  };
  const up = () => (painting = undefined);
  const keyPaint = (e: KeyboardEvent) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.mam__px');
    if (!b) return;
    const c = Number(b.dataset.c);
    const r = Number(b.dataset.r);
    const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (moves[e.key]) {
      e.preventDefault();
      const nc = Math.max(0, Math.min(6, c + moves[e.key][0]));
      const nr = Math.max(0, Math.min(6, r + moves[e.key][1]));
      px[nr * 7 + nc].focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const i = r * 7 + c;
      painting = state[i] === ink() ? null : ink();
      paint(b);
      painting = undefined;
    }
  };

  const onAct = async (e: Event) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
    if (!a) return;
    if (a === 'clear') state.fill(null);
    if (a === 'felixis') {
      state.fill(null);
      for (const cell of CELLS) state[cell.r * 7 + cell.c] = cell.leaf === 'design' ? 'gold' : cell.leaf === 'centre' ? 'paper' : 'leaf';
    }
    if (a === 'download') {
      const url = URL.createObjectURL(new Blob([svg()], { type: 'image/svg+xml' }));
      const link = Object.assign(document.createElement('a'), { href: url, download: 'my-mark.svg' });
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = 'Saved my-mark.svg';
    }
    if (a === 'copy') {
      try {
        await navigator.clipboard.writeText(svg());
        status.textContent = 'SVG code copied';
      } catch {
        status.textContent = 'Copy was blocked by the browser. Use Download instead.';
      }
    }
    sound.tick(5);
    render();
  };

  grid.addEventListener('pointerdown', down);
  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
  grid.addEventListener('keydown', keyPaint);
  root.addEventListener('click', onAct);
  // a click without pointerdown (keyboard Enter on a button fires click) is handled by keyPaint
  grid.addEventListener('click', (e) => e.preventDefault());
  // start from the Felixis mark so there is something to edit
  for (const cell of CELLS) state[cell.r * 7 + cell.c] = cell.leaf === 'design' ? 'gold' : cell.leaf === 'centre' ? 'paper' : 'leaf';
  render();
  return () => {
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', up);
  };
}
