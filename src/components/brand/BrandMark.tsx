import { useId } from 'react';
import { BRAND } from '@/config/brand';
import styles from './BrandMark.module.css';

/**
 * The BitLab mark: a lowercase "b" — its bowl is a bit's "0", the coral dot
 * its "1" (and Bit the robot's eye) — on the site's sky → orchid gradient.
 * Same drawing as public/brand/logo.svg and public/favicon.svg.
 */
export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}g`} x1="6" y1="4" x2="60" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2fc8f2" />
          <stop offset="0.55" stopColor="#5f7bff" />
          <stop offset="1" stopColor="#a95cf5" />
        </linearGradient>
        <linearGradient id={`${id}d`} x1="40" y1="10" x2="52" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffc15c" />
          <stop offset="1" stopColor="#ff7a6b" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="17" fill={`url(#${id}g)`} />
      <rect x="2" y="2" width="60" height="30" rx="17" fill="#fff" opacity="0.1" />
      <path d="M22 13v35" stroke="#fff" strokeWidth="7" strokeLinecap="round" fill="none" />
      <circle cx="33.5" cy="37.5" r="10.5" stroke="#fff" strokeWidth="7" fill="none" />
      <path d="M22 26h7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
      <circle cx="45.5" cy="17.5" r="5.5" fill={`url(#${id}d)`} />
    </svg>
  );
}

/** Mark + wordmark ("Bit" bold, "Lab" in the accent gradient). */
export function BrandLogo({ size = 32, className, showName = true }: { size?: number; className?: string; showName?: boolean }) {
  const [a, b] = BRAND.wordmark;
  return (
    <span className={[styles.logo, className].filter(Boolean).join(' ')}>
      <BrandMark size={size} />
      {showName && (
        <span className={styles.word} style={{ fontSize: size * 0.62 }}>
          <span className={styles.bold}>{a}</span>
          <span className={styles.light}>{b}</span>
        </span>
      )}
    </span>
  );
}
