import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import { BrandMark } from '@/components/brand/BrandMark';
import { BRAND } from '@/config/brand';
import styles from './PageLayout.module.css';

/** Links every content page ends with (0.36): feedback, contact, certificate, games, credits. */
function Footer() {
  const t = useT();
  return (
    <footer className={styles.footer}>
      <span className={styles.footBrand}>
        <BrandMark size={22} /> {BRAND.name}
      </span>
      <nav aria-label={t('app.short')}>
        <Link to="/feedback">{t('footer.feedback')}</Link>
        <Link to="/feedback#contact">{t('footer.contact')}</Link>
        <Link to="/certificate">{t('footer.certificate')}</Link>
        <Link to="/games">{t('footer.games')}</Link>
        <Link to="/identify">{t('nav.identify')}</Link>
        <Link to="/path">{t('nav.path')}</Link>
        <Link to="/credits">{t('footer.credits')}</Link>
        <Link to="/privacy">{t('footer.privacy')}</Link>
      </nav>
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
