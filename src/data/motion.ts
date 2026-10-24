// Motion grammar. CSS mirrors these in tokens.css; Inspect mode reads them to label curves.

export const EASE = {
  /** anything that travels */
  glide: { css: 'cubic-bezier(0.16, 1, 0.3, 1)', gsap: 'expo.out' },
  /** morphs and state changes */
  swing: { css: 'cubic-bezier(0.65, 0, 0.35, 1)', gsap: 'fx.swing' },
  /** pixel moments: fills, reveals, wipes */
  step: { css: 'steps(6, jump-end)', gsap: 'steps(6)' },
} as const;

/** Beat-based durations in seconds (beat = 0.6s). */
export const DUR = {
  tick: 0.12,
  quick: 0.24,
  short: 0.36,
  beat: 0.6,
  long: 1.2,
} as const;

export const STAGGER = { tight: 0.03, loose: 0.06 } as const;
