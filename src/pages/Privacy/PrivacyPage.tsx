/**
 * `/privacy` (0.37): what BitLab keeps about a student, where, for how long
 * and who sees it — in plain words for children and parents. The texts are
 * in the locales (privacy.s1 … s8).
 */
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import styles from './Privacy.module.css';

const k = (s: string) => s as TranslationKey;
const SECTIONS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'] as const;

export default function PrivacyPage() {
  const t = useT();
  return (
    <PageLayout eyebrow={t('privacy.eyebrow')} title={t('privacy.title')} subtitle={t('privacy.subtitle')}>
      <div className={styles.doc}>
        {SECTIONS.map((s) => (
          <section key={s} className={styles.section}>
            <h2>{t(k(`privacy.${s}.h`))}</h2>
            <p>{t(k(`privacy.${s}.p`))}</p>
          </section>
        ))}
        <p className={styles.contact}>
          {t('privacy.contact')} <Link to="/feedback#contact">{t('footer.contact')}</Link>
        </p>
        <p className={styles.updated}>{t('privacy.updated')}</p>
      </div>
    </PageLayout>
  );
}
