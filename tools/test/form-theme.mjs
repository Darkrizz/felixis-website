// 1. Theme: a fresh visit with a light-mode system starts dark; the light toggle lasts only for that visit.
// 2. Brief builder: fill the four steps and submit to a stubbed FormSubmit endpoint (no real
//    request leaves the browser), then print the request it would have sent.
import path from 'node:path';
import { launch, PROJECT } from '../cdp/chrome.mjs';
const BASE = process.env.BASE || 'http://127.0.0.1:4411';
const out = path.join(PROJECT, 'tools/out/form');
const chrome = await launch({ gpu: 'hw', profile: 'chrome-form' });
const page = await chrome.newPage();
await page.init({ width: 1440, height: 900, media: [{ name: 'prefers-color-scheme', value: 'light' }] });
await page.goto(`${BASE}/?fx-test`, 1500);
console.log('system light, first visit ->', await page.eval('document.documentElement.dataset.theme'));
await page.eval(`document.querySelector('.nav [data-ctl="theme"]').click(); true`);
await page.sleep(1300);
console.log('after toggle ->', await page.eval('document.documentElement.dataset.theme'));
await page.goto(`${BASE}/lab/?fx-test`, 1200);
console.log('same visit, next page ->', await page.eval('document.documentElement.dataset.theme'));
const fresh = await chrome.newPage();
await fresh.init({ width: 1440, height: 900, media: [{ name: 'prefers-color-scheme', value: 'light' }] });
await fresh.goto(`${BASE}/?fx-test`, 1200);
console.log('new visit (new tab) ->', await fresh.eval('document.documentElement.dataset.theme'));

// fresh tab for the form, so nothing from the theme checks carries over
const fp = await chrome.newPage();
await fp.init({ width: 1440, height: 900 });
await fp.goto(`${BASE}/start/?fx-test`, 2500);
const js = (x) => fp.eval(x);
await js(`(() => { const f = document.querySelector('[data-brief]'); f.dataset.endpoint = 'https://formsubmit.co/ajax/test@felixis.example'; window.fetch = async (url, o) => { window.__sent = { url, headers: o.headers, body: JSON.parse(o.body) }; return new Response('{"success":"true"}', { status: 200 }); }; return true; })()`);
await js(`document.querySelector('input[name="kind"][value="New website"]').click(); document.querySelector('input[name="kind"][value="Motion and 3D"]').click(); document.querySelector('[data-next]').click(); true`);
await fp.sleep(300);
await js(`document.querySelector('input[name="when"][value="In 1 to 3 months"]').click(); document.querySelector('[name="budget"]').value = 'Around 4 lakh'; document.querySelector('[data-next]').click(); true`);
await fp.sleep(300);
await js(`document.querySelector('[name="name"]').value = 'Test Person'; document.querySelector('[name="email"]').value = 'person@example.org'; document.querySelector('[name="company"]').value = 'Test Co'; document.querySelector('[data-next]').click(); true`);
await fp.sleep(300);
await js(`document.querySelector('[name="details"]').value = 'A new site with a 3D product viewer and a booking flow.'; document.querySelector('[data-send]').click(); true`);
await fp.sleep(2000);
await fp.shot(path.join(out, 'sent.jpg'));
console.log('state:', await fp.eval(`JSON.stringify({ steps: [...document.querySelectorAll('[data-step]')].map((s) => s.className), errs: [...document.querySelectorAll('[data-err]')].map((e) => e.textContent).filter(Boolean), status: document.querySelector('[data-status]').textContent, ready: document.querySelector('[data-brief]').dataset.demoReady, theme: document.documentElement.dataset.theme })`));
console.log('request:', JSON.stringify(await fp.eval('window.__sent'), null, 1));
console.log('done panel visible:', await fp.eval(`!document.querySelector('[data-done]').hidden`), '| text:', await fp.eval(`document.querySelector('[data-done-text]').textContent`));
console.log('errors:', fp.errors.length ? fp.errors : 'none');
await chrome.close();
