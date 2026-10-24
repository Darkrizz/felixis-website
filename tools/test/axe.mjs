// axe-core in states Lighthouse doesn't reach: light theme, menu open, Inspect on,
// form errors shown, mobile width, each service and lab page.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { launch } from '../cdp/chrome.mjs';

const require = createRequire(import.meta.url);
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const BASE = process.env.BASE || 'http://127.0.0.1:4411';
const chrome = await launch({ gpu: 'hw' });
const page = await chrome.newPage();

async function run(label, url, { width = 1440, height = 900, theme = 'dark', before = '' } = {}) {
  await page.init({ width, height, mobile: width < 768, dpr: width < 768 ? 2 : 1 });
  await page.goto(`${BASE}/`, 200);
  await page.eval(`sessionStorage.setItem('fx-theme', '${theme}'); true`);
  await page.goto(`${BASE}${url}${url.includes('?') ? '&' : '?'}fx-test`, 2500);
  if (before) {
    await page.eval(before);
    await page.sleep(900);
  }
  await page.eval(AXE);
  const res = await page.eval(`axe.run(document, { resultTypes: ['violations'] }).then((r) => r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, first: v.nodes[0].html.slice(0, 120), why: v.nodes[0].failureSummary?.split('\\n')[1]?.slice(0, 140) })))`);
  console.log(`${label}: ${res.length ? '' : 'clean'}`);
  for (const v of res) console.log(`  [${v.impact}] ${v.id} x${v.n}: ${v.first}\n      ${v.why ?? ''}`);
}

await run('home dark', '/');
await run('home light', '/', { theme: 'light' });
await run('home mobile, menu open', '/', { width: 390, height: 844, before: `document.querySelector('[data-ctl="menu"]').click(); true` });
await run('home inspect on', '/', { before: `document.querySelector('.nav [data-ctl="inspect"]').click(); true` });
await run('start, errors shown', '/start/', { before: `document.querySelector('[data-next]').click(); true` });
for (const p of ['/strategy/', '/design/', '/development/', '/growth/', '/lab/', '/lab/sequencer/', '/lab/make-a-mark/', '/lab/type-playground/', '/lab/flow-field/', '/nope/']) await run(p, p);
await run('design light', '/design/', { theme: 'light' });
console.log('console errors:', page.errors.filter((e) => !/404/.test(e)).length ? page.errors.filter((e) => !/404/.test(e)) : 'none');
await chrome.close();
