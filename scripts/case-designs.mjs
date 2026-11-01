/**
 * Writes every case design (src/scenes/DeskScene/pc/caseDesigns.ts) with its
 * derived frame and mounts to assets-src/bitlab/case-designs.json, the input
 * of scripts/blender/make-cases.py — the Blender model and the scene's mounts
 * come from the same numbers.
 *
 *   node --experimental-strip-types --import ./scripts/test-resolve.mjs scripts/case-designs.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CASE_DESIGNS, caseFrame, mountsOf, SLOTS } from '../src/scenes/DeskScene/pc/caseDesigns.ts';
import { PART_GEOMETRY } from '../src/data/hardware/partGeometry.generated.ts';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'assets-src/bitlab/case-designs.json');
mkdirSync(path.dirname(out), { recursive: true });
const designs = CASE_DESIGNS.map((d) => ({ ...d, frame: caseFrame(d), mounts: mountsOf(d) }));
writeFileSync(out, JSON.stringify({ designs, atxCornerToSlot1: SLOTS.firstBelowCorner, slots: SLOTS }, null, 1));
console.log(`${designs.length} designs → ${path.relative(root, out)}`);
void PART_GEOMETRY;
