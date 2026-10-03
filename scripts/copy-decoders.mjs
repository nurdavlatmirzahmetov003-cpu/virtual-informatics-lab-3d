// Copies Draco + Basis (KTX2) decoders from the installed three.js version
// into public/decoders so they are served locally (no CDN dependency).
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const libs = resolve(root, 'node_modules/three/examples/jsm/libs');
const out = resolve(root, 'public/decoders');

const targets = [
  ['draco/gltf', 'draco'],
  ['basis', 'basis'],
];

for (const [from, to] of targets) {
  const src = resolve(libs, from);
  if (!existsSync(src)) {
    console.warn(`[copy-decoders] missing ${src} — skipped`);
    continue;
  }
  const dest = resolve(out, to);
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`[copy-decoders] ${from} -> public/decoders/${to}`);
}
