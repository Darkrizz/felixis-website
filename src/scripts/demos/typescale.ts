// Type scale demo: step n = base * ratio^n, rendered live, with the CSS to copy.

const NAMES = ['-1', '0', '1', '2', '3', '4', '5', '6'];

export default function typescale(root: HTMLElement) {
  const base = root.querySelector<HTMLInputElement>('[data-base]')!;
  const baseOut = root.querySelector<HTMLOutputElement>('[data-base-out]')!;
  const ratio = root.querySelector<HTMLSelectElement>('[data-ratio]')!;
  const steps = root.querySelector<HTMLOListElement>('[data-steps]')!;
  const code = root.querySelector<HTMLElement>('[data-code]')!;

  const update = () => {
    const b = Number(base.value);
    const r = Number(ratio.value);
    baseOut.textContent = String(b);
    const sizes = NAMES.map((_, i) => b * Math.pow(r, i - 1));
    steps.innerHTML = sizes
      .map((px, i) => ({ px, i }))
      .reverse()
      .map(({ px, i }) => `<li><span class="ts__px">${px.toFixed(1)}</span><span class="ts__sample" style="font-size:${px.toFixed(2)}px">${i > 4 ? 'Felixis' : i > 1 ? 'Luck has nothing to do with it' : 'Body text sits here, comfortable at a glance.'}</span></li>`)
      .join('');
    code.textContent = `:root {\n${sizes.map((px, i) => `  --step-${NAMES[i]}: ${(px / 16).toFixed(4)}rem; /* ${px.toFixed(1)}px */`).join('\n')}\n}`;
  };
  root.addEventListener('input', update);
  update();
  return () => root.removeEventListener('input', update);
}
