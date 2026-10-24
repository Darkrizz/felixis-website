// Horizontal overflow check at phone widths for every route.
import { launch } from '../cdp/chrome.mjs';
const BASE = process.env.BASE || 'http://127.0.0.1:4411';
const routes = ['/', '/strategy/', '/design/', '/development/', '/growth/', '/lab/', '/lab/voxel-sandbox/', '/lab/sequencer/', '/lab/make-a-mark/', '/lab/type-playground/', '/lab/cell-shader/', '/lab/flow-field/', '/start/', '/nope/'];
const chrome = await launch({ gpu: 'hw' });
const page = await chrome.newPage();
for (const w of [360, 390]) {
  await page.init({ width: w, height: 800, mobile: true, dpr: 2 });
  for (const r of routes) {
    await page.goto(`${BASE}${r}?fx-test`, 1200);
    const res = await page.eval(`(() => {
      const W = document.documentElement.clientWidth;
      const wide = [...document.querySelectorAll('body *')].filter((el) => { const b = el.getBoundingClientRect(); return b.width && b.right > W + 1 && !el.closest('.range__stage, .cs__stage, canvas, [aria-hidden="true"], .ins, .sv-del__grid') && getComputedStyle(el).position !== 'fixed'; }).slice(0, 4).map((el) => el.tagName + '.' + String(el.className).split(' ')[0] + ' ' + Math.round(el.getBoundingClientRect().right));
      return { sw: document.documentElement.scrollWidth, W, wide };
    })()`);
    if (res.sw > res.W || res.wide.length) console.log(w, r, JSON.stringify(res));
  }
}
console.log('done; errors:', page.errors.filter((e) => !/404/.test(e)).length ? page.errors : 'none');
await chrome.close();
