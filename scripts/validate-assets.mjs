import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';

const root = resolve(import.meta.dirname, '..');
const registry = JSON.parse(await readFile(resolve(root, 'src/data/assets/hardware.json'), 'utf8'));
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
let bytes = 0, files = 0;

/** Shared geometry checks for any optimised GLB; returns its scene bounds. */
async function check(path, label, maxTexture) {
  const doc = await io.read(path);
  assert.ok(doc.getRoot().listExtensionsRequired().some(e => e.extensionName === 'EXT_meshopt_compression'), `${label}: Meshopt`);
  const b = getBounds(doc.getRoot().listScenes()[0]);
  assert.ok([...b.min, ...b.max].every(Number.isFinite), `${label}: finite bounds`);
  assert.ok(b.max.every((v, i) => v > b.min[i]), `${label}: non-empty geometry`);
  for (const texture of doc.getRoot().listTextures()) {
    assert.ok(Math.max(...texture.getSize()) <= maxTexture, `${label}: texture budget ${maxTexture}`);
    assert.equal(texture.getMimeType(), 'image/webp');
  }
  for (const mesh of doc.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) {
    const vertices = p.getAttribute('POSITION');
    assert.ok(vertices?.getCount() > 0, `${label}: positions`);
    const indices = p.getIndices()?.getArray();
    if (indices) for (const index of indices) assert.ok(index < vertices.getCount(), `${label}: valid index`);
  }
  bytes += (await stat(path)).size; files++;
  return { doc, bounds: b };
}

/** Per-product models (V2-2a): three levels, real size in metres, standing on the ground, centred. */
/** [suffix, max texture px, GPU texture budget MB (RGBA + mips)] — see optimize-assets.mjs */
const LEVELS = [['', 2048, 32], ['_lod1', 1024, 16], ['_lod2', 512, 4]];
async function checkProduct(file) {
  const id = file.match(/^products\/([a-z0-9-]+)\.glb$/)?.[1];
  assert.ok(id, `${file}: products/<id>.glb`);
  for (const [suffix, max, budgetMB] of LEVELS) {
    const label = `products/${id}${suffix}.glb`;
    const { doc, bounds } = await check(resolve(root, 'public/assets/models', label), label, max);
    assert.ok(Math.abs(bounds.min[1]) < 0.005, `${label}: stands on the ground (min y ${bounds.min[1]})`);
    assert.ok(Math.abs(bounds.min[0] + bounds.max[0]) < 0.01 && Math.abs(bounds.min[2] + bounds.max[2]) < 0.01, `${label}: centred`);
    assert.ok(bounds.max.every((v, i) => v - bounds.min[i] < 2.5), `${label}: real-world size in metres`);
    const gpuMB = doc.getRoot().listTextures().reduce((sum, t) => sum + t.getSize()[0] * t.getSize()[1] * 4 * (4 / 3), 0) / 1048576;
    assert.ok(gpuMB <= budgetMB + 0.01, `${label}: ${gpuMB.toFixed(1)} MB of textures, budget ${budgetMB} MB`);
    const materials = doc.getRoot().listMaterials().map(m => m.getName());
    if (id.startsWith('mon-')) assert.ok(materials.includes('Screen'), `${label}: Screen material`);
    if (id.startsWith('desk-')) assert.ok(materials.includes('DeskTop'), `${label}: DeskTop material`);
  }
}

for (const asset of registry) {
  assert.ok(asset.author && asset.name);
  assert.match(asset.url, /^https:\/\/sketchfab\.com\/3d-models\/.+-[a-f0-9]{32}$/);
  for (const file of asset.file.split(' + ')) {
    if (file.startsWith('products/')) await checkProduct(file);
    else {
      assert.match(file, /^[a-z0-9_]+\.glb$/);
      await check(resolve(root, 'public/assets/models/hardware', file), file, 1024);
    }
  }
}
console.log(`Validated ${files} GLBs from ${registry.length} attributed originals: ${(bytes / 1e6).toFixed(2)} MB; Meshopt decoding, bounded geometry, valid indices, WebP texture sizes and per-level GPU budgets, product levels on the ground at real size.`);
