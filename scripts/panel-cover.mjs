/**
 * V4 §6: the info and Bit panels never cover the main 3D controls (devices
 * list, zoom, reset, keyboard help, view switches, fold tabs). Every 3D page
 * is opened at 375, 768, 1280, 1366 and 1920 px with its panels open and then
 * folded; each visible control is hit-tested at its centre and corners with
 * elementsFromPoint. A control whose point is topped by something outside its
 * own tree is covered. The site's top bar (data-chrome) floats over the page
 * on purpose and does not count; the floating Bit button does, but is listed
 * apart (its place on phones is Section 11).
 *
 *   npm run test:panel-cover            # needs the dev site on :5173 (npm run dev)
 *   npm run test:panel-cover -- lab     # only the pages whose name contains "lab"
 */
import { openChrome } from './lib/cdp.mjs';

const SITE = process.env.LAB_BASE ?? 'http://localhost:5173';
const only = process.argv.slice(2).find((a) => !a.startsWith('--'));
const WIDTHS = [375, 768, 1280, 1366, 1920];
const heightOf = (w) => (w === 375 ? 812 : w === 768 ? 1024 : w === 1366 ? 768 : w === 1920 ? 1080 : 800);
const FOLD_IDS = ['lab:zone', 'lab:side', 'anatomy:intro', 'anatomy:panel', 'home:explore', 'connect:side', 'assembly:head', 'assembly:panel'];

/** name, path, and a step run once the scene is ready (opens the panel under test). */
const PAGES = [
  ['home-360', '/', `[...document.querySelectorAll('button')].find((b) => /360/.test(b.textContent))?.click()`],
  ['lab', '/lab'],
  ['lab-zone', '/lab?zone=showcase'],
  ['lab-device', '/lab?device=gpu'],
  ['anatomy', '/explorer'],
  ['anatomy-part', '/explorer', `document.querySelector('nav ol button')?.click()`],
  ['connect', '/labs/connect'],
  ['assembly', '/labs/assembly'],
];

const CHECK = `(() => {
  const pe = document.createElement('style');
  pe.textContent = '* { pointer-events: auto !important }';
  document.head.append(pe);
  const vw = innerWidth, vh = innerHeight;
  const topbar = document.querySelector('[data-chrome="topbar"]')?.getBoundingClientRect().bottom ?? 0;
  const label = (el) => {
    const t = (el.getAttribute('aria-label') || el.innerText || el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 40);
    const cls = typeof el.className === 'string' ? el.className.split(' ')[0].replace(/_[A-Za-z0-9]{5}_\\d+$/, '').replace(/_[A-Za-z0-9]{5}$/, '') : '';
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '') + ' "' + t + '"';
  };
  const visible = (el) => {
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) return false;
    }
    return true;
  };
  // labels pinned in the 3D scene (drei <Html>, next to the canvas) move with the camera: not controls
  const hosts = [...document.querySelectorAll('canvas')].map((c) => c.parentElement);
  // a panel that takes the whole screen (the device panel on phones: the scene pauses behind it) is the page for now
  const fullScreen = (e) => {
    for (; e && e !== document.body; e = e.parentElement) {
      const b = e.getBoundingClientRect();
      if (b.width >= vw * 0.9 && b.height >= (vh - topbar) * 0.8 && getComputedStyle(e).position === 'fixed') return true;
    }
    return false;
  };
  const ownText = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const out = [];
  for (const el of document.querySelectorAll('button, a[href], [role="button"], input, select')) {
    if (el.closest('[data-chrome="topbar"], [data-chrome="bit"], [data-overlay], [hidden]') || hosts.some((h) => h?.contains(el)) || !visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8 || r.top < topbar + 1 || r.bottom > vh - 1 || r.left < 0 || r.right > vw) continue;
    const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 4, r.top + 4], [r.right - 4, r.top + 4], [r.left + 4, r.bottom - 4], [r.right - 4, r.bottom - 4]];
    for (const [x, y] of pts) {
      const top = document.elementsFromPoint(x, y)[0];
      if (!top || el.contains(top) || top.contains(el)) continue;
      // a transparent wrapper (no background, no text of its own) hides nothing
      const s = getComputedStyle(top);
      if (s.backgroundColor === 'rgba(0, 0, 0, 0)' && s.backgroundImage === 'none' && !ownText(top) && !['IMG', 'svg', 'CANVAS'].includes(top.tagName)) continue;
      if (top.closest('[data-chrome="topbar"]') || fullScreen(top)) continue;
      out.push((top.closest('[data-chrome="bit"]') ? '[bit] ' : '') + label(el) + ' under ' + label(top));
      break;
    }
  }
  pe.remove();
  return JSON.stringify([...new Set(out)]);
})()`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  try {
    await fetch(SITE);
  } catch {
    console.error(`panel-cover: the site is not running on ${SITE} (npm run dev)`);
    process.exit(2);
  }
  const pages = PAGES.filter(([n]) => !only || n.includes(only));
  const problems = [];
  const bitNotes = [];
  for (const w of WIDTHS) {
    const c = await openChrome({ width: w, height: heightOf(w), port: 9460 + WIDTHS.indexOf(w) });
    try {
      await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await c.navigate(`${SITE}/credits`);
      await sleep(1500);
      for (const [name, p, step] of pages) {
        for (const folded of [false, true]) {
          const folds = JSON.stringify(Object.fromEntries(FOLD_IDS.map((id) => [id, folded])));
          await c.evaluate(`localStorage.setItem('vil3d:panel-folds', ${JSON.stringify(folds)}); localStorage.removeItem('vil3d:lab-layout')`);
          await c.navigate(SITE + p);
          await sleep(500);
          // every page here is 3D: the scene ready and the loading screen gone
          const ready = await c.waitFor('document.readyState === "complete" && !!window.__vil3d?.ready?.() && !document.querySelector("[data-visible=true]")', 120000).catch(() => false);
          if (!ready) console.log(`
  ${name} @ ${w}px: the scene did not finish loading`);
          if (step) {
            await c.evaluate(step).catch(() => {});
          }
          await sleep(1800);
          const found = JSON.parse(await c.evaluate(CHECK));
          const bit = found.filter((f) => f.startsWith('[bit]'));
          const real = found.filter((f) => !f.startsWith('[bit]'));
          if (bit.length) bitNotes.push({ name, w, folded, items: bit });
          if (real.length) problems.push({ name, w, folded, items: real });
          process.stdout.write(real.length ? '✖' : '·');
        }
      }
    } finally {
      await c.close().catch(() => {});
    }
    process.stdout.write(` ${w}px\n`);
  }
  for (const pr of problems) {
    console.log(`\n${pr.name} @ ${pr.w}px, panels ${pr.folded ? 'folded' : 'open'}`);
    for (const o of pr.items) console.log(`  covered: ${o}`);
  }
  for (const pr of bitNotes) {
    console.log(`\n(note) ${pr.name} @ ${pr.w}px, panels ${pr.folded ? 'folded' : 'open'}`);
    for (const o of pr.items) console.log(`  ${o}`);
  }
  console.log(`\n${pages.length} pages × 2 states × ${WIDTHS.length} widths: ${problems.length} with covered controls, ${bitNotes.length} with a control under the Bit button`);
  if (problems.length) process.exit(1);
}

await main();
