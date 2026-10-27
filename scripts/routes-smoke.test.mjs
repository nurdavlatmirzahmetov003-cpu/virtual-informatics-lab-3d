/**
 * Smoke test of the built site: every page opens in headless Chrome without
 * an uncaught error or the error screen. Catches production-only failures
 * such as a chunk import cycle (a lazy page that loads r3f before SceneCanvas
 * once failed with «Class extends value undefined»).
 *
 * Needs `npm run build` first (skipped without dist/) and Chrome or Edge.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { CHROME, openChrome, startPreview } from './lib/cdp.mjs';

const root = path.resolve(import.meta.dirname, '..');
const built = existsSync(path.join(root, 'dist/index.html'));

const PAGES = ['/', '/lab', '/robots', '/studio', '/explorer', '/labs', '/labs/assembly', '/labs/network', '/labs/connect', '/labs/sim', '/labs/algorithms', '/labs/logic', '/labs/experiments', '/games', '/path', '/identify', '/progress', '/credits'];

test('every page of the built site opens without an error', { skip: !built ? 'run npm run build first' : !CHROME ? 'no Chrome/Edge' : false, timeout: 300000 }, async () => {
  const preview = await startPreview(root, 4181);
  const failures = [];
  const ERRS = `window.__errs = []; addEventListener('error', (e) => window.__errs.push(String(e.message))); addEventListener('unhandledrejection', (e) => window.__errs.push(String(e.reason))); const ce = console.error; console.error = (...a) => { window.__errs.push(a.map(String).join(' ').slice(0, 300)); ce(...a); };`;
  /** One page in its own Chrome (a dozen WebGL pages in one tab can take the browser down). */
  async function check(page) {
    const chrome = await openChrome({ port: 9341 });
    try {
      await chrome.navigate(`${preview.base}/credits`);
      await chrome.waitFor('document.readyState === "complete"');
      await chrome.evaluate(`(() => { const k = 'vil3d:settings'; const s = JSON.parse(localStorage.getItem(k) || '{"state":{},"version":3}'); s.state = { ...s.state, qualityMode: 'low' }; localStorage.setItem(k, JSON.stringify(s)); })()`);
      // errors are collected inside the page: uncaught ones and React Router's error screen
      await chrome.send('Page.addScriptToEvaluateOnNewDocument', { source: ERRS });
      await chrome.navigate(`${preview.base}${page}`);
      await chrome.waitFor('document.readyState === "complete"');
      await new Promise((r) => setTimeout(r, 5000));
      const errs = await chrome.evaluate(`(window.__errs || []).filter((m) => /TypeError|ReferenceError|SyntaxError|is not a constructor|caught the following error/.test(m))`);
      const main = await chrome.evaluate(`(document.querySelector('main')?.innerText ?? document.body.innerText).length`);
      if (errs.length) failures.push(`${page}: ${errs[0]}`);
      else if (main < 40) failures.push(`${page}: the page is (almost) empty`);
    } finally {
      await chrome.close();
    }
  }
  try {
    for (const page of PAGES) {
      let timer;
      const late = new Promise((_, no) => (timer = setTimeout(() => no(new Error('timed out')), 60000)));
      await Promise.race([check(page), late]).catch((e) => failures.push(`${page}: ${e.message}`));
      clearTimeout(timer);
    }
  } finally {
    preview.stop();
  }
  assert.deepEqual(failures, []);
});
