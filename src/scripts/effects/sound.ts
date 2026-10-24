// Interface sound, synthesised on the fly (no audio files). Off until the visitor turns it on.
// Pitches come from a pentatonic scale so any sequence of ticks sounds intentional.

import { soundOn, saveSound } from '../core/prefs';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = soundOn();

const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
const BASE = 392; // G4

const freq = (step: number) => BASE * Math.pow(2, PENTA[((step % PENTA.length) + PENTA.length) % PENTA.length] / 12);

function ensure() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.16;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend();
      else if (enabled) ctx.resume();
    });
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function blip(f: number, when = 0, len = 0.09, type: OscillatorType = 'square', gain = 0.5) {
  if (!enabled) return;
  const ac = ensure();
  const t = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2400;
  osc.type = type;
  osc.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  osc.connect(lp).connect(g).connect(master!);
  osc.start(t);
  osc.stop(t + len + 0.02);
}

export const sound = {
  get on() {
    return enabled;
  },
  set(on: boolean) {
    enabled = on;
    saveSound(on);
    if (on) {
      ensure();
      blip(freq(4), 0, 0.12, 'triangle');
      blip(freq(7), 0.07, 0.14, 'triangle');
    } else ctx?.suspend();
  },
  /** a short pixel tick; `step` picks the note */
  tick(step = 0) {
    blip(freq(step), 0, 0.06, 'square', 0.28);
  },
  /** soft rising chirp for primary buttons */
  chirp() {
    if (!enabled) return;
    const ac = ensure();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq(5), t);
    osc.frequency.exponentialRampToValueAtTime(freq(8), t + 0.12);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.35, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(g).connect(master!);
    osc.start(t);
    osc.stop(t + 0.2);
  },
  /** four notes, one per leaf; the gold leaf (second) rings highest */
  arpeggio() {
    [3, 9, 5, 7].forEach((s, i) => blip(freq(s), i * 0.11, 0.32, 'triangle', 0.45));
    blip(freq(10), 0.5, 0.6, 'sine', 0.3);
  },
};
