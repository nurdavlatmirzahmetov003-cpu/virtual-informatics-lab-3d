// V4 §10 screenshots: node dev/s10-shots.mjs — Bit's voice settings at 360/375/768/1280/1920, light and dark
import { writeFileSync, mkdirSync } from 'node:fs';
import { openChrome } from '../scripts/lib/cdp.mjs';

const base = 'http://localhost:5173';
const out = 'docs/v4-section10';
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let port = 9600;

async function shot(c, name) {
  const info = await c.evaluate(`(() => {
    const sheet = document.querySelector('[aria-labelledby="bit-voice-title"]');
    const r = sheet?.getBoundingClientRect();
    // every button, radio row and switch in the sheet at least 44 px tall
    const small = [...(sheet?.querySelectorAll('button, label') ?? [])].filter((e) => e.getBoundingClientRect().height < 44 && e.getBoundingClientRect().height > 0).map((e) => e.textContent.trim().slice(0, 20));
    return { hscroll: document.documentElement.scrollWidth > innerWidth + 1, sheet: r ? [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] : null, inside: r ? r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight : false, small };
  })()`);
  const r = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 84 });
  writeFileSync(`${out}/${name}.jpg`, Buffer.from(r.result.data, 'base64'));
  console.log(`${name}.jpg`, JSON.stringify(info));
}

for (const theme of ['light', 'dark']) {
  for (const [w, h] of [[360, 740], [375, 812], [768, 1024], [1280, 800], [1920, 1080]]) {
    const c = await openChrome({ width: w, height: h, port: port++ });
    await c.navigate(`${base}/credits`);
    await sleep(1000);
    await c.evaluate(`(() => { const k = 'vil3d:settings'; const s = JSON.parse(localStorage.getItem(k) || '{"state":{},"version":3}'); s.state = { ...s.state, qualityMode: 'low', theme: '${theme}', language: 'kk' }; s.version = 3; localStorage.setItem(k, JSON.stringify(s)); localStorage.setItem('vil3d:onboarded', '1'); })()`);
    await c.navigate(`${base}/credits`);
    await c.waitFor(`!!document.querySelector('button[aria-label="Битпен сөйлесу"]')`, 30000);
    await c.evaluate(`(async () => { const u = performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('/store/bitStore.ts')).pop(); (await import(u)).useBitStore.getState().openBit(); })()`);
    await c.waitFor(`!!document.querySelector('button[aria-label^="Биттің дауысы"]')`, 30000);
    await sleep(600);
    await c.evaluate(`document.querySelector('button[aria-label^="Биттің дауысы"]').click()`);
    await sleep(700);
    await shot(c, `voice-settings-${w}-${theme}`);
    await c.evaluate(`(() => { const b = document.querySelector('[aria-labelledby="bit-voice-title"] > div'); b.scrollTop = b.scrollHeight; })()`);
    await sleep(300);
    await shot(c, `voice-settings-end-${w}-${theme}`);
    await c.close();
  }
}
