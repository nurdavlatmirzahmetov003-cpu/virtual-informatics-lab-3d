import type { ReactNode } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './PageLayout.module.css';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children?: ReactNode;
}

/** Layout for content pages (non-fullscreen 3D). */
export function PageLayout({ title, subtitle, eyebrow, children }: PageLayoutProps) {
  useDocumentTitle(title);
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </header>
      {children}
    </div>
  );
}
