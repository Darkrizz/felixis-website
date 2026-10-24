// Generates PNG icons, favicon.ico and the social card from the brand SVGs by screenshotting
// them in headless Chrome (no image libraries needed). Writes into public/.
// Usage: node tools/gen-assets.mjs
import fs from 'node:fs';
import path from 'node:path';
import { launch, PROJECT } from './cdp/chrome.mjs';

const pub = path.join(PROJECT, 'public');
const icon = fs.readFileSync(path.join(pub, 'brand', 'felixis-app-icon.svg'), 'utf8').replace(/width="512" height="512"/, '');
const chrome = await launch({ gpu: 'off', profile: 'chrome-assets' });
const page = await chrome.newPage();

async function png(html, w, h, file) {
  await page.init({ width: w, height: h });
  await page.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  await page.goto('data:text/html;charset=utf-8,' + encodeURIComponent(html), 300);
  const { data } = await page.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
  const buf = Buffer.from(data, 'base64');
  if (file) fs.writeFileSync(file, buf);
  return buf;
}

const iconHtml = (size, pad = 0) =>
  `<html><body style="margin:0;background:transparent"><div style="width:${size}px;height:${size}px;padding:${pad}px;box-sizing:border-box">${icon.replace('<svg ', `<svg width="${size - pad * 2}" height="${size - pad * 2}" `)}</div></body></html>`;

await png(iconHtml(180), 180, 180, path.join(pub, 'apple-touch-icon.png'));
await png(iconHtml(192), 192, 192, path.join(pub, 'icon-192.png'));
await png(iconHtml(512), 512, 512, path.join(pub, 'icon-512.png'));
const fav32 = await png(iconHtml(32), 32, 32, null);

// favicon.ico holding one 32x32 PNG
const header = Buffer.alloc(6 + 16);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6);
header.writeUInt8(32, 7);
header.writeUInt8(0, 8);
header.writeUInt8(0, 9);
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(fav32.length, 14);
header.writeUInt32LE(22, 18);
fs.writeFileSync(path.join(pub, 'favicon.ico'), Buffer.concat([header, fav32]));

// social card
await page.init({ width: 1200, height: 630 });
await page.goto('file:///' + path.join(PROJECT, 'tools', 'og-card.html').replace(/\\/g, '/'), 1200);
const { data } = await page.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
fs.writeFileSync(path.join(pub, 'og.png'), Buffer.from(data, 'base64'));

console.log('wrote apple-touch-icon.png, icon-192.png, icon-512.png, favicon.ico, og.png');
await chrome.close();
