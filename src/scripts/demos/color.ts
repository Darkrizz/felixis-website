// Colour maths for the design demos: OKLCH to sRGB with gamut mapping, WCAG contrast.

export type RGB = [number, number, number];

function oklchToLinear(l: number, c: number, h: number): RGB {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const L = l_ ** 3;
  const M = m_ ** 3;
  const S = s_ ** 3;
  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}

const toSrgb = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
const inGamut = (rgb: RGB) => rgb.every((v) => v >= -0.0001 && v <= 1.0001);

/** OKLCH to sRGB 0..1, reducing chroma until the colour fits the sRGB gamut. */
export function oklch(l: number, c: number, h: number): RGB {
  let lo = 0;
  let hi = c;
  let lin = oklchToLinear(l, c, h);
  if (!inGamut(lin)) {
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear(l, mid, h))) lo = mid;
      else hi = mid;
    }
    lin = oklchToLinear(l, lo, h);
  }
  return lin.map((v) => Math.min(1, Math.max(0, toSrgb(v)))) as RGB;
}

export const hex = (rgb: RGB) => '#' + rgb.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();

export function luminance(rgb: RGB) {
  const lin = rgb.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

export function contrast(a: RGB, b: RGB) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

export const hexToRgb = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;
