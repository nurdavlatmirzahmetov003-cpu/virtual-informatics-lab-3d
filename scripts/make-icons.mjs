/**
 * App icons for the installable site (0.37): PNGs from the brand mark,
 * `any` (the rounded tile as it is) and `maskable` (with the safe-zone
 * margin Android crops into a circle or squircle).
 *
 *   node scripts/make-icons.mjs   → public/icons/*.png
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const svg = readFileSync(`${root}public/favicon.svg`);
mkdirSync(`${root}public/icons`, { recursive: true });
for (const size of [192, 512]) {
  await sharp(svg, { density: 512 }).resize(size, size).png().toFile(`${root}public/icons/icon-${size}.png`);
  // maskable: the mark at 80 % on the brand blue, so nothing important is cropped
  const inner = Math.round(size * 0.8);
  const mark = await sharp(svg, { density: 512 }).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: '#5f7bff' } })
    .composite([{ input: mark, gravity: 'centre' }])
    .png()
    .toFile(`${root}public/icons/maskable-${size}.png`);
}
await sharp(svg, { density: 512 }).resize(180, 180).flatten({ background: '#ffffff' }).png().toFile(`${root}public/icons/apple-touch-icon.png`);
console.log('icons written to public/icons');
