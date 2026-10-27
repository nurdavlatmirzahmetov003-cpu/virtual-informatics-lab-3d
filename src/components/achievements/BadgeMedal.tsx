/**
 * V4 §9: an achievement's medal, drawn in-house as SVG with a 3D look — a
 * bevelled metal rim (shape and metal by rarity: bronze disc, silver hexagon,
 * gold rosette, legendary star), coloured enamel in the middle with the
 * subject's icon, a specular highlight and ribbon tails. Locked: a flat
 * silhouette of the same shape. `progress` draws a ring round a locked one.
 */
import { useId } from 'react';
import type { AchievementId } from '@/services/progress';
import { RARITY, type Rarity } from '@/services/progress/rarity';
import { ACHIEVEMENT_HUE, ACHIEVEMENT_ICONS } from './achievementIcons';
import styles from './BadgeMedal.module.css';

/** Metal stops: light → base → dark → rim highlight. */
const METAL: Record<Rarity | 'locked', [string, string, string, string]> = {
  bronze: ['#f6c79b', '#c27a3e', '#7a4520', '#ffe2c4'],
  silver: ['#ffffff', '#c3cad6', '#7d8796', '#f4f7fb'],
  gold: ['#fff2b0', '#f2b81f', '#a86d05', '#fff8d6'],
  legendary: ['#f5d0fe', '#a855f7', '#4c1d95', '#cffafe'],
  locked: ['#9aa3b2', '#6b7383', '#3e4452', '#a9b0bd'],
};

function polygon(n: number, r: number, rot = -Math.PI / 2, cx = 60, cy = 58) {
  return Array.from({ length: n }, (_, i) => {
    const a = rot + (i / n) * Math.PI * 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

function star(points: number, outer: number, inner: number, cx = 60, cy = 58) {
  return Array.from({ length: points * 2 }, (_, i) => {
    const a = -Math.PI / 2 + (i / (points * 2)) * Math.PI * 2;
    const r = i % 2 ? inner : outer;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

/** The rim's outline per rarity. */
function Rim({ rarity, ...rest }: { rarity: Rarity } & React.SVGProps<SVGPolygonElement> & React.SVGProps<SVGCircleElement>) {
  switch (rarity) {
    case 'bronze':
      return <circle cx="60" cy="58" r="46" {...rest} />;
    case 'silver':
      return <polygon points={polygon(6, 50, -Math.PI / 2)} strokeLinejoin="round" {...rest} />;
    case 'gold':
      return <polygon points={star(16, 51, 44)} strokeLinejoin="round" {...rest} />;
    case 'legendary':
      return <polygon points={star(8, 56, 40)} strokeLinejoin="round" {...rest} />;
  }
}

export function BadgeMedal({ id, unlocked, progress, size = 96, className }: { id: AchievementId; unlocked: boolean; progress?: number; size?: number; className?: string }) {
  const uid = useId().replace(/:/g, '');
  const rarity = RARITY[id];
  const [light, base, dark, shine] = METAL[unlocked ? rarity : 'locked'];
  const hue = unlocked ? ACHIEVEMENT_HUE[id] : '#4b5263';
  const Icon = ACHIEVEMENT_ICONS[id];
  const ring = progress !== undefined && !unlocked;
  const C = 2 * Math.PI * 57;
  return (
    <svg className={[styles.medal, className].filter(Boolean).join(' ')} data-rarity={rarity} data-unlocked={unlocked} width={size} height={(size * 140) / 120} viewBox="0 0 120 140" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${uid}m`} x1="0.15" y1="0.05" x2="0.85" y2="0.95">
          <stop offset="0" stopColor={light} />
          <stop offset="0.45" stopColor={base} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <linearGradient id={`${uid}b`} x1="0.85" y1="0.95" x2="0.15" y2="0.05">
          <stop offset="0" stopColor={light} />
          <stop offset="0.5" stopColor={base} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <radialGradient id={`${uid}e`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#ffffff" stopOpacity={unlocked ? 0.55 : 0.12} />
          <stop offset="0.35" stopColor={hue} />
          <stop offset="1" stopColor={hue} stopOpacity="1" />
        </radialGradient>
        <radialGradient id={`${uid}d`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.75" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </radialGradient>
        {rarity === 'legendary' && unlocked && (
          <linearGradient id={`${uid}p`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#67e8f9" />
            <stop offset="0.35" stopColor="#c084fc" />
            <stop offset="0.7" stopColor="#f472b6" />
            <stop offset="1" stopColor="#fde68a" />
          </linearGradient>
        )}
      </defs>

      {/* ribbon tails */}
      {unlocked && (
        <g className={styles.ribbon}>
          <path d="M42 92 L30 134 L41 127 L49 136 L57 98 Z" fill={hue} />
          <path d="M78 92 L90 134 L79 127 L71 136 L63 98 Z" fill={hue} />
          <path d="M42 92 L30 134 L41 127 L49 136 L57 98 Z M78 92 L90 134 L79 127 L71 136 L63 98 Z" fill="#000" opacity="0.18" />
        </g>
      )}

      {ring && (
        <g transform="rotate(-90 60 58)">
          <circle cx="60" cy="58" r="57" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4" />
          <circle cx="60" cy="58" r="57" fill="none" className={styles.ringFill} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(C * Math.max(0.02, Math.min(1, progress))).toFixed(1)} ${C.toFixed(1)}`} />
        </g>
      )}

      {/* rim: outer metal, a bevel the other way round, then the enamel */}
      <g transform="translate(0 2)" opacity="0.35">
        <Rim rarity={rarity} fill="#000" />
      </g>
      <Rim rarity={rarity} fill={rarity === 'legendary' && unlocked ? `url(#${uid}p)` : `url(#${uid}m)`} stroke={dark} strokeWidth="1.2" />
      <circle cx="60" cy="58" r="38" fill={`url(#${uid}b)`} />
      <circle cx="60" cy="58" r="38" fill="none" stroke={shine} strokeOpacity="0.8" strokeWidth="1" />
      <circle cx="60" cy="58" r="32" fill={`url(#${uid}e)`} />
      <circle cx="60" cy="58" r="32" fill={`url(#${uid}d)`} />
      <circle cx="60" cy="58" r="32" fill="none" stroke={dark} strokeOpacity="0.6" strokeWidth="1.2" />

      <Icon x={40} y={38} width={40} height={40} color={unlocked ? '#ffffff' : '#2b303b'} strokeWidth={1.9} className={styles.icon} />

      {/* specular highlight on the rim and the enamel */}
      {unlocked && <path d="M26 44 A36 36 0 0 1 60 20" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round" />}
      {unlocked && <ellipse cx="50" cy="42" rx="14" ry="7" fill="#fff" opacity="0.28" transform="rotate(-25 50 42)" />}
      {rarity === 'legendary' && unlocked && (
        <g className={styles.sparkles} fill="#fff">
          <path d="M98 14 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z" />
          <path d="M18 88 l1.5 4.5 4.5 1.5 -4.5 1.5 -1.5 4.5 -1.5 -4.5 -4.5 -1.5 4.5 -1.5z" />
        </g>
      )}
    </svg>
  );
}
