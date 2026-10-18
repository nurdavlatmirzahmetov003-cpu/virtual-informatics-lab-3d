/**
 * Bit's chat panel: the conversation, quick requests, the tour / lesson
 * stepper, typing and the microphone. Loaded on the first open.
 */
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ChevronRight, Headphones, Mic, MicOff, Send, Square, Trash2, Volume2, VolumeX, X } from 'lucide-react';
import { BRAND } from '@/config/brand';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { useBitStore } from '@/store/bitStore';
import { LESSON_STEPS, TOUR_STOPS } from '@/services/bit/lessons';
import { sectionById } from '@/services/bit/sections';
import { listen, sttSupported, type Listener } from '@/services/bit/speech';
import { BitFace } from './BitFace';
import { useBitBrain } from './useBitBrain';
import styles from './Bit.module.css';

const ACTIONS = ['tour', 'open', 'lesson', 'build'] as const;

export default function BitPanel() {
  const t = useT();
  const { content, model, voiceNote, handle, next, stopAll, speaker, language } = useBitBrain();
  const messages = useBitStore((s) => s.messages);
  const guide = useBitStore((s) => s.guide);
  const voice = useBitStore((s) => s.voice);
  const conversation = useBitStore((s) => s.conversation);
  const queued = useBitStore((s) => s.queued);
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const listener = useRef<Listener | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const canListen = sttSupported();

  const send = useCallback(
    (value: string) => {
      setNote(null);
      handle(value);
      setText('');
    },
    [handle],
  );

  const startListening = useCallback(() => {
    if (listener.current) return;
    stopAll();
    setNote(null);
    // always the site language: Bit never switches it, whatever is spoken
    const l = listen(language, {
      onInterim: (s) => setText(s),
      onFinal: (s) => send(s),
      onError: (code) => {
        if (code === 'not-allowed' || code === 'service-not-allowed') setNote(t('bit.micDenied'));
        else if (code === 'no-speech') setNote(t('bit.heardNothing'));
      },
      onEnd: () => {
        listener.current = null;
        setListening(false);
      },
    });
    listener.current = l;
    setListening(!!l);
  }, [language, send, stopAll, t]);

  const stopListening = useCallback(() => {
    listener.current?.stop();
  }, []);

  // hands-free: listen again once Bit has finished speaking
  useEffect(() => {
    const s = speaker.current;
    if (!s) return;
    s.onIdle = () => {
      if (useBitStore.getState().conversation && useBitStore.getState().open && canListen) startListening();
    };
    return () => {
      s.onIdle = null;
    };
  }, [canListen, speaker, startListening, content]);

  // a request sent with openBit('…') (the robot, a page button) runs once the texts are here
  useEffect(() => {
    if (!content || !queued) return;
    // after this render: sending updates the panel's own state
    const timer = window.setTimeout(() => {
      const q = useBitStore.getState().takeQueued();
      if (q) send(q);
    });
    return () => window.clearTimeout(timer);
  }, [content, queued, send]);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' });
  }, [messages, guide]);

  useEffect(() => {
    input.current?.focus();
    return () => listener.current?.abort();
  }, []);

  const close = () => {
    stopAll();
    listener.current?.abort();
    useBitStore.getState().close();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim()) send(text);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) send(text);
    }
  };

  const guideLabel =
    guide?.kind === 'tour'
      ? `${t('bit.tour')} · ${t('bit.step', { n: guide.index + 1, total: TOUR_STOPS.length })}`
      : guide
        ? `${t('bit.lesson', { name: t(sectionById(guide.lesson)!.nameKey as TranslationKey) })} · ${t('bit.step', { n: guide.index + 1, total: LESSON_STEPS })}`
        : '';

  return (
    <section
      className={styles.panel}
      role="dialog"
      aria-modal="false"
      aria-labelledby="bit-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') close();
      }}
    >
      <header className={styles.head}>
        <span className={styles.avatar} data-state={listening ? 'listening' : model}>
          <BitFace size={34} />
        </span>
        <div className={styles.who}>
          <h2 id="bit-title">{t('bit.name')}</h2>
          <span className={styles.status} data-model={model}>
            {model === 'checking' ? t('bit.checking') : model === 'online' ? t('bit.online') : t('bit.offline')}
          </span>
        </div>
        <div className={styles.tools}>
          <button type="button" className={styles.tool} aria-pressed={voice} onClick={() => (voice ? (stopAll(), useBitStore.getState().setVoice(false)) : useBitStore.getState().setVoice(true))} title={voice ? t('bit.voiceOn') : t('bit.voiceOff')} aria-label={voice ? t('bit.voiceOn') : t('bit.voiceOff')}>
            {voice ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          {canListen && (
            <button type="button" className={styles.tool} aria-pressed={conversation} disabled={!voice} onClick={() => useBitStore.getState().setConversation(!conversation)} title={conversation ? t('bit.conversationOn') : t('bit.conversationOff')} aria-label={conversation ? t('bit.conversationOn') : t('bit.conversationOff')}>
              <Headphones size={17} />
            </button>
          )}
          <button type="button" className={styles.tool} onClick={() => (stopAll(), useBitStore.getState().clear())} title={t('bit.clear')} aria-label={t('bit.clear')}>
            <Trash2 size={17} />
          </button>
          <button type="button" className={styles.tool} onClick={close} title={t('bit.close')} aria-label={t('bit.close')}>
            <X size={18} />
          </button>
        </div>
      </header>

      <div className={styles.messages} ref={list} aria-live="polite">
        {content && messages.length === 0 && (
          <div className={styles.welcome}>
            <p className={styles.bubble} data-role="bit">
              {content.say.greet.replace('{brand}', BRAND.name)}
            </p>
            <span className={styles.hint}>{t('bit.try')}</span>
            <div className={styles.chips}>
              {ACTIONS.map((a) => (
                <button key={a} type="button" className={styles.chip} data-kind="action" onClick={() => send(t(`bit.actions.${a}` as TranslationKey))}>
                  {t(`bit.actions.${a}` as TranslationKey)}
                </button>
              ))}
              {content.starters.map((id) => (
                <button key={id} type="button" className={styles.chip} onClick={() => send(content.faq[id].q)}>
                  {content.faq[id].q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={styles.row} data-role={m.role}>
            <p className={styles.bubble} data-role={m.role} data-error={m.error || undefined}>
              {m.text || (m.pending ? <span className={styles.dots} aria-label={t('bit.thinking')} /> : null)}
            </p>
            {m.role === 'bit' && !m.pending && (m.source === 'faq' || m.source === 'ai') && <span className={styles.source}>{m.source === 'faq' ? t('bit.sourceFaq') : t('bit.sourceAi')}</span>}
          </div>
        ))}
      </div>

      {guide && (
        <div className={styles.guide}>
          <span>{guideLabel}</span>
          <button type="button" className={styles.next} onClick={next}>
            {t('bit.next')} <ChevronRight size={16} aria-hidden="true" />
          </button>
          <button type="button" className={styles.tool} onClick={() => (stopAll(), useBitStore.getState().setGuide(null))} title={t('bit.stopGuide')} aria-label={t('bit.stopGuide')}>
            <Square size={14} />
          </button>
        </div>
      )}

      {(note || (voice && voiceNote)) && <p className={styles.note}>{note ?? (voiceNote === 'approx' ? t('bit.voiceApprox') : t('bit.noVoice'))}</p>}

      <form className={styles.compose} onSubmit={onSubmit}>
        <textarea
          ref={input}
          className={styles.input}
          rows={1}
          value={text}
          maxLength={600}
          placeholder={listening ? t('bit.listening') : t('bit.placeholder')}
          aria-label={t('bit.placeholder')}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {canListen ? (
          <button type="button" className={styles.mic} data-on={listening || undefined} onClick={listening ? stopListening : startListening} title={listening ? t('bit.stopListening') : t('bit.listen')} aria-label={listening ? t('bit.stopListening') : t('bit.listen')}>
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        ) : (
          <button type="button" className={styles.mic} onClick={() => setNote(t('bit.noMic'))} title={t('bit.noMic')} aria-label={t('bit.listen')} data-off>
            <MicOff size={18} />
          </button>
        )}
        <button type="submit" className={styles.send} disabled={!text.trim()} title={t('bit.send')} aria-label={t('bit.send')}>
          <Send size={17} />
        </button>
      </form>
    </section>
  );
}
