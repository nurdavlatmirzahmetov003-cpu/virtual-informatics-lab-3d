// Reproducible build of the licensed originals; assets-src is never modified.
//
// Per model: cleanup (flatten, prune, dedup, weld, join) → optional simplify →
// adaptive textures → Meshopt. Heavy models also get `<name>_lod1.glb`: a
// lighter level (fewer triangles, ≤ 256 px textures) used far away and on the
// Low preset / phones.
//
// Adaptive textures: each texture keeps the smallest size whose bilinear
// upscale stays visually lossless against the 1024 px reference
// (PSNR ≥ 45 dB). Textures with real detail stay at 1024; constant or nearly
// flat maps (e.g. a uniform normal map) shrink to a few pixels — they look the
// same and no longer take megabytes of GPU memory.
import { NodeIO, Logger } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, flatten, join, prune, weld, simplify, meshopt, getBounds, cloneDocument } from '@gltf-transform/functions';
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
const names = ['monitor_ultrawide', 'keyboard_mech', 'mouse_gaming', 'motherboard_x570', 'cpu_am4', 'ram_rgb', 'cooler_tower', 'gpu_triple_fan', 'ssd_m2', 'psu', 'fan_frame', 'fan_rotor', 'headset_gaming', 'speakers', 'pc_setup_y3d'];
/** Models with a second, lighter level: [ratio of the full model's triangles, max simplification error]. */
// (CPU and GPU are left out: their seam-heavy meshes barely simplify without cracks.)
const LOD1 = {
  monitor_ultrawide: [0.3, 0.006], cooler_tower: [0.25, 0.006], headset_gaming: [0.3, 0.006],
  motherboard_x570: [0.45, 0.004], speakers: [0.35, 0.006], mouse_gaming: [0.4, 0.006],
};
const MAX_TEXTURE = 1024;
const LOD_TEXTURE = 256;
const MIN_PSNR = 45;
const QUALITY = 88;

const report = [];
const triangles = (doc) => doc.getRoot().listMeshes().reduce((sum, m) => sum + m.listPrimitives().reduce((s, p) => s + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION')?.getCount() ?? 0) / 3, 0), 0);
const textureBytes = (doc) => doc.getRoot().listTextures().reduce((s, t) => { const [w, h] = t.getSize() ?? [0, 0]; return s + w * h * 4 * (4 / 3); }, 0);

function psnr(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; sum += d * d; }
  const mse = sum / a.length;
  return mse === 0 ? 99 : 10 * Math.log10((255 * 255) / mse);
}

/** Smallest size (halving from the capped size) that is still visually lossless. */
async function adaptiveSize(image, maxSize) {
  const meta = await sharp(image).metadata();
  const scale = Math.min(1, maxSize / Math.max(meta.width, meta.height));
  const W = Math.max(1, Math.round(meta.width * scale));
  const H = Math.max(1, Math.round(meta.height * scale));
  const ref = await sharp(image).resize(W, H, { fit: 'fill', kernel: 'lanczos3' }).ensureAlpha().raw().toBuffer();
  let best = [W, H, 99];
  for (let k = 1; k <= 8; k++) {
    const w = Math.max(4, W >> k), h = Math.max(4, H >> k);
    if (w === best[0] && h === best[1]) break;
    const small = await sharp(image).resize(w, h, { fit: 'fill', kernel: 'lanczos3' }).png().toBuffer();
    const up = await sharp(small).resize(W, H, { fit: 'fill', kernel: 'linear' }).ensureAlpha().raw().toBuffer();
    const score = psnr(ref, up);
    if (score < MIN_PSNR) break;
    best = [w, h, score];
  }
  return { from: [meta.width, meta.height], capped: [W, H], size: [best[0], best[1]], psnr: +best[2].toFixed(1) };
}

async function adaptiveTextures(doc, maxSize, adaptive = true) {
  const decisions = [];
  for (const texture of doc.getRoot().listTextures()) {
    const image = Buffer.from(texture.getImage());
    const d = adaptive ? await adaptiveSize(image, maxSize) : await (async () => {
      const m = await sharp(image).metadata();
      const s = Math.min(1, maxSize / Math.max(m.width, m.height));
      const size = [Math.max(1, Math.round(m.width * s)), Math.max(1, Math.round(m.height * s))];
      return { from: [m.width, m.height], capped: size, size, psnr: null };
    })();
    const webp = await sharp(image).resize(d.size[0], d.size[1], { fit: 'fill', kernel: 'lanczos3' }).webp({ quality: QUALITY }).toBuffer();
    texture.setImage(new Uint8Array(webp)).setMimeType('image/webp');
    const uri = texture.getURI();
    if (uri) texture.setURI(uri.replace(/\.\w+$/, '.webp'));
    decisions.push({ name: texture.getName() || null, from: d.from.join('x'), to: d.size.join('x'), psnr: d.psnr });
  }
  // the WebP extension tells loaders these images are WebP
  doc.createExtension((await import('@gltf-transform/extensions')).EXTTextureWebP).setRequired(true);
  return decisions;
}

for (const name of names) {
  const sourceName = name.startsWith('fan_') ? 'fan_120' : name;
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
    if (name === 'pc_setup_y3d') {
      // Extract the chassis only. Interior parts remain independently loaded,
      // so exploded animation never duplicates a baked-in PC assembly.
      const shell = [1, 3, 4, 27, 28, 32, 33, 34, 63, 64, 65, 66, 67, 68];
      remove = !shell.includes(index);
    }
    if (remove) { removed.push(node.getName()); node.dispose(); }
  });
  if (name === 'speakers') {
    // One file, two named halves: both speakers share the same textures in
    // GPU memory; the scene picks a half with <ModelLoader node="speaker_left">.
    const scene = doc.getRoot().listScenes()[0];
    const halves = { speaker_left: doc.createNode('speaker_left'), speaker_right: doc.createNode('speaker_right') };
    for (const node of doc.getRoot().listNodes().filter(n => n.getMesh())) {
      const b = getBounds(node);
      // same split as the earlier two files: parts across the middle belong to neither
      if (b.max[0] <= -0.01) halves.speaker_left.addChild(node);
      else if (b.min[0] >= 0.01) halves.speaker_right.addChild(node);
      else { removed.push(node.getName()); node.dispose(); }
    }
    Object.values(halves).forEach(h => scene.addChild(h));
  }
  await doc.transform(prune(), dedup(), weld(), join());
  if (['monitor_ultrawide', 'cooler_tower', 'gpu_triple_fan', 'cpu_am4', 'mouse_gaming'].includes(name)) {
    await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: name === 'monitor_ultrawide' ? 0.35 : 0.65, error: 0.0003, lockBorder: true }));
  }

  // the light level starts from the same cleaned geometry and original textures
  const lodDoc = LOD1[name] ? cloneDocument(doc) : null;

  const textures = await adaptiveTextures(doc, MAX_TEXTURE);
  await doc.transform(prune(), meshopt({ encoder: MeshoptEncoder, level: 'high', quantizePosition: 16 }), prune());
  const file = name === 'pc_setup_y3d' ? 'chassis.glb' : name + '.glb';
  await io.write(resolve(out, file), doc);

  let lod = null;
  if (lodDoc) {
    const [ratio, error] = LOD1[name];
    lodDoc.setLogger(new Logger(Logger.Verbosity.WARN));
    await lodDoc.transform(simplify({ simplifier: MeshoptSimplifier, ratio, error, lockBorder: true }));
    await adaptiveTextures(lodDoc, LOD_TEXTURE, false);
    await lodDoc.transform(prune(), meshopt({ encoder: MeshoptEncoder, level: 'high', quantizePosition: 14 }), prune());
    const lodFile = name + '_lod1.glb';
    await io.write(resolve(out, lodFile), lodDoc);
    lod = { file: lodFile, bytes: (await stat(resolve(out, lodFile))).size, triangles: triangles(lodDoc), textureMB: +(textureBytes(lodDoc) / 1048576).toFixed(1) };
  }

  const entry = {
    source: sourceName + '.glb', file, before,
    after: { bytes: (await stat(resolve(out, file))).size, triangles: triangles(doc), textureMB: +(textureBytes(doc) / 1048576).toFixed(1), primitives: doc.getRoot().listMeshes().reduce((s, m) => s + m.listPrimitives().length, 0), bounds: getBounds(doc.getRoot().listScenes()[0]) },
    lod1: lod,
    edits: { removedNodes: removed, textures: `WebP q${QUALITY}, ≤ ${MAX_TEXTURE}px, adaptive size (PSNR ≥ ${MIN_PSNR} dB); Meshopt; welded and merged static meshes`, textureSizes: textures },
  };
  report.push(entry);
  console.log(`${file}: ${(before.bytes / 1e6).toFixed(2)} -> ${(entry.after.bytes / 1e6).toFixed(2)} MB, ${Math.round(entry.after.triangles / 1000)}k △, ${entry.after.textureMB} MB GPU tex${lod ? ` · ${lod.file} ${(lod.bytes / 1e6).toFixed(2)} MB, ${Math.round(lod.triangles / 1000)}k △` : ''}`);
}
await writeFile(resolve(root, 'public/assets/models/hardware/optimization-report.json'), JSON.stringify(report, null, 2) + '\n');

// Room/desk textures: 512 px copies for the Low preset (phones), so they are
// not downloaded at 2K only to be shrunk on the GPU.
const textureDir = resolve(root, 'public/assets/textures');
for (const name of ['wood_diff.jpg', 'wood_nor.webp', 'wood_rough.jpg', 'floor_diff.jpg', 'floor_rough.webp']) {
  const input = resolve(textureDir, name);
  const outName = name.replace(/\.(\w+)$/, '_512.$1');
  const img = sharp(input).resize(512, 512, { kernel: 'lanczos3' });
  await (name.endsWith('.jpg') ? img.jpeg({ quality: 86, mozjpeg: true }) : img.webp({ quality: 88 })).toFile(resolve(textureDir, outName));
  console.log(`${outName}: ${((await stat(resolve(textureDir, outName))).size / 1024).toFixed(0)} KB`);
}
