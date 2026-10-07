/**
 * Measures a running build in real Chrome (headless, GPU) over the DevTools
 * protocol — no extra dependencies. Start `npm run preview` first, then:
 *
 *   node scripts/perf-measure.mjs [baseUrl] [--quality=auto|low|medium|high|ultra] [--mobile] [--pages=/,/studio]
 *
 * Per page: bytes downloaded by type, time until the scene is ready, draw
 * calls / triangles / ms per frame (`__vil3d.bench`), rAF FPS over 5 s,
 * texture memory and JS heap (`__vil3d.memory`). Prints JSON.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const base = args.find((a) => !a.startsWith('--')) ?? 'http://localhost:4173';
const opt = (name, def) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? def;
const quality = opt('quality', 'auto');
const mobile = args.includes('--mobile');
/** --profile: 3 s CPU profile of the running scene, top functions by self time */
const cpuProfile = args.includes('--profile');
/** --profile-load: CPU profile from navigation until the scene is ready */
const loadProfile = args.includes('--profile-load');
/** --throttle=Mbps: emulate a network (e.g. 20 ≈ good 4G / home Wi-Fi) */
const throttle = Number(opt('throttle', 0));
/** --fail=text: every request whose URL contains text fails (a broken GLB must not take the page down) */
const failPattern = opt('fail', null);
/** --no-webgl: Chrome without WebGL (the page must show its informative fallback) */
const noWebgl = args.includes('--no-webgl');
/** --lose-context: once ready, drop the WebGL context and record what the page shows and whether it recovers */
const loseContext = args.includes('--lose-context');
/** --leave=/path: after measuring, navigate inside the app (no reload) and report the JS heap after GC */
const leaveTo = opt('leave', null);
/** --shots=dir: PNG of every page once ready (visual comparison of builds) */
const shots = opt('shots', null);
const pages = opt('pages', '/,/studio').split(',');
const PORT = 9333;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(existsSync);
if (!CHROME) throw new Error('Chrome/Edge not found');

const profile = mkdtempSync(path.join(tmpdir(), 'vil3d-perf-'));
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--window-size=1440,900', '--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=d3d11',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
  '--no-first-run', '--no-default-browser-check', ...(noWebgl ? ['--disable-webgl', '--disable-3d-apis'] : []), 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
    await sleep(200);
  }
  throw new Error('Chrome did not start');
}

const ws = new WebSocket(await connect());
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pending = new Map();
const listeners = [];
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  } else if (msg.method) listeners.forEach((l) => l(msg));
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, { resolve, reject });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'evaluate failed');
  return r.result.value;
};

// bytes per request (encoded, i.e. over the wire)
const requests = new Map();
listeners.push((m) => {
  if (m.method === 'Network.responseReceived') requests.set(m.params.requestId, { url: m.params.response.url, bytes: 0 });
  if (m.method === 'Network.loadingFinished' && requests.has(m.params.requestId)) Object.assign(requests.get(m.params.requestId), { bytes: m.params.encodedDataLength, at: Date.now() });
});

// page errors are part of the result: a broken page must not look "fast"
const errors = [];
listeners.push((m) => {
  if (m.method === 'Runtime.exceptionThrown') errors.push((m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).split(String.fromCharCode(10)).slice(0, 4).join(' | '));
  if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || (m.params.type === 'warning' && /SceneCanvas|ModelLoader/.test(m.params.args[0]?.value ?? '')))) errors.push(m.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 300));
});
await send('Network.enable');
if (failPattern) {
  await send('Fetch.enable', { patterns: [{ urlPattern: `*${failPattern}*` }] });
  listeners.push((m) => {
    if (m.method === 'Fetch.requestPaused') void send('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'Failed' });
  });
}
await send('Network.setCacheDisabled', { cacheDisabled: true });
if (throttle) await send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: (throttle * 1e6) / 8, uploadThroughput: (5 * 1e6) / 8 });
await send('Page.enable');
await send('Runtime.enable');
if (mobile) {
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36' });
} else {
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
}

// fixed quality (or auto) via the persisted settings
await send('Page.navigate', { url: `${base}/credits` });
await sleep(1500);
await evaluate(`(() => {
  const k = 'vil3d:settings';
  const s = JSON.parse(localStorage.getItem(k) || '{"state":{},"version":1}');
  s.state = { ...s.state, qualityMode: ${JSON.stringify(quality)} };
  localStorage.setItem(k, JSON.stringify(s));
})()`);

/** Functions with the most self time in a CDP CPU profile. */
function topFunctions(prof, n) {
  const counts = new Map();
  for (const id of prof.samples) counts.set(id, (counts.get(id) ?? 0) + 1);
  const self = new Map();
  for (const node of prof.nodes) {
    const c = counts.get(node.id) ?? 0;
    if (!c) continue;
    const f = node.callFrame;
    const key = `${f.functionName || '(anon)'} ${f.url.split('/').pop()}:${f.lineNumber + 1}:${f.columnNumber + 1}`;
    self.set(key, (self.get(key) ?? 0) + c);
  }
  return [...self].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, c]) => `${((c / prof.samples.length) * 100).toFixed(1)}% ${k}`);
}

const kind = (u) =>
  /\.js(\?|$)/.test(u) ? 'js' : /\.css(\?|$)/.test(u) ? 'css' : /\.(glb|gltf|bin)(\?|$)/.test(u) ? 'models' : /\.(jpe?g|png|webp|ktx2)(\?|$)/.test(u) ? 'textures' : /\.hdr(\?|$)/.test(u) ? 'hdr' : /woff2?(\?|$)/.test(u) ? 'fonts' : /\.wasm|decoders\//.test(u) ? 'decoders' : 'other';

const results = { base, quality, mobile, gpu: null, pages: {} };
for (const p of pages) {
  requests.clear();
  errors.length = 0;
  if (loadProfile) {
    await send('Profiler.enable');
    await send('Profiler.setSamplingInterval', { interval: 500 });
    await send('Profiler.start');
  }
  const t0 = Date.now();
  await send('Page.navigate', { url: `${base}${p}${p.includes('?') ? '&' : '?'}debug` });
  // ready = __vil3d present and the loader gone, then no new requests for 2 s
  let ready = null;
  let readyKB = null;
  for (let i = 0; i < 600; i++) {
    // every asset of the scene's Suspense boundary resolved
    const ok = await evaluate(`!!window.__vil3d?.ready?.()`).catch(() => false);
    // a 2D page (no canvas): nothing 3D to wait for
    if (!ok && i > 25 && (await evaluate(`!document.querySelector('canvas') && (document.querySelector('main')?.innerText.length ?? 0) > 50`).catch(() => false))) break;
    // a fallback / error message instead of a scene: stop waiting
    if (!ok && i > 30 && (await evaluate(`!!document.querySelector('[role="alert"]')`).catch(() => false))) break;
    if (ok) {
      ready = Date.now() - t0;
      // what the visitor had to wait for: bytes finished before the scene was ready
      readyKB = Math.round([...requests.values()].filter((r) => r.at && r.at - t0 <= ready).reduce((n, r) => n + r.bytes, 0) / 1024);
      break;
    }
    await sleep(100);
  }
  // first frame actually drawn after the scene is ready (shader compiles included), ms since navigation
  const firstFrameMs = ready === null ? null : Math.round(await evaluate(`new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(performance.now()))))`));
  let contextLoss = null;
  if (loseContext && ready !== null) {
    await evaluate(`(() => { const c = document.querySelector('canvas'); c.addEventListener('webglcontextrestored', () => { window.__restored = true; }); window.__loseExt = (c.getContext('webgl2') || c.getContext('webgl')).getExtension('WEBGL_lose_context'); window.__loseExt.loseContext(); })()`);
    await sleep(800);
    const shown = await evaluate(`[...document.querySelectorAll('[role="alert"]')].map((e) => e.innerText.split(String.fromCharCode(10))[0])`);
    await evaluate(`window.__loseExt.restoreContext()`);
    const lostAt = Date.now();
    let back = false;
    while (!back && Date.now() - lostAt < 20000) {
      await sleep(250);
      back = await evaluate(`!!window.__vil3d?.ready?.() && ![...document.querySelectorAll('[role="alert"]')].length`).catch(() => false);
    }
    const state = await evaluate(`({ restoredEvent: !!window.__restored, ready: !!window.__vil3d?.ready?.(), canvases: document.querySelectorAll('canvas').length, alerts: [...document.querySelectorAll('[role="alert"]')].map((e) => e.innerText.slice(0, 60)) })`);
    contextLoss = { messageShown: shown, recovered: back, recoveredInMs: back ? Date.now() - lostAt : null, state };
  }
  let afterLeave = null;
  if (leaveTo && ready !== null) {
    const gc = async () => {
      await send('HeapProfiler.enable');
      await send('HeapProfiler.collectGarbage');
    };
    await gc();
    const before = await evaluate(`performance.memory.usedJSHeapSize`);
    await evaluate(`(() => { history.pushState({}, '', ${JSON.stringify(leaveTo)}); dispatchEvent(new PopStateEvent('popstate')); })()`);
    await sleep(5000); // past the 2 s release grace
    await gc();
    const after = await evaluate(`performance.memory.usedJSHeapSize`);
    afterLeave = { to: leaveTo, heapBeforeMB: +(before / 1048576).toFixed(1), heapAfterMB: +(after / 1048576).toFixed(1), canvases: await evaluate(`document.querySelectorAll('canvas').length`) };
  }
  let loadHot = null;
  if (loadProfile) loadHot = topFunctions((await send('Profiler.stop')).profile, 20);
  let count = -1;
  for (let still = 0; still < 20; ) {
    await sleep(100);
    still = requests.size === count ? still + 1 : 0;
    count = requests.size;
  }
  await sleep(1500);
  const by = {};
  let total = 0;
  for (const r of requests.values()) {
    const k = kind(r.url);
    by[k] ??= { files: 0, KB: 0 };
    by[k].files++;
    by[k].KB += r.bytes / 1024;
    total += r.bytes / 1024;
  }
  for (const k in by) by[k].KB = Math.round(by[k].KB);
  const scene = await evaluate(`(async () => {
    const v = window.__vil3d;
    if (!v) return null;
    const fps = await new Promise((done) => { let n = 0; const s = performance.now(); const f = () => { n++; performance.now() - s < 5000 ? requestAnimationFrame(f) : done(Math.round(n / ((performance.now() - s) / 1000))); }; requestAnimationFrame(f); });
    return { level: v.quality, dpr: v.dpr(), bench: v.bench(60), fps, memory: v.memory(), lodSwitches: v.lod?.(), programs: v.renderer().programs, state: v.state?.() };
  })()`);
  if (shots) {
    mkdirSync(shots, { recursive: true });
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(path.join(shots, `${p.replace(/[^a-z0-9]+/gi, '_') || 'home'}.png`), Buffer.from(data, 'base64'));
  }
  let hot = null;
  if (cpuProfile) {
    await send('Profiler.enable');
    await send('Profiler.start');
    await sleep(3000);
    hot = topFunctions((await send('Profiler.stop')).profile, 15);
  }
  results.gpu ??= await evaluate(`(() => { const g = document.createElement('canvas').getContext('webgl2'); const e = g?.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : null; })()`);
  const pageText = ready === null ? await evaluate(`document.querySelector('main')?.innerText.slice(0, 300) ?? ''`) : undefined;
  results.pages[p] = { readyMs: ready, firstFrameMs, ...(pageText !== undefined ? { pageText } : {}), ...(contextLoss ? { contextLoss } : {}), ...(afterLeave ? { afterLeave } : {}), readyKB, downloadKB: Math.round(total), requests: requests.size, by, scene, errors: errors.splice(0), ...(hot ? { hot } : {}), ...(loadHot ? { loadHot } : {}) };
}

console.log(JSON.stringify(results, null, 2));
ws.close();
chrome.kill();
await sleep(500);
try {
  rmSync(profile, { recursive: true, force: true });
} catch {
  /* profile still locked */
}
