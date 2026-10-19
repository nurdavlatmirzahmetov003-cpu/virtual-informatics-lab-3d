/**
 * Renders the lab overview impostor atlas (0.37) from the dev page
 * /dev/impostors.html in headless Chrome and writes
 *   public/assets/textures/lab-impostors.webp   (the atlas)
 *   src/data/lab/impostors.json                 (tile, size and base of each device)
 *
 *   npm run dev            # in another terminal
 *   npm run lab:impostors  # [-- http://localhost:5173]
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const base = process.argv[2] ?? 'http://localhost:5173';
const root = path.resolve(import.meta.dirname, '..');
const PORT = 9334;
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
if (!CHROME) throw new Error('Chrome/Edge not found');
const profile = mkdtempSync(path.join(tmpdir(), 'vil3d-imp-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--window-size=2200,1400', '--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=d3d11', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 50 && !wsUrl; i++) {
  try {
    wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === 'page')?.webSocketDebuggerUrl;
  } catch {
    /* starting */
  }
  if (!wsUrl) await sleep(200);
}
const ws = new WebSocket(wsUrl);
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
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;

try {
  await send('Page.enable');
  await send('Page.navigate', { url: `${base}/dev/impostors.html` });
  let sheet = null;
  for (let i = 0; i < 240 && !sheet; i++) {
    await sleep(500);
    sheet = await evaluate('window.__impostors ?? null');
  }
  if (!sheet) throw new Error('the impostor sheet did not finish (open /dev/impostors.html to see why)');
  const png = Buffer.from(sheet.png.split(',')[1], 'base64');
  const out = path.join(root, 'public/assets/textures/lab-impostors.webp');
  await sharp(png).webp({ quality: 88, alphaQuality: 95, effort: 6 }).toFile(out);
  const items = Object.fromEntries(sheet.items.sort((a, b) => a.row - b.row || a.col - b.col).map((m) => [m.id, { col: m.col, row: m.row, w: +m.w.toFixed(4), h: +m.h.toFixed(4), base: +m.base.toFixed(3) }]));
  writeFileSync(path.join(root, 'src/data/lab/impostors.json'), JSON.stringify({ cols: sheet.cols, rows: sheet.rows, tile: sheet.tile, items }, null, 1) + '\n');
  console.log(`lab-impostors.webp: ${sheet.items.length} devices, ${sheet.cols}×${sheet.rows} tiles of ${sheet.tile}px`);
} finally {
  ws.close();
  chrome.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
