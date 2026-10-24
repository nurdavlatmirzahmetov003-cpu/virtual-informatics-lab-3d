/**
 * Visibility audit of the 3D lab (0.37): in the built site, in headless Chrome,
 * every tagged sign, banner, poster and logo (userData.signage) must be visible
 * from the overview and from its zone's camera stop — rays to a 3 × 3 grid of
 * points on it may not hit anything else first (src/scenes/LabSpace/visibilityAudit.ts).
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

test('every lab sign, banner, poster and logo can be seen; no screen logo is mirrored', { skip: !built ? 'run npm run build first' : !CHROME ? 'no Chrome/Edge' : false, timeout: 180000 }, async () => {
  const preview = await startPreview(root);
  const chrome = await openChrome();
  try {
    for (const theme of ['light', 'dark']) {
      await chrome.navigate(`${preview.base}/credits`);
      await chrome.waitFor('document.readyState === "complete"');
      await chrome.evaluate(`(() => { const k = 'vil3d:settings'; const s = JSON.parse(localStorage.getItem(k) || '{"state":{},"version":2}'); s.state = { ...s.state, theme: '${theme}', qualityMode: 'low' }; localStorage.setItem(k, JSON.stringify(s)); })()`);
      await chrome.navigate(`${preview.base}/lab?debug`);
      await chrome.waitFor('!!window.__vil3d?.ready?.() && !!window.__labAudit', 90000);
      // posters and signs draw their text into canvases once the fonts are in
      await new Promise((r) => setTimeout(r, 2500));
      const rows = await chrome.evaluate('JSON.stringify(window.__labAudit())').then(JSON.parse);
      const names = new Set(rows.map((r) => r.name));
      assert.ok([...names].filter((n) => n.startsWith('zone-sign:')).length >= 9, `${theme}: every zone sign is tagged (${[...names].join(', ')})`);
      const hidden = rows.filter((r) => r.visible < r.total - 1).map((r) => `${r.name} from ${r.from}: ${r.visible}/${r.total} visible, hidden by ${r.hiddenBy}`);
      assert.deepEqual(hidden, [], `${theme} theme`);
    }
    // screens: every zone opened in turn so its full models (and their wallpapers) are on
    for (const zone of ['workstation', 'peripherals', 'print_media', 'mobile', 'showcase']) {
      await chrome.navigate(`${preview.base}/lab?debug&zone=${zone}`);
      await chrome.waitFor('!!window.__vil3d?.ready?.() && !!window.__labScreens', 90000);
      await new Promise((r) => setTimeout(r, 6000));
      const screens = await chrome.evaluate('JSON.stringify(window.__labScreens())').then(JSON.parse);
      const wrong = screens.filter((s) => s.mirrored || s.upsideDown).map((s) => `${zone}: ${s.name}${s.mirrored ? ' mirrored' : ''}${s.upsideDown ? ' upside down' : ''}`);
      assert.deepEqual(wrong, [], `screens in ${zone}`);
      if (zone === 'workstation') assert.ok(screens.length >= 1, 'the workstation monitor shows the wallpaper');
    }
  } finally {
    await chrome.close();
    preview.stop();
  }
});
