/**
 * Textures of the BitLab showcase hardware (V4 §1.1), drawn as SVG and
 * rasterised with sharp: the white PCB (silkscreen, traces, pads), the
 * heatsink and card lettering, the perforated steel of the case panels and
 * the radiator fins. Own work of the project (CC0).
 *
 *   node scripts/blender/showcase-textures.mjs   → assets-src/bitlab/tex/*.png
 *
 * Board layout numbers are shared with make-showcase.py through
 * assets-src/bitlab/board-layout.json (written here): millimetres, `a` from
 * the board's bottom edge towards its top edge, `b` from its front edge
 * towards the I/O edge.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '../..');
const out = path.join(root, 'assets-src/bitlab/tex');
mkdirSync(out, { recursive: true });

/** ATX layout of the BitLab AERO board (305 × 244 mm). */
export const BOARD = {
  size: [305, 244],
  socket: { a: 225, b: 124 },
  dimm: { a: 230, b: [76, 66.5, 57, 47.5] },
  pcie: [{ a: 120, b: 156, x16: true }, { a: 59, b: 156, x16: true }, { a: 99.7, b: 186, x16: false }],
  m2: [{ a: 160, b: 150 }, { a: 84, b: 150 }],
  atx24: { a: 160, b: 9 },
  eps: [{ a: 297, b: 206 }, { a: 297, b: 190 }],
  holes: [[295, 6.5], [295, 157], [295, 234], [140, 6.5], [140, 157], [140, 234], [15, 6.5], [15, 157], [15, 234]],
};
writeFileSync(path.join(root, 'assets-src/bitlab/board-layout.json'), JSON.stringify(BOARD, null, 1));

const PX = 5; // px per mm
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

async function png(name, w, h, body, opts = {}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
  let img = sharp(Buffer.from(svg));
  if (opts.grey) img = img.greyscale();
  await img.png({ compressionLevel: 9 }).toFile(path.join(out, `${name}.png`));
  console.log(`tex/${name}.png ${w}×${h}`);
}

/* ── PCB: x = a (bottom → top edge), y = 244 − b (I/O edge at the top of the image) ── */
{
  const [A, Bm] = BOARD.size;
  const W = A * PX;
  const H = Bm * PX;
  const X = (a) => (a * PX).toFixed(1);
  const Y = (b) => ((Bm - b) * PX).toFixed(1);
  const parts = [`<rect width="${W}" height="${H}" fill="#f1f2f4"/>`];
  // subtle copper traces under the white solder mask
  let traces = '';
  for (let i = 0; i < 520; i++) {
    let x = rnd() * A;
    let y = rnd() * Bm;
    let d = `M${X(x)} ${Y(y)}`;
    for (let k = 0; k < 3 + Math.floor(rnd() * 4); k++) {
      const len = 4 + rnd() * 26;
      const dir = Math.floor(rnd() * 8);
      const dx = [1, 1, 0, -1, -1, -1, 0, 1][dir];
      const dy = [0, 1, 1, 1, 0, -1, -1, -1][dir];
      x = Math.min(A - 2, Math.max(2, x + dx * len));
      y = Math.min(Bm - 2, Math.max(2, y + dy * len));
      d += ` L${X(x)} ${Y(y)}`;
    }
    traces += `<path d="${d}" stroke="#e1e4e9" stroke-width="${(0.25 + rnd() * 0.35) * PX}" fill="none" stroke-linejoin="round"/>`;
  }
  parts.push(traces);
  // vias
  let vias = '';
  for (let i = 0; i < 900; i++) vias += `<circle cx="${X(rnd() * A)}" cy="${Y(rnd() * Bm)}" r="${0.32 * PX}" fill="#d3d7de"/>`;
  parts.push(vias);
  const silk = '#7f8792';
  const box = (a0, b0, a1, b1, extra = '') => `<rect x="${X(Math.min(a0, a1))}" y="${Y(Math.max(b0, b1))}" width="${Math.abs(a1 - a0) * PX}" height="${Math.abs(b1 - b0) * PX}" fill="none" stroke="${silk}" stroke-width="${0.25 * PX}" ${extra}/>`;
  const text = (a, b, s, size = 2.2, rot = 0, weight = 600, fill = silk) =>
    `<text x="${X(a)}" y="${Y(b)}" font-family="Bahnschrift, Segoe UI, Arial" font-size="${size * PX}" font-weight="${weight}" fill="${fill}" transform="rotate(${rot} ${X(a)} ${Y(b)})">${s}</text>`;
  // mounting holes: plated rings
  for (const [a, b] of BOARD.holes) parts.push(`<circle cx="${X(a)}" cy="${Y(b)}" r="${3.6 * PX}" fill="#c8ccd2"/><circle cx="${X(a)}" cy="${Y(b)}" r="${1.9 * PX}" fill="#6b7078"/>`);
  // component outlines and labels
  parts.push(box(BOARD.socket.a - 27, BOARD.socket.b - 27, BOARD.socket.a + 27, BOARD.socket.b + 27));
  parts.push(text(BOARD.socket.a - 26, BOARD.socket.b - 31, 'AM5 CPU', 2.4));
  for (const [i, b] of BOARD.dimm.b.entries()) parts.push(text(BOARD.dimm.a - 80, b + 1, ['DDR5_A1', 'DDR5_A2', 'DDR5_B1', 'DDR5_B2'][i], 1.6));
  parts.push(text(BOARD.pcie[0].a + 6, BOARD.pcie[0].b - 46, 'PCIEX16_1', 2));
  parts.push(text(BOARD.pcie[1].a + 6, BOARD.pcie[1].b - 46, 'PCIEX16_2', 2));
  parts.push(text(BOARD.pcie[2].a + 4, BOARD.pcie[2].b - 16, 'PCIEX1', 1.8));
  parts.push(text(BOARD.m2[0].a - 13, BOARD.m2[0].b - 44, 'M2A_CPU', 1.7));
  parts.push(text(BOARD.atx24.a - 26, BOARD.atx24.b + 12, 'ATX_PWR', 1.8));
  parts.push(text(278, 216, 'ATX12V', 1.6, 90));
  parts.push(text(262, 90, 'CPU_FAN', 1.6));
  parts.push(text(20, 18, 'F_PANEL', 1.6));
  parts.push(text(40, 30, 'SATA3_0  SATA3_1', 1.6));
  // branding: a plain wordmark, no third-party logos
  parts.push(text(186, 100, 'BITLAB', 5.5, 0, 800, '#9aa1ab'));
  parts.push(text(186, 92, 'B650E AERO  ·  REV 1.0', 2.3, 0, 600, '#9aa1ab'));
  // tiny SMD pads around the socket and the slots
  let pads = '';
  for (let i = 0; i < 380; i++) {
    const a = 150 + rnd() * 140;
    const b = 80 + rnd() * 100;
    if (Math.abs(a - BOARD.socket.a) < 30 && Math.abs(b - BOARD.socket.b) < 30) continue;
    pads += `<rect x="${X(a)}" y="${Y(b)}" width="${1.1 * PX}" height="${0.6 * PX}" fill="#b9bec6"/>`;
  }
  parts.push(pads);
  await png('pcb', W, H, parts.join(''));
}

/* ── lettering: heatsink cover, I/O shroud, card side / backplate, RAM ── */
const word = (w, h, bg, main, sub, color, subColor, size, stripes = true) =>
  `<rect width="${w}" height="${h}" fill="${bg}"/>` +
  (stripes ? Array.from({ length: 9 }, (_, i) => `<rect x="${w * 0.04 + i * w * 0.012}" y="${h * 0.18}" width="${w * 0.005}" height="${h * 0.64}" fill="${subColor}" opacity="0.55"/>`).join('') : '') +
  `<text x="${w * 0.2}" y="${h * 0.62}" font-family="Bahnschrift, Segoe UI, Arial" font-weight="700" font-size="${size}" letter-spacing="${size * 0.12}" fill="${color}">${main}</text>` +
  (sub ? `<text x="${w * 0.2}" y="${h * 0.86}" font-family="Bahnschrift, Segoe UI, Arial" font-weight="500" font-size="${size * 0.3}" letter-spacing="${size * 0.08}" fill="${subColor}">${sub}</text>` : '');
await png('logo_io', 1024, 256, word(1024, 256, '#eceef2', 'AERO', 'BITLAB GAMING', '#3a3f47', '#9aa1ab', 150));
await png('logo_heatsink', 1024, 256, word(1024, 256, '#e7e9ed', 'BITLAB', 'AERO SERIES', '#59606a', '#a4abb4', 130));
await png('logo_gpu_side', 2048, 256, word(2048, 256, '#f3f4f6', 'BITLAB AERO', 'GAMING GRAPHICS · 16 GB', '#2f343b', '#98a0aa', 150));
await png('logo_backplate', 1024, 512, `<rect width="1024" height="512" fill="#eef0f3"/>` + Array.from({ length: 14 }, (_, i) => `<rect x="${60 + i * 66}" y="40" width="4" height="432" fill="#dfe2e7"/>`).join('') + `<text x="150" y="300" font-family="Bahnschrift, Segoe UI, Arial" font-weight="700" font-size="150" letter-spacing="22" fill="#9aa1ab">AERO</text>`);
await png('logo_ram', 1024, 256, word(1024, 256, '#f1f2f5', 'BITLAB', 'DDR5 · 6000', '#4a515b', '#a1a8b1', 120, false));
await png('logo_psu', 1024, 512, `<rect width="1024" height="512" fill="#f1f2f5"/><rect x="40" y="40" width="944" height="432" rx="18" fill="none" stroke="#c7ccd3" stroke-width="6"/>` +
  `<text x="90" y="250" font-family="Bahnschrift, Segoe UI, Arial" font-weight="700" font-size="150" letter-spacing="18" fill="#3a3f47">AERO 850</text>` +
  `<text x="94" y="345" font-family="Bahnschrift, Segoe UI, Arial" font-weight="500" font-size="44" letter-spacing="10" fill="#8e96a1">BITLAB · MODULAR · PLATINUM</text>`);
await png('logo_pump', 512, 512, `<rect width="512" height="512" fill="#0b0d12"/><text x="256" y="292" text-anchor="middle" font-family="Bahnschrift, Segoe UI, Arial" font-weight="700" font-size="86" letter-spacing="10" fill="#e9edf5">BitLab</text>`);

/* ── perforated steel (alpha: white = metal, black = hole), tiles seamlessly ── */
{
  const n = 256;
  const step = n / 8;
  let holes = '';
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    const x = c * step + (r % 2 ? step / 2 : 0);
    const y = r * step * 0.866;
    for (const [dx, dy] of [[0, 0], [n, 0], [0, n], [-n, 0], [0, -n]]) holes += `<circle cx="${(x + dx).toFixed(2)}" cy="${(y + dy).toFixed(2)}" r="${step * 0.33}" fill="#000"/>`;
  }
  await png('perforated', n, n, `<rect width="${n}" height="${n}" fill="#fff"/>${holes}`, { grey: true });
}

/* ── radiator fins: thin vertical louvres ── */
{
  const n = 512;
  let fins = `<rect width="${n}" height="${n}" fill="#d7dbe1"/>`;
  for (let i = 0; i < 64; i++) fins += `<rect x="${i * 8}" y="0" width="3" height="${n}" fill="#f2f4f7"/><rect x="${i * 8 + 3}" y="0" width="1" height="${n}" fill="#b4bac3"/>`;
  await png('fins', n, n, fins);
}

/* ── cable sleeve braid (normal-ish shading in colour; used as map + bump) ── */
{
  const w = 256;
  const h = 64;
  let braid = `<rect width="${w}" height="${h}" fill="#e9ebef"/>`;
  for (let i = -8; i < 40; i++) braid += `<path d="M${i * 8} 0 L${i * 8 + 32} ${h}" stroke="#cfd3da" stroke-width="2.4"/><path d="M${i * 8 + 32} 0 L${i * 8} ${h}" stroke="#f8f9fb" stroke-width="1.6"/>`;
  await png('sleeve', w, h, braid, { grey: true });
}
