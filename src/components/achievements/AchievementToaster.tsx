import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { evaluateAchievements, summarize, type AchievementId } from '@/services/progress';
import { useProgressStore, type XpGain } from '@/store/progressStore';
import { LevelRing } from '@/components/game/GamePanel';
import { rankOf } from '@/services/game/xp';
import game from '@/components/game/Game.module.css';
import { ACHIEVEMENT_ICONS } from './achievementIcons';
import styles from './AchievementToaster.module.css';

const tk = (key: string) => key as TranslationKey;
const SHOW_MS = 6000;

function Toast({ id, onClose }: { id: AchievementId; onClose: () => void }) {
  const t = useT();
  const Icon = ACHIEVEMENT_ICONS[id];
  const [paused, setPaused] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const exercises = useProgressStore((s) => s.exercises);
  const attempts = useProgressStore((s) => s.attempts);
  const target = evaluateAchievements(summarize({ exercises }), attempts).find((a) => a.id === id)?.target ?? 1;

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => setLeaving(true), SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [paused]);

  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(onClose, 260);
    return () => window.clearTimeout(timer);
  }, [leaving, onClose]);

  return (
    <div
      className={styles.toast}
      data-leaving={leaving}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className={styles.icon} aria-hidden="true">
        <Icon size={22} strokeWidth={1.6} />
      </span>
      <div className={styles.text}>
        <span className={styles.eyebrow}>{t('achievements.toast.eyebrow')}</span>
        <strong>{t(tk(`achievements.items.${id}.name`))}</strong>
        <small>{t(tk(`achievements.items.${id}.condition`), { target })}</small>
        <Link to="/progress#achievements" className={styles.link} onClick={() => setLeaving(true)}>
          {t('achievements.toast.open')} →
        </Link>
      </div>
      <button type="button" className={styles.close} onClick={() => setLeaving(true)} aria-label={t('achievements.toast.close')}>
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

const GAIN_MS = 2600;

/** "+35 XP", or a level-up with the ring — quiet, a few seconds, no confetti. */
function GainToast({ gain, onClose }: { gain: XpGain; onClose: () => void }) {
  const t = useT();
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const a = window.setTimeout(() => setLeaving(true), gain.level ? GAIN_MS * 2 : GAIN_MS);
    return () => window.clearTimeout(a);
  }, [gain.level]);
  useEffect(() => {
    if (!leaving) return;
    const b = window.setTimeout(onClose, 260);
    return () => window.clearTimeout(b);
  }, [leaving, onClose]);
  return (
    <div className={game.gain} data-leaving={leaving}>
      {gain.level ? <LevelRing level={gain.level} progress={0.02} size={44} /> : null}
      <div>
        <strong>{gain.level ? t('game.toast.levelUp', { n: gain.level }) : `+${gain.xp} XP`}</strong>
        <small>{gain.level ? `+${gain.xp} XP · ${t(tk(`game.ranks.${rankOf(gain.level)}`))}` : t('game.toast.earned')}</small>
      </div>
    </div>
  );
}

/** Announces XP and newly unlocked achievements one at a time. Mounted once in the app shell. */
export function AchievementToaster() {
  const current = useProgressStore((s) => s.toasts[0]);
  const gain = useProgressStore((s) => s.gains[0]);
  const dismiss = useProgressStore((s) => s.dismissToast);
  const dismissGain = useProgressStore((s) => s.dismissGain);
  const onClose = useCallback(() => {
    if (current) dismiss(current);
  }, [current, dismiss]);
  const onGainClose = useCallback(() => {
    if (gain) dismissGain(gain.id);
  }, [gain, dismissGain]);

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {gain && <GainToast key={gain.id} gain={gain} onClose={onGainClose} />}
      {current && <Toast key={current} id={current} onClose={onClose} />}
    </div>
  );
}
