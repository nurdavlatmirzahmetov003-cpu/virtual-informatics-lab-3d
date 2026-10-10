import type { ReactNode } from 'react';
import type { ModuleId } from './modules';
import styles from './LabsPage.module.css';

/**
 * Small layered illustrations for the hub cards. Layers carry `data-depth`
 * so the card tilt moves them at different depths (a light 3D parallax
 * without loading WebGL on the hub).
 */
export function ModulePreview({ id }: { id: ModuleId }) {
  return (
    <svg className={styles.preview} viewBox="0 0 320 160" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`glow-${id}`} cx="50%" cy="55%" r="60%">
          <stop offset="0%" stopColor="var(--tone)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--tone)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`face-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c2230" />
          <stop offset="100%" stopColor="#10141c" />
        </linearGradient>
      </defs>
      <ellipse cx="160" cy="92" rx="150" ry="70" fill={`url(#glow-${id})`} />
      <g className={styles.layerBack}>{BACK[id]}</g>
      <g className={styles.layerFront}>{FRONT[id](`url(#face-${id})`)}</g>
    </svg>
  );
}

const line = { fill: 'none', stroke: 'var(--tone)', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const dim = { fill: 'none', stroke: 'rgba(255,255,255,0.14)', strokeWidth: 1.2 } as const;

const grid = (
  <g opacity="0.5">
    {Array.from({ length: 9 }, (_, i) => (
      <line key={`v${i}`} x1={40 + i * 30} y1="18" x2={40 + i * 30} y2="148" {...dim} strokeWidth={0.6} />
    ))}
    {Array.from({ length: 5 }, (_, i) => (
      <line key={`h${i}`} x1="30" y1={28 + i * 30} x2="290" y2={28 + i * 30} {...dim} strokeWidth={0.6} />
    ))}
  </g>
);

const BACK: Record<ModuleId, ReactNode> = {
  space: grid,
  hardware: grid,
  assembly: grid,
  network: grid,
  algorithms: grid,
  logic: grid,
  experiments: grid,
  studio: <path d="M20 128 H300" {...dim} />,
  assignments: grid,
  results: grid,
};

const FRONT: Record<ModuleId, (face: string) => ReactNode> = {
  // the hall from above: three walls, nine zones, the visitor at the open front
  space: (face) => (
    <>
      <path d="M70 140 V26 H250 V140" {...line} />
      {[
        [86, 34], [138, 34], [190, 34],
        [74, 70], [74, 104], [214, 70], [214, 104],
        [122, 112],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="34" height="22" rx="3" {...line} fill={face} />
      ))}
      <circle cx="160" cy="80" r="15" {...line} fill={face} />
      <circle cx="176" cy="148" r="4" fill="var(--tone)" />
    </>
  ),
  hardware: (face) => (
    <>
      <rect x="92" y="34" width="96" height="66" rx="6" {...line} fill={face} />
      <rect x="99" y="41" width="82" height="52" rx="3" fill="var(--tone)" opacity="0.14" />
      <path d="M128 100 v12 h24 v-12 M116 116 h48" {...line} />
      <rect x="204" y="30" width="44" height="88" rx="6" {...line} fill={face} />
      <circle cx="226" cy="48" r="9" {...line} />
      <circle cx="226" cy="74" r="9" {...line} />
      <path d="M214 102 h24" {...line} opacity="0.6" />
      <circle cx="226" cy="48" r="3" fill="var(--tone)" className={styles.pulse} />
    </>
  ),
  assembly: (face) => (
    <>
      <rect x="86" y="30" width="148" height="104" rx="6" {...line} fill={face} />
      <rect x="112" y="52" width="38" height="38" rx="3" {...line} />
      <rect x="121" y="61" width="20" height="20" rx="2" fill="var(--tone)" opacity="0.35" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={170 + i * 12} y="46" width="6" height="58" rx="1.5" {...dim} />
      ))}
      <rect x="194" y="16" width="6" height="58" rx="1.5" fill="var(--tone)" opacity="0.85" className={styles.float} />
      <path d="M100 112 h70" {...line} opacity="0.6" />
    </>
  ),
  network: (face) => (
    <>
      <path d="M70 112 C 110 112, 120 64, 160 64 S 220 112, 250 112" {...line} opacity="0.5" />
      <path d="M160 64 V 34" {...line} opacity="0.5" />
      {[
        [70, 112],
        [250, 112],
        [160, 34],
      ].map(([x, y]) => (
        <rect key={`${x}`} x={x - 18} y={y - 12} width="36" height="24" rx="6" {...line} fill={face} />
      ))}
      <rect x="132" y="54" width="56" height="20" rx="5" {...line} fill={face} />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={142 + i * 12} cy="64" r="2" fill="var(--tone)" opacity="0.7" />
      ))}
      <circle r="5" fill="var(--tone)" className={styles.packet} />
    </>
  ),
  algorithms: () => (
    <>
      {[46, 82, 30, 104, 62, 92, 40, 74].map((h, i) => (
        <rect key={i} x={70 + i * 24} y={130 - h} width="16" height={h} rx="3" fill={i === 3 || i === 4 ? 'var(--tone)' : 'rgba(255,255,255,0.16)'} opacity={i === 3 || i === 4 ? 0.9 : 1} className={i === 3 || i === 4 ? styles.swap : undefined} />
      ))}
      <path d="M150 20 l10 -6 l10 6" {...line} />
    </>
  ),
  logic: (face) => (
    <>
      <path d="M60 58 H120 M60 102 H120 M190 80 H232" {...line} />
      <path d="M120 44 H150 A36 36 0 0 1 150 116 H120 Z" {...line} fill={face} />
      <circle cx="60" cy="58" r="5" fill="var(--tone)" />
      <circle cx="60" cy="102" r="5" fill="var(--tone)" />
      <circle cx="248" cy="80" r="12" fill="var(--tone)" opacity="0.25" className={styles.pulse} />
      <circle cx="248" cy="80" r="7" fill="var(--tone)" />
      <text x="138" y="85" fill="var(--tone)" fontSize="13" fontFamily="var(--font-mono)">
        &amp;
      </text>
    </>
  ),
  experiments: () => (
    <>
      <path d="M40 90 C 70 30, 100 30, 130 90 S 190 150, 220 90 S 270 40, 290 70" {...line} strokeWidth={2} />
      <path d="M60 136 H260" {...dim} strokeWidth={3} strokeLinecap="round" />
      <path d="M60 136 H176" stroke="var(--tone)" strokeWidth={3} strokeLinecap="round" />
      <circle cx="176" cy="136" r="7" {...line} fill="#10141c" />
    </>
  ),
  studio: (face) => (
    <>
      <path d="M50 116 H270 M66 116 V 146 M254 116 V 146" {...line} opacity="0.7" />
      <rect x="104" y="30" width="112" height="66" rx="6" {...line} fill={face} />
      <rect x="111" y="37" width="98" height="52" rx="3" fill="var(--tone)" opacity="0.16" />
      <path d="M152 96 v12 h16 v-12" {...line} />
      <rect x="112" y="108" width="74" height="6" rx="2" {...line} opacity="0.7" />
      <rect x="196" y="107" width="12" height="8" rx="4" {...line} opacity="0.7" />
      <rect x="236" y="62" width="26" height="52" rx="4" {...line} fill={face} />
      <path d="M241 70 h16" stroke="var(--tone)" strokeWidth="2" className={styles.pulse} />
    </>
  ),
  assignments: (face) => (
    <>
      <rect x="104" y="22" width="112" height="120" rx="8" {...line} fill={face} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="118" y={44 + i * 30} width="14" height="14" rx="3" {...line} />
          {i < 2 && <path d={`M121 ${51 + i * 30} l3 3 l6 -7`} {...line} strokeWidth={2} />}
          <path d={`M142 ${51 + i * 30} H${196 - i * 14}`} {...dim} strokeWidth={3} strokeLinecap="round" />
        </g>
      ))}
    </>
  ),
  results: () => (
    <>
      <circle cx="160" cy="82" r="46" {...dim} strokeWidth={8} />
      <circle cx="160" cy="82" r="46" fill="none" stroke="var(--tone)" strokeWidth="8" strokeLinecap="round" strokeDasharray="210 289" transform="rotate(-90 160 82)" />
      <path d="M146 76 h28 v8 a14 14 0 0 1 -28 0 Z M160 98 v8 M150 108 h20" {...line} />
    </>
  ),
};
