// Lists every layout shift on a page load with the elements that moved.
// Usage: node tools/test/cls.mjs [path=/] [w=1440] [h=900] [query=?fx-test]
import { launch } from '../cdp/chrome.mjs';

const [route = '/', w = '1440', h = '900', query = '?fx-test'] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://127.0.0.1:4411';
const chrome = await launch({ gpu: 'hw' });
const page = await chrome.newPage();
await page.init({ width: Number(w), height: Number(h), mobile: Number(w) < 768, dpr: Number(w) < 768 ? 2 : 1 });
await page.send('Page.addScriptToEvaluateOnNewDocument', {
  source: `window.__shifts = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__shifts.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), input: e.hadRecentInput, src: (e.sources || []).map((s) => { const n = s.node; if (!n) return '(gone)'; const el = n.nodeType === 1 ? n : n.parentElement; return (el.tagName + '.' + (el.className?.baseVal ?? el.className)).slice(0, 70) + ' ' + JSON.stringify([s.previousRect.y, s.currentRect.y, s.previousRect.height, s.currentRect.height]); }) }); }).observe({ type: 'layout-shift', buffered: true });`,
});
await page.goto(`${BASE}${route}${query}`, 4000);
console.log(JSON.stringify(await page.eval('window.__shifts'), null, 1));
console.log('errors:', page.errors.length ? page.errors : 'none');
await chrome.close();
