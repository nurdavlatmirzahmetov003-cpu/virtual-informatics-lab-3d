// node dev/asm-eval.mjs <step@into> <js>  — evaluate JS in the frozen Setup Studio assembly
import { readFileSync } from 'node:fs';
import { openChrome } from '../scripts/lib/cdp.mjs';
const [shot, js] = process.argv.slice(2);
const c = await openChrome({ width: 1440, height: 900, port: 9343 });
const kv = JSON.parse(readFileSync('dev/storage/showcase.json', 'utf8'));
await c.send('Page.addScriptToEvaluateOnNewDocument', { source: Object.entries(kv).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(JSON.stringify(v))});`).join('') });
await c.navigate('http://localhost:5173/studio/summary');
await c.waitFor(`!!window.__vil3d?.ready?.() && !!window.__vil3d?.assembly`, 120000);
const [id, into = '1'] = shot.split('@');
await c.evaluate(`__vil3d.assembly.seek(${JSON.stringify(id)}, ${Number(into)})`);
await new Promise((r) => setTimeout(r, 1500));
console.log(await c.evaluate(js));
await c.close();
