/**
 * Every letter the site prints must exist in the bundled fonts — otherwise the
 * browser silently mixes in a system font (this happened with ә ғ қ ң ұ before
 * 0.35). Reads the cmap table straight from the @fontsource woff2 files.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const FONTS = ['onest', 'montserrat'];
const KAZAKH = 'ӘәҒғҚқҢңӨөҰұҮүҺһІі';

function base128(buf, at) {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    const b = buf[at.i++];
    value = value * 128 + (b & 0x7f);
    if (!(b & 0x80)) return value;
  }
  throw new Error('bad UIntBase128');
}

/** Code points mapped by one woff2 file (cmap formats 4 and 12). */
export function woff2CodePoints(file) {
  const buf = readFileSync(file);
  assert.equal(buf.toString('latin1', 0, 4), 'wOF2');
  const numTables = buf.readUInt16BE(12);
  const at = { i: 48 };
  const tables = [];
  for (let t = 0; t < numTables; t++) {
    const flags = buf[at.i++];
    const tag = flags & 0x3f;
    if (tag === 63) at.i += 4;
    const length = base128(buf, at);
    const version = (flags >> 6) & 3;
    const transformed = tag === 10 || tag === 11 ? version === 0 : version !== 0;
    tables.push({ tag, length: transformed ? base128(buf, at) : length });
  }
  const data = brotliDecompressSync(buf.subarray(at.i));
  let offset = 0;
  let cmap = null;
  for (const t of tables) {
    if (t.tag === 0) cmap = data.subarray(offset, offset + t.length);
    offset += t.length;
  }
  assert.ok(cmap, `${file}: no cmap`);
  const points = new Set();
  const n = cmap.readUInt16BE(2);
  for (let r = 0; r < n; r++) {
    const sub = cmap.readUInt32BE(4 + r * 8 + 4);
    const format = cmap.readUInt16BE(sub);
    if (format === 12) {
      const groups = cmap.readUInt32BE(sub + 12);
      for (let g = 0; g < groups; g++) {
        const p = sub + 16 + g * 12;
        for (let c = cmap.readUInt32BE(p); c <= cmap.readUInt32BE(p + 4); c++) points.add(c);
      }
    } else if (format === 4) {
      const segs = cmap.readUInt16BE(sub + 6) / 2;
      const ends = sub + 14;
      const starts = ends + segs * 2 + 2;
      const deltas = starts + segs * 2;
      const ranges = deltas + segs * 2;
      for (let s = 0; s < segs; s++) {
        const end = cmap.readUInt16BE(ends + s * 2);
        const start = cmap.readUInt16BE(starts + s * 2);
        const delta = cmap.readInt16BE(deltas + s * 2);
        const rangeOffset = cmap.readUInt16BE(ranges + s * 2);
        for (let c = start; c <= end && c !== 0xffff; c++) {
          let glyph;
          if (rangeOffset === 0) glyph = (c + delta) & 0xffff;
          else {
            const g = cmap.readUInt16BE(ranges + s * 2 + rangeOffset + (c - start) * 2);
            glyph = g === 0 ? 0 : (g + delta) & 0xffff;
          }
          if (glyph !== 0) points.add(c);
        }
      }
    }
  }
  return points;
}

function familyPoints(name) {
  const dir = path.join(root, 'node_modules/@fontsource-variable', name, 'files');
  const all = new Set();
  for (const f of readdirSync(dir)) if (f.endsWith('-wght-normal.woff2')) for (const c of woff2CodePoints(path.join(dir, f))) all.add(c);
  return all;
}

function localeLetters() {
  const letters = new Set();
  for (const lang of ['kk', 'ru', 'en']) {
    const text = readFileSync(path.join(root, 'src/locales', `${lang}.json`), 'utf8');
    for (const ch of text) if (/\p{L}/u.test(ch)) letters.add(ch.codePointAt(0));
  }
  return letters;
}

test('the site fonts are bundled and imported', () => {
  const main = readFileSync(path.join(root, 'src/main.tsx'), 'utf8');
  for (const f of FONTS) assert.ok(main.includes(`@fontsource-variable/${f}`), f);
  const tokens = readFileSync(path.join(root, 'src/styles/tokens.css'), 'utf8');
  assert.match(tokens, /--font-sans: 'Onest Variable'/);
  assert.match(tokens, /--font-display: 'Montserrat Variable'/);
});

for (const name of FONTS) {
  test(`${name}: every Kazakh letter and every letter in the locales has a glyph`, () => {
    const points = familyPoints(name);
    const missingKk = [...KAZAKH].filter((c) => !points.has(c.codePointAt(0)));
    assert.deepEqual(missingKk, [], `${name} lacks ${missingKk.join(' ')}`);
    const missing = [...localeLetters()].filter((c) => !points.has(c)).map((c) => String.fromCodePoint(c));
    assert.deepEqual(missing, [], `${name} lacks ${missing.join(' ')}`);
  });
}
