/**
 * V4 §4.5: the subtitle of a robot's tip — the robot's name and what it
 * says, at the bottom of the screen while it speaks (and a few seconds for
 * reading). Always shown, sound or not; a click or Esc closes it.
 */
import { useEffect, useState, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import { robotById } from '@/data/robots/roster';
import type { TranslationKey } from '@/lib/i18n';
import { useT } from '@/hooks/useT';
import { useVoiceStore } from '@/services/bit/voice';
import { closeRobotTip, useRobotTip } from '@/services/robots/robotTips';
import styles from './RobotTipCaption.module.css';

export function RobotTipCaption() {
  const t = useT();
  const { robot, text, until } = useRobotTip();
  const reading = useVoiceStore((s) => s.speaking && s.owner === 'robot-tip');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!robot) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && closeRobotTip();
    document.addEventListener('keydown', esc);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('keydown', esc);
    };
  }, [robot]);

  if (!robot || (!reading && now > until)) return null;
  const accent = robotById(robot).accent;
  return (
    <div className={styles.tip} role="status" aria-live="polite" style={{ '--robot': accent } as CSSProperties}>
      <p>
        <b>{t('robots.tips.from', { name: t(`robots.list.${robot}.name` as TranslationKey) })}</b>
        {text}
      </p>
      <button type="button" className={styles.close} onClick={closeRobotTip} aria-label={t('menu.close')}>
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
