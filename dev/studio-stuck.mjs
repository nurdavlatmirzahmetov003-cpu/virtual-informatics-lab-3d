// V4 §11 probe: does /studio finish loading on a phone when it is the first 3D page?
import { openChrome } from '../scripts/lib/cdp.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const [w, h, mobile, first] = [Number(process.argv[2] ?? 360), 740, process.argv[3] !== 'desk', process.argv[4] ?? '/?demo=1'];
const c = await openChrome({ width: w, height: h, port: 9690 });
const logs = [];
await c.send('Log.enable');
const orig = c.send;
if (mobile) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true, screenWidth: w, screenHeight: h });
  await c.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  if (process.env.RM) await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  if (process.env.ET) await c.send('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' });
}
await c.evaluate(`window.__errs = []`).catch(() => {});
await c.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__errs=[];addEventListener('error',e=>__errs.push(String(e.message)));addEventListener('unhandledrejection',e=>__errs.push('rej '+String(e.reason)));const ce=console.error;console.error=(...a)=>{__errs.push(a.map(String).join(' ').slice(0,300));ce(...a)};const cw=console.warn;console.warn=(...a)=>{__errs.push('warn '+a.map(String).join(' ').slice(0,300));cw(...a)}` });
await c.navigate(`http://localhost:5173${first}`);
await sleep(2500);
await c.navigate('http://localhost:5173/studio');
for (let i = 0; i < 12; i++) {
  await sleep(2500);
  const s = await c.evaluate(`JSON.stringify({ loader: !!document.querySelector('[data-visible=true]'), text: document.querySelector('[data-visible=true]')?.innerText?.replace(/\\s+/g,' ').slice(0,80), canvas: !!document.querySelector('canvas'), q: localStorage.getItem('vil3d:settings') })`);
  console.log(i, s);
  if (!JSON.parse(s).loader) break;
}
console.log(JSON.stringify(await c.evaluate('window.__errs'), null, 1));
await c.close();
void orig;
void logs;
