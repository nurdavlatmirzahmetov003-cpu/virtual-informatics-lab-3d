/**
 * The share preview image (0.37): the living home hero at 1200 × 630, the
 * size social networks and messengers show for a link. Needs a running site:
 *
 *   npm run dev            # or npm run preview
 *   node scripts/make-og.mjs [http://localhost:5173]
 *
 * Writes public/og-image.jpg (sharp, quality 82).
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { openChrome } from './lib/cdp.mjs';

const base = process.argv[2] ?? 'http://localhost:5173';
const out = fileURLToPath(new URL('../public/og-image.jpg', import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const c = await openChrome({ width: 1200, height: 630, port: 9343 });
try {
  await c.navigate(`${base}/?lang=kk`);
  await c.waitFor(`document.title.includes('BitLab')`, 30_000);
  // the hero assembles itself: wait until the setup is complete and the loader has gone
  await c.waitFor(`!document.querySelector('[aria-busy="true"]')`, 90_000).catch(() => undefined);
  await sleep(16_000);
  // the Bit launcher and the scrollbar are not part of the picture
  await c.evaluate(`(() => {
    const s = document.createElement('style');
    s.textContent = 'html { scrollbar-width: none } ::-webkit-scrollbar { display: none }';
    document.head.append(s);
    document.querySelectorAll('button[aria-label*="Бит"]').forEach((b) => ((b.closest('[class*="aunch"]') ?? b).style.display = 'none'));
  })()`);
  await sleep(500);
  const shot = await c.send('Page.captureScreenshot', { format: 'png' });
  const png = Buffer.from(shot.result.data, 'base64');
  writeFileSync(out, await sharp(png).resize(1200, 630).jpeg({ quality: 82, mozjpeg: true }).toBuffer());
  console.log(`og-image.jpg written (${base})`);
} finally {
  await c.close();
}
