/**
 * «PC build race» (0.37): the Assembly Lab's 3D bench against the clock.
 * Parts are dragged onto their places in 3D as in the lab, or tapped in
 * the tray (then the part tries its own place — the order is still the
 * player's). Every drop is a move; the lab's own rules (AssemblyLab
 * `place`) referee it on the server too.
 */
import { lazy, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { SceneCanvas } from '@/components/3d/SceneCanvas';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { STEPS, STEP_IDS } from '@/labs/AssemblyLab';
import { useAssemblyLabStore } from '@/store/assemblyLabStore';
import type { HandsOnView } from './types';
import styles from './HandsOn.module.css';

const AssemblyLabScene = lazy(() => import('@/scenes/AssemblyLab/AssemblyLabScene'));
const k = (s: string) => s as TranslationKey;
const collator = new Intl.Collator(['kk', 'ru', 'en']);

export default function PcBuildGame({ move }: HandsOnView) {
  const t = useT();
  const sendRef = useRef(move);
  useEffect(() => {
    sendRef.current = move;
  }, [move]);
  useEffect(() => {
    useAssemblyLabStore.getState().playGame((step, at) => sendRef.current({ t: 'place', step, at }));
    return () => useAssemblyLabStore.getState().playGame(null);
  }, []);
  const installed = useAssemblyLabStore((s) => s.assembly.installed);
  const message = useAssemblyLabStore((s) => s.message);
  const name = (s: string) => t(k(`pcLab.steps.${s}.part`));
  const params: Record<string, string> = { ...message.params };
  if (params.missing) params.missing = params.missing.split(',').map(name).join(', ');
  if (params.where) params.where = t(k(`pcLab.steps.${params.where}.slot`));
  const parts = [...STEP_IDS].sort((a, b) => collator.compare(name(a), name(b)));

  return (
    <div className={styles.game}>
      <div className={`${styles.stage} ${styles.tall}`}>
        <SceneCanvas initialCamera="HOME_WIDE" label={t('games3d.pcbuild.scene')}>
          <AssemblyLabScene />
        </SceneCanvas>
      </div>
      <p className={styles.say} data-tone={message.tone} role="status" aria-live="polite">
        {t(k(message.key), params)}
      </p>
      <section className={styles.tray} aria-label={t('games3d.build.tray')}>
        <h3>{t('games3d.pcbuild.tray')}</h3>
        <div className={styles.tiles}>
          {parts.map((s) => {
            const done = installed.includes(s);
            return (
              <button key={s} type="button" className={styles.tile} data-state={done ? 'done' : 'idle'} disabled={done} onClick={() => useAssemblyLabStore.getState().drop(s, STEPS[s].target)}>
                {done && <Check size={14} aria-hidden="true" />}
                {name(s)}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
