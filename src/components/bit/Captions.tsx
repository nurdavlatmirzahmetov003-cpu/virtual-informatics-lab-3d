/**
 * Captions for Bit's voice (0.37): the sentence being spoken, at the
 * bottom of the screen, for students who cannot hear or do not have sound
 * on. Shown while Bit speaks when the «captions» option is on.
 */
import { useVoiceStore } from '@/services/bit/voice';
import styles from './Captions.module.css';

export function Captions() {
  const speaking = useVoiceStore((s) => s.speaking);
  const sentence = useVoiceStore((s) => s.sentence);
  if (!speaking || !sentence) return null;
  return (
    <div className={styles.captions} role="status" aria-live="polite">
      <p>{sentence}</p>
    </div>
  );
}
