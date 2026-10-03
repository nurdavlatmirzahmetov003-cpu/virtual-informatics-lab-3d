// Reproducible build of the licensed originals; assets-src is never modified.
import { NodeIO, Logger } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, flatten, join, prune, weld, simplify, meshopt, textureCompress, getBounds } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'public/assets/models/hardware');
await mkdir(out, { recursive: true });
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder,
});
const names = ['monitor_ultrawide', 'keyboard_mech', 'mouse_gaming', 'motherboard_x570', 'cpu_am4', 'ram_rgb', 'cooler_tower', 'gpu_triple_fan', 'ssd_m2', 'psu', 'fan_frame', 'fan_rotor', 'headset_gaming', 'speaker_left', 'speaker_right', 'pc_setup_y3d'];
const report = [];
const triangles = (doc) => doc.getRoot().listMeshes().reduce((sum, m) => sum + m.listPrimitives().reduce((s, p) => s + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION')?.getCount() ?? 0) / 3, 0), 0);

for (const name of names) {
  const sourceName = name.startsWith('speaker_') ? 'speakers' : name.startsWith('fan_') ? 'fan_120' : name;
  const input = resolve(root, 'assets-src/sketchfab', sourceName + '.glb');
  const doc = await io.read(input);
  doc.setLogger(new Logger(Logger.Verbosity.WARN));
  const before = { bytes: (await stat(input)).size, triangles: triangles(doc) };
  if (name === 'headset_gaming') {
    // The download carries an unused headphone rig. Bake its static rest pose
    // by keeping authored vertex positions; skin quantization would otherwise
    // make bounding-box fitting measure the bind-space rather than the product.
    doc.getRoot().listAnimations().forEach(a => a.dispose());
    doc.getRoot().listNodes().forEach(n => n.setSkin(null));
    doc.getRoot().listMeshes().forEach(m => m.listPrimitives().forEach(p => {
      p.setAttribute('JOINTS_0', null); p.setAttribute('WEIGHTS_0', null);
    }));
    doc.getRoot().listSkins().forEach(s => s.dispose());
  }
  await doc.transform(flatten());
  const nodes = doc.getRoot().listNodes().filter(n => n.getMesh());
  // Remove authoring cables that extend far beyond the devices, and detached
  // PSU screws. Keep original files and document these edits in the report.
  const removed = [];
  nodes.forEach((node, index) => {
    let remove = false;
    if (name === 'keyboard_mech') remove = /^(wire|usb)_/.test(node.getName());
    if (name === 'mouse_gaming') remove = /^Cord/.test(node.getName());
    if (name === 'psu') remove = ['Object_78', 'Object_80', 'Object_82'].includes(node.getName());
    if (name === 'gpu_triple_fan') remove = node.getMesh().listPrimitives().every(p => p.getMaterial()?.getAlphaMode() === 'BLEND' && p.getMaterial().getBaseColorFactor()[3] === 0);
    if (name === 'fan_frame') remove = node.getName() === 'Object_10';
    if (name === 'fan_rotor') remove = node.getName() !== 'Object_10';
    if (name.startsWith('speaker_')) {
      const b = getBounds(node);
      remove = name === 'speaker_left' ? b.max[0] > -0.01 : b.min[0] < 0.01;
    }
    if (name === 'pc_setup_y3d') {
      // Extract the chassis only. Interior parts remain independently loaded,
      // so exploded animation never duplicates a baked-in PC assembly.
      const shell = [1, 3, 4, 27, 28, 32, 33, 34, 63, 64, 65, 66, 67, 68];
      remove = !shell.includes(index);
    }
    if (remove) { removed.push(node.getName()); node.dispose(); }
  });
  await doc.transform(prune(), dedup(), weld(), join());
  if (['monitor_ultrawide', 'cooler_tower', 'gpu_triple_fan', 'cpu_am4', 'mouse_gaming'].includes(name)) {
    await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: name === 'monitor_ultrawide' ? 0.35 : 0.65, error: 0.0003, lockBorder: true }));
  }
  await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 88 }), meshopt({ encoder: MeshoptEncoder, level: 'high', quantizePosition: 16 }), prune());
  const file = name === 'pc_setup_y3d' ? 'chassis.glb' : name + '.glb';
  await io.write(resolve(out, file), doc);
  const entry = { source: sourceName + '.glb', file, before, after: { bytes: (await stat(resolve(out, file))).size, triangles: triangles(doc), primitives: doc.getRoot().listMeshes().reduce((s, m) => s + m.listPrimitives().length, 0), bounds: getBounds(doc.getRoot().listScenes()[0]) }, edits: { removedNodes: removed, textures: 'WebP up to 1024px, quality 88; Meshopt; welded and merged static meshes' } };
  report.push(entry);
  console.log(`${file}: ${(before.bytes / 1e6).toFixed(2)} -> ${(entry.after.bytes / 1e6).toFixed(2)} MB, ${entry.after.primitives} primitives`);
}
await writeFile(resolve(root, 'public/assets/models/hardware/optimization-report.json'), JSON.stringify(report, null, 2) + '\n');
