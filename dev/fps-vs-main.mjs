// V4 §13: FPS and draw calls, this branch (:4173) vs main (:4174), home / 3D lab / Setup Studio on Low, Medium, High,
// rounds alternating builds. Start both previews first. node dev/fps-vs-main.mjs [rounds]
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const rounds = Number(process.argv[2] ?? 2);
/** qualities to measure (comma-separated), default low,medium,high */
const qualities = (process.argv[3] ?? 'low,medium,high').split(',');
const builds = { main: 'http://localhost:4174', branch: 'http://localhost:4173' };
const pages = ['/', '/lab', '/studio'];
const rows = {};
for (let r = 0; r < rounds; r++) {
  for (const q of qualities) {
    for (const b of r % 2 ? ['branch', 'main'] : ['main', 'branch']) {
      const out = execFileSync(process.execPath, ['scripts/perf-measure.mjs', builds[b], `--quality=${q}`, `--pages=${pages.join(',')}`], { encoding: 'utf8', maxBuffer: 64 << 20 });
      const json = JSON.parse(out.slice(out.indexOf('{')));
      for (const p of pages) {
        const s = (json.pages ?? json)[p]?.scene;
        const key = `${p} ${q}`;
        rows[key] ??= { main: [], branch: [], calls: {} };
        rows[key][b].push(s?.fps ?? null);
        rows[key].calls[b] = s?.bench?.calls ?? null;
      }
      console.log(`round ${r + 1} ${q} ${b} done`);
    }
  }
}
// the median: one run in a few drops by half on this laptop GPU (a background spike), the mean would follow it
const avg = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const lines = ['| page / quality | main fps (median) | branch fps (median) | change | draw calls main → branch |', '|---|---|---|---|---|'];
for (const [k, v] of Object.entries(rows)) {
  const m = avg(v.main), b = avg(v.branch);
  lines.push(`| ${k} | ${v.main.join(' / ')} (${m.toFixed(1)}) | ${v.branch.join(' / ')} (${b.toFixed(1)}) | ${(((b - m) / m) * 100).toFixed(1)} % | ${v.calls.main} → ${v.calls.branch} |`);
}
writeFileSync('docs/v4-section13-fps.md', `# V4 §13 — FPS vs main (headless Chrome, GPU, ${new Date().toISOString().slice(0, 10)})\n\n${lines.join('\n')}\n`);
console.log(lines.join('\n'));
