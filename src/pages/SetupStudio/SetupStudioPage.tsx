import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import styles from '../shared/StatusPage.module.css';

export default function SetupStudioPage() {
  const t = useT();
  return (
    <PageLayout title={t('studio.title')} subtitle={t('studio.subtitle')}>
      <p className={styles.status}>{t('studio.status')}</p>
    </PageLayout>
  );
}
