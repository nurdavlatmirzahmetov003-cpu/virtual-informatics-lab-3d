/**
 * V4 §11: every page at every size. Opens each route (demo profile, so every
 * page has content) at 360, 390, 768 portrait, 1024 (768 landscape), 1280,
 * 1366 and 1920 px — phones and tablets as touch devices — and reports:
 *   hscroll  the page scrolls sideways
 *   cut      a control sticks out of the screen (and nothing scrolls it back)
 *   bit      a control under Bit's button
 *   small    on touch screens, a button or field smaller than 44 × 44 px
 *            (text links inside sentences are not counted)
 * A screenshot of each page at each size goes to docs/v4-section11/audit/.
 *
 *   npm run test:responsive                 # needs the dev site (npm start)
 *   npm run test:responsive -- lab 360      # pages / sizes whose name contains these
 *   npm run test:responsive -- --no-shots
 * Exit code 1 when any page scrolls sideways, cuts a control or puts one under Bit.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { openChrome } from './lib/cdp.mjs';

const SITE = process.env.LAB_BASE ?? 'http://localhost:5173';
const OUT = 'docs/v4-section11/audit';
const args = process.argv.slice(2);
const shots = !args.includes('--no-shots');
const filters = args.filter((a) => !a.startsWith('--'));

export const SIZES = [
  ['360', 360, 740, true],
  ['390', 390, 844, true],
  ['768', 768, 1024, true],
  ['1024', 1024, 768, true],
  ['1280', 1280, 800, false],
  ['1366', 1366, 768, false],
  ['1920', 1920, 1080, false],
];

export const ROUTES = [
  ['home', '/'],
  ['lab', '/lab'],
  ['lab-zone', '/lab?zone=showcase'],
  ['labs', '/labs'],
  ['assembly', '/labs/assembly'],
  ['network', '/labs/network'],
  ['connect', '/labs/connect'],
  ['sim', '/labs/sim'],
  ['algorithms', '/labs/algorithms'],
  ['logic', '/labs/logic'],
  ['experiments', '/labs/experiments'],
  ['assignments', '/assignments'],
  ['explorer', '/explorer'],
  ['studio', '/studio'],
  ['studio-summary', '/studio/summary'],
  ['progress', '/progress'],
  ['report', '/progress/report'],
  ['achievements', '/achievements'],
  ['path', '/path'],
  ['robots', '/robots'],
  ['games', '/games'],
  ['leaderboard', '/leaderboard'],
  ['live', '/live'],
  ['certificate', '/certificate'],
  ['certificate-preview', '/certificate/preview'],
  ['identify', '/identify'],
  ['remote', '/remote'],
  ['feedback', '/feedback'],
  ['credits', '/credits'],
  ['privacy', '/privacy'],
  ['login', '/login'],
  ['join', '/join'],
  ['not-found', '/no-such-page'],
];

const CHECK = (touch) => `(() => {
  const vw = innerWidth, vh = innerHeight;
  const label = (el) => {
    const t = (el.getAttribute('aria-label') || el.innerText || el.value || el.getAttribute('placeholder') || '').trim().replace(/\\s+/g, ' ').slice(0, 32);
    return el.tagName.toLowerCase() + ' "' + t + '"';
  };
  const hosts = [...document.querySelectorAll('canvas')].map((c) => c.parentElement);
  const shown = (el) => el.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) ?? el.offsetParent !== null;
  // a scroller (or a clipping box) between the control and the page brings it back into view
  const scrolled = (el) => {
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (/(auto|scroll|hidden|clip)/.test(s.overflowX) && e.scrollWidth > e.clientWidth + 1) return true;
    }
    return false;
  };
  const inSentence = (el) => el.tagName === 'A' && el.closest('p, li, td, small, figcaption') && !el.querySelector('svg') && getComputedStyle(el).display === 'inline';
  const bitBtn = document.querySelector('[data-chrome="bit"] button');
  const bit = bitBtn?.getBoundingClientRect();
  const out = { hscroll: document.documentElement.scrollWidth > vw + 1, cut: [], bit: [], small: [] };
  for (const el of document.querySelectorAll('button, a[href], [role="button"], [role="tab"], input:not([type="hidden"]), select, textarea')) {
    if (el.closest('[data-chrome="bit"], [hidden], [inert], [aria-hidden="true"]') || hosts.some((h) => h?.contains(el)) || !shown(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    // visually hidden (skip links, radios inside styled labels)
    if (r.width <= 2 || getComputedStyle(el).clip === 'rect(0px, 0px, 0px, 0px)' || Number(getComputedStyle(el).opacity) === 0) continue;
    if ((r.left < -1 || r.right > vw + 1) && r.bottom > 0 && r.top < vh && !scrolled(el)) out.cut.push(label(el) + ' x ' + Math.round(r.left) + '..' + Math.round(r.right));
    if (bit && r.bottom > bit.top + 4 && r.top < bit.bottom - 4 && r.right > bit.left + 4 && r.left < bit.right - 4 && r.top > 0 && r.bottom < vh) {
      const top = document.elementFromPoint(Math.min(Math.max(r.left + r.width / 2, bit.left + 2), bit.right - 2), Math.min(Math.max(r.top + r.height / 2, bit.top + 2), bit.bottom - 2));
      if (top?.closest('[data-chrome="bit"]')) out.bit.push(label(el));
    }
    if (${touch} && !inSentence(el) && (r.height < 43.5 || r.width < 43.5) && !['checkbox', 'radio', 'range'].includes(el.type)) out.small.push(label(el) + ' ' + Math.round(r.width) + '×' + Math.round(r.height));
  }
  out.cut = [...new Set(out.cut)];
  out.small = [...new Set(out.small)];
  return JSON.stringify(out);
})()`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Loaded: no loading screen for 1.5 s in a row (a 3D page shows it only after its first render). */
async function settle(c, ms = 90000) {
  const end = Date.now() + ms;
  let calm = 0;
  await sleep(600);
  while (Date.now() < end && calm < 3) {
    const busy = await c.evaluate('document.readyState !== "complete" || !!document.querySelector("[data-visible=true]")').catch(() => true);
    calm = busy ? 0 : calm + 1;
    await sleep(500);
  }
  await sleep(1200);
}

async function main() {
  try {
    await fetch(SITE);
  } catch {
    console.error(`responsive-audit: the site is not running on ${SITE} (npm start)`);
    process.exit(2);
  }
  if (shots) mkdirSync(OUT, { recursive: true });
  const sizes = SIZES.filter(([n]) => !filters.some((f) => /^\d+$/.test(f)) || filters.includes(n));
  const routes = ROUTES.filter(([n]) => !filters.some((f) => !/^\d+$/.test(f)) || filters.some((f) => !/^\d+$/.test(f) && n.includes(f)));
  const report = [];
  let failed = 0;
  let port = 9700;
  for (const [name, w, h, touch] of sizes) {
    const c = await openChrome({ width: w, height: h, port: port++ });
    try {
      if (touch) {
        // a phone or tablet: touch input, coarse pointer (the site picks Low on phones by itself)
        await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 768, screenWidth: w, screenHeight: h });
        await c.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
        await c.send('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: w < 768 ? 'mobile' : 'desktop' });
      }
      await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await c.navigate(`${SITE}/?demo=1`);
      await sleep(2500);
      for (const [route, path] of routes) {
        await c.navigate(SITE + path);
        await settle(c);
        const found = JSON.parse(await c.evaluate(CHECK(touch)));
        const bad = found.hscroll || found.cut.length || found.bit.length;
        if (bad) failed++;
        report.push({ size: name, route, ...found });
        if (shots) {
          const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
          writeFileSync(`${OUT}/${route}-${name}.jpg`, Buffer.from(s.result.data, 'base64'));
        }
        process.stdout.write(bad ? '✖' : found.small.length ? '·' : '✓');
      }
    } finally {
      await c.close().catch(() => {});
    }
    process.stdout.write(` ${name}\n`);
  }
  for (const r of report) {
    if (!(r.hscroll || r.cut.length || r.bit.length)) continue;
    console.log(`\n${r.route} @ ${r.size}`);
    if (r.hscroll) console.log('  scrolls sideways');
    for (const x of r.cut) console.log(`  cut: ${x}`);
    for (const x of r.bit) console.log(`  under Bit: ${x}`);
  }
  const small = report.filter((r) => r.small.length);
  console.log(`\nSmall touch targets (< 44 px) on ${small.length} page × size pairs; worst:`);
  for (const r of small.sort((a, b) => b.small.length - a.small.length).slice(0, 12)) console.log(`  ${r.route} @ ${r.size}: ${r.small.length} — ${r.small.slice(0, 4).join('; ')}`);
  writeFileSync('docs/v4-section11/audit.json', JSON.stringify(report, null, 1) + '\n');
  console.log(`\n${routes.length} pages × ${sizes.length} sizes: ${failed} with sideways scroll, a cut control or a control under Bit → docs/v4-section11/audit.json`);
  if (failed) process.exit(1);
}

await main();
