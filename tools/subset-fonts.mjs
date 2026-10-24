// Prebuild: subset each Range language's font to the poster text, keeping variation axes.
// Skips work when neither the text nor the source list changed.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'fonts', 'range');
const CACHE = path.join(ROOT, '.cache', 'subset-hash.txt');

// range.ts is TypeScript; read the data we need with a tiny eval-free parse via dynamic import of a transpiled copy
const src = fs.readFileSync(path.join(ROOT, 'src', 'data', 'range.ts'), 'utf8');
const js = src
  .replace(/export interface[\s\S]*?\n}\n/g, '')
  .replace(/: RangeLang\[\]/g, '')
  .replace(/\(langId: string, i: number\)/, '(langId, i)');
const tmp = path.join(ROOT, '.cache', 'range-data.mjs');
fs.mkdirSync(path.dirname(tmp), { recursive: true });
fs.writeFileSync(tmp, js);
const { RANGE, POSTER_GLYPHS } = await import(`file://${tmp.replace(/\\/g, '/')}?t=${Date.now()}`);

const hash = crypto.createHash('sha1').update(POSTER_GLYPHS + JSON.stringify(RANGE.map((l) => l.files))).digest('hex');
const prev = fs.existsSync(CACHE) ? fs.readFileSync(CACHE, 'utf8') : '';
const expected = RANGE.flatMap((l) => l.files.map((_, i) => path.join(OUT, `${l.id}-${i}.woff2`)));
if (prev === hash && expected.every((f) => fs.existsSync(f))) {
  console.log('[subset-fonts] up to date');
  process.exit(0);
}

fs.mkdirSync(OUT, { recursive: true });
for (const lang of RANGE) {
  for (const [i, file] of lang.files.entries()) {
    const input = fs.readFileSync(path.join(ROOT, 'node_modules', file.src));
    const out = await subsetFont(input, POSTER_GLYPHS + ' ', { targetFormat: 'woff2', ...(file.axes ? { variationAxes: file.axes } : {}) });
    const dest = path.join(OUT, `${lang.id}-${i}.woff2`);
    fs.writeFileSync(dest, out);
    console.log(`[subset-fonts] ${lang.id}-${i}: ${(input.length / 1024).toFixed(1)} kB -> ${(out.length / 1024).toFixed(1)} kB`);
  }
}
fs.writeFileSync(CACHE, hash);
