// Lighthouse against the brotli preview server (node tools/serve.mjs), mobile settings,
// median of N runs. Writes HTML/JSON reports to tools/out/lighthouse.
// Usage: node tools/test/lighthouse.mjs [path=/] [runs=3] [gpu=hw|sw|off]
import fs from 'node:fs';
import path from 'node:path';
import lighthouse from 'lighthouse';
import { launch, PROJECT } from '../cdp/chrome.mjs';

const [route = '/', runsArg = '3', gpu = 'hw'] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://127.0.0.1:4411';
const out = path.join(PROJECT, 'tools/out/lighthouse');
fs.mkdirSync(out, { recursive: true });
const runs = Number(runsArg);
const results = [];

for (let i = 0; i < runs; i++) {
  const chrome = await launch({ gpu, profile: `chrome-lh-${i}` });
  const r = await lighthouse(`${BASE}${route}`, {
    port: chrome.port,
    output: ['html', 'json'],
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    logLevel: 'error',
  });
  await chrome.close();
  const lhr = r.lhr;
  const cat = Object.fromEntries(Object.entries(lhr.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
  const m = {
    ...cat,
    lcp: lhr.audits['largest-contentful-paint'].displayValue,
    tbt: lhr.audits['total-blocking-time'].displayValue,
    cls: lhr.audits['cumulative-layout-shift'].displayValue,
    fcp: lhr.audits['first-contentful-paint'].displayValue,
    si: lhr.audits['speed-index'].displayValue,
  };
  results.push({ m, lhr, report: r.report });
  console.log(`run ${i + 1}:`, JSON.stringify(m));
}

results.sort((a, b) => a.m.performance - b.m.performance);
const median = results[Math.floor(results.length / 2)];
const slug = route.replace(/\//g, '_') || '_';
fs.writeFileSync(path.join(out, `${slug}.html`), median.report[0]);
fs.writeFileSync(path.join(out, `${slug}.json`), median.report[1]);
console.log('median:', JSON.stringify(median.m));
const failing = Object.values(median.lhr.audits)
  .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'manual' && a.scoreDisplayMode !== 'notApplicable')
  .map((a) => `${a.id} (${a.score}) ${a.displayValue ?? ''}`);
console.log('audits under 0.9:', failing.length ? failing : 'none');
