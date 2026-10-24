// Page transitions: click through nav links with the ClientRouter, capture the cover
// mid-flight and the settled page, and check that triggers don't leak between pages.
import path from 'node:path';
import { launch, PROJECT } from '../cdp/chrome.mjs';

const BASE = process.env.BASE || 'http://127.0.0.1:4411';
const out = path.join(PROJECT, 'tools/out/transitions');
const chrome = await launch({ gpu: 'hw' });
const page = await chrome.newPage();
await page.init({ width: 1440, height: 900 });
await page.goto(`${BASE}/?fx-test`, 3000);

const route = ['/design/', '/lab/', '/lab/voxel-sandbox/', '/start/', '/growth/', '/'];
let i = 0;
for (const href of route) {
  const pos = await page.eval(`(() => {
    const a = [...document.querySelectorAll('a[href="${href}"]')].find((a) => { const r = a.getBoundingClientRect(); return r.width && r.top >= 0 && r.bottom <= innerHeight; });
    if (!a) return null;
    const r = a.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  })()`);
  if (!pos) {
    // link not on screen: navigate through the router API instead
    await page.eval(`document.querySelector('a[href="${href}"]')?.click(); true`);
  } else {
    await page.click(pos[0], pos[1]);
  }
  await page.sleep(260);
  await page.shot(path.join(out, `${String(i).padStart(2, '0')}-mid-${href.replace(/\//g, '_')}.jpg`));
  await page.sleep(2200);
  await page.shot(path.join(out, `${String(i).padStart(2, '0')}-end-${href.replace(/\//g, '_')}.jpg`));
  const info = await page.eval(`({ path: location.pathname, page: document.documentElement.dataset.page, theme: document.documentElement.dataset.theme, triggers: window.__fx ? __fx.triggers().map((t) => t.id) : 'no-fx', stage: window.__fx ? __fx.stage.stations : null, gl: document.documentElement.classList.contains('gl-ready') })`);
  console.log(JSON.stringify(info));
  i++;
}
console.log('errors:', page.errors.length ? page.errors : 'none');
await chrome.close();
