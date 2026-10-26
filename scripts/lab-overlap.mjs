/**
 * V4 §5.2: no lab ever covers or clips its own text. Every lab and every task
 * is opened at 375, 768, 1280, 1366 and 1920 px in headless Chrome; the page
 * is scrolled through, and at each step every visible text block is sampled
 * with elementsFromPoint — a block whose points are covered by something
 * outside its own element tree is an overlap (the site's top bar and the
 * floating Bit button, marked data-chrome, are expected to float over the
 * page and do not count, nor do labels pinned in a 3D scene, marked
 * data-overlay). A text block cut by its box (overflow or an ellipsis) is
 * clipped text.
 *
 *   npm run test:lab-overlap                 # needs the dev site on :5173 (npm run dev)
 *   npm run test:lab-overlap -- network      # only the labs whose path contains "network"
 *   LAB_BASE=http://localhost:4173 npm run test:lab-overlap   # a built site (npm run preview)
 *
 * Problems are listed per page and width; screenshots of the failing views are
 * written to test-results/lab-overlap/.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { openChrome } from './lib/cdp.mjs';
import { NETWORK_TASK_IDS } from '../src/labs/NetworkLab/tasks.ts';
import { LOGIC_TASK_IDS } from '../src/labs/LogicLab/tasks.ts';
import { ALGORITHM_IDS } from '../src/labs/AlgorithmLab/types.ts';
import { QUIZ_IDS } from '../src/labs/AlgorithmLab/quizzes.ts';
import { EXPERIMENT_IDS } from '../src/labs/Experiments/index.ts';
import { CONNECT_TASK_IDS } from '../src/labs/ConnectLab/tasks.ts';

const root = path.resolve(import.meta.dirname, '..');
const OUT = path.join(root, 'test-results/lab-overlap');
const SITE = process.env.LAB_BASE ?? 'http://localhost:5173';
const only = process.argv.slice(2).find((a) => !a.startsWith('--'));
const WIDTHS = [375, 768, 1280, 1366, 1920];
const heightOf = (w) => (w === 375 ? 812 : w === 768 ? 1024 : w === 1366 ? 768 : w === 1920 ? 1080 : 800);

export const LAB_PAGES = [
  ...[...NETWORK_TASK_IDS, 'free'].map((t) => `/labs/network?task=${t}`),
  ...[...LOGIC_TASK_IDS, 'free'].map((t) => `/labs/logic?task=${t}`),
  ...ALGORITHM_IDS.map((a) => `/labs/algorithms?algo=${a}`),
  ...QUIZ_IDS.slice(1).map((q) => `/labs/algorithms?quiz=${q}#quiz`),
  ...EXPERIMENT_IDS.map((e) => `/labs/experiments?exp=${e}`),
  ...CONNECT_TASK_IDS.map((t) => `/labs/connect?task=${t}`),
  '/labs/sim',
  '/labs/sim?mode=fix',
  '/labs/assembly',
];

/** Runs in the page: overlaps and clipped text in the current viewport. */
const CHECK = `(() => {
  // hit-testing skips pointer-events: none — switch it on everywhere so the paint order decides
  const pe = document.createElement('style');
  pe.textContent = '* { pointer-events: auto !important }';
  document.head.append(pe);
  const vw = innerWidth, vh = innerHeight;
  const chrome = (el) => !!el.closest('[data-chrome]');
  const visible = (el) => {
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) return false;
    }
    return true;
  };
  const label = (el) => {
    const t = (el.innerText || el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 48);
    const cls = typeof el.className === 'string' ? el.className.split(' ')[0].replace(/_[A-Za-z0-9]{5}$/, '') : '';
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '') + ' "' + t + '"';
  };
  const topbar = document.querySelector('[data-chrome="topbar"]')?.getBoundingClientRect().bottom ?? 0;
  const out = { overlaps: [], clipped: [] };
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const blocks = new Set();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || chrome(el) || el.closest('svg, canvas, script, style, [aria-hidden="true"], .sr-only, [data-overlay]')) continue;
    blocks.add(el);
  }
  /** The part of the screen an element can show: its scrolling / clipping ancestors cut it. */
  const clipOf = (el) => {
    let c = { left: 0, top: topbar, right: vw, bottom: vh };
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.overflowX === 'visible' && s.overflowY === 'visible') continue;
      const b = e.getBoundingClientRect();
      c = { left: Math.max(c.left, b.left), top: Math.max(c.top, b.top), right: Math.min(c.right, b.right), bottom: Math.min(c.bottom, b.bottom) };
    }
    return c;
  };
  for (const el of blocks) {
    if (!visible(el)) continue;
    // screen-reader-only text: a 1 px clipped box on purpose
    const box = el.getBoundingClientRect();
    if (box.width <= 2 || box.height <= 2) continue;
    // the content of a closed <details> has boxes but is not shown
    if (el.closest('details:not([open])') && !el.closest('summary')) continue;
    const clip = clipOf(el);
    const range = document.createRange();
    range.selectNodeContents(el);
    for (const raw of range.getClientRects()) {
      const r = { left: Math.max(raw.left, clip.left), top: Math.max(raw.top, clip.top), right: Math.min(raw.right, clip.right), bottom: Math.min(raw.bottom, clip.bottom) };
      r.width = r.right - r.left;
      r.height = r.bottom - r.top;
      if (r.width < 4 || r.height < 4) continue;
      // only what is on screen now, below the top bar
      if (r.bottom <= topbar + 2 || r.top >= vh - 2 || r.right <= 0 || r.left >= vw) continue;
      const pts = [[r.left + r.width * 0.5, r.top + r.height * 0.5], [r.left + 3, r.top + r.height * 0.5], [r.right - 3, r.top + r.height * 0.5]];
      for (const [x, y] of pts) {
        if (y <= topbar + 1 || y >= vh - 1 || x <= 0 || x >= vw) continue;
        const stack = document.elementsFromPoint(x, y);
        const top = stack[0];
        if (!top || el.contains(top) || top.contains(el) || chrome(top)) continue;
        // a transparent wrapper above the text (no background, no border) hides nothing
        const s = getComputedStyle(top);
        const paints = s.backgroundColor !== 'rgba(0, 0, 0, 0)' || s.backgroundImage !== 'none' || top.tagName === 'IMG' || top.tagName === 'CANVAS' || top.tagName === 'svg' || (top.innerText || '').trim();
        if (!paints) continue;
        const key = label(el) + ' under ' + label(top);
        if (!seen.has(key)) { seen.add(key); out.overlaps.push(key); }
        break;
      }
    }
    // clipped: the text's own box (or a clipping parent within 2 levels) cuts it
    for (let e = el, i = 0; e && i < 3; e = e.parentElement, i++) {
      const s = getComputedStyle(e);
      const clips = s.overflowX !== 'visible' || s.overflowY !== 'visible' || s.textOverflow === 'ellipsis';
      if (!clips || s.overflowX === 'auto' || s.overflowX === 'scroll' || s.overflowY === 'auto' || s.overflowY === 'scroll') continue;
      if (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 2) {
        const key = 'clipped ' + label(el);
        if (!seen.has(key)) { seen.add(key); out.clipped.push(key); }
      }
      break;
    }
  }
  pe.remove();
  return JSON.stringify(out);
})()`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  try {
    await fetch(SITE);
  } catch {
    console.error(`lab-overlap: the site is not running on ${SITE} (npm run dev)`);
    process.exit(2);
  }
  const pages = LAB_PAGES.filter((p) => !only || p.includes(only));
  const problems = [];
  for (const w of WIDTHS) {
    const h = heightOf(w);
    const c = await openChrome({ width: w, height: h, port: 9410 + WIDTHS.indexOf(w) });
    try {
      await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await c.navigate(`${SITE}/credits`);
      await sleep(1500);
      for (const p of pages) {
        await c.navigate(SITE + p);
        await c.waitFor('document.readyState === "complete" && !!document.querySelector("main h1")', 30000).catch(() => {});
        // a lab with a 3D scene: its loading screen first has to go
        await c.waitFor('!document.querySelector("canvas") || !!window.__vil3d?.ready?.()', 60000).catch(() => {});
        await sleep(1800);
        const total = await c.evaluate('document.documentElement.scrollHeight');
        const found = { overlaps: new Set(), clipped: new Set() };
        let firstBad = null;
        for (let y = 0; y < total; y += Math.round(h * 0.6)) {
          await c.evaluate(`window.scrollTo(0, ${y})`);
          await sleep(250);
          const r = JSON.parse(await c.evaluate(CHECK));
          if ((r.overlaps.length || r.clipped.length) && firstBad === null) firstBad = y;
          r.overlaps.forEach((o) => found.overlaps.add(o));
          r.clipped.forEach((o) => found.clipped.add(o));
        }
        if (found.overlaps.size || found.clipped.size) {
          problems.push({ page: p, width: w, overlaps: [...found.overlaps], clipped: [...found.clipped] });
          mkdirSync(OUT, { recursive: true });
          await c.evaluate(`window.scrollTo(0, ${firstBad ?? 0})`);
          await sleep(300);
          const shot = await c.send('Page.captureScreenshot', { format: 'png' });
          writeFileSync(path.join(OUT, `${p.replace(/[/?=#&]+/g, '_').replace(/^_/, '')}-${w}.png`), Buffer.from(shot.result.data, 'base64'));
        }
        process.stdout.write(found.overlaps.size || found.clipped.size ? '✖' : '·');
      }
    } finally {
      await c.close().catch(() => {});
    }
    process.stdout.write(` ${w}px\n`);
  }
  for (const pr of problems) {
    console.log(`\n${pr.page} @ ${pr.width}px`);
    for (const o of pr.overlaps) console.log(`  overlap: ${o}`);
    for (const o of pr.clipped) console.log(`  ${o}`);
  }
  console.log(`\n${pages.length} pages × ${WIDTHS.length} widths: ${problems.length} with problems`);
  if (problems.length) process.exit(1);
}

await main();
