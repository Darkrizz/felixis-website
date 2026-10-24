// The cell model in brand.ts must reproduce the trademark exactly: same leaves, same
// notches, same colours. Run with: npm run test:unit (Node strips the types itself).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CELLS, CELL, ORIGIN, LEAF_PATHS, MARK_COLORS, LEAVES } from '../../src/data/brand.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const trademark = (f: string) => fs.readFileSync(path.join(here, '..', '..', 'public', 'brand', f), 'utf8');

test('33 cells: four leaves of 8 and one centre cell', () => {
  assert.equal(CELLS.length, 33);
  for (const leaf of LEAVES) assert.equal(CELLS.filter((c) => c.leaf === leaf).length, 8, leaf);
  assert.deepEqual(
    CELLS.filter((c) => c.leaf === 'centre').map((c) => [c.c, c.r]),
    [[3, 3]],
  );
});

test('fill order is a permutation of 0..32 and leaves fill in service order', () => {
  const seqs = CELLS.map((c) => c.seq).sort((a, b) => a - b);
  assert.deepEqual(seqs, Array.from({ length: 33 }, (_, i) => i));
  LEAVES.forEach((leaf, i) => {
    const s = CELLS.filter((c) => c.leaf === leaf).map((c) => c.seq);
    assert.equal(Math.min(...s), i * 8, `${leaf} starts at ${i * 8}`);
    assert.equal(Math.max(...s), i * 8 + 7, `${leaf} ends at ${i * 8 + 7}`);
  });
});

test('every leaf path in the trademark file is covered exactly by its cells', () => {
  const svg = trademark('felixis-mark.svg');
  for (const leaf of LEAVES) {
    const d = LEAF_PATHS[leaf];
    assert.ok(svg.includes(`d="${d}"`), `${leaf} path matches felixis-mark.svg`);
    // rasterise the path's polygon on the 6-unit grid and compare with the cells
    const pts = [...d.matchAll(/([MHV])\s*(\d+)(?:\s+(\d+))?/g)];
    let x = 0;
    let y = 0;
    const poly: [number, number][] = [];
    for (const [, cmd, a, b] of pts) {
      if (cmd === 'M') [x, y] = [Number(a), Number(b)];
      if (cmd === 'H') x = Number(a);
      if (cmd === 'V') y = Number(a);
      poly.push([x, y]);
    }
    const inside = (px: number, py: number) => {
      let hit = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i];
        const [xj, yj] = poly[j];
        if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
      }
      return hit;
    };
    const fromPath = new Set<string>();
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) if (inside(ORIGIN + c * CELL + 3, ORIGIN + r * CELL + 3)) fromPath.add(`${c}:${r}`);
    const fromCells = new Set(CELLS.filter((c) => c.leaf === leaf).map((c) => `${c.c}:${c.r}`));
    assert.deepEqual([...fromPath].sort(), [...fromCells].sort(), leaf);
  }
  assert.ok(svg.includes('<rect x="29" y="29" width="6" height="6"'), 'centre cell at 29,29');
});

test('mark colours match both trademark variants', () => {
  const dark = trademark('felixis-mark.svg');
  const light = trademark('felixis-mark-light.svg');
  assert.ok(dark.includes(`fill="${MARK_COLORS.dark.strategy}"`));
  assert.ok(dark.includes(`fill="${MARK_COLORS.dark.design}"`));
  assert.ok(dark.includes(`fill="${MARK_COLORS.dark.centre}"`));
  assert.ok(light.includes(`fill="${MARK_COLORS.light.strategy}"`));
  assert.ok(light.includes(`fill="${MARK_COLORS.light.centre}"`));
});
