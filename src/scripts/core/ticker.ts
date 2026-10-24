// The one clock. gsap.ticker calls Lenis first (prioritised), which updates ScrollTrigger,
// then runs these phases in a fixed order so every reader sees the same frame.

import { gsap } from 'gsap';
import { sampleInput } from './signals';

type Phase = 'input' | 'sim' | 'read' | 'write' | 'render' | 'overlay';
type FrameFn = (time: number, dt: number) => void;

const PHASES: Phase[] = ['input', 'sim', 'read', 'write', 'render', 'overlay'];
const subs: Record<Phase, Set<FrameFn>> = {
  input: new Set(),
  sim: new Set(),
  read: new Set(),
  write: new Set(),
  render: new Set(),
  overlay: new Set(),
};

let last = 0;
/** frame time in ms, exponentially smoothed; Proof and the GL governor read it */
export const frameStats = { dt: 16.7, fps: 60, frames: 0 };

function run(time: number) {
  const dt = last ? Math.min(time - last, 0.1) : 1 / 60;
  last = time;
  frameStats.dt += (dt * 1000 - frameStats.dt) * 0.08;
  frameStats.fps = 1000 / frameStats.dt;
  frameStats.frames++;
  sampleInput();
  for (const p of PHASES) for (const fn of subs[p]) fn(time, dt);
}

let started = false;
export function startTicker() {
  if (started) return;
  started = true;
  gsap.ticker.lagSmoothing(0);
  gsap.ticker.add(run);
}

export function onFrame(phase: Phase, fn: FrameFn) {
  subs[phase].add(fn);
  return () => subs[phase].delete(fn);
}
