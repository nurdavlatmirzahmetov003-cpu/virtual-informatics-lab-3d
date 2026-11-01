/**
 * V4 §8.2: draws the certificate's seals and the team signature (in-house, CC0):
 *   node scripts/certificate-seals.mjs public/certificate
 * seal-team.svg — the team's round ink seal after «ММАН:»; seal-brand.svg — BitLab's
 * gold brand seal; signature-team.svg — a sample signature. All three are placeholders
 * a real seal or signature scan can replace (paths in src/config/brand.ts).
 */
import { writeFileSync } from 'node:fs';
const out = process.argv[2] ?? 'public/certificate';
const f = (n) => n.toFixed(2);
const ring = (r, cx = 120, cy = 120) => `M${cx} ${cy} m-${r} 0 a${r} ${r} 0 1 1 ${2 * r} 0 a${r} ${r} 0 1 1 -${2 * r} 0`;
// the BitLab "b" mark as one-colour strokes, centred on (cx, cy), unit = 64-box scale s
const mark = (cx, cy, s, color, dot) => `<g transform="translate(${f(cx - 32 * s)} ${f(cy - 32 * s)}) scale(${s})" fill="none" stroke="${color}" stroke-linecap="round">
    <path d="M22 13v35" stroke-width="7" />
    <circle cx="33.5" cy="37.5" r="10.5" stroke-width="7" />
    <circle cx="45.5" cy="17.5" r="5.5" fill="${dot ?? color}" stroke="none" />
  </g>`;

// 1. the team's official round seal (ink stamp) — sits after «ММАН:» on the certificate
const ink = '#2443b8';
const team = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="480" height="480">
  <title>BitLab team seal (in-house drawing, CC0) — replaceable placeholder</title>
  <defs>
    <path id="t" d="${ring(87)}" />
    <filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="1.4" result="d" />
      <feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="1" seed="3" result="m" />
      <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.75" result="mask" />
      <feComposite in="d" in2="mask" operator="in" />
    </filter>
  </defs>
  <g filter="url(#rough)" opacity="0.9">
    <g fill="none" stroke="${ink}">
      <circle cx="120" cy="120" r="113" stroke-width="5" />
      <circle cx="120" cy="120" r="105" stroke-width="1.6" />
      <circle cx="120" cy="120" r="70" stroke-width="2.4" />
      <circle cx="120" cy="120" r="65" stroke-width="0.9" />
    </g>
    <text font-family="Arial, 'Segoe UI', sans-serif" font-size="16.5" font-weight="700" fill="${ink}">
      <textPath href="#t" startOffset="0" textLength="541" lengthAdjust="spacing">BitLab · Маралым · Меруерт · Аружан · Нұрдәулет ·</textPath>
    </text>
    ${mark(120, 112, 1.25, ink)}
    <g fill="${ink}">
      ${[-1, 1].map((k) => `<path transform="translate(${120 + k * 30} 160) scale(0.55)" d="M0 -10 L2.9 -3.1 L10 -3.1 L4.3 1.2 L6.4 8.1 L0 4 L-6.4 8.1 L-4.3 1.2 L-10 -3.1 L-2.9 -3.1Z" />`).join('\n      ')}
      <path transform="translate(120 162) scale(0.8)" d="M0 -10 L2.9 -3.1 L10 -3.1 L4.3 1.2 L6.4 8.1 L0 4 L-6.4 8.1 L-4.3 1.2 L-10 -3.1 L-2.9 -3.1Z" />
    </g>
  </g>
</svg>
`;
writeFileSync(`${out}/seal-team.svg`, team);

// 2. BitLab's own brand seal: a gold foil rosette
const N = 36;
let scallop = '';
for (let i = 0; i <= N * 2; i++) {
  const a = (i / (N * 2)) * Math.PI * 2 - Math.PI / 2;
  const r = i % 2 ? 108 : 116;
  scallop += `${i ? 'L' : 'M'}${f(120 + r * Math.cos(a))} ${f(120 + r * Math.sin(a))}`;
}
const brand = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="480" height="480">
  <title>BitLab brand seal (in-house drawing, CC0) — replaceable placeholder</title>
  <defs>
    <linearGradient id="gold" x1="30" y1="20" x2="210" y2="220" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#f7dc8a" />
      <stop offset="0.35" stop-color="#d9a73c" />
      <stop offset="0.55" stop-color="#fbe7a6" />
      <stop offset="0.8" stop-color="#b9831f" />
      <stop offset="1" stop-color="#e8bf5c" />
    </linearGradient>
    <linearGradient id="brand" x1="80" y1="70" x2="160" y2="160" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#2fc8f2" />
      <stop offset="0.55" stop-color="#5f7bff" />
      <stop offset="1" stop-color="#a95cf5" />
    </linearGradient>
    <linearGradient id="dot" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffc15c" />
      <stop offset="1" stop-color="#ff7a6b" />
    </linearGradient>
    <path id="t" d="${ring(84)}" />
  </defs>
  <path d="${scallop}Z" fill="url(#gold)" stroke="#a87418" stroke-width="1.2" />
  <circle cx="120" cy="120" r="101" fill="none" stroke="#fff6d6" stroke-width="1.4" opacity="0.8" />
  <circle cx="120" cy="120" r="98" fill="#fffaf0" stroke="#a87418" stroke-width="2" />
  <circle cx="120" cy="120" r="68" fill="none" stroke="#c9962b" stroke-width="1.6" />
  <text font-family="Arial, 'Segoe UI', sans-serif" font-size="14.5" font-weight="700" fill="#8a5f12">
    <textPath href="#t" startOffset="0" textLength="523" lengthAdjust="spacing">BITLAB · VIRTUAL INFORMATICS LAB ·</textPath>
  </text>
  <rect x="86" y="86" width="68" height="68" rx="19" fill="url(#brand)" />
  <rect x="86" y="86" width="68" height="34" rx="19" fill="#fff" opacity="0.12" />
  ${mark(120, 120, 68 / 64, '#fff', 'url(#dot)')}
</svg>
`;
writeFileSync(`${out}/seal-brand.svg`, brand);

// 3. a sample signature for the team line (one pen stroke)
const sig = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 110" width="600" height="220">
  <title>Signature placeholder (sample) — replace with a scan of the real signature</title>
  <path d="M18 78c18-6 30-44 40-46 9-2-6 46 2 46 10 0 22-48 32-46 8 2-4 40 4 42 10 2 18-26 30-28 10-2 6 20 16 20 12 0 18-18 28-16 8 2 2 14 10 14 16 0 44-22 70-24 20-2 34 4 40 8" fill="none" stroke="#1b2a6b" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M60 92c50-6 120-10 190-6" fill="none" stroke="#1b2a6b" stroke-width="2" stroke-linecap="round" opacity="0.8" />
</svg>
`;
writeFileSync(`${out}/signature-team.svg`, sig);
