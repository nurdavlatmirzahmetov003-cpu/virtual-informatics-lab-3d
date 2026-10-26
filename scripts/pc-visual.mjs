/**
 * Visual regression check of the PC (V4 §1.5): the home hero PC and the Setup
 * Studio PC, each from four fixed angles, against saved baselines. A shot
 * whose pixels differ beyond the threshold fails, and a diff image is written
 * next to it so the change can be seen.
 *
 *   npm run test:pc-visual              # compare (needs the dev site on :5173)
 *   npm run test:pc-visual -- --update  # write new baselines after an intended change
 *
 * Headless Chrome over the DevTools protocol (scripts/lib/cdp.mjs), the same
 * driver as the perf scripts; reduced motion freezes the RGB and fans, the
 * quality is fixed to Medium and the UI is hidden so only the 3D is compared.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { openChrome } from './lib/cdp.mjs';

const root = path.resolve(import.meta.dirname, '..');
const BASE = path.join(root, 'scripts/visual-baselines');
const OUT = path.join(root, 'test-results/pc-visual');
const SITE = process.env.VISUAL_BASE ?? 'http://localhost:5173';
const update = process.argv.includes('--update');
/** A pixel counts as changed when a channel moves more than this (0–255)… */
const PIXEL = 32;
/** …and a shot fails when more than this share of its pixels changed. */
const SHARE = 0.015;
const W = 1280;
const H = 800;

const showcase = {
  case: 'case-bitlab-panorama', cpu: 'cpu-amd-r7-7800x3d', cooling: 'cool-bitlab-aero-360', motherboard: 'mb-bitlab-aero', ram: 'ram-bitlab-aero', gpu: 'gpu-bitlab-aero',
  ssd: 'ssd-samsung-990-pro-2tb', psu: 'psu-bitlab-aero', monitor: 'mon-asus-xg27acs', keyboard: 'kb-logitech-pro-x-tkl', mouse: 'mouse-logitech-superlight2',
};
const storage = {
  'vil3d:settings': { state: { qualityMode: 'medium', language: 'kk', theme: 'light' }, version: 3 },
  'vil3d:setup': { state: { purpose: 'gaming', budget: 2_000_000, style: 'white', step: 'colors', build: showcase, finish: { case: 'white', rgb: 'flow', rgbCustom: '#38d6f5', desk: 'white', peripherals: 'white' } }, version: 1 },
};

/** Four views around the PC (camera offsets from the case origin, metres). */
// the glass view looks over the monitor, the rear one stays clear of the scenery behind the desk
const ANGLES = { front: [-0.95, 0.42, 1.0], glass: [-0.8, 0.62, 0.3], top: [-0.7, 0.95, 0.55], rear: [0.62, 0.3, -0.72] };

const HIDE_UI = `(() => { const s = document.createElement('style'); s.textContent = '* { visibility: hidden !important; transition: none !important; animation: none !important } canvas { visibility: visible !important }'; document.head.append(s); })()`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Puts the orbit camera at `offset` from the PC's case origin (read from the scene's pcRig, so each scene's own desk layout counts). */
const orbitTo = (o) => `import('/src/scenes/DeskScene/pc/pcRig.ts').then(({ pcRig }) => {
  const [x, y, z] = pcRig.origin;
  const c = __vil3d.controls(); const cam = __vil3d.camera();
  c.enableDamping = false; c.autoRotate = false; c.minDistance = 0.05; c.maxDistance = 20; c.minAzimuthAngle = -Infinity; c.maxAzimuthAngle = Infinity; c.minPolarAngle = 0; c.maxPolarAngle = Math.PI;
  cam.position.set(x + ${o[0]}, y + ${o[1]}, z + ${o[2]}); c.target.set(x, y - 0.02, z); c.update();
})`;

const SCENES = {
  hero: {
    url: '/',
    // explore mode on the assembled PC (the orbit camera is free there)
    prepare: `import('/src/store/pcStore.ts').then(({ usePcStore }) => { usePcStore.getState().enterExplore(null); usePcStore.setState({ exploded: false, autoRotate: false }); })`,
  },
  studio: {
    url: '/studio/summary',
    // the finished setup (the assembly skipped to its end), orbit view
    prepare: `import('/src/store/assemblyStore.ts').then(({ useAssemblyStore }) => { useAssemblyStore.getState().skip(); setTimeout(() => useAssemblyStore.setState({ autoRotate: false }), 300); })`,
  },
};

async function shoot(c, scene, angle) {
  await c.evaluate(orbitTo(ANGLES[angle]));
  await sleep(1200);
  const r = await c.send('Page.captureScreenshot', { format: 'png' });
  return Buffer.from(r.result.data, 'base64');
}

async function raw(png) {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, info };
}

async function compare(name, png) {
  const file = path.join(BASE, `${name}.png`);
  if (update || !existsSync(file)) {
    writeFileSync(file, png);
    return { name, status: update ? 'updated' : 'new baseline' };
  }
  const [a, b] = await Promise.all([raw(png), raw(file)]);
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) return { name, status: 'size changed', fail: true };
  const diff = Buffer.alloc(a.data.length);
  let changed = 0;
  for (let i = 0; i < a.data.length; i += 3) {
    const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]));
    if (d > PIXEL) {
      changed++;
      diff[i] = 255;
    } else {
      // the old frame, faded, so the red changes stand out
      diff[i] = diff[i + 1] = diff[i + 2] = 180 + (b.data[i] >> 2);
    }
  }
  const share = changed / (a.data.length / 3);
  const fail = share > SHARE;
  if (fail) {
    mkdirSync(OUT, { recursive: true });
    writeFileSync(path.join(OUT, `${name}.png`), png);
    await sharp(diff, { raw: { width: a.info.width, height: a.info.height, channels: 3 } }).png().toFile(path.join(OUT, `${name}.diff.png`));
  }
  return { name, status: `${(share * 100).toFixed(2)} % changed`, fail };
}

mkdirSync(BASE, { recursive: true });
try {
  await fetch(SITE);
} catch {
  console.error(`pc-visual: the dev site is not running on ${SITE} (npm run dev)`);
  process.exit(2);
}
const results = [];
for (const [key, scene] of Object.entries(SCENES)) {
  const c = await openChrome({ width: W, height: H, port: 9351 });
  try {
    await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await c.send('Page.addScriptToEvaluateOnNewDocument', { source: Object.entries(storage).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(JSON.stringify(v))});`).join('') });
    await c.navigate(SITE + scene.url);
    await c.waitFor('!!window.__vil3d?.ready?.()', 120000);
    await sleep(2500);
    await c.evaluate(scene.prepare);
    await sleep(2500);
    await c.evaluate(HIDE_UI);
    for (const angle of Object.keys(ANGLES)) results.push(await compare(`${key}-${angle}`, await shoot(c, scene, angle)));
  } finally {
    await c.close().catch(() => {});
  }
}
for (const r of results) console.log(`${r.fail ? '✖' : '✔'} ${r.name}: ${r.status}`);
const failed = results.filter((r) => r.fail);
if (failed.length) {
  console.error(`\n${failed.length} shot(s) differ from the baseline; see ${path.relative(root, OUT)} (run with --update if the change is intended)`);
  process.exit(1);
}
