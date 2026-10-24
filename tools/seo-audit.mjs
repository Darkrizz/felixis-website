// Post-build SEO audit of dist/: title and description lengths, one h1, canonical,
// duplicate titles/descriptions, valid JSON-LD types, and every internal link resolving.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.html') ? [path.join(d, e.name)] : []));
const seen = { t: new Map(), d: new Map() };
let problems = 0;
const warn = (f, msg) => {
  problems++;
  console.log(`  ! ${f}: ${msg}`);
};
const exists = (href) => {
  const p = href.split('#')[0].split('?')[0];
  if (!p || p === '/') return fs.existsSync(path.join(ROOT, 'index.html'));
  const f = path.join(ROOT, p);
  return fs.existsSync(f) || fs.existsSync(path.join(f, 'index.html'));
};
for (const file of walk(ROOT)) {
  const rel = '/' + path.relative(ROOT, file).replace(/\\/g, '/');
  const h = fs.readFileSync(file, 'utf8');
  const t = (h.match(/<title>([^<]*)<\/title>/) || [])[1] ?? '';
  const d = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] ?? '';
  const h1 = (h.match(/<h1[\s>]/g) || []).length;
  const can = (h.match(/rel="canonical" href="([^"]*)"/) || [])[1] ?? '';
  const robots = (h.match(/<meta name="robots" content="([^"]*)"/) || [])[1] ?? '';
  const types = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => {
    try {
      const j = JSON.parse(m[1]);
      return (j['@graph'] || [j]).map((x) => x['@type']).join('+');
    } catch {
      warn(rel, 'invalid JSON-LD');
      return 'BAD';
    }
  });
  console.log(`${rel.padEnd(34)} title ${String(t.length).padStart(2)}  desc ${String(d.length).padStart(3)}  h1 ${h1}  ${robots.split(',')[0]}  ${types.join(' | ')}`);
  const indexable = !robots.startsWith('noindex');
  if (indexable) {
    if (t.length < 25 || t.length > 70) warn(rel, `title length ${t.length}`);
    if (d.length < 70 || d.length > 165) warn(rel, `description length ${d.length}`);
    if (h1 !== 1) warn(rel, `${h1} h1 elements`);
    if (!can.startsWith('https://')) warn(rel, 'missing canonical');
    if (seen.t.has(t)) warn(rel, `duplicate title with ${seen.t.get(t)}`);
    if (seen.d.has(d)) warn(rel, `duplicate description with ${seen.d.get(d)}`);
    seen.t.set(t, rel);
    seen.d.set(d, rel);
  }
  for (const m of h.matchAll(/href="(\/[^"]*)"/g)) {
    const href = m[1];
    if (href.startsWith('/_astro/') || href.startsWith('//')) continue;
    if (!exists(href)) warn(rel, `broken internal link ${href}`);
  }
  if (/\.example\b/.test(h)) warn(rel, 'placeholder domain in output');
}
console.log(problems ? `\n${problems} SEO problem(s)` : '\nSEO audit: no problems');
process.exitCode = problems ? 1 : 0;
