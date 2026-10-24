// Range stage check: scroll to the stage, click every language tab, screenshot each.
// Usage: node tools/test/range.mjs [w=1440] [h=900]
import path from 'node:path';
import { launch, PROJECT } from '../cdp/chrome.mjs';

const [w = '1440', h = '900'] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://127.0.0.1:4411';
const width = Number(w);
const height = Number(h);
const out = path.join(PROJECT, 'tools/out/range');
const chrome = await launch({ gpu: 'hw' });
const page = await chrome.newPage();
await page.init({ width, height, mobile: width < 768, dpr: width < 768 ? 2 : 1 });
await page.goto(`${BASE}/?fx-test`, 1500);
const y = await page.eval(`Math.round(document.querySelector('.range__controls').getBoundingClientRect().top + scrollY - 90)`);
await page.eval(`__fx.scrollTo(${y})`);
await page.sleep(1500);
const tabs = await page.eval(`[...document.querySelectorAll('.range__tab')].map((t) => { const r = t.getBoundingClientRect(); return [t.dataset.lang, r.left + r.width / 2, r.top + r.height / 2]; })`);
await page.shot(path.join(out, `${width}-0-initial.jpg`));
let i = 1;
for (const [lang, x, ty] of tabs.slice(1).concat([tabs[0]])) {
  await page.click(x, ty);
  await page.sleep(380);
  await page.shot(path.join(out, `${width}-${i}-${lang}-mid.jpg`));
  await page.sleep(1300);
  await page.shot(path.join(out, `${width}-${i}-${lang}.jpg`));
  i++;
}
console.log('errors:', page.errors.length ? page.errors : 'none');
await chrome.close();
