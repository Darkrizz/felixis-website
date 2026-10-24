// Clover sequencer. Notes are scheduled ahead on the audio clock (a 25ms look-ahead loop),
// so timing stays tight even when the main thread is busy; the visuals follow the audio.

// pentatonic, top row highest
const FREQ = [1046.5, 880, 784, 659.3, 587.3, 523.3, 440];
// a starting loop: one or two notes per step, so it plays something the moment you press Play
const CLOVER_PATTERN = new Set(['0:1', '1:0', '2:2', '1:4', '0:5', '2:6', '3:3', '4:1', '5:0', '6:2', '4:5', '5:6', '6:4']);

export default function sequencer(root: HTMLElement) {
  const cells = [...root.querySelectorAll<HTMLButtonElement>('.seq__cell')];
  const head = root.querySelector<HTMLElement>('[data-head]')!;
  const play = root.querySelector<HTMLButtonElement>('[data-play]')!;
  const playLabel = root.querySelector<HTMLElement>('[data-play-label]')!;
  const bpm = root.querySelector<HTMLInputElement>('[data-bpm]')!;
  const bpmOut = root.querySelector<HTMLOutputElement>('[data-bpm-out]')!;
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let timer = 0;
  let step = 0;
  let nextTime = 0;
  const visualQueue: { step: number; time: number }[] = [];
  let raf = 0;

  const on = (c: HTMLButtonElement) => c.getAttribute('aria-pressed') === 'true';
  const set = (c: HTMLButtonElement, v: boolean) => c.setAttribute('aria-pressed', String(v));

  const voice = (freq: number, t: number, gold: boolean) => {
    const osc = ctx!.createOscillator();
    const g = ctx!.createGain();
    const f = ctx!.createBiquadFilter();
    osc.type = gold ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(gold ? 3200 : 1800, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gold ? 0.18 : 0.28, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    osc.connect(f).connect(g).connect(master!);
    osc.start(t);
    osc.stop(t + 0.35);
  };

  const schedule = () => {
    const spb = 60 / Number(bpm.value) / 2; // eighth notes
    while (nextTime < ctx!.currentTime + 0.1) {
      for (const c of cells) {
        if (Number(c.dataset.c) === step && on(c)) voice(FREQ[Number(c.dataset.r)], nextTime, c.dataset.leaf === 'design');
      }
      visualQueue.push({ step, time: nextTime });
      nextTime += spb;
      step = (step + 1) % 7;
    }
  };

  const draw = () => {
    if (!ctx) return;
    while (visualQueue.length && visualQueue[0].time <= ctx.currentTime) {
      const { step: s } = visualQueue.shift()!;
      head.style.setProperty('--step', String(s));
      for (const c of cells) {
        const hit = Number(c.dataset.c) === s && on(c);
        c.classList.toggle('is-hit', hit);
      }
    }
    raf = requestAnimationFrame(draw);
  };

  const start = async () => {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    await ctx.resume();
    step = 0;
    nextTime = ctx.currentTime + 0.05;
    timer = window.setInterval(schedule, 25);
    raf = requestAnimationFrame(draw);
    root.classList.add('is-playing');
    play.setAttribute('aria-pressed', 'true');
    playLabel.textContent = 'Stop';
  };
  const stop = () => {
    clearInterval(timer);
    cancelAnimationFrame(raf);
    visualQueue.length = 0;
    cells.forEach((c) => c.classList.remove('is-hit'));
    root.classList.remove('is-playing');
    play.setAttribute('aria-pressed', 'false');
    playLabel.textContent = 'Play';
    ctx?.suspend();
  };

  const pattern = (kind: string) => {
    cells.forEach((c) => {
      const key = `${c.dataset.c}:${c.dataset.r}`;
      set(c, kind === 'clover' ? CLOVER_PATTERN.has(key) : kind === 'random' ? Math.random() < 0.34 : false);
    });
  };

  const onClick = (e: Event) => {
    const t = e.target as HTMLElement;
    const cell = t.closest<HTMLButtonElement>('.seq__cell');
    if (cell) {
      set(cell, !on(cell));
      if (ctx && ctx.state === 'running') voice(FREQ[Number(cell.dataset.r)], ctx.currentTime, cell.dataset.leaf === 'design');
      return;
    }
    if (t.closest('[data-play]')) {
      if (play.getAttribute('aria-pressed') === 'true') stop();
      else start();
      return;
    }
    const p = t.closest<HTMLElement>('[data-pattern]');
    if (p) pattern(p.dataset.pattern!);
  };
  const onTempo = () => (bpmOut.textContent = bpm.value);

  root.addEventListener('click', onClick);
  bpm.addEventListener('input', onTempo);
  pattern('clover');
  return () => {
    stop();
    ctx?.close();
    root.removeEventListener('click', onClick);
  };
}
