import type { LucideIcon } from 'lucide-react';
import { Boxes, BrainCircuit, ClipboardCheck, Cpu, FlaskConical, Network, Trophy, Workflow, Wrench } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import styles from './LabsPage.module.css';

type ModuleId = 'hardware' | 'assembly' | 'network' | 'algorithms' | 'logic' | 'experiments' | 'studio' | 'assignments' | 'results';

/** Module registry for the hub; `phase` is when it becomes interactive. */
const MODULES: ReadonlyArray<{ id: ModuleId; icon: LucideIcon; phase: number }> = [
  { id: 'hardware', icon: Cpu, phase: 3 },
  { id: 'assembly', icon: Wrench, phase: 3 },
  { id: 'network', icon: Network, phase: 7 },
  { id: 'algorithms', icon: Workflow, phase: 7 },
  { id: 'logic', icon: BrainCircuit, phase: 7 },
  { id: 'experiments', icon: FlaskConical, phase: 7 },
  { id: 'studio', icon: Boxes, phase: 4 },
  { id: 'assignments', icon: ClipboardCheck, phase: 8 },
  { id: 'results', icon: Trophy, phase: 8 },
];

export default function LabsPage() {
  const t = useT();
  return (
    <PageLayout title={t('labs.title')} subtitle={t('labs.subtitle')}>
      <ol className={styles.list}>
        {MODULES.map(({ id, icon: Icon, phase }, i) => (
          <li key={id} className={styles.item} aria-disabled="true">
            <span className={styles.index}>{String(i + 1).padStart(2, '0')}</span>
            <Icon className={styles.icon} size={22} strokeWidth={1.5} aria-hidden="true" />
            <div className={styles.text}>
              <h2 className={styles.name}>{t(`labs.modules.${id}.title`)}</h2>
              <p className={styles.desc}>{t(`labs.modules.${id}.desc`)}</p>
            </div>
            <span className={styles.status}>
              {t('labs.planned')} · {t('labs.phase', { n: phase })}
            </span>
          </li>
        ))}
      </ol>
    </PageLayout>
  );
}
