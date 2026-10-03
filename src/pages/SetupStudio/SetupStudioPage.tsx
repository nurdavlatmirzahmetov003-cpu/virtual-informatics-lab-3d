import { lazy, type ComponentType } from 'react';
import { ArrowLeft, ArrowRight, Rotate3d, RotateCcw, Trash2 } from 'lucide-react';
import { SceneCanvas } from '@/components/3d/SceneCanvas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import { STUDIO_STEPS, useStudioStore, type StudioStep } from '@/store/studioStore';
import { ColorsStep } from './ColorsStep';
import { ProductsStep } from './ProductsStep';
import { StudioSummary } from './StudioSummary';
import { sk } from './studioText';
import { BudgetStep, PurposeStep, StyleStep } from './WizardSteps';
import styles from './SetupStudio.module.css';
import { SetupAssistant } from './SetupAssistant';

const StudioScene = lazy(() => import('@/scenes/SetupStudio/StudioScene'));

const STEP_VIEW: Record<StudioStep, ComponentType> = {
  purpose: PurposeStep,
  budget: BudgetStep,
  style: StyleStep,
  products: ProductsStep,
  colors: ColorsStep,
};

function Wizard() {
  const t = useT();
  const step = useStudioStore((s) => s.step);
  const setStep = useStudioStore((s) => s.setStep);
  const resetAll = useStudioStore((s) => s.resetAll);
  const index = STUDIO_STEPS.indexOf(step);
  const View = STEP_VIEW[step];
  const go = (d: number) => setStep(STUDIO_STEPS[Math.min(STUDIO_STEPS.length - 1, Math.max(0, index + d))]);

  return (
    <section className={styles.wizard} aria-labelledby="studio-title">
      <header className={styles.wizardHead}>
        <span className={styles.eyebrow}>{t('studio.eyebrow')}</span>
        <h1 id="studio-title" className={styles.title}>{t('studio.title')}</h1>
      </header>
      <SetupAssistant />
      <ol className={styles.stepper} aria-label={t('studio.steps.label')}>
        {STUDIO_STEPS.map((s, i) => (
          <li key={s}>
            <button type="button" aria-current={s === step ? 'step' : undefined} data-done={i < index} onClick={() => setStep(s)}>
              <span>{i + 1}</span>
              {t(sk(`steps.${s}`))}
            </button>
          </li>
        ))}
      </ol>
      <div className={styles.wizardBody}>
        <View />
      </div>
      <footer className={styles.wizardFoot}>
        <button type="button" className={styles.ghost} onClick={() => go(-1)} disabled={index === 0}>
          <ArrowLeft size={15} aria-hidden="true" />
          {t('studio.back')}
        </button>
        <button type="button" className={styles.iconGhost} onClick={resetAll} title={t('studio.reset')} aria-label={t('studio.reset')}>
          <Trash2 size={15} aria-hidden="true" />
        </button>
        <button type="button" className={styles.ghost} onClick={() => go(1)} disabled={index === STUDIO_STEPS.length - 1}>
          {t('studio.next')}
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </footer>
    </section>
  );
}

function ViewTools() {
  const t = useT();
  const autoRotate = useStudioStore((s) => s.autoRotate);
  const toggleAutoRotate = useStudioStore((s) => s.toggleAutoRotate);
  const resetCamera = useStudioStore((s) => s.resetCamera);
  return (
    <div className={styles.viewTools} role="toolbar" aria-label={t('studio.view.label')}>
      <button type="button" onClick={resetCamera} aria-label={t('studio.view.reset')}>
        <RotateCcw size={15} aria-hidden="true" />
        <span>{t('studio.view.reset')}</span>
      </button>
      <button type="button" onClick={toggleAutoRotate} aria-pressed={autoRotate} aria-label={t('studio.view.autoRotate')}>
        <Rotate3d size={15} aria-hidden="true" />
        <span>{t('studio.view.autoRotate')}</span>
      </button>
      <p className={styles.viewHint}>{t('studio.view.hint')}</p>
    </div>
  );
}

export default function SetupStudioPage() {
  const t = useT();
  useDocumentTitle(t('studio.title'));
  return (
    <div className={styles.stage}>
      <SceneCanvas initialCamera="STUDIO_WIDE" label={t('studio.sceneLabel')}>
        <StudioScene />
      </SceneCanvas>
      <div className={styles.overlay}>
        <Wizard />
        <StudioSummary />
        <ViewTools />
      </div>
    </div>
  );
}
