// Device emulation pass (same as DevTools device mode): screenshots through a page at
// named device sizes, plus an automatic overlap check between text blocks.
// Usage: node tools/test/device.mjs [path=/] [device=iphone16] [stops=0,0.1,...]
import path from 'node:path';
import { launch, PROJECT } from '../cdp/chrome.mjs';
const DEVICES = {
  iphone16: { width: 393, height: 852, dpr: 3 },
  iphone16pm: { width: 440, height: 956, dpr: 3 },
  iphonese: { width: 375, height: 667, dpr: 2 },
  pixel8: { width: 412, height: 915, dpr: 2.625 },
  galaxys20: { width: 360, height: 800, dpr: 3 },
  ipadmini: { width: 768, height: 1024, dpr: 2 },
  ipadair: { width: 820, height: 1180, dpr: 2 },
  ipadpro: { width: 1024, height: 1366, dpr: 2 },
  nesthub: { width: 1024, height: 600, dpr: 1 },
};
const [route = '/', dev = 'iphone16', stopsArg = ''] = process.argv.slice(2);
const d = DEVICES[dev];
const BASE = process.env.BASE || 'http://127.0.0.1:4411';
const out = path.join(PROJECT, 'tools/out/device', dev);
const chrome = await launch({ gpu: 'hw' });
const page = await chrome.newPage();
await page.init({ width: d.width, height: d.height, dpr: d.dpr, mobile: d.width < 1024 });
await page.goto(`${BASE}${route}?fx-test`, 2500);
const docH = await page.eval('document.documentElement.scrollHeight');
const stops = stopsArg ? stopsArg.split(',').map(Number) : Array.from({ length: Math.ceil(docH / d.height) }, (_, i) => i * d.height);
let i = 0;
const overlaps = new Set();
for (const y of stops) {
  await page.eval(`__fx.scrollTo(${y})`);
  await page.sleep(700);
  await page.shot(path.join(out, `${String(i++).padStart(2, '0')}-y${y}.jpg`), { quality: 70 });
  // text-bearing elements whose boxes intersect another text element that isn't an ancestor/descendant
  const hits = await page.eval(`(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < innerHeight && s.visibility !== 'hidden' && s.opacity !== '0' && !e.closest('[aria-hidden="true"], .sr-only, .nav, .menu, canvas, .range__stage, .poster') && !(e.closest('details:not([open])') && !e.closest('summary')); };
    const els = [...document.querySelectorAll('h1,h2,h3,p,li,dt,dd,label,button,a,output,legend,figcaption')].filter((e) => vis(e) && e.textContent.trim());
    const out = [];
    for (let a = 0; a < els.length; a++) for (let b = a + 1; b < els.length; b++) {
      const A = els[a], B = els[b];
      if (A.contains(B) || B.contains(A)) continue;
      const r1 = A.getBoundingClientRect(), r2 = B.getBoundingClientRect();
      const ix = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left);
      const iy = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
      if (ix > 4 && iy > 4) out.push(A.tagName + '.' + String(A.className).split(' ')[0] + ' "' + A.textContent.trim().slice(0, 24) + '" x ' + B.tagName + '.' + String(B.className).split(' ')[0] + ' "' + B.textContent.trim().slice(0, 24) + '"');
    }
    return out;
  })()`);
  hits.forEach((h) => overlaps.add(`y${y}: ${h}`));
}
console.log(`${dev} ${route}: ${stops.length} screens, docH ${docH}`);
console.log(overlaps.size ? [...overlaps].slice(0, 40).join('\n') : 'no text overlaps');
console.log('errors:', page.errors.filter((e) => !/404/.test(e)).length ? page.errors : 'none');
await chrome.close();
