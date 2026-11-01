/**
 * V4 §9: the big unlock moment. The medal spins in and flips, light rays turn
 * behind it and a shine sweeps across; Bit pops up and cheers (by voice when
 * Bit's voice is on). Also opens from the achievements page to look at a
 * badge (`replay`: no cheering). Reduced motion: a simple fade.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { BitFace } from '@/components/bit/BitFace';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { bitVoice } from '@/services/bit/voice';
import type { AchievementId } from '@/services/progress';
import { badgeXp, RARITY } from '@/services/progress/rarity';
import { ECONOMY } from '@/services/robots/economy';
import { useBitStore } from '@/store/bitStore';
import { useSettingsStore } from '@/store/settingsStore';
import { BadgeMedal } from './BadgeMedal';
import styles from './UnlockCeremony.module.css';

const tk = (key: string) => key as TranslationKey;

export function UnlockCeremony({ id, unlocked = true, target = 1, current, replay = false, onClose }: { id: AchievementId; unlocked?: boolean; target?: number; current?: number; replay?: boolean; onClose: () => void }) {
  const t = useT();
  const language = useSettingsStore((s) => s.language);
  const voice = useBitStore((s) => s.voice);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [calm] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const rarity = RARITY[id];
  const name = t(tk(`achievements.items.${id}.name`));
  const xp = badgeXp(id);
  const cheer = t('achievements.ceremony.cheer', { name });

  useEffect(() => {
    if (replay || !voice) return;
    bitVoice.setLanguage(language);
    bitVoice.say(cheer);
    return () => bitVoice.stop();
    // once per ceremony
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    closeBtn.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  return createPortal(
    <div className={styles.root} data-rarity={rarity} data-calm={calm || undefined} data-replay={replay || undefined} role="dialog" aria-modal="true" aria-label={name} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.card}>
        <button ref={closeBtn} type="button" className={styles.close} onClick={onClose} aria-label={t('achievements.toast.close')}>
          <X size={18} aria-hidden="true" />
        </button>
        <span className={styles.eyebrow}>{unlocked ? (replay ? t(tk(`achievements.rarity.${rarity}`)) : t('achievements.toast.eyebrow')) : t('progress.achievements.locked')}</span>
        <div className={styles.stage}>
          {unlocked && <span className={styles.rays} aria-hidden="true" />}
          <div className={styles.flip}>
            <BadgeMedal id={id} unlocked={unlocked} progress={unlocked ? undefined : (current ?? 0) / target} size={180} />
          </div>
          {unlocked && <span className={styles.shine} aria-hidden="true" />}
        </div>
        <span className={styles.rarity} data-rarity={rarity}>
          {t(tk(`achievements.rarity.${rarity}`))}
        </span>
        <h2 className={styles.name}>{name}</h2>
        <p className={styles.condition}>{t(tk(`achievements.items.${id}.condition`), { target })}</p>
        {!unlocked && current !== undefined && <p className={styles.progress}>{t('progress.achievements.progress', { current, target })}</p>}
        <p className={styles.reward}>
          +{xp} XP · +{Math.floor(xp / ECONOMY.xpPerCoin)} {t('achievements.coins')}
        </p>
        {unlocked && !replay && (
          <div className={styles.bit}>
            <span className={styles.face}>
              <BitFace size={44} live={voice} mood="speaking" />
            </span>
            <p>{cheer}</p>
          </div>
        )}
        {!replay && (
          <Link to="/achievements" className={styles.link} onClick={onClose}>
            {t('achievements.toast.open')} →
          </Link>
        )}
      </div>
    </div>,
    document.body,
  );
}
