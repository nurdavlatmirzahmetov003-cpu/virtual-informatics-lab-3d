import { useEffect } from 'react';
import { TaskGuide, type DemoStep } from '@/components/lab/TaskGuide';
import { guideEl, pressGuide } from '@/components/lab/guideDom';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { ALGORITHMS, ALGORITHM_IDS, isQuizId, type AlgorithmId, type QuizId } from '@/labs/AlgorithmLab';
import { QuizSection } from './QuizSection';
import { Visualizer } from './Visualizer';
import styles from './AlgorithmLab.module.css';

const tk = (key: string) => key as TranslationKey;
const isAlgorithm = (v: unknown): v is AlgorithmId => ALGORITHM_IDS.includes(v as AlgorithmId);

export default function AlgorithmLabPage() {
  const t = useT();
  useDocumentTitle(t('labs.modules.algorithms.title'));
  const [params, setParams] = useSearchParams();
  // ?task= is the link format of the earlier version of this lab
  const raw = params.get('algo') ?? params.get('task');
  const algo: AlgorithmId = isAlgorithm(raw) ? raw : 'bubble';
  const rawQuiz = params.get('quiz');
  const quiz: QuizId = isQuizId(rawQuiz) ? rawQuiz : 'nextSwap';
  const { hash } = useLocation();
  // links from the assignment list open the quiz section directly
  useEffect(() => {
    if (hash === '#quiz') document.getElementById('quiz')?.scrollIntoView({ block: 'start' });
  }, [hash]);
  const set = (next: { algo?: AlgorithmId; quiz?: QuizId }) => setParams({ algo: next.algo ?? algo, quiz: next.quiz ?? quiz }, { replace: true, preventScrollReset: true });

  // V4 §5.3: the first algorithm (bubble sort), shown by pressing the player's own buttons
  const algoDemo = (): DemoStep[] => [
    { say: t('labGuide.algorithms.s1'), target: guideEl('canvas') },
    { say: t('labGuide.algorithms.s2'), target: guideEl('play'), run: pressGuide('play'), hold: 4200 },
    { say: t('labGuide.algorithms.s3'), target: guideEl('canvas'), run: pressGuide('play'), hold: 1200 },
    { say: t('labGuide.algorithms.s4'), target: guideEl('forward'), run: pressGuide('forward') },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{t('algorithms.ui.eyebrow')}</span>
        <h1>{t('labs.modules.algorithms.title')}</h1>
        <p>{t('algorithms.ui.intro')}</p>
      </header>

      <nav className={styles.tabs} aria-label={t('algorithms.ui.choose')}>
        {ALGORITHM_IDS.map((id, i) => (
          <button key={id} type="button" className={styles.tab} aria-pressed={id === algo} onClick={() => set({ algo: id })}>
            <span className={styles.tabIndex}>{String(i + 1).padStart(2, '0')}</span>
            <b>{t(tk(`algorithms.names.${id}`))}</b>
            <small>
              {t(tk(`algorithms.short.${id}`))} · {ALGORITHMS[id].complexity}
            </small>
          </button>
        ))}
      </nav>

      <TaskGuide
        id={`algorithms:${algo}`}
        title={t(tk(`algorithms.names.${algo}`))}
        text={t('labGuide.algoText', { short: t(tk(`algorithms.short.${algo}`)) })}
        demo={algo === 'bubble' ? algoDemo : undefined}
        onDemoEnd={pressGuide('reset')}
      />
      <Visualizer key={algo} id={algo} />
      <QuizSection quiz={quiz} onQuiz={(q) => set({ quiz: q })} />
    </div>
  );
}
