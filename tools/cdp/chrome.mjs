// Launch headless Chrome with its own profile under .cache (never the user's running
// Chrome) and talk to it over the DevTools protocol using Node's built-in WebSocket.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT = path.resolve(HERE, '..', '..');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ gpu = "hw", extraArgs = [], profile = 'chrome-test' } = {}) {
  const userDir = path.join(PROJECT, '.cache', profile);
  const tmp = path.join(PROJECT, '.cache', 'tmp');
  fs.mkdirSync(userDir, { recursive: true });
  fs.mkdirSync(tmp, { recursive: true });
  const portFile = path.join(userDir, 'DevToolsActivePort');
  try {
    fs.unlinkSync(portFile);
  } catch {}
  const args = [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${userDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-features=Translate,OptimizationHints,MediaRouter',
    '--mute-audio',
    '--hide-scrollbars',
    ...(gpu === 'hw' ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : gpu === 'sw' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--disable-3d-apis']),
    ...extraArgs,
    'about:blank',
  ];
  const proc = spawn(CHROME, args, { env: { ...process.env, TEMP: tmp, TMP: tmp }, stdio: 'ignore' });
  let port;
  for (let i = 0; i < 200; i++) {
    try {
      const [p] = fs.readFileSync(portFile, 'utf8').split('\n');
      if (p) {
        port = Number(p);
        break;
      }
    } catch {}
    await sleep(100);
  }
  if (!port) throw new Error('Chrome did not start');
  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  const browser = await connect(version.webSocketDebuggerUrl);
  return {
    port,
    browser,
    async newPage() {
      const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
      return makePage(browser, sessionId, targetId);
    },
    async close() {
      try {
        await browser.send('Browser.close');
      } catch {}
      await sleep(300);
      try {
        proc.kill();
      } catch {}
    },
  };
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let id = 0;
    const pending = new Map();
    const listeners = new Set();
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) {
        const { res, rej } = pending.get(m.id);
        pending.delete(m.id);
        if (m.error) rej(new Error(`${m.error.message} (${m.error.data || ''})`));
        else res(m.result);
      } else if (m.method) listeners.forEach((fn) => fn(m));
    };
    ws.onerror = reject;
    ws.onopen = () =>
      resolve({
        send(method, params = {}, sessionId) {
          const i = ++id;
          ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) }));
          return new Promise((res, rej) => pending.set(i, { res, rej }));
        },
        on(fn) {
          listeners.add(fn);
          return () => listeners.delete(fn);
        },
      });
  });
}

function makePage(browser, sessionId, targetId) {
  const errors = [];
  const logs = [];
  const send = (m, p) => browser.send(m, p, sessionId);
  browser.on((m) => {
    if (m.sessionId !== sessionId) return;
    if (m.method === 'Runtime.exceptionThrown') errors.push('exception: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    if (m.method === 'Runtime.consoleAPICalled') {
      const text = m.params.args.map((a) => a.value ?? a.description).join(' ');
      if (m.params.type === 'error') errors.push('console.error: ' + text);
      else logs.push(`${m.params.type}: ${text}`);
    }
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push('log: ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
    if (m.method === 'Network.loadingFailed' && !m.params.canceled) errors.push('net: ' + m.params.errorText);
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) errors.push(`http ${m.params.response.status} ${m.params.response.url}`);
  });
  const page = {
    errors,
    logs,
    send,
    async init({ width = 1440, height = 900, dpr = 1, mobile = false, media = [] } = {}) {
      await send('Page.enable');
      await send('Runtime.enable');
      await send('Log.enable');
      await send('Network.enable');
      await page.viewport({ width, height, dpr, mobile });
      if (media.length) await send('Emulation.setEmulatedMedia', { features: media });
    },
    async viewport({ width, height, dpr = 1, mobile = false }) {
      page.size = { width, height };
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile });
      await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
    },
    async goto(url, waitMs = 600) {
      const loaded = new Promise((r) => {
        const off = browser.on((m) => {
          if (m.sessionId === sessionId && m.method === 'Page.loadEventFired') {
            off();
            r();
          }
        });
      });
      await send('Page.navigate', { url });
      await Promise.race([loaded, sleep(15000)]);
      await sleep(waitMs);
    },
    async eval(expression) {
      const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error('eval failed: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      return r.result.value;
    },
    async shot(file, { full = false, quality = 82 } = {}) {
      const params = { format: 'jpeg', quality };
      if (full) {
        const h = await page.eval('document.documentElement.scrollHeight');
        params.captureBeyondViewport = true;
        params.clip = { x: 0, y: 0, width: page.size.width, height: h, scale: 0.5 };
      }
      const { data } = await send('Page.captureScreenshot', params);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.from(data, 'base64'));
      return file;
    },
    async mouse(type, x, y, extra = {}) {
      await send('Input.dispatchMouseEvent', { type, x, y, button: 'none', ...extra });
    },
    async move(x, y) {
      await page.mouse('mouseMoved', x, y);
    },
    async click(x, y) {
      await page.mouse('mouseMoved', x, y);
      await page.mouse('mousePressed', x, y, { button: 'left', clickCount: 1 });
      await page.mouse('mouseReleased', x, y, { button: 'left', clickCount: 1 });
    },
    async wheel(dy, x = 700, y = 450) {
      await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY: dy });
    },
    async key(key, code = key) {
      const text = key === 'Enter' ? String.fromCharCode(13) : key === ' ' ? ' ' : key.length === 1 ? key : undefined;
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, ...(text ? { text } : {}), windowsVirtualKeyCode: key.length === 1 ? key.toUpperCase().charCodeAt(0) : key === 'Tab' ? 9 : key === 'Escape' ? 27 : key === 'Enter' ? 13 : 0 });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code });
    },
    sleep,
    async close() {
      await browser.send('Target.closeTarget', { targetId });
    },
  };
  return page;
}
