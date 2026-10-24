import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '@/components/brand/BrandMark';
import styles from './Auth.module.css';

/** Bits drifting up behind the card: positions and timings, fixed so every visit looks the same. */
const BITS = [
  { x: 6, d: 0, s: 19, c: '1' },
  { x: 14, d: 7, s: 23, c: '0' },
  { x: 23, d: 3, s: 17, c: '1' },
  { x: 35, d: 11, s: 25, c: '0' },
  { x: 62, d: 5, s: 21, c: '1' },
  { x: 71, d: 13, s: 18, c: '0' },
  { x: 80, d: 2, s: 24, c: '1' },
  { x: 91, d: 9, s: 20, c: '0' },
] as const;

/**
 * Background of the sign-in, class-join and password-reset pages (0.37):
 * slowly drifting brand-gradient light, a faint grid and rising bits behind a
 * glass card. All motion is CSS and stops under prefers-reduced-motion.
 */
export function AuthShell({ children, busy }: { children?: ReactNode; busy?: boolean }) {
  return (
    <div className={styles.page} aria-busy={busy || undefined}>
      <div className={styles.backdrop} aria-hidden="true">
        <span className={styles.glowA} />
        <span className={styles.glowB} />
        <span className={styles.glowC} />
        <span className={styles.grid} />
        {BITS.map((b) => (
          <span key={b.x} className={styles.bit} style={{ left: `${b.x}%`, animationDelay: `-${b.d}s`, animationDuration: `${b.s}s` }}>
            {b.c}
          </span>
        ))}
      </div>
      {children}
    </div>
  );
}

/** The logo at the top of an auth card; leads home. */
export function AuthLogo() {
  return (
    <Link to="/" className={styles.logo}>
      <BrandLogo size={34} />
    </Link>
  );
}
