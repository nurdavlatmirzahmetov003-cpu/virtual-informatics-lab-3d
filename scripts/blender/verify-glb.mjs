/**
 * Checks Blender pipeline output against its config (no Blender needed):
 *
 *   node scripts/blender/verify-glb.mjs scripts/blender/configs/gpu_triple_fan.json
 *
 * - config: unique snake_case part ids, exactly one fallback, ports reference parts;
 * - GLB: one node per part with teardown extras (part, explode, order), every port
 *   marker `port_<type>_<n>` parented to its part, LOD1 lighter than LOD0.
 */
import { NodeIO } from '@gltf-transform/core';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function validateConfig(cfg) {
  const errors = [];
  for (const key of ['name', 'input', 'output', 'parts']) if (!(key in cfg)) errors.push(`missing "${key}"`);
  const ids = (cfg.parts ?? []).map((p) => p.id);
  if (new Set(ids).size !== ids.length) errors.push('part ids must be unique');
  for (const id of ids) if (!/^[a-z][a-z0-9_]*$/.test(id)) errors.push(`part id "${id}" must be snake_case`);
  const fallbacks = (cfg.parts ?? []).filter((p) => p.fallback).length;
  if (fallbacks !== 1) errors.push(`exactly one fallback part required (found ${fallbacks})`);
  for (const p of cfg.parts ?? []) {
    if (!p.fallback && !(p.rules?.length > 0)) errors.push(`part "${p.id}" has no rules`);
    for (const r of p.rules ?? []) {
      for (const k of ['groups', 'objects', 'materials']) {
        if (k in r) {
          try {
            new RegExp(r[k]);
          } catch {
            errors.push(`part "${p.id}": invalid ${k} regex`);
          }
        }
      }
    }
    if (p.explode && (p.explode.length !== 3 || p.explode.some((v) => typeof v !== 'number'))) errors.push(`part "${p.id}": explode must be [x, y, z]`);
  }
  for (const port of cfg.ports ?? []) {
    if (!ids.includes(port.part)) errors.push(`port "${port.type}" references unknown part "${port.part}"`);
    if (!/^[a-z0-9_]+$/.test(port.type ?? '')) errors.push(`port type "${port.type}" must be snake_case`);
  }
  return errors;
}

function triangles(mesh) {
  let n = 0;
  for (const prim of mesh?.listPrimitives() ?? []) {
    const idx = prim.getIndices();
    n += (idx ? idx.getCount() : prim.getAttribute('POSITION').getCount()) / 3;
  }
  return n;
}

export async function inspectGlb(file) {
  const doc = await new NodeIO().read(file);
  const nodes = doc.getRoot().listNodes();
  const parentOf = new Map();
  for (const n of nodes) for (const c of n.listChildren()) parentOf.set(c, n);
  const parts = {};
  const ports = [];
  let total = 0;
  for (const n of nodes) {
    const extras = n.getExtras() ?? {};
    const t = triangles(n.getMesh());
    total += t;
    if (extras.part) parts[extras.part] = { node: n.getName(), triangles: t, explode: extras.explode, order: extras.order, labelKey: extras.labelKey };
    if (extras.port) ports.push({ name: n.getName(), type: extras.port, parent: parentOf.get(n)?.getName() ?? null, translation: n.getTranslation() });
  }
  return { parts, ports, triangles: total, textures: doc.getRoot().listTextures().length };
}

export function checkOutput(cfg, info, lod) {
  const errors = [];
  for (const p of cfg.parts) {
    const got = info.parts[p.id];
    if (!got) {
      errors.push(`part "${p.id}" missing in GLB`);
      continue;
    }
    if (got.node !== p.id) errors.push(`part "${p.id}" node is named "${got.node}"`);
    if (!(got.triangles > 0)) errors.push(`part "${p.id}" has no geometry`);
    if (!Array.isArray(got.explode) || got.explode.length !== 3) errors.push(`part "${p.id}" has no explode vector`);
  }
  const expected = (cfg.ports ?? []).length;
  if (info.ports.length !== expected) errors.push(`expected ${expected} port markers, found ${info.ports.length}`);
  const counters = {};
  for (const port of cfg.ports ?? []) {
    counters[port.type] = (counters[port.type] ?? 0) + 1;
    const name = `port_${port.type}_${counters[port.type]}`;
    const got = info.ports.find((p) => p.name === name);
    if (!got) errors.push(`port marker "${name}" missing`);
    else if (got.parent !== port.part) errors.push(`port marker "${name}" is under "${got.parent}", expected "${port.part}"`);
  }
  if (lod && !(lod.triangles < info.triangles)) errors.push(`LOD1 (${lod.triangles} △) is not lighter than LOD0 (${info.triangles} △)`);
  return errors;
}

export async function verify(configPath) {
  const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
  const errors = validateConfig(cfg);
  const out = path.resolve(ROOT, cfg.output);
  if (!existsSync(out)) return { cfg, errors, built: false };
  const info = await inspectGlb(out);
  const lodFile = out.replace(/\.glb$/, '_lod1.glb');
  const lod = cfg.lod && existsSync(lodFile) ? await inspectGlb(lodFile) : null;
  errors.push(...checkOutput(cfg, info, lod));
  return { cfg, errors, built: true, info, lod };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = process.argv[2];
  if (!target) {
    console.error('usage: node scripts/blender/verify-glb.mjs <config.json>');
    process.exit(2);
  }
  const r = await verify(target);
  if (!r.built) console.log(`${r.cfg.name}: output not built yet (${r.cfg.output}) — config checked only`);
  else {
    console.log(`${r.cfg.name}: ${Object.keys(r.info.parts).length} parts, ${r.info.ports.length} ports, ${r.info.triangles} △` + (r.lod ? `, LOD1 ${r.lod.triangles} △` : ''));
    for (const [id, p] of Object.entries(r.info.parts)) console.log(`  ${id.padEnd(12)} ${String(p.triangles).padStart(6)} △  explode ${JSON.stringify(p.explode)}`);
    for (const p of r.info.ports) console.log(`  ${p.name.padEnd(16)} on ${p.parent}`);
  }
  if (r.errors.length) {
    console.error('errors:\n  ' + r.errors.join('\n  '));
    process.exit(1);
  }
  console.log('OK');
}
