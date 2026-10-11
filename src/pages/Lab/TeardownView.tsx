/**
 * Full-screen teardown view (V2-5a): the 3D stage, an assembled ↔ taken
 * apart slider, step-by-step buttons, "take all apart / put back", and the
 * ordered parts list with the explanation of the current or chosen part.
 * Reduced motion: parts jump to their place instead of travelling.
 */
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, RotateCcw, X } from 'lucide-react';
import { TEARDOWNS, type TeardownId } from '@/data/teardown/teardowns';
import { stepValue } from '@/lib/teardown/timeline';
import type { TranslationKey } from '@/lib/i18n';
import { useT } from '@/hooks/useT';
import { createRig, publish, useRigSnapshot } from '@/scenes/Teardown/rig';
import styles from './TeardownView.module.css';

const TeardownStage = lazy(() => import('@/scenes/Teardown/TeardownStage'));
const key = (k: string) => k as TranslationKey;
/** Seconds one part takes to come out. */
const PART_SECONDS = 1.1;

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
  const closeBtn = useRef<HTMLButtonElement>(null);

  const go = (g: number) => {
    rig.goal = g;
    rig.selected = null; // the panel follows the moving part
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
          <span className={styles.ends} aria-hidden="true">
            <span>{t('teardown.ui.assembled')}</span>
            <span>{t('teardown.ui.apart')}</span>
          </span>
        </label>
        <div className={styles.buttons}>
          <button type="button" onClick={() => go(stepValue(k - 1, n))} disabled={k <= 0}>
            <ChevronLeft size={16} aria-hidden="true" />
            {t('teardown.ui.prev')}
          </button>
          <span className={styles.step} aria-live="polite">
            {t('teardown.ui.step', { n: snap.step, total: n })}
          </span>
          <button type="button" onClick={() => go(stepValue(k + 1, n))} disabled={k >= n}>
            {t('teardown.ui.next')}
            <ChevronRight size={16} aria-hidden="true" />
          </button>
          <button type="button" className={styles.play} onClick={() => go(goal < 1 ? 1 : 0)}>
            {goal < 1 ? <Play size={15} aria-hidden="true" /> : <RotateCcw size={15} aria-hidden="true" />}
            {goal < 1 ? t('teardown.ui.playApart') : t('teardown.ui.playAssemble')}
          </button>
        </div>
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
        <p className={styles.intro}>{t(key(`${base}.intro`))}</p>
        {id === 'laptop' && <p className={styles.note}>{t('teardown.ui.placeholder')}</p>}

        <section className={styles.current} aria-live="polite">
          {current ? (
            <>
              <h3>
                <span className={styles.badge}>{parts.indexOf(current) + 1}</span>
                {t(key(`${base}.parts.${current}.name`))}
              </h3>
              <p>{t(key(`${base}.parts.${current}.text`))}</p>
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
                {t(key(`${base}.parts.${p}.name`))}
              </button>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
