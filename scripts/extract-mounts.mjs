/**
 * Mount geometry of every PC part model (V4 §1.2), measured from the GLB files:
 * the bounding box in the installed pose and the anchor points the mounting
 * system aligns (slot / socket markers of the Blender pipeline, the contact
 * face of a cooler base, a card's gold fingers). Writes
 * src/data/hardware/partGeometry.generated.ts; scripts/pc-fit.test.mjs checks
 * that the file is up to date.
 *
 *   node scripts/extract-mounts.mjs [--check]
 *
 * Installed pose = the part's model rotated as the scene mounts it (a quarter
 * turn about Z lays a board, card or stick against the tray: component side
 * −X, top edge +Y, I/O / bracket at −Z). Every point is relative to the
 * centre of that rotated bounding box, because ModelLoader centres models.
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { Matrix4, Vector3 } from 'three';

const root = path.resolve(import.meta.dirname, '..');
const MODELS = path.join(root, 'public/assets/models');
const OUT = path.join(root, 'src/data/hardware/partGeometry.generated.ts');

await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });

/** Model file prefix → category and pose. */
const KINDS = [
  { re: /^products\/mb-.*\.glb$/, kind: 'board', onBoard: true },
  { re: /^products\/cpu-.*\.glb$/, kind: 'cpu', onBoard: true },
  { re: /^products\/cool-.*\.glb$/, kind: 'cooler', onBoard: true },
  { re: /^products\/ram-.*\.glb$/, kind: 'ram', onBoard: true },
  { re: /^products\/gpu-.*\.glb$/, kind: 'gpu', onBoard: true },
  // a 2.5″ SATA drive lies flat on the shroud; M.2 drives lie on the board
  { re: /^products\/ssd-samsung-870-.*\.glb$/, kind: 'ssd', onBoard: false },
  { re: /^products\/ssd-.*\.glb$/, kind: 'ssd', onBoard: true },
  { re: /^products\/psu-.*\.glb$/, kind: 'psu', onBoard: false },
  { re: /^bitlab\/(board|gpu|ram|cpu|cooler|ssd)-.*\.glb$/, kind: 'auto', onBoard: true },
  { re: /^bitlab\/psu-.*\.glb$/, kind: 'psu', onBoard: false },
];
/**
 * Slot anchors measured on top-view renders of each board model
 * (scripts/blender/check-markers.py, 2026-10-25): the pipeline's markers are a
 * shared template and miss the real socket by up to 28 mm on some boards.
 * [y, z] in the installed pose relative to the box centre (y = towards the
 * board's top edge, z = towards its front edge). Socket = centre of the
 * cooler mounting-hole pattern; DIMM / PCIe = slot centre; M.2 = drive centre.
 */
const TUF_LAYOUT = {
  socket_cpu_1: [0.0596, 0.01388],
  slot_dimm_1: [0.0605, 0.06868], slot_dimm_2: [0.0605, 0.07811], slot_dimm_3: [0.0605, 0.08754], slot_dimm_4: [0.0605, 0.09713],
  slot_pcie_x16_1: [-0.03096, -0.03416],
  slot_m2_1: [-0.01174, -0.00747],
  header_24pin_1: [0.0448, 0.116],
  header_eps_8pin_1: [0.1459, -0.0658],
};
const MEASURED = {
  'products/mb-asus-tuf-b650-plus.glb': TUF_LAYOUT,
  // same source model as the TUF
  'products/mb-asus-prime-z890-p.glb': TUF_LAYOUT,
  'products/mb-msi-b650-gaming-plus.glb': {
    socket_cpu_1: [0.06832, 0.00712],
    slot_dimm_1: [0.07188, 0.06298], slot_dimm_2: [0.07188, 0.07152], slot_dimm_3: [0.07188, 0.0797], slot_dimm_4: [0.07188, 0.08789],
    slot_pcie_x16_1: [-0.02964, -0.03203],
    slot_m2_1: [-0.00712, -0.00534],
    header_24pin_1: [0.04033, 0.11362],
    header_eps_8pin_1: [0.14472, -0.07117],
  },
  'products/mb-msi-pro-b760m-a-ddr4.glb': {
    socket_cpu_1: [0.04754, 0.00939],
    slot_dimm_1: [0.04603, 0.06112], slot_dimm_2: [0.04603, 0.0706], slot_dimm_3: [0.04603, 0.08008], slot_dimm_4: [0.04603, 0.08876],
    slot_pcie_x16_1: [-0.02656, -0.03083],
    slot_m2_1: [-0.01044, -0.03416],
    header_24pin_1: [0.05409, 0.11293],
    header_eps_8pin_1: [0.1115, -0.05645],
  },
};
/** Centre of an x16 card's gold fingers from the outer face of its bracket (fingers start ≈ 57 mm in, 89 mm long) (the pipeline's card markers are a template too). */
const FINGERS_FROM_BRACKET = 0.1015;
/** Depth of a card's PCB below the top of its backplate. */
const PCB_BELOW_BACKPLATE = 0.006;

const ON_BOARD = new Matrix4().makeRotationZ(Math.PI / 2);
const r4 = (v) => Math.round(v * 1e5) / 1e5;
const vec = (v) => [r4(v.x), r4(v.y), r4(v.z)];

async function measure(rel, onBoard) {
  const doc = await io.read(path.join(MODELS, rel));
  const pose = onBoard ? ON_BOARD : new Matrix4();
  const min = new Vector3(Infinity, Infinity, Infinity);
  const max = new Vector3(-Infinity, -Infinity, -Infinity);
  const points = [];
  const markers = {};
  const p = new Vector3();
  const el = [];
  for (const node of doc.getRoot().listNodes()) {
    const world = new Matrix4().fromArray(node.getWorldMatrix());
    const m = pose.clone().multiply(world);
    const name = node.getName();
    if (/^(slot|socket|header|mount)_/.test(name)) markers[name] = new Vector3().setFromMatrixPosition(m);
    const mesh = node.getMesh();
    if (!mesh) continue;
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION');
      for (let i = 0; i < pos.getCount(); i++) {
        pos.getElement(i, el);
        p.set(el[0], el[1], el[2]).applyMatrix4(m);
        min.min(p);
        max.max(p);
        points.push(p.x, p.y, p.z);
      }
    }
  }
  return { min, max, points, markers };
}

/** Centroid of the vertices within `band` metres of the +X face (the side that touches the board / CPU). */
function contactFace(points, maxX, band) {
  let n = 0;
  const c = new Vector3();
  const lo = new Vector3(Infinity, Infinity, Infinity);
  const hi = new Vector3(-Infinity, -Infinity, -Infinity);
  for (let i = 0; i < points.length; i += 3) {
    if (points[i] < maxX - band) continue;
    c.x += points[i]; c.y += points[i + 1]; c.z += points[i + 2];
    lo.min(new Vector3(points[i], points[i + 1], points[i + 2]));
    hi.max(new Vector3(points[i], points[i + 1], points[i + 2]));
    n++;
  }
  // the middle of the contact face's extent: robust against uneven vertex density
  return new Vector3(maxX, (lo.y + hi.y) / 2, (lo.z + hi.z) / 2);
}

const files = [];
for (const dir of ['products', 'bitlab']) {
  let list = [];
  try { list = readdirSync(path.join(MODELS, dir)); } catch { continue; }
  for (const f of list) if (f.endsWith('.glb') && !/_lod\d|_hd\./.test(f)) files.push(`${dir}/${f}`);
}

const out = {};
for (const rel of files.sort()) {
  const k = KINDS.find((x) => x.re.test(rel));
  if (!k) continue;
  const kind = k.kind === 'auto' ? rel.match(/^bitlab\/(\w+)-/)[1].replace('cooler', 'cooler') : k.kind;
  const { min, max, points, markers } = await measure(rel, k.onBoard);
  const centre = min.clone().add(max).multiplyScalar(0.5);
  const rel3 = (v) => vec(v.clone().sub(centre));
  const entry = { kind, size: vec(max.clone().sub(min)), anchors: {} };
  for (const [name, v] of Object.entries(markers)) entry.anchors[name] = rel3(v);
  for (const [name, [y, z]] of Object.entries(MEASURED[rel] ?? {})) entry.anchors[name] = [entry.anchors[name]?.[0] ?? 0, y, z];
  // BitLab's own models (scripts/blender/make-showcase.py) carry exact markers
  const own = /\/(mb|gpu|ram|cool)-bitlab-/.test(rel);
  if (kind === 'board' && !own && !MEASURED[rel]) throw new Error(`${rel}: measure its slot anchors (MEASURED)`);
  if (own && (kind === 'board' || kind === 'gpu') && !entry.anchors[kind === 'board' ? 'socket_cpu_1' : 'slot_pcie_x16_1']) throw new Error(`${rel}: its markers are missing (export them with extras)`);
  // the PCB (and its fingers) lies just under the backplate; the cooler and fans hang below it
  if (kind === 'gpu' && !own) entry.anchors.slot_pcie_x16_1 = [r4(entry.size[0] / 2), r4(entry.size[1] / 2 - PCB_BELOW_BACKPLATE), r4(-entry.size[2] / 2 + FINGERS_FROM_BRACKET)];
  if (kind === 'cooler') entry.anchors.base = rel3(contactFace(points, max.x, 0.0015));
  if (kind === 'cpu') entry.anchors.base = rel3(new Vector3(max.x, centre.y, centre.z));
  out[rel] = entry;
}

/** Desks: the bounds of the top surface (vertices within 1 cm of the highest point), model space. */
const desks = {};
for (const rel of files.filter((f) => /^products\/desk-/.test(f)).sort()) {
  const { max, points } = await measure(rel, false);
  const lo = [Infinity, Infinity];
  const hi = [-Infinity, -Infinity];
  for (let i = 0; i < points.length; i += 3) {
    if (points[i + 1] < max.y - 0.01) continue;
    lo[0] = Math.min(lo[0], points[i]);
    lo[1] = Math.min(lo[1], points[i + 2]);
    hi[0] = Math.max(hi[0], points[i]);
    hi[1] = Math.max(hi[1], points[i + 2]);
  }
  desks[rel] = { y: r4(max.y), min: lo.map(r4), max: hi.map(r4) };
}

const json = (v) => JSON.stringify(v, null, 1).replace(/\n\s+(-?[\d.e-]+,?)/g, ' $1').replace(/\n\s+\]/g, ']');
const body = `/* Generated by scripts/extract-mounts.mjs — do not edit. */
import type { DeskTop, PartGeometry } from './mountTypes';

export const PART_GEOMETRY: Readonly<Record<string, PartGeometry>> = ${json(out)};

export const DESK_TOPS: Readonly<Record<string, DeskTop>> = ${json(desks)};
`;
if (process.argv.includes('--check')) {
  const now = readFileSync(OUT, 'utf8');
  if (now !== body) { console.error('partGeometry.generated.ts is stale: run node scripts/extract-mounts.mjs'); process.exit(1); }
  console.log('up to date');
} else {
  writeFileSync(OUT, body);
  console.log(`${Object.keys(out).length} models → ${path.relative(root, OUT)}`);
}
