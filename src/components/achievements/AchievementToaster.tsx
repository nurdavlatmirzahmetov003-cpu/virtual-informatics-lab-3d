import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { evaluateAchievements, summarize, type AchievementId } from '@/services/progress';
import { useProgressStore } from '@/store/progressStore';
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
  const target = evaluateAchievements(summarize({ exercises })).find((a) => a.id === id)?.target ?? 1;

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

/** Announces newly unlocked achievements one at a time. Mounted once in the app shell. */
export function AchievementToaster() {
  const current = useProgressStore((s) => s.toasts[0]);
  const dismiss = useProgressStore((s) => s.dismissToast);
  const onClose = useCallback(() => {
    if (current) dismiss(current);
  }, [current, dismiss]);

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {current && <Toast key={current} id={current} onClose={onClose} />}
    </div>
  );
}
