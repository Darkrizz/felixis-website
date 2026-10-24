// Snippet demo: measures the title and description in pixels (the way result pages budget
// space) and truncates with an ellipsis where they'd run out of room.

const TITLE_PX = 580;
const DESC_PX = 600 * 2 - 40; // two lines, minus room for the ellipsis

export default function snippet(root: HTMLElement) {
  const title = root.querySelector<HTMLInputElement>('[data-title]')!;
  const desc = root.querySelector<HTMLTextAreaElement>('[data-desc]')!;
  const tOut = root.querySelector<HTMLOutputElement>('[data-t-out]')!;
  const dOut = root.querySelector<HTMLOutputElement>('[data-d-out]')!;
  const tPrev = root.querySelector<HTMLElement>('[data-t-prev]')!;
  const dPrev = root.querySelector<HTMLElement>('[data-d-prev]')!;
  const ctx = document.createElement('canvas').getContext('2d')!;

  const fit = (text: string, font: string, max: number) => {
    ctx.font = font;
    const w = ctx.measureText(text).width;
    if (w <= max) return { text, w, cut: false };
    let lo = 0;
    let hi = text.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (ctx.measureText(text.slice(0, mid) + ' ...').width <= max) lo = mid;
      else hi = mid - 1;
    }
    const cut = text.slice(0, lo).replace(/\s+\S*$/, '');
    return { text: cut + ' ...', w, cut: true };
  };

  const update = () => {
    const t = fit(title.value.trim(), '20px Arial', TITLE_PX);
    const d = fit(desc.value.trim().replace(/\s+/g, ' '), '14px Arial', DESC_PX);
    tPrev.textContent = t.text;
    dPrev.textContent = d.text;
    tOut.textContent = `${Math.round(t.w)} / ${TITLE_PX}px`;
    dOut.textContent = `${Math.round(d.w)} / ${DESC_PX}px`;
    tOut.classList.toggle('over', t.cut);
    dOut.classList.toggle('over', d.cut);
  };

  root.addEventListener('input', update);
  update();
  return () => root.removeEventListener('input', update);
}
