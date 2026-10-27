/**
 * Minimal headless Chrome over the DevTools protocol (no dependencies), for
 * the scripts that need a real WebGL page: launch, navigate, evaluate, close.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * Chrome profiles live in the project's ignored `.tmp/chrome/` (on the
 * project's own disk, not the system temp) and are always removed: after
 * close, when Chrome fails to start, when the script exits or crashes, and
 * any left by a killed run are swept on the next start (older than an hour).
 */
export const PROFILE_ROOT = process.env.VIL3D_PROFILE_DIR ?? path.resolve(import.meta.dirname, '../../.tmp/chrome');
const live = new Map();
process.once('exit', () => {
  for (const [proc, profile] of live) {
    try {
      proc.kill();
    } catch {
      /* already gone */
    }
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      /* still locked: swept on the next start */
    }
  }
});

/** A fresh profile folder; removes ones a killed run left behind. */
export function newProfile(prefix) {
  mkdirSync(PROFILE_ROOT, { recursive: true });
  for (const name of readdirSync(PROFILE_ROOT)) {
    const dir = path.join(PROFILE_ROOT, name);
    try {
      if (Date.now() - statSync(dir).mtimeMs > 3_600_000) rmSync(dir, { recursive: true, force: true });
    } catch {
      /* in use by another run */
    }
  }
  return mkdtempSync(path.join(PROFILE_ROOT, prefix));
}

/** Remembers a running Chrome, so an exiting script still stops it and removes its profile. */
export function track(proc, profile) {
  live.set(proc, profile);
  proc.once('exit', () => live.delete(proc));
}

export const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(existsSync);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Stops Chrome and deletes its temp profile. The profile is removed only once
 * Chrome has exited — before that Windows keeps it locked (EPERM) and the
 * folder used to stay behind, ~40 MB per run, until the disk was full.
 */
async function stopAndClean(proc, profile) {
  if (proc.exitCode === null) {
    const exited = new Promise((r) => proc.once('exit', r));
    proc.kill();
    await Promise.race([exited, sleep(5000)]);
  }
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
  } catch {
    // Chrome's helpers still hold a file: a leftover temp folder must not fail the check
  }
}

/** `serviceWorker`: let the site install its offline worker (off by default: its background caching would skew measurements). */
export async function openChrome({ port = 9335, width = 1440, height = 900, serviceWorker = false } = {}) {
  if (!CHROME) throw new Error('Chrome/Edge not found');
  const profile = newProfile('vil3d-cdp-');
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, `--window-size=${width},${height}`, '--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=d3d11', 'about:blank'], { stdio: 'ignore' });
  track(proc, profile);
  let url;
  for (let i = 0; i < 60 && !url; i++) {
    try {
      url = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page')?.webSocketDebuggerUrl;
    } catch {
      /* starting */
    }
    if (!url) await sleep(200);
  }
  if (!url) {
    // leave no Chrome and no profile behind (a full temp disk stops every check)
    await stopAndClean(proc, profile);
    throw new Error('Chrome did not start');
  }
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
      await stopAndClean(proc, profile);
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
