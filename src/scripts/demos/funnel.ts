// Funnel demo: pure arithmetic on the visitor's own inputs. The step with the lowest
// pass-through rate is marked, along with what lifting it by 10 points would add.

const LABELS = ['Visit the site', 'Open a service page', 'Start the contact form', 'Send it'];

export default function funnel(root: HTMLElement) {
  const inputs = [...root.querySelectorAll<HTMLInputElement>('[data-step]')];
  const bars = root.querySelector<HTMLOListElement>('[data-bars]')!;
  const tip = root.querySelector<HTMLElement>('[data-tip]')!;

  const update = () => {
    const v = inputs.map((i) => Math.max(0, Number(i.value) || 0));
    const visits = v[0];
    const rates = v.slice(1).map((r) => Math.min(100, r) / 100);
    const counts = [visits];
    rates.forEach((r, i) => counts.push(counts[i] * r));
    const leak = rates.indexOf(Math.min(...rates)) + 1;
    bars.innerHTML = counts
      .map(
        (n, i) =>
          `<li class="${i === leak ? 'is-leak' : ''}"><span class="fun__row"><span>${LABELS[i]}</span><span class="fun__n">${Math.round(n).toLocaleString()}</span></span><span class="fun__bar" style="transform:scaleX(${visits ? Math.max(0.004, n / visits) : 0})"></span></li>`,
      )
      .join('');
    const before = counts[counts.length - 1];
    const lifted = rates.map((r, i) => (i === leak - 1 ? Math.min(1, r + 0.1) : r)).reduce((a, r) => a * r, visits);
    const gain = Math.round(lifted - before);
    tip.textContent = visits
      ? `The weakest step is "${LABELS[leak]}" at ${Math.round(rates[leak - 1] * 100)}%. Lifting it by ten points would turn ${Math.round(before).toLocaleString()} briefs a month into ${Math.round(lifted).toLocaleString()} (+${gain.toLocaleString()}).`
      : 'Enter your monthly visitors to start.';
  };
  root.addEventListener('input', update);
  update();
  return () => root.removeEventListener('input', update);
}
