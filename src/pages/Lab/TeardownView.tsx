/**
 * Full-screen teardown view (V2-5a/b): the 3D stage, an assembled ↔ taken
 * apart slider with step dots, step-by-step buttons, "take all apart / put
 * back", a demo print for the 3D printer, and a side panel with two tabs —
 * the parts (current part: what it does and how it comes out; the ordered
 * list) and the graded "What does this part do?" task.
 * Reduced motion: parts jump to their place instead of travelling.
 */
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Printer, RotateCcw, Square, X } from 'lucide-react';
import { TEARDOWNS, type TeardownId } from '@/data/teardown/teardowns';
import { teardownExercise, teardownQuestions } from '@/data/teardown/teardownQuiz';
import { stepValue } from '@/lib/teardown/timeline';
import type { TranslationKey } from '@/lib/i18n';
import { useT } from '@/hooks/useT';
import { QuizForm } from '@/components/quiz/QuizForm';
import { useProgressStore } from '@/store/progressStore';
import { createRig, publish, useRigSnapshot, type TeardownRig } from '@/scenes/Teardown/rig';
import styles from './TeardownView.module.css';

const TeardownStage = lazy(() => import('@/scenes/Teardown/TeardownStage'));
const key = (k: string) => k as TranslationKey;
/** Seconds one part takes to come out. */
const PART_SECONDS = 1.1;
/** Teardowns built from licensed models (the 3D printer is still a procedural placeholder). */
const LICENSED: readonly TeardownId[] = ['system_unit', 'laptop', 'smartphone', 'tablet', 'all_in_one'];

type Tab = 'parts' | 'task';

function TaskTab({ id }: { id: TeardownId }) {
  const t = useT();
  const exercise = useMemo(() => teardownExercise(id), [id]);
  const questions = useMemo(
    () =>
      teardownQuestions(id).map((q) => ({
        prompt: `teardown.${id}.parts.${q.part}.ask`,
        options: q.options.map((p) => `teardown.${id}.parts.${p}.does`),
        correct: q.correct,
        explain: `teardown.${id}.parts.${q.part}.text`,
      })),
    [id],
  );
  return (
    <div className={styles.task}>
      <p className={styles.muted}>{t('teardown.ui.quizIntro')}</p>
      <QuizForm key={exercise.id} questions={questions} exercise={exercise} />
    </div>
  );
}

function PrintControls({ rig, assembled, printing, percent }: { rig: TeardownRig; assembled: boolean; printing: boolean; percent: number }) {
  const t = useT();
  return (
    <div className={styles.print}>
      <button
        type="button"
        className={styles.printBtn}
        disabled={!assembled && !printing}
        title={assembled ? undefined : t('teardown.ui.printHint')}
        onClick={() => {
          if (printing) rig.print.active = false;
          else rig.print = { active: true, t: 0 };
          publish(rig);
        }}
      >
        {printing ? <Square size={14} aria-hidden="true" /> : <Printer size={15} aria-hidden="true" />}
        {printing ? t('teardown.ui.printStop') : t('teardown.ui.print')}
      </button>
      <span className={styles.printStatus} aria-live="polite">
        {printing ? t('teardown.ui.printing', { p: percent }) : percent >= 99 ? t('teardown.ui.printDone') : !assembled ? t('teardown.ui.printHint') : ''}
      </span>
      {(printing || percent > 0) && (
        <span className={styles.printBar} aria-hidden="true">
          <span style={{ width: `${percent}%` }} />
        </span>
      )}
    </div>
  );
}

export function TeardownView({ id, onClose }: { id: TeardownId; onClose: () => void }) {
  const t = useT();
  const parts = TEARDOWNS[id].parts;
  const n = parts.length;
  const rig = useMemo(() => {
    const r = createRig(n);
    r.rate = 1 / (PART_SECONDS * n);
    return r;
  }, [n]);
  const snap = useRigSnapshot(rig);
  const [goal, setGoal] = useState(0);
  const [tab, setTab] = useState<Tab>('parts');
  const closeBtn = useRef<HTMLButtonElement>(null);
  const passed = useProgressStore((s) => s.exercises[`teardown:${id}`]?.best?.percent === 100);

  const go = (g: number) => {
    rig.goal = g;
    rig.selected = null; // the panel follows the moving part
    rig.print.active = false;
    publish(rig);
    setGoal(g);
  };
  const k = Math.round(goal * n);

  useEffect(() => {
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const current = snap.selected ?? (snap.active >= 0 ? parts[snap.active] : null);
  const base = `teardown.${id}`;
  const title = t(key(`${base}.title`));

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="teardown-title">
      <div className={styles.stage}>
        <Suspense fallback={<div className={styles.loading} aria-hidden="true" />}>
          <TeardownStage id={id} rig={rig} label={t('teardown.ui.sceneLabel', { name: title })} />
        </Suspense>
        <p className={styles.hint}>{t('teardown.ui.hint')}</p>
      </div>

      <div className={styles.controls}>
        <div className={styles.track}>
          <label className={styles.slider}>
            <span className={styles.sliderLabel}>{t('teardown.ui.slider')}</span>
            <input
              type="range"
              min={0}
              max={1000}
              value={Math.round(goal * 1000)}
              aria-valuetext={t('teardown.ui.step', { n: k, total: n })}
              onChange={(e) => {
                const v = Number(e.target.value) / 1000;
                rig.shown = v; // direct manipulation: no easing lag
                go(v);
              }}
            />
          </label>
          <ol className={styles.dots} aria-hidden="true">
            {parts.map((p, i) => (
              <li key={p} data-state={i < snap.step ? 'out' : i === snap.active ? 'moving' : 'in'} />
            ))}
          </ol>
          <span className={styles.ends} aria-hidden="true">
            <span>{t('teardown.ui.assembled')}</span>
            <span>{t('teardown.ui.apart')}</span>
          </span>
        </div>
        <div className={styles.buttons}>
          <button type="button" onClick={() => go(stepValue(k - 1, n))} disabled={k <= 0} aria-label={t('teardown.ui.prev')} title={t('teardown.ui.prev')}>
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <span className={styles.step} aria-live="polite">
            <strong>{snap.step}</strong>
            <span>/ {n}</span>
          </span>
          <button type="button" onClick={() => go(stepValue(k + 1, n))} disabled={k >= n} className={styles.next}>
            {t('teardown.ui.next')}
            <ChevronRight size={16} aria-hidden="true" />
          </button>
          <button type="button" className={styles.play} onClick={() => go(goal < 1 ? 1 : 0)}>
            {goal < 1 ? <Play size={15} aria-hidden="true" /> : <RotateCcw size={15} aria-hidden="true" />}
            {goal < 1 ? t('teardown.ui.playApart') : t('teardown.ui.playAssemble')}
          </button>
        </div>
        {id === 'printer_3d' && <PrintControls rig={rig} assembled={goal === 0 && snap.active === -1} printing={snap.printing} percent={snap.print} />}
      </div>

      <aside className={styles.side}>
        <header className={styles.head}>
          <div>
            <span className={styles.eyebrow}>{t('teardown.ui.title')}</span>
            <h2 id="teardown-title">{title}</h2>
          </div>
          <button ref={closeBtn} type="button" className={styles.close} onClick={onClose} aria-label={t('teardown.ui.close')} title={t('teardown.ui.close')}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.tabs} role="tablist">
          {(['parts', 'task'] as const).map((tb) => (
            <button key={tb} type="button" role="tab" aria-selected={tab === tb} onClick={() => setTab(tb)}>
              {t(`teardown.ui.tabs.${tb}`)}
              {tb === 'task' && passed ? ' ✓' : ''}
            </button>
          ))}
        </div>

        {tab === 'task' ? (
          <TaskTab id={id} />
        ) : (
          <>
            <p className={styles.intro}>{t(key(`${base}.intro`))}</p>
            {!LICENSED.includes(id) && <p className={styles.note}>{t('teardown.ui.placeholder')}</p>}
            {id === 'printer_3d' && (snap.printing || snap.print > 0) && <p className={styles.note}>{t('teardown.ui.printAbout')}</p>}

            <section className={styles.current} aria-live="polite">
              {current ? (
                <>
                  <h3>
                    <span className={styles.bigBadge}>{parts.indexOf(current) + 1}</span>
                    <span>{t(key(`${base}.parts.${current}.name`))}</span>
                  </h3>
                  <p className={styles.label}>{t('teardown.ui.does')}</p>
                  <p className={styles.does}>{t(key(`${base}.parts.${current}.does`))}</p>
                  <p className={styles.label}>{t('teardown.ui.how')}</p>
                  <p className={styles.text}>{t(key(`${base}.parts.${current}.text`))}</p>
                </>
              ) : (
                <p className={styles.muted}>{t('teardown.ui.start')}</p>
              )}
            </section>

            <h3 className={styles.listTitle}>{t('teardown.ui.parts')}</h3>
            <ol className={styles.list}>
              {parts.map((p, i) => (
                <li key={p}>
                  <button
                    type="button"
                    aria-current={current === p ? 'step' : undefined}
                    data-out={i < snap.step}
                    onClick={() => {
                      // take the part out if it is still inside, then show its explanation
                      const need = stepValue(i + 1, n);
                      if (goal < need) go(need);
                      rig.selected = p;
                      publish(rig);
                    }}
                  >
                    <span className={styles.badge}>{i + 1}</span>
                    <span className={styles.itemText}>
                      <span className={styles.itemName}>{t(key(`${base}.parts.${p}.name`))}</span>
                      <span className={styles.itemDoes}>{t(key(`${base}.parts.${p}.does`))}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </>
        )}
      </aside>
    </div>
  );
}
