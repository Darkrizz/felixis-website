// Post-build: gzip size of every script chunk against its budget, a guard that three.js
// never lands in the critical path, and a list of placeholder facts still to fill in.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { unfilled, optionalEmpty } from '../src/data/site.config.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(ROOT, 'dist');
const astro = path.join(dist, '_astro');
const gz = (buf) => zlib.gzipSync(buf, { level: 9 }).length;
const kb = (n) => (n / 1024).toFixed(1) + ' kB';
let failed = false;

const html = fs.readFileSync(path.join(dist, 'index.html'));
const entry = [...html.toString().matchAll(/<script type="module" src="(\/_astro\/[^"]+)"/g)].map((m) => m[1]);
const BUDGETS = [
  { test: (f) => entry.some((e) => e.endsWith(f)), name: 'entry (critical)', max: 90 * 1024 },
  { test: (f) => /^voxel\./.test(f), name: 'voxel engine (lazy)', max: 175 * 1024 },
  { test: () => true, name: 'other lazy chunk', max: 40 * 1024 },
];

const rows = [];
for (const f of fs.readdirSync(astro).filter((f) => f.endsWith('.js'))) {
  const buf = fs.readFileSync(path.join(astro, f));
  const size = gz(buf);
  const b = BUDGETS.find((x) => x.test(f));
  const over = size > b.max;
  if (over) failed = true;
  rows.push([f, kb(size), b.name, over ? 'OVER ' + kb(b.max) : 'ok']);
  if (b.name.startsWith('entry') && buf.includes('WebGLRenderer')) {
    console.error(`three.js leaked into the entry chunk ${f}`);
    failed = true;
  }
}
rows.sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));
console.log('\nscript budgets (gzip)');
for (const r of rows) console.log(`  ${r[0].padEnd(58)} ${r[1].padStart(9)}  ${r[2].padEnd(20)} ${r[3]}`);
console.log(`  index.html ${kb(gz(html))} gzip`);

const missing = unfilled();
if (missing.length) console.warn(`\nplaceholders still to fill in src/data/site.config.mjs: ${missing.join(', ')}`);
if (failed) {
  console.error('\nbudget check failed');
  process.exit(1);
}
