/**
 * V4 §7: every secondary page is reachable from the side menu at 375, 768,
 * 1280, 1366 and 1920 px. At each width, on a content page and on the 3D
 * lab: the menu button is visible, inside the screen and not covered; it
 * opens the drawer; the drawer fits the screen; each of its links lies
 * inside the drawer and, clicked, lands on its page (the drawer closes).
 * Esc, a click on the backdrop and a touch swipe to the right close it;
 * Tab stays inside it; the focus returns to the button. No horizontal page
 * scroll, open or closed.
 *
 *   npm run test:site-menu              # needs the dev site on :5173 (npm run dev)
 *   npm run test:site-menu -- --shots   # also saves docs/v4-section7/*.jpg, light and dark
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { openChrome } from './lib/cdp.mjs';

const SITE = process.env.LAB_BASE ?? 'http://localhost:5173';
const SHOTS = process.argv.includes('--shots');
const WIDTHS = [375, 768, 1280, 1366, 1920];
const heightOf = (w) => (w === 375 ? 812 : w === 768 ? 1024 : w === 1366 ? 768 : w === 1920 ? 1080 : 800);
/** every secondary page (src/components/layout/siteLinks.ts) and where it must land */
const EXPECTED = ['/path', '/certificate', '/games', '/identify', '/robots', '/feedback#contact', '/feedback', '/credits', '/privacy'];
/** pages the menu is opened from: a content page and a full-screen 3D page with the Bit tab and 3D controls */
const FROM = ['/credits', '/lab'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = 'docs/v4-section7';
const problems = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

const STATE = `(() => {
  const vw = innerWidth, vh = innerHeight;
  const b = document.querySelector('[data-site-menu-button]');
  const p = document.querySelector('[data-site-menu]');
  const r = (e) => { const x = e.getBoundingClientRect(); return { left: x.left, top: x.top, right: x.right, bottom: x.bottom, width: x.width, height: x.height }; };
  const br = b && r(b);
  const top = br && document.elementFromPoint(br.left + br.width / 2, br.top + br.height / 2);
  const layer = p?.closest('[data-chrome]');
  return {
    vw, vh,
    overflowX: document.documentElement.scrollWidth > vw + 1,
    button: br,
    buttonVisible: !!b && getComputedStyle(b).visibility !== 'hidden' && getComputedStyle(b).display !== 'none',
    buttonOnTop: !!top && (top === b || b.contains(top)),
    onTop: top ? top.tagName.toLowerCase() + '.' + String(top.className).split(' ')[0] + ' ' + (top.closest('[data-chrome]')?.getAttribute('data-chrome') ?? '') : '',
    open: !!layer?.hasAttribute('data-open'),
    panel: p && r(p),
    focusInside: !!p && p.contains(document.activeElement),
    focusOnButton: document.activeElement === b,
    links: p ? [...p.querySelectorAll('nav a')].map((a) => ({ href: a.getAttribute('href'), text: a.textContent.trim(), rect: r(a) })) : [],
    here: location.pathname + location.hash,
  };
})()`;

const c = await openChrome({ port: 9341, width: 1280, height: 800 });
const state = () => c.evaluate(STATE);
const ready = () => c.waitFor(`!!document.querySelector('[data-site-menu-button]') && document.readyState === 'complete'`, 60000);
const go = async (path) => {
  await c.navigate(SITE + path);
  await sleep(400);
  await ready();
  // a 3D page shows its loading screen over everything (the top bar too) until the scene is ready
  if (path === '/lab') {
    await c.waitFor('!!document.querySelector("canvas") && !document.querySelector("[data-visible=true]")', 120000).catch(() => {});
    await sleep(1500); // its fade-out
  } else await sleep(700);
};
const click = (sel) => c.evaluate(`document.querySelector(${JSON.stringify(sel)}).click()`);
const key = async (k, shift = false) => {
  const code = k === 'Tab' ? 9 : 27;
  const base = { key: k, code: k, windowsVirtualKeyCode: code, modifiers: shift ? 8 : 0 };
  await c.send('Input.dispatchKeyEvent', { type: 'keyDown', ...base });
  await c.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
};
const openMenu = async () => {
  await click('[data-site-menu-button]');
  // until the slide-in has finished
  await c.waitFor(`(() => { const p = document.querySelector('[data-site-menu]'); const m = p && new DOMMatrix(getComputedStyle(p).transform); return !!m && Math.abs(m.m41) < 1; })()`, 5000).catch(() => {});
  await sleep(150);
  return state();
};
const shot = async (name) => {
  const r = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
  writeFileSync(`${OUT}/${name}.jpg`, Buffer.from(r.result.data, 'base64'));
};
const setTheme = (theme) =>
  c.evaluate(`(() => { const k = 'vil3d:settings'; const v = JSON.parse(localStorage.getItem(k) || '{"state":{},"version":3}'); v.state.theme = '${theme}'; localStorage.setItem(k, JSON.stringify(v)); })()`);

if (SHOTS) mkdirSync(OUT, { recursive: true });

try {
  for (const w of WIDTHS) {
    const h = heightOf(w);
    await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 768 });
    await c.send('Emulation.setTouchEmulationEnabled', { enabled: w < 768, maxTouchPoints: 5 });

    for (const from of FROM) {
      const where = `${w}px ${from}`;
      await go(from);
      // something passing over the button (a fading loading screen) is not covering it: give it 10 s
      let s = await state();
      for (let i = 0; i < 20 && s.buttonVisible && !s.buttonOnTop; i++) {
        await sleep(500);
        s = await state();
      }
      if (!s.buttonVisible || !s.button) {
        fail(where, 'menu button not shown');
        continue;
      }
      if (s.button.left < 0 || s.button.right > s.vw || s.button.top < 0 || s.button.bottom > s.vh) fail(where, 'menu button outside the screen');
      if (!s.buttonOnTop) fail(where, `menu button covered by ${s.onTop}`);
      if (s.overflowX) fail(where, 'horizontal page scroll (menu closed)');

      s = await openMenu();
      if (!s.open) {
        fail(where, 'drawer did not open');
        continue;
      }
      if (!s.focusInside) fail(where, 'focus not moved into the drawer');
      if (s.panel.right > s.vw + 1 || s.panel.left < -1 || s.panel.width > s.vw) fail(where, `drawer outside the screen (${Math.round(s.panel.left)}–${Math.round(s.panel.right)} of ${s.vw})`);
      if (s.overflowX) fail(where, 'horizontal page scroll (menu open)');
      const hrefs = s.links.map((l) => l.href);
      for (const e of EXPECTED) if (!hrefs.includes(e)) fail(where, `no link to ${e}`);
      for (const l of s.links) {
        if (l.rect.left < s.panel.left - 1 || l.rect.right > s.panel.right + 1) fail(where, `link ${l.href} sticks out of the drawer`);
        if (l.rect.height < 44) fail(where, `link ${l.href} is ${Math.round(l.rect.height)} px tall (< 44)`);
      }

      // focus trap: 40 Tabs forward and back never leave the drawer
      let escaped = false;
      for (let i = 0; i < 40 && !escaped; i++) {
        await key('Tab', i >= 20);
        escaped = !(await state()).focusInside;
      }
      if (escaped) fail(where, 'Tab left the drawer');

      if (SHOTS && from === '/credits') {
        for (const theme of ['dark', 'light']) {
          await setTheme(theme);
          await go(from);
          await openMenu();
          await shot(`menu-open-${w}-${theme}`);
          await key('Escape');
          await sleep(500);
          await c.evaluate('scrollTo(0, document.documentElement.scrollHeight)');
          await sleep(300);
          await shot(`footer-${w}-${theme}`);
        }
        await setTheme('dark');
        await go(from);
        await openMenu();
      }
      if (SHOTS && from === '/lab') {
        for (const theme of ['dark', 'light']) {
          await setTheme(theme);
          await go(from);
          await shot(`lab-closed-${w}-${theme}`);
        }
        await setTheme('dark');
        await go(from);
        await openMenu();
      }

      // Esc closes, focus back on the button
      await key('Escape');
      await sleep(450);
      s = await state();
      if (s.open) fail(where, 'Esc did not close the drawer');
      if (!s.focusOnButton) fail(where, 'focus not returned to the menu button after Esc');

      // a click on the backdrop (left of the drawer) closes it
      s = await openMenu();
      const bx = Math.max(4, s.panel.left / 2);
      await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: bx, y: s.vh / 2, button: 'left', clickCount: 1 });
      await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: bx, y: s.vh / 2, button: 'left', clickCount: 1 });
      await sleep(450);
      if ((await state()).open) fail(where, 'backdrop click did not close the drawer');

      // a touch swipe to the right closes it
      if (w < 768) {
        s = await openMenu();
        const y = s.vh / 2;
        const x0 = s.panel.left + 40;
        await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y }] });
        for (let i = 1; i <= 8; i++) {
          await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + i * 20, y }] });
          await sleep(16);
        }
        await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await sleep(450);
        if ((await state()).open) fail(where, 'swipe right did not close the drawer');
      }

      // each link lands on its page (from the content page; the lab run checks the button and drawer over the 3D view)
      if (from !== '/credits') continue;
      for (const href of EXPECTED) {
        await go(from);
        await openMenu();
        await c.evaluate(`document.querySelector('[data-site-menu] nav a[href="${href}"]').click()`);
        await sleep(900);
        s = await state();
        if (s.here !== href) fail(where, `link ${href} landed on ${s.here}`);
        if (s.open) fail(where, `drawer still open after following ${href}`);
      }
    }
    console.log(`${w}px checked`);
  }
} finally {
  // Chrome on Windows can hold its temp profile a moment longer; a leftover folder is not a test failure
  await c.close().catch(() => {});
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n  ` + problems.join('\n  '));
  process.exit(1);
}
console.log(`\nside menu: ${EXPECTED.length} secondary pages reachable at ${WIDTHS.join(', ')} px; Esc, backdrop, swipe and focus trap OK`);
