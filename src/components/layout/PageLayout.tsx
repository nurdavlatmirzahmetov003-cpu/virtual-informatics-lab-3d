import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import { BrandMark } from '@/components/brand/BrandMark';
import { BRAND } from '@/config/brand';
import { SITE_LINK_GROUPS } from './siteLinks';
import styles from './PageLayout.module.css';

/** Links every content page ends with (0.36), in the side menu's groups (V4 §7). */
function Footer() {
  const t = useT();
  return (
    <footer className={styles.footer}>
      <span className={styles.footBrand}>
        <BrandMark size={26} /> {BRAND.name}
      </span>
      <div className={styles.footGroups}>
        {SITE_LINK_GROUPS.map((g) => (
          <nav key={g.id} className={styles.footGroup} aria-label={t(g.title)}>
            <h2 className={styles.footTitle}>{t(g.title)}</h2>
            <ul>
              {g.links.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <Link to={to}>
                    <Icon size={16} aria-hidden="true" />
                    {t(label)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  );
}

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
      <Footer />
    </div>
  );
}
