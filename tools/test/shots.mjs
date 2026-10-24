// Review screenshots: loads a page in test mode, waits for the engine, then captures the
// viewport at a list of scroll positions. Prints console errors and engine stats.
// Usage: node tools/test/shots.mjs [path=/] [out=tools/out/shots] [w=1440] [h=900] [gpu=hw|sw|off] [stops=0,0.5,1...] [theme=dark|light]
import path from 'node:path';
import { launch, PROJECT } from '../cdp/chrome.mjs';

const [route = '/', outArg = 'tools/out/shots', w = '1440', h = '900', gpu = 'hw', stopsArg = '', themeArg = 'dark', reduce = ''] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://127.0.0.1:4411';
const out = path.resolve(PROJECT, outArg);
const width = Number(w);
const height = Number(h);
const mobile = width < 768;

const chrome = await launch({ gpu });
const page = await chrome.newPage();
await page.init({ width, height, dpr: mobile ? 2 : 1, mobile, media: reduce ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : [] });
await page.goto(`${BASE}/`, 200);
await page.eval(`sessionStorage.setItem('fx-theme', '${themeArg}'); localStorage.removeItem('fx-motion'); true`);
await page.goto(`${BASE}${route}${route.includes('?') ? '&' : '?'}fx-test`, 800);

// wait for the engine (or the fallback) to settle
for (let i = 0; i < 60; i++) {
  const ready = await page.eval(`document.documentElement.classList.contains('gl-ready') || document.documentElement.classList.contains('gl-off') || document.documentElement.classList.contains('motion-reduce')`);
  if (ready) break;
  await page.sleep(150);
}
await page.sleep(1800);
const docH = await page.eval('document.documentElement.scrollHeight');
const stops = stopsArg ? stopsArg.split(',') : ['0', '0.12', '0.2', '0.3', '0.45', '0.6', '0.75', '0.9', '1'];
const tag = `${width}x${height}-${themeArg}${reduce ? '-reduced' : ''}`;
let i = 0;
for (const s of stops) {
  let y;
  if (s.startsWith('t:')) {
    const [, id, f] = s.split(':');
    y = await page.eval(`(() => { const t = __fx.triggers().find((t) => t.id === '${id}'); return Math.round(t.start + (t.end - t.start) * ${Number(f)}); })()`);
  } else y = Number(s) <= 1 ? Math.round(Number(s) * (docH - height)) : Number(s);
  await page.eval(`window.__fx ? __fx.scrollTo(${y}) : window.scrollTo(0, ${y})`);
  await page.sleep(900);
  if (i === 0) {
    const [px, py] = (process.env.POINTER || '0.78,0.45').split(',').map(Number);
    await page.move(width * px, height * py);
    await page.sleep(500);
  }
  const f = await page.shot(path.join(out, `${tag}-${String(i).padStart(2, '0')}.jpg`));
  console.log('shot', path.relative(PROJECT, f), 'y=', y);
  i++;
}
const stats = await page.eval(`window.__fx ? JSON.stringify({ stats: __fx.stats(), stage: __fx.stage, triggers: __fx.triggers() }) : 'no __fx'`);
console.log(stats);
console.log('errors:', page.errors.length ? page.errors : 'none');
await chrome.close();
