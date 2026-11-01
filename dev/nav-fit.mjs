// V4 §11 probe: do the top bar's section links fit (no hidden sideways scroll) at laptop widths, normal and demo?
import { openChrome } from '../scripts/lib/cdp.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let port = 9720;
for (const demo of [false, true]) {
  for (const w of (process.argv[2] ? process.argv.slice(2).map(Number) : [1025, 1100, 1180, 1280, 1366, 1440, 1536, 1920])) {
    const c = await openChrome({ width: w, height: 800, port: port++ });
    await c.navigate(`http://localhost:5173/credits${demo ? '?demo=1' : ''}`);
    await sleep(demo ? 4000 : 2500);
    if (demo) await c.navigate('http://localhost:5173/credits');
    await sleep(2000);
    const r = await c.evaluate(`(() => {
      const nav = document.querySelector('[data-chrome="topbar"] nav');
      const links = [...nav.querySelectorAll('a')];
      const n = nav.getBoundingClientRect();
      const hidden = links.filter((a) => { const b = a.getBoundingClientRect(); return b.right > n.right + 1 || b.left < n.left - 1; }).map((a) => a.textContent.trim());
      return JSON.stringify({ over: nav.scrollWidth - nav.clientWidth, hidden });
    })()`);
    console.log(demo ? 'demo' : 'norm', w, r);
    await c.close();
  }
}
