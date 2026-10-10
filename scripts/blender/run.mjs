/**
 * Runs the headless Blender pipeline for one or all configs, then verifies the output.
 *
 *   npm run blender:pipeline                       # every scripts/blender/configs/*.json
 *   npm run blender:pipeline -- gpu_triple_fan     # one config (name or path)
 *   npm run blender:pipeline -- products           # every catalog product (configs/products)
 *
 * Blender is found via BLENDER_PATH or the default Windows install of Blender 5.1.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verify } from './verify-glb.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const blender = [
  process.env.BLENDER_PATH,
  'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe',
  '/Applications/Blender.app/Contents/MacOS/Blender',
  '/usr/bin/blender',
].find((p) => p && existsSync(p));
if (!blender) {
  console.error('Blender not found — install Blender 5.1 or set BLENDER_PATH');
  process.exit(2);
}

const configsDir = path.join(here, 'configs');
const wanted = process.argv.slice(2);
const productsDir = path.join(configsDir, 'products');
const all = [
  ...readdirSync(configsDir).filter((f) => f.endsWith('.json')).map((f) => path.join(configsDir, f)),
  ...readdirSync(productsDir).filter((f) => f.endsWith('.json')).map((f) => path.join(productsDir, f)),
];
// `products` = every catalog product config; otherwise names or paths
const configs = !wanted.length
  ? all
  : wanted.flatMap((c) =>
      c === 'products'
        ? all.filter((f) => f.startsWith(productsDir))
        : [existsSync(c) ? path.resolve(c) : all.find((f) => path.basename(f) === (c.endsWith('.json') ? c : `${c}.json`)) ?? c],
    );

let failed = 0;
for (const config of configs) {
  const run = spawnSync(blender, ['--background', '--factory-startup', '--python', path.join(here, 'pipeline.py'), '--', config], {
    cwd: root,
    encoding: 'utf8',
  });
  const lines = `${run.stdout}${run.stderr}`.split('\n').filter((l) => l.startsWith('[pipeline]') || /Traceback|Error/.test(l));
  console.log(lines.join('\n'));
  if (run.status !== 0) {
    failed++;
    continue;
  }
  const r = await verify(config);
  if (r.errors.length) {
    failed++;
    console.error(`verify ${path.basename(config)}:\n  ${r.errors.join('\n  ')}`);
  } else console.log(`verify ${path.basename(config)}: OK (${Object.keys(r.info.parts).length} parts, ${r.info.ports.length} ports)`);
}
process.exit(failed ? 1 : 0);
