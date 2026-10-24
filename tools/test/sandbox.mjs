// Sandbox interaction: gravity on, then paint a stroke across the clover.
import path from 'node:path';
import { launch, PROJECT } from '../cdp/chrome.mjs';
const BASE = process.env.BASE || 'http://127.0.0.1:4411';
const out = path.join(PROJECT, 'tools/out/sandbox');
const chrome = await launch({ gpu: 'hw' });
const page = await chrome.newPage();
await page.init({ width: 1440, height: 900 });
await page.goto(`${BASE}/lab/voxel-sandbox/?fx-test`, 3000);
const y = await page.eval(`Math.round(document.querySelector('[data-sbx-stage]').getBoundingClientRect().top + scrollY - 90)`);
await page.eval(`__fx.scrollTo(${y})`);
await page.sleep(1500);
const btn = async (sel) => page.eval(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
let [bx, by] = await btn('[data-sbx="gravity"]');
await page.click(bx, by);
await page.sleep(2500);
await page.shot(path.join(out, 'gravity.jpg'));
await page.click(bx, by);
await page.sleep(2000);
[bx, by] = await btn('input[name="brush"][value="#FF6B5A"]');
await page.click(bx, by);
const a = await btn('[data-voxel-anchor="experiment"]');
await page.mouse('mousePressed', a[0] - 200, a[1] - 60, { button: 'left', clickCount: 1 });
for (let k = 0; k <= 30; k++) { await page.mouse('mouseMoved', a[0] - 200 + k * 14, a[1] - 60 + Math.sin(k / 4) * 60, { button: 'left' }); await page.sleep(16); }
await page.mouse('mouseReleased', a[0] + 220, a[1], { button: 'left', clickCount: 1 });
await page.sleep(600);
await page.shot(path.join(out, 'paint.jpg'));
console.log('errors:', page.errors.length ? page.errors : 'none');
await chrome.close();
