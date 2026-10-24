// Shared input signals. The voxels, the hero type and the footer wordmark all read these,
// which is why they move together.

export const pointer = {
  /** CSS px, viewport space */
  x: -9999,
  y: -9999,
  /** smoothed velocity, px per frame */
  vx: 0,
  vy: 0,
  /** true once the pointer has moved over the page */
  active: false,
  /** a button or finger is down */
  down: false,
  coarse: matchMedia('(pointer: coarse)').matches,
};

export const scroll = {
  y: 0,
  /** Lenis velocity, smoothed, roughly -1..1 for normal scrolling */
  v: 0,
};

export const viewport = {
  w: innerWidth,
  h: innerHeight,
  dpr: Math.min(devicePixelRatio || 1, 2),
};

/** performance.now() of the first scroll or interaction; the Proof readout uses it to split load from use */
export const firstInput = { t: Infinity };
const markInput = () => (firstInput.t = Math.min(firstInput.t, performance.now()));
for (const ev of ['wheel', 'touchstart', 'keydown', 'scroll', 'pointerdown']) addEventListener(ev, markInput, { once: true, passive: true });

let lastX = 0;
let lastY = 0;
let moved = false;

addEventListener(
  'pointermove',
  (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
    moved = true;
  },
  { passive: true },
);

addEventListener(
  'pointerdown',
  (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
    pointer.down = true;
  },
  { passive: true },
);

for (const ev of ['pointerup', 'pointercancel']) addEventListener(ev, () => (pointer.down = false), { passive: true });

document.documentElement.addEventListener('pointerleave', () => {
  pointer.active = false;
  pointer.x = pointer.y = -9999;
});

addEventListener('resize', () => {
  viewport.w = innerWidth;
  viewport.h = innerHeight;
  viewport.dpr = Math.min(devicePixelRatio || 1, 2);
});

/** Called once per frame by the ticker, before anything reads the pointer. */
export function sampleInput() {
  const dx = moved ? pointer.x - lastX : 0;
  const dy = moved ? pointer.y - lastY : 0;
  pointer.vx += (dx - pointer.vx) * 0.35;
  pointer.vy += (dy - pointer.vy) * 0.35;
  lastX = pointer.x;
  lastY = pointer.y;
  moved = false;
}
