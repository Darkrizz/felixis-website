// First-visit preloader: capture frames through the sequence on a cold load.
import path from 'node:path';
import { launch, PROJECT } from '../cdp/chrome.mjs';
const BASE = process.env.BASE || 'http://127.0.0.1:4411';
const out = path.join(PROJECT, 'tools/out/preloader');
const chrome = await launch({ gpu: 'hw', profile: 'chrome-preload' });
const page = await chrome.newPage();
await page.init({ width: 1440, height: 900 });
await page.send('Page.navigate', { url: `${BASE}${process.argv[2] || '/'}` });
const t0 = Date.now();
for (const ms of [250, 500, 750, 950, 1150, 1400, 2200, 3600]) {
  await page.sleep(Math.max(0, ms - (Date.now() - t0)));
  await page.shot(path.join(out, `t${String(ms).padStart(4, '0')}.jpg`), { quality: 70 });
}
console.log('errors:', page.errors.length ? page.errors : 'none');
await chrome.close();
