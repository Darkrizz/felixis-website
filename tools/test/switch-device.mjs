// Reproduces DevTools device mode: load at desktop size, then switch the viewport to a
// phone (without reloading) and check the leaves section for overlaps.
import path from 'node:path';
import { launch, PROJECT } from '../cdp/chrome.mjs';
const BASE = process.env.BASE || 'http://127.0.0.1:4411';
const out = path.join(PROJECT, 'tools/out/switch');
const chrome = await launch({ gpu: 'hw' });
const page = await chrome.newPage();
await page.init({ width: 1440, height: 900 });
await page.goto(`${BASE}/?fx-test`, 2500);
const report = async (label) => {
  await page.sleep(1200);
  const y = await page.eval(`Math.round(document.querySelector('[data-pin="leaves"]').getBoundingClientRect().top + scrollY + 120)`);
  await page.eval(`__fx.scrollTo(${y})`);
  await page.sleep(800);
  await page.shot(path.join(out, `${label}.jpg`), { quality: 70 });
  console.log(label, await page.eval(`(() => { const s = document.querySelector('[data-pin="leaves"]'); const t = document.querySelector('.leaves__title').getBoundingClientRect(); const g = document.querySelector('[data-leaves-grid]').getBoundingClientRect(); return JSON.stringify({ vw: innerWidth, pinned: s.classList.contains('is-pinned'), titleBottom: Math.round(t.bottom), gridTop: Math.round(g.top), overlap: g.top < t.bottom && g.left < t.right, spacer: !!s.closest('.pin-spacer') }); })()`));
};
await report('1-desktop');
await page.viewport({ width: 393, height: 852, dpr: 3, mobile: true });
await report('2-switched-to-iphone16');
await page.viewport({ width: 1440, height: 900 });
await report('3-back-to-desktop');
console.log('errors:', page.errors.length ? page.errors : 'none');
await chrome.close();
