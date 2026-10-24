// Spring demo: semi-implicit Euler on the shared ticker. The plot is the step response for
// the current settings, integrated with the same code the cell uses.

import { onFrame } from '../core/ticker';
import { sound } from '../effects/sound';

function response(k: number, c: number, m: number) {
  const pts: number[] = [];
  let x = 1;
  let v = 0;
  const dt = 1 / 240;
  let settle = 0;
  let peak = 0;
  for (let i = 0; i < 240 * 3; i++) {
    const f = -k * x - c * v;
    v += (f / m) * dt;
    x += v * dt;
    if (i % 4 === 0) pts.push(x);
    if (x < 0) peak = Math.max(peak, -x);
    if (Math.abs(x) > 0.02 || Math.abs(v) > 0.05) settle = (i + 1) * dt;
  }
  return { pts, settle, overshoot: peak };
}

export default function spring(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>('[data-stage]')!;
  const cell = root.querySelector<HTMLButtonElement>('[data-cell]')!;
  const kIn = root.querySelector<HTMLInputElement>('[data-k]')!;
  const cIn = root.querySelector<HTMLInputElement>('[data-c]')!;
  const mIn = root.querySelector<HTMLInputElement>('[data-m]')!;
  const plot = root.querySelector<HTMLCanvasElement>('[data-plot]')!;
  const read = root.querySelector<HTMLElement>('[data-read]')!;
  const code = root.querySelector<HTMLElement>('[data-code]')!;
  const s = { x: 0, y: 0, vx: 0, vy: 0, drag: false, ox: 0, oy: 0, awake: false };

  const params = () => ({ k: Number(kIn.value), c: Number(cIn.value), m: Number(mIn.value) });

  const draw = () => {
    const { k, c, m } = params();
    root.querySelector('[data-k-out]')!.textContent = String(k);
    root.querySelector('[data-c-out]')!.textContent = String(c);
    root.querySelector('[data-m-out]')!.textContent = m.toFixed(1);
    const r = response(k, c, m);
    const ratio = c / (2 * Math.sqrt(k * m));
    read.textContent = `Settles in ${r.settle.toFixed(2)}s, overshoots by ${Math.round(r.overshoot * 100)}%. Damping ratio ${ratio.toFixed(2)}: ${ratio < 1 ? 'bouncy' : ratio < 1.05 ? 'critically damped' : 'sluggish'}.`;
    code.innerHTML = `// one frame of a damped spring\nconst stiffness = <b>${k}</b>, damping = <b>${c}</b>, mass = <b>${m.toFixed(1)}</b>;\nconst force = -stiffness * x - damping * v;\nv += (force / mass) * dt;\nx += v * dt;`;
    const rect = plot.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    plot.width = Math.round(rect.width * dpr);
    plot.height = Math.round(rect.height * dpr);
    const ctx = plot.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const css = getComputedStyle(root);
    const mid = rect.height * 0.62;
    ctx.strokeStyle = css.getPropertyValue('--line-strong');
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(rect.width, mid);
    ctx.stroke();
    ctx.fillStyle = css.getPropertyValue('--leaf');
    const w = rect.width / r.pts.length;
    r.pts.forEach((x, i) => {
      const y = mid - x * rect.height * 0.5;
      ctx.fillRect(i * w, Math.min(y, mid), Math.max(1, w - 0.5), Math.abs(mid - y) || 1);
    });
  };

  const tick = (_t: number, dt: number) => {
    if (s.drag || !s.awake) return;
    const { k, c, m } = params();
    const steps = 4;
    const h = Math.min(dt, 1 / 30) / steps;
    for (let i = 0; i < steps; i++) {
      s.vx += ((-k * s.x - c * s.vx) / m) * h;
      s.vy += ((-k * s.y - c * s.vy) / m) * h;
      s.x += s.vx * h;
      s.y += s.vy * h;
    }
    if (Math.abs(s.x) + Math.abs(s.y) < 0.2 && Math.abs(s.vx) + Math.abs(s.vy) < 2) {
      s.x = s.y = s.vx = s.vy = 0;
      s.awake = false;
    }
    cell.style.transform = `translate(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px)`;
  };
  const off = onFrame('sim', tick);

  const down = (e: PointerEvent) => {
    s.drag = true;
    cell.setPointerCapture(e.pointerId);
    s.ox = e.clientX - s.x;
    s.oy = e.clientY - s.y;
  };
  const move = (e: PointerEvent) => {
    if (!s.drag) return;
    const r = stage.getBoundingClientRect();
    s.x = Math.max(-r.width / 2 + 28, Math.min(r.width / 2 - 28, e.clientX - s.ox));
    s.y = Math.max(-r.height / 2 + 28, Math.min(r.height / 2 - 28, e.clientY - s.oy));
    cell.style.transform = `translate(${s.x}px, ${s.y}px)`;
  };
  const up = () => {
    if (!s.drag) return;
    s.drag = false;
    s.awake = true;
    s.vx = s.vy = 0;
    sound.tick(4);
  };
  const key = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    s.x = -stage.clientWidth * 0.35;
    s.y = -stage.clientHeight * 0.3;
    s.awake = true;
    sound.tick(6);
  };
  cell.addEventListener('pointerdown', down);
  cell.addEventListener('pointermove', move);
  cell.addEventListener('pointerup', up);
  cell.addEventListener('pointercancel', up);
  cell.addEventListener('keydown', key);
  root.addEventListener('input', draw);
  const ro = new ResizeObserver(draw);
  ro.observe(plot);
  draw();
  return () => {
    off();
    ro.disconnect();
    root.removeEventListener('input', draw);
  };
}
