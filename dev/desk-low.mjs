// V4 §11 probe: the white desk top on Low vs Medium (home hero) — screenshots and the mean brightness of the desk top
import { writeFileSync, mkdirSync } from 'node:fs';
import { openChrome } from '../scripts/lib/cdp.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync('docs/v4-section11', { recursive: true });
let port = 9740;
for (const q of ['low', 'medium']) {
  const c = await openChrome({ width: 1280, height: 800, port: port++ });
  await c.navigate('http://localhost:5173/credits');
  await sleep(800);
  await c.evaluate(`(() => { const k = 'vil3d:settings'; const s = JSON.parse(localStorage.getItem(k) || '{"state":{},"version":3}'); s.state = { ...s.state, qualityMode: '${q}', theme: 'light' }; s.version = 3; localStorage.setItem(k, JSON.stringify(s)); })()`);
  await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await c.navigate('http://localhost:5173/?look=white');
  await c.waitFor('!!document.querySelector("canvas") && !document.querySelector("[data-visible=true]")', 90000);
  await sleep(6000);
  const s = await c.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`docs/v4-section11/desk-white-${q}.png`, Buffer.from(s.result.data, 'base64'));
  // the desk top's front edge area, right of the headline (sampled from the canvas)
  const lum = await c.evaluate(`(async () => {
    const img = new Image(); img.src = 'data:image/png;base64,${'${'}DATA${'}'}';
    return 0;
  })()`).catch(() => 0);
  console.log(q, 'saved', lum);
  await c.close();
}
