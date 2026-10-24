// Voxel sandbox controls. The engine does the physics; this wires the toolbar and turns
// drags on the stage into rotation (or paint strokes when a brush is picked).

import { engineRef, stage } from '../core/stage';
import { sound } from '../effects/sound';

export default function sandbox(root: HTMLElement) {
  const st = root.querySelector<HTMLElement>('[data-sbx-stage]')!;
  const gravityBtn = root.querySelector<HTMLButtonElement>('[data-sbx="gravity"]')!;
  let drag: { x: number; y: number; yaw: number; pitch: number } | null = null;
  let painting = false;

  const onClick = (e: Event) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-sbx]');
    const eng = engineRef.current;
    if (!b || !eng) return;
    const cmd = b.dataset.sbx as 'gravity' | 'explode' | 'reset';
    const on = eng.sandbox(cmd);
    if (cmd === 'gravity') gravityBtn.setAttribute('aria-pressed', String(on));
    if (cmd === 'reset') {
      gravityBtn.setAttribute('aria-pressed', 'false');
      const off = root.querySelector<HTMLInputElement>('input[name="brush"][value=""]');
      if (off) off.checked = true;
      painting = false;
      st.classList.remove('is-painting');
    }
    sound.tick(cmd === 'explode' ? 9 : cmd === 'gravity' ? (on ? 1 : 6) : 4);
  };
  const onBrush = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.name !== 'brush') return;
    painting = Boolean(input.value);
    st.classList.toggle('is-painting', painting);
    engineRef.current?.sandbox('brush', input.value || null);
    sound.tick(painting ? 7 : 2);
  };
  const down = (e: PointerEvent) => {
    if (painting) return;
    drag = { x: e.clientX, y: e.clientY, yaw: stage.spin.yaw, pitch: stage.spin.pitch };
    st.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    if (!drag) return;
    stage.spin.yaw = drag.yaw + (e.clientX - drag.x) * 0.008;
    stage.spin.pitch = Math.max(-1.2, Math.min(1.2, drag.pitch + (e.clientY - drag.y) * 0.006));
  };
  const up = () => (drag = null);
  const key = (e: KeyboardEvent) => {
    if (e.target !== st) return;
    const d: Record<string, [number, number]> = { ArrowLeft: [-0.15, 0], ArrowRight: [0.15, 0], ArrowUp: [0, -0.12], ArrowDown: [0, 0.12] };
    if (!d[e.key]) return;
    e.preventDefault();
    stage.spin.yaw += d[e.key][0];
    stage.spin.pitch = Math.max(-1.2, Math.min(1.2, stage.spin.pitch + d[e.key][1]));
  };
  st.tabIndex = 0;
  st.setAttribute('aria-label', 'Voxel clover. Use the arrow keys to turn it.');
  root.addEventListener('click', onClick);
  root.addEventListener('change', onBrush);
  st.addEventListener('pointerdown', down);
  st.addEventListener('pointermove', move);
  st.addEventListener('pointerup', up);
  st.addEventListener('pointercancel', up);
  st.addEventListener('keydown', key);
  return () => {
    engineRef.current?.sandbox('reset');
    root.removeEventListener('click', onClick);
    root.removeEventListener('change', onBrush);
  };
}
