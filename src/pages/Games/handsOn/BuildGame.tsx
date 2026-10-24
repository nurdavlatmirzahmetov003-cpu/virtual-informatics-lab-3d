/**
 * «Build the phone» / «Build the laptop» (0.37): the teardown scene played
 * backwards. Every part starts out on the repair mat; the player picks the
 * part that goes in next — in 3D (its label) or from the tray below — and a
 * part that fits flies back into its place. The race rules
 * (labs/LiveGames/races, BUILD_GROUPS) decide what fits.
 */
import { lazy, Suspense, useEffect, useMemo } from 'react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { TEARDOWNS } from '@/data/teardown/teardowns';
import { BUILD_DEVICE, type BuildKind } from '@/labs/LiveGames/races';
import { createRig, publish, useRigSnapshot } from '@/scenes/Teardown/rig';
import type { HandsOnView } from './types';
import styles from './HandsOn.module.css';

const TeardownStage = lazy(() => import('@/scenes/Teardown/TeardownStage'));
const k = (s: string) => s as TranslationKey;
const collator = new Intl.Collator(['kk', 'ru', 'en']);

export default function BuildGame({ kind, state, move }: HandsOnView & { kind: BuildKind }) {
  const t = useT();
  const device = BUILD_DEVICE[kind];
  const order = TEARDOWNS[device].parts;
  const built = useMemo(() => state.built ?? [], [state.built]);
  const rig = useMemo(() => {
    const r = createRig(order.length);
    r.game = true;
    r.shown = r.goal = 1;
    r.rate = 0.7;
    // keyed in teardown order (XRay reads the parts by their teardown index)
    r.parts = Object.fromEntries(order.map((p) => [p, { shown: 1, goal: 1 }]));
    return r;
  }, [order]);
  const name = (p: string) => t(k(`teardown.${device}.parts.${p}.name`));

  // a part that went in flies back into its place
  useEffect(() => {
    for (const p of order) rig.parts![p].goal = built.includes(p) ? 0 : 1;
  }, [built, order, rig]);

  // a click on a part's label in 3D picks that part
  const snap = useRigSnapshot(rig);
  useEffect(() => {
    if (!snap.selected) return;
    const part = snap.selected;
    rig.selected = null;
    publish(rig);
    if (!built.includes(part)) move({ t: 'install', part });
  }, [snap.selected, rig, built, move]);

  // sorted by name, so the tray never hints at the order
  const tray = order.filter((p) => !built.includes(p)).sort((a, b) => collator.compare(name(a), name(b)));

  return (
    <div className={styles.game}>
      <div className={styles.stage}>
        <Suspense fallback={<span className={styles.loading} />}>
          <TeardownStage id={device} rig={rig} label={t(k(`games3d.${kind}.scene`))} />
        </Suspense>
      </div>
      <section className={styles.tray} aria-label={t('games3d.build.tray')}>
        <h3>{t('games3d.build.next')}</h3>
        <div className={styles.tiles}>
          {tray.map((p) => (
            <button key={p} type="button" className={styles.tile} onClick={() => move({ t: 'install', part: p })}>
              {name(p)}
            </button>
          ))}
        </div>
        {built.length > 0 && (
          <p className={styles.built}>
            {t('games3d.build.inside')}: {built.map(name).join(' → ')}
          </p>
        )}
      </section>
    </div>
  );
}
