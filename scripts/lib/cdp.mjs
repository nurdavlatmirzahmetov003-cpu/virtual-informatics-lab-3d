/**
 * Minimal headless Chrome over the DevTools protocol (no dependencies), for
 * the scripts that need a real WebGL page: launch, navigate, evaluate, close.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(existsSync);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** `serviceWorker`: let the site install its offline worker (off by default: its background caching would skew measurements). */
export async function openChrome({ port = 9335, width = 1440, height = 900, serviceWorker = false } = {}) {
  if (!CHROME) throw new Error('Chrome/Edge not found');
  const profile = mkdtempSync(path.join(tmpdir(), 'vil3d-cdp-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, `--window-size=${width},${height}`, '--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=d3d11', 'about:blank'], { stdio: 'ignore' });
  let url;
  for (let i = 0; i < 60 && !url; i++) {
    try {
      url = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page')?.webSocketDebuggerUrl;
    } catch {
      /* starting */
    }
    if (!url) await sleep(200);
  }
  if (!url) throw new Error('Chrome did not start');
  const ws = new WebSocket(url);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
  });
  const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  await send('Page.enable');
  // measurements and checks see the site as a returning visitor: no first-visit welcome over the scene
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.setItem('vil3d:onboarded', '1'); ${serviceWorker ? '' : "localStorage.setItem('vil3d:no-sw', '1');"} } catch {}` });
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  return {
    send,
    evaluate: async (expression) => {
      const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'evaluate failed');
      return r.result?.result?.value;
    },
    navigate: (u) => send('Page.navigate', { url: u }),
    waitFor: async (expression, ms = 60000) => {
      const end = Date.now() + ms;
      while (Date.now() < end) {
        const r = await send('Runtime.evaluate', { expression, returnByValue: true });
        if (r.result?.result?.value) return r.result.result.value;
        await sleep(400);
      }
      throw new Error(`timed out waiting for ${expression}`);
    },
    close: async () => {
      ws.close();
      proc.kill();
      await sleep(300);
      rmSync(profile, { recursive: true, force: true });
    },
  };
}

/** `vite preview` of dist/ on a free port; resolves to its base URL and a stop function. */
export async function startPreview(root, port = 4179) {
  const vite = path.join(root, 'node_modules/vite/bin/vite.js');
  const proc = spawn(process.execPath, [vite, 'preview', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
  const base = `http://localhost:${port}`;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) return { base, stop: () => proc.kill() };
    } catch {
      /* starting */
    }
    await sleep(250);
  }
  proc.kill();
  throw new Error('vite preview did not start');
}
