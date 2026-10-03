import { PageLayout } from '@/components/layout/PageLayout';
import { ButtonLink } from '@/components/ui/Button';
import { useT } from '@/hooks/useT';

export default function NotFoundPage() {
  const t = useT();
  return (
    <PageLayout eyebrow="404" title={t('notFound.title')} subtitle={t('notFound.body')}>
      <ButtonLink to="/" variant="ghost">
        {t('notFound.back')}
      </ButtonLink>
    </PageLayout>
  );
}
