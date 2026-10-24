// Six design languages for the Range stage. Each one names its type, colour and grid so the
// readout under the stage can say exactly what changed. Font files are subset at build time
// (tools/subset-fonts.mjs) to the poster text below, so each costs a few kilobytes.

export const POSTER = {
  kicker: 'Felixis Web Solutions',
  title: 'Felixis',
  line: 'Websites, brands and web apps.',
  meta: ['Strategy', 'Design', 'Development', 'Growth'],
  cta: 'Start a project',
  num: '04',
  prompt: '$ felixis --start',
};

/** Every character any language might draw (decorations add > [ ] _ ok). */
export const POSTER_GLYPHS = [...new Set(Object.values(POSTER).flat().join('') + '>[]_ok0123456789.,:-$No')].join('');

export interface RangeFontFile {
  /** path under node_modules */
  src: string;
  weight: string;
  style?: 'normal' | 'italic';
  /** pin variation axes to make a small static instance */
  axes?: Record<string, number>;
}

export interface RangeLang {
  id: string;
  label: string;
  family: string;
  files: RangeFontFile[];
  type: string;
  colors: string[];
  grid: string;
  note: string;
}

export const RANGE: RangeLang[] = [
  {
    id: 'swiss',
    label: 'Swiss',
    family: 'Range Swiss',
    files: [
      { src: '@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2', weight: '900', axes: { wght: 900, wdth: 100 } },
      { src: '@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2', weight: '500', axes: { wght: 500, wdth: 100 } },
    ],
    type: 'Archivo, Black and Medium',
    colors: ['#F1F0EB', '#111111', '#E4002B'],
    grid: '12 columns, flush left, ragged right',
    note: 'One family, a strict grid and red as the only colour.',
  },
  {
    id: 'editorial',
    label: 'Editorial',
    family: 'Range Editorial',
    files: [
      { src: '@fontsource-variable/newsreader/files/newsreader-latin-standard-italic.woff2', weight: '400', style: 'italic', axes: { wght: 400, opsz: 72 } },
      { src: '@fontsource-variable/newsreader/files/newsreader-latin-standard-italic.woff2', weight: '500', style: 'italic', axes: { wght: 500, opsz: 14 } },
    ],
    type: 'Newsreader Italic at display size',
    colors: ['#F4EFE4', '#1C1A16', '#1F6B45'],
    grid: 'Centred masthead between hairline rules',
    note: 'A magazine cover: one serif, generous margins, the brand green as ink.',
  },
  {
    id: 'brutalist',
    label: 'Brutalist',
    family: 'Range Brutalist',
    files: [
      { src: '@fontsource/space-mono/files/space-mono-latin-400-normal.woff2', weight: '400' },
      { src: '@fontsource/space-mono/files/space-mono-latin-700-normal.woff2', weight: '700' },
    ],
    type: 'Space Mono, Regular and Bold',
    colors: ['#FFFFFF', '#000000', '#FFE500'],
    grid: 'Visible boxes, thick borders, nothing hidden',
    note: 'Structure on show: every box has a border and every link is blue.',
  },
  {
    id: 'glass',
    label: 'Glass',
    family: 'Range Glass',
    files: [
      { src: '@fontsource-variable/mona-sans/files/mona-sans-latin-standard-normal.woff2', weight: '300', axes: { wght: 300, wdth: 125 } },
      { src: '@fontsource-variable/mona-sans/files/mona-sans-latin-standard-normal.woff2', weight: '500', axes: { wght: 500, wdth: 112.5 } },
    ],
    type: 'Mona Sans Expanded, Light',
    colors: ['#0E1512', '#4CB27A', '#E8B422'],
    grid: 'One frosted card floating over light',
    note: 'Depth from blur and light, with the brand colours as the glow.',
  },
  {
    id: 'terminal',
    label: 'Terminal',
    family: 'Doto',
    files: [],
    type: 'Doto, a dot-matrix face',
    colors: ['#07100B', '#4CB27A', '#E8B422'],
    grid: 'Monospaced lines, a prompt and a caret',
    note: 'Phosphor green on black, scanlines and a blinking cursor.',
  },
  {
    id: 'soft',
    label: 'Soft 3D',
    family: 'Range Soft',
    files: [
      { src: '@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2', weight: '900', axes: { wght: 1000 } },
      { src: '@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2', weight: '700', axes: { wght: 700 } },
    ],
    type: 'Nunito Black, rounded',
    colors: ['#EDE7FF', '#3D2E9C', '#9EE6C8'],
    grid: 'Loose, inflated shapes that overlap',
    note: 'Toy-like and friendly: rounded type, pastel clay and soft shadows.',
  },
];

export const fontUrl = (langId: string, i: number) => `/fonts/range/${langId}-${i}.woff2`;
