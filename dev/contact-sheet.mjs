// V4 §11: a contact sheet of the audit's screenshots — node dev/contact-sheet.mjs 360 [cols] [scale]
import { readdirSync } from 'node:fs';
import sharp from 'sharp';
const [size = '360', cols = '8', scale = '0.5'] = process.argv.slice(2);
const dir = 'docs/v4-section11/audit';
const files = readdirSync(dir).filter((f) => f.endsWith(`-${size}.jpg`)).sort();
const first = await sharp(`${dir}/${files[0]}`).metadata();
const w = Math.round(first.width * Number(scale));
const h = Math.round(first.height * Number(scale));
const label = 22;
const n = Number(cols);
const rows = Math.ceil(files.length / n);
const tiles = await Promise.all(
  files.map(async (f, i) => {
    const img = await sharp(`${dir}/${f}`).resize(w, h).toBuffer();
    const text = Buffer.from(`<svg width="${w}" height="${label}"><rect width="100%" height="100%" fill="#111"/><text x="4" y="16" font-size="14" font-family="sans-serif" fill="#fff">${f.replace(`-${size}.jpg`, '')}</text></svg>`);
    return [
      { input: text, left: (i % n) * w, top: Math.floor(i / n) * (h + label) },
      { input: img, left: (i % n) * w, top: Math.floor(i / n) * (h + label) + label },
    ];
  }),
);
const out = `docs/v4-section11/sheet-${size}.jpg`;
await sharp({ create: { width: n * w, height: rows * (h + label), channels: 3, background: '#333' } })
  .composite(tiles.flat())
  .jpeg({ quality: 80 })
  .toFile(out);
console.log(out, files.length);
