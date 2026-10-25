/**
 * Dev helper: Setup Studio assembly frozen at given steps (needs `__vil3d.assembly` from the dev build).
 *   node dev/assembly-shots.mjs <outDir> <step>[@seconds-into] ... [--storage=dev/storage/showcase.json --cam=js]
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { openChrome } from '../scripts/lib/cdp.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? d;
const [out, ...shots] = args.filter((a) => !a.startsWith('--'));
mkdirSync(out, { recursive: true });
const c = await openChrome({ width: Number(opt('w', 1440)), height: Number(opt('h', 900)), port: 9342 });
const kv = JSON.parse(readFileSync(opt('storage', 'dev/storage/showcase.json'), 'utf8'));
await c.send('Page.addScriptToEvaluateOnNewDocument', { source: Object.entries(kv).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(typeof v === 'string' ? v : JSON.stringify(v))});`).join('') + `localStorage.setItem('vil3d:theme', '${opt('theme', 'light')}');` });
await c.navigate('http://localhost:5173/studio/summary');
await c.waitFor(`!!window.__vil3d?.ready?.() && !!window.__vil3d?.assembly`, 120000);
console.log('steps', await c.evaluate('JSON.stringify(__vil3d.assembly.steps)'));
for (const s of shots) {
  const [id, into = '1'] = s.split('@');
  const r = await c.evaluate(`__vil3d.assembly.seek(${JSON.stringify(id)}, ${Number(into)})`);
  await new Promise((res) => setTimeout(res, 1800));
  const cam = opt('cam', '');
  if (cam) { await c.evaluate(cam); await new Promise((res) => setTimeout(res, 600)); }
  const shot = await c.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(path.join(out, `${id}@${into}.png`), Buffer.from(shot.result.data, 'base64'));
  console.log('saved', id, into, r);
}
await c.close();
