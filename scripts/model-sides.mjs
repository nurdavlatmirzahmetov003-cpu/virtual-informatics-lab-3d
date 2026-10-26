/**
 * Renders catalog product models from four sides (+Z, +X, −Z, −X) with a red
 * arrow along +Z — the side that must face the chair (V4 §2.1). Use it to
 * audit a new model's front before adding it to scripts/orientation.test.mjs
 * (and, when it faces another way, to lib/three/modelFront.ts).
 *
 *   npm run models:sides -- spk-edifier-r1280db,mon-lg-27gr93u [out.png]
 *
 * Needs the dev site on :5173 (npm run dev).
 */
import { writeFileSync } from 'node:fs';
import { openChrome } from './lib/cdp.mjs';

const [ids, out = 'test-results/model-sides.png'] = process.argv.slice(2);
if (!ids) {
  console.error('usage: npm run models:sides -- <id,id,…> [out.png]');
  process.exit(2);
}
const c = await openChrome({ width: 1320, height: 260 * ids.split(',').length + 40, port: 9361 });
try {
  await c.navigate(`http://localhost:5173/scripts/model-sides.html?ids=${ids}`);
  await c.waitFor('window.done === 1', 60000);
  const r = await c.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  const { mkdirSync } = await import('node:fs');
  const { dirname } = await import('node:path');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(r.result.data, 'base64'));
  console.log(`saved ${out}`);
} finally {
  await c.close();
}
