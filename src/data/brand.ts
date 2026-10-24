// The Felixis mark as data. Everything that draws the clover (SVG, voxels, preloader,
// progress meters, tests) reads these cells, so the mark can only ever be drawn one way.
//
// Source: felixis trademarks/felixis-mark.svg. viewBox 64, cells of 6 units starting at 11,
// so the matrix is 7x7 (11..53). Each leaf is a 3x3 block missing its outer corner cell.

export const VIEWBOX = 64;
export const CELL = 6;
export const ORIGIN = 11;
export const GRID = 7;

export type Leaf = 'strategy' | 'design' | 'development' | 'growth' | 'centre';

/** Leaf order is the service order: top-left, top-right (gold), bottom-left, bottom-right. */
export const LEAVES: Exclude<Leaf, 'centre'>[] = ['strategy', 'design', 'development', 'growth'];

export interface Cell {
  /** column 0..6, left to right */
  c: number;
  /** row 0..6, top to bottom */
  r: number;
  leaf: Leaf;
  /** fill order 0..32: leaf by leaf in service order, centre outward within a leaf, centre cell last */
  seq: number;
}

const LEAF_ORIGIN: Record<Exclude<Leaf, 'centre'>, { c0: number; r0: number; skip: [number, number] }> = {
  strategy: { c0: 0, r0: 0, skip: [0, 0] },
  design: { c0: 4, r0: 0, skip: [6, 0] },
  development: { c0: 0, r0: 4, skip: [0, 6] },
  growth: { c0: 4, r0: 4, skip: [6, 6] },
};

function buildCells(): Cell[] {
  const cells: Cell[] = [];
  let seq = 0;
  for (const leaf of LEAVES) {
    const { c0, r0, skip } = LEAF_ORIGIN[leaf];
    const own: Omit<Cell, 'seq'>[] = [];
    for (let r = r0; r < r0 + 3; r++) {
      for (let c = c0; c < c0 + 3; c++) {
        if (c === skip[0] && r === skip[1]) continue;
        own.push({ c, r, leaf });
      }
    }
    // Fill from the cell nearest the centre of the mark outward.
    own.sort((a, b) => {
      const da = Math.hypot(a.c - 3, a.r - 3);
      const db = Math.hypot(b.c - 3, b.r - 3);
      return da - db || a.r - b.r || a.c - b.c;
    });
    for (const cell of own) cells.push({ ...cell, seq: seq++ });
  }
  cells.push({ c: 3, r: 3, leaf: 'centre', seq: seq++ });
  return cells;
}

export const CELLS: readonly Cell[] = buildCells();

/** Cell top-left in viewBox units. */
export const cellX = (c: number) => ORIGIN + c * CELL;
export const cellY = (r: number) => ORIGIN + r * CELL;

export const COLORS = {
  forest: '#13201A',
  leaf: '#4CB27A',
  leafDeep: '#1F6B45',
  gold: '#E8B422',
  paper: '#EEF1EA',
} as const;

export type ThemeName = 'dark' | 'light';

/** Mark colours per theme, exactly as in the trademark files. */
export const MARK_COLORS: Record<ThemeName, Record<Leaf, string>> = {
  dark: {
    strategy: COLORS.leaf,
    design: COLORS.gold,
    development: COLORS.leaf,
    growth: COLORS.leaf,
    centre: COLORS.paper,
  },
  light: {
    strategy: COLORS.leafDeep,
    design: COLORS.gold,
    development: COLORS.leafDeep,
    growth: COLORS.leafDeep,
    centre: COLORS.forest,
  },
};

/** The leaf paths exactly as the trademark SVG writes them (used by tests and the plain mark). */
export const LEAF_PATHS: Record<Exclude<Leaf, 'centre'>, string> = {
  strategy: 'M17 11 H29 V29 H11 V17 H17 Z',
  design: 'M35 11 H47 V17 H53 V29 H35 Z',
  development: 'M11 35 H29 V53 H17 V47 H11 Z',
  growth: 'M35 35 H53 V47 H47 V53 H35 Z',
};
