import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import styles from '../shared/StatusPage.module.css';

export default function ProgressPage() {
  const t = useT();
  return (
    <PageLayout title={t('progress.title')} subtitle={t('progress.subtitle')}>
      <p className={styles.status}>{t('progress.empty')}</p>
    </PageLayout>
  );
}
