// Keyboard pass: tab order and visible focus on home, Inspect shortcut, theme switch
// (captured mid-wipe), mobile menu opens and Escape returns focus.
import path from 'node:path';
import { launch, PROJECT } from '../cdp/chrome.mjs';
const BASE = process.env.BASE || 'http://127.0.0.1:4411';
const out = path.join(PROJECT, 'tools/out/keyboard');
const chrome = await launch({ gpu: 'hw' });
const page = await chrome.newPage();
await page.init({ width: 1440, height: 900 });
await page.goto(`${BASE}/?fx-test`, 2500);

const focused = () =>
  page.eval(`(() => { const a = document.activeElement; if (!a || a === document.body) return 'body'; const r = a.getBoundingClientRect(); const cs = getComputedStyle(a); const ring = cs.outlineStyle !== 'none' && cs.outlineColor !== 'rgba(0, 0, 0, 0)' && cs.outlineWidth !== '0px'; const pseudo = getComputedStyle(a, '::before').content !== 'none'; return (a.tagName + ' ' + (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 30)) + ' | inView=' + (r.top >= 0 && r.bottom <= innerHeight) + ' ring=' + (ring || pseudo); })()`);
const stops = [];
for (let i = 0; i < 16; i++) {
  await page.key('Tab');
  await page.sleep(150);
  stops.push(await focused());
  if (i === 2) await page.shot(path.join(out, 'focus-nav.jpg'));
  if (i === 13) await page.shot(path.join(out, 'focus-hero.jpg'));
}
console.log(stops.map((s, i) => `${i + 1}. ${s}`).join('\n'));

// theme switch via the nav button, captured mid-wipe
const t = await page.eval(`(() => { const r = document.querySelector('.nav [data-ctl="theme"]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
await page.click(t[0], t[1]);
await page.sleep(300);
await page.shot(path.join(out, 'theme-mid.jpg'));
await page.sleep(1200);
await page.shot(path.join(out, 'theme-light.jpg'));
console.log('theme now', await page.eval('document.documentElement.dataset.theme'));

// mobile menu: open, Escape, focus returns
await page.viewport({ width: 390, height: 844, mobile: true, dpr: 2 });
await page.goto(`${BASE}/?fx-test`, 2000);
await page.eval(`document.querySelector('[data-ctl="menu"]').focus(); true`);
await page.key('Enter');
await page.sleep(900);
await page.shot(path.join(out, 'menu-open.jpg'));
console.log('menu open:', await page.eval(`document.querySelector('[data-menu]').open`), 'focus in menu:', await page.eval(`document.querySelector('[data-menu]').contains(document.activeElement)`));
await page.key('Escape');
await page.sleep(400);
console.log('menu closed:', !(await page.eval(`document.querySelector('[data-menu]').open`)), 'focus back on toggle:', await page.eval(`document.activeElement?.dataset?.ctl === 'menu'`));
console.log('errors:', page.errors.length ? page.errors : 'none');
await chrome.close();
