// Compact view of perf-measure.mjs output: node scripts/perf-summary.mjs result.json
import { readFileSync } from 'node:fs';
const r = JSON.parse(readFileSync(process.argv[2], 'utf8'));
for (const [page, v] of Object.entries(r.pages)) {
  const s = v.scene;
  console.log(`${page}  ready ${v.readyMs} ms, first frame ${v.firstFrameMs} ms (${((v.readyKB ?? 0) / 1024).toFixed(2)} MB before ready)  download ${(v.downloadKB / 1024).toFixed(2)} MB  ` + Object.entries(v.by).map(([k, x]) => `${k} ${x.files}f/${x.KB}KB`).join(', '));
  if (s) console.log(`   ${s.level} dpr ${s.dpr}  calls ${s.bench.calls}  tris ${Math.round(s.bench.triangles / 1000)}k  ${s.bench.msPerFrame} ms/frame  rAF ${s.fps} fps  tex ${s.memory.textures} = ${s.memory.textureMB} MB  heap ${s.memory.heapMB} MB  programs ${s.programs ?? '?'}  gl ${JSON.stringify(s.memory.gl)}`);
  if (s?.state) console.log('   state', JSON.stringify(s.state));
  if (v.errors?.length) console.log('   errors:', v.errors);
}
