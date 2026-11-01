import { useId } from 'react';
import { useT } from '@/hooks/useT';
import styles from './Certificate.module.css';

/** A star-burst outline: `n` points between two radii, centred in a 200 box. */
function burst(n: number, outer: number, inner: number) {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? inner : outer;
    d += `${i ? 'L' : 'M'}${(100 + r * Math.cos(a)).toFixed(1)} ${(100 + r * Math.sin(a)).toFixed(1)}`;
  }
  return `${d}Z`;
}

const OUTLINE = burst(22, 98, 88);

/**
 * V4 §8.2: the holographic «Course completed» sticker (in-house SVG). A
 * rainbow foil under fine diagonal lines; on screen a sheen sweeps across it
 * (still with reduced motion and on paper).
 */
export function HoloSticker({ className }: { className?: string }) {
  const t = useT();
  const id = useId().replace(/:/g, '');
  const [top, bottom] = t('certificate.sticker').split('\n');
  return (
    <svg className={[styles.sticker, className].filter(Boolean).join(' ')} viewBox="0 0 200 200" role="img" aria-label={t('certificate.sticker').replace('\n', ' ')}>
      <defs>
        <linearGradient id={`${id}foil`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a5f3fc" />
          <stop offset="0.2" stopColor="#c4b5fd" />
          <stop offset="0.4" stopColor="#fbcfe8" />
          <stop offset="0.6" stopColor="#fde68a" />
          <stop offset="0.8" stopColor="#bbf7d0" />
          <stop offset="1" stopColor="#93c5fd" />
        </linearGradient>
        <radialGradient id={`${id}glow`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <pattern id={`${id}lines`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="2" height="6" fill="#fff" opacity="0.35" />
        </pattern>
        <clipPath id={`${id}clip`}>
          <path d={OUTLINE} />
        </clipPath>
      </defs>
      <path d={OUTLINE} fill={`url(#${id}foil)`} stroke="#b9c2d8" strokeWidth="1.5" />
      <g clipPath={`url(#${id}clip)`}>
        <rect width="200" height="200" fill={`url(#${id}lines)`} />
        <rect width="200" height="200" fill={`url(#${id}glow)`} />
        <g className={styles.sheen}>
          <rect x="-40" y="-20" width="60" height="240" fill={`url(#${id}sheen)`} transform="rotate(20 100 100)" />
        </g>
      </g>
      <circle cx="100" cy="100" r="70" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.9" />
      <circle cx="100" cy="100" r="64" fill="none" stroke="#7c5cd6" strokeWidth="1" opacity="0.5" strokeDasharray="2 4" />
      <path d="M78 74l14 13 30-30" fill="none" stroke="#4c2fb0" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 -6)" />
      <text x="100" y="112" textAnchor="middle" fontFamily="var(--font-display), Arial, sans-serif" fontWeight="800" fontSize="17" letterSpacing="1" fill="#3b2391">
        {top}
      </text>
      {bottom && (
        <text x="100" y="133" textAnchor="middle" fontFamily="var(--font-display), Arial, sans-serif" fontWeight="800" fontSize="17" letterSpacing="1" fill="#3b2391">
          {bottom}
        </text>
      )}
      <text x="100" y="152" textAnchor="middle" fontFamily="var(--font-display), Arial, sans-serif" fontWeight="700" fontSize="10" letterSpacing="2" fill="#5b45b8">
        ★ BITLAB ★
      </text>
    </svg>
  );
}
