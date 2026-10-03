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
for (const asset of registry) {
  assert.ok(asset.author && asset.name);
  assert.match(asset.url, /^https:\/\/sketchfab\.com\/3d-models\/.+-[a-f0-9]{32}$/);
  for (const file of asset.file.split(' + ')) {
    assert.match(file, /^[a-z0-9_]+\.glb$/);
    const path = resolve(root, 'public/assets/models/hardware', file);
    const doc = await io.read(path);
    assert.ok(doc.getRoot().listExtensionsRequired().some(e => e.extensionName === 'EXT_meshopt_compression'));
    const b = getBounds(doc.getRoot().listScenes()[0]);
    assert.ok([...b.min, ...b.max].every(Number.isFinite), `${file}: finite bounds`);
    assert.ok(b.max.every((v, i) => v > b.min[i]), `${file}: non-empty geometry`);
    for (const texture of doc.getRoot().listTextures()) {
      assert.ok(Math.max(...texture.getSize()) <= 1024, `${file}: texture budget`);
      assert.equal(texture.getMimeType(), 'image/webp');
    }
    for (const mesh of doc.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) {
      const vertices = p.getAttribute('POSITION');
      assert.ok(vertices?.getCount() > 0, `${file}: positions`);
      const indices = p.getIndices()?.getArray();
      if (indices) for (const index of indices) assert.ok(index < vertices.getCount(), `${file}: valid index`);
    }
    bytes += (await stat(path)).size; files++;
  }
}
console.log(`Validated ${files} GLBs from ${registry.length} attributed originals: ${(bytes / 1e6).toFixed(2)} MB; Meshopt decoding, bounded geometry, valid indices, 1K WebP textures.`);
