/**
 * An information panel's text as Bit's speech (0.37): Bit's face beside a
 * speech bubble, "Read it with Bit" plays the text in Bit's voice and the
 * sentence being spoken lights up (karaoke). `more` is read after the bubble
 * (purpose, use…) without being repeated on screen.
 */
import { useId, useMemo } from 'react';
import { Square, Volume2 } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { bitVoice, sentencesOf, useVoiceStore } from '@/services/bit/voice';
import { BitFace } from './BitFace';
import styles from './BitSays.module.css';

export function BitSays({ text, more = [], className }: { text: string; more?: readonly string[]; className?: string }) {
  const t = useT();
  const id = useId();
  const sentences = useMemo(() => sentencesOf(text), [text]);
  const mine = useVoiceStore((s) => s.owner === id && s.speaking);
  const current = useVoiceStore((s) => (s.owner === id ? s.sentence : ''));
  // the voice speaks a few sentences at a time: light up every one in the piece being spoken
  const on = (s: string) => mine && current.includes(s);

  const play = () => {
    bitVoice.stop();
    useVoiceStore.setState({ owner: id });
    bitVoice.say([text, ...more].join(' '));
  };

  return (
    <div className={[styles.says, className].filter(Boolean).join(' ')} data-speaking={mine || undefined}>
      <span className={styles.face} aria-hidden="true">
        <BitFace size={40} live={mine} mood={mine ? 'speaking' : 'idle'} />
      </span>
      <div className={styles.bubble}>
        <span className={styles.who}>{t('bit.says')}</span>
        <p>
          {sentences.map((s, i) => (
            <span key={i} data-on={on(s) || undefined}>
              {s}{' '}
            </span>
          ))}
        </p>
        <button type="button" className={styles.play} onClick={mine ? () => bitVoice.stop() : play} aria-pressed={mine}>
          {mine ? <Square size={14} aria-hidden="true" /> : <Volume2 size={15} aria-hidden="true" />} {mine ? t('bit.stopPanel') : t('bit.listenPanel')}
        </button>
      </div>
    </div>
  );
}
