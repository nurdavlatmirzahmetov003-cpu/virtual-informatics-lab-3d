/**
 * Bit's panel (0.37): docked to the screen side Bit lives on (desktop: a
 * full-height side panel the page makes room for; phone: a bottom sheet),
 * with Bit's talking face in the header, the conversation, quick requests,
 * the tour / lesson stepper, typing and the microphone. Minimising keeps it
 * mounted but hidden, so speech, listening and tours go on; touching a 3D
 * scene folds it away by itself.
 */
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ChevronRight, Headphones, Mic, MicOff, Minus, Send, Square, Trash2, Volume2, VolumeX, X } from 'lucide-react';
import { BRAND } from '@/config/brand';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { useBitStore } from '@/store/bitStore';
import { LESSON_STEPS, TOUR_STOPS } from '@/services/bit/lessons';
import { sectionById } from '@/services/bit/sections';
import { listen, sttSupported, type Listener } from '@/services/bit/speech';
import { recordRequest, recordingSupported, type Recording } from '@/services/bit/recorder';
import { bitVoice, useVoiceStore } from '@/services/bit/voice';
import { BitFace, type BitMood } from './BitFace';
import { useBitBrain } from './useBitBrain';
import styles from './Bit.module.css';

const ACTIONS = ['tour', 'open', 'lesson', 'build'] as const;
/** Wider than this the panel docks to the side and the page makes room for it. */
const DOCK_MIN_WIDTH = 900;

export default function BitPanel({ hidden = false }: { hidden?: boolean }) {
  const t = useT();
  const { content, model, caps, voiceNote, handle, next, stopAll, language } = useBitBrain();
  const messages = useBitStore((s) => s.messages);
  const guide = useBitStore((s) => s.guide);
  const voice = useBitStore((s) => s.voice);
  const conversation = useBitStore((s) => s.conversation);
  const queued = useBitStore((s) => s.queued);
  const side = useBitStore((s) => s.dock.side);
  const speaking = useVoiceStore((s) => s.speaking);
  const [text, setText] = useState('');
  const [listening, setListening] = useState<false | 'browser' | 'server'>(false);
  const [transcribing, setTranscribing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const listener = useRef<Listener | null>(null);
  const recording = useRef<Recording | null>(null);
  const micLevel = useRef<HTMLSpanElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const pending = messages.some((m) => m.pending);
  // Kazakh is recognised far better by Gemini on the server; Russian and English by the browser (faster, free)
  const useServerEars = caps.stt && recordingSupported() && (language === 'kk' || !sttSupported());
  const canListen = useServerEars || sttSupported();

  const send = useCallback(
    (value: string) => {
      setNote(null);
      handle(value);
      setText('');
    },
    [handle],
  );

  const micError = useCallback(
    (code: string) => {
      if (code === 'not-allowed' || code === 'service-not-allowed' || code === 'denied') setNote(t('bit.micDenied'));
      else if (code === 'no-speech') setNote(t('bit.heardNothing'));
      else if (code === 'stt-429') setNote(t('bit.busy'));
      else if (code.startsWith('stt')) setNote(t('bit.sttFailed'));
    },
    [t],
  );

  const startListening = useCallback(() => {
    if (listener.current || recording.current) return;
    stopAll();
    setNote(null);
    // always the site language: Bit never switches it, whatever is spoken
    if (useServerEars) {
      const level = (v: number) => micLevel.current?.style.setProperty('--lvl', String(v));
      const r = recordRequest(language, level);
      recording.current = r;
      setListening('server');
      void r.result
        .then((said) => {
          if (said) send(said);
          else setNote(t('bit.heardNothing'));
        })
        .catch((e: Error) => micError(e.message))
        .finally(() => {
          recording.current = null;
          setListening(false);
          setTranscribing(false);
        });
      return;
    }
    const l = listen(language, {
      onInterim: (s) => setText(s),
      onFinal: (s) => send(s),
      onError: micError,
      onEnd: () => {
        listener.current = null;
        setListening(false);
      },
    });
    listener.current = l;
    setListening(l ? 'browser' : false);
  }, [language, micError, send, stopAll, t, useServerEars]);

  const stopListening = useCallback(() => {
    if (recording.current) {
      setTranscribing(true);
      recording.current.stop();
    }
    listener.current?.stop();
  }, []);

  // hands-free: listen again once Bit has finished speaking
  useEffect(
    () =>
      bitVoice.onIdle(() => {
        const s = useBitStore.getState();
        if (s.conversation && (s.open || s.mini) && canListen) window.setTimeout(startListening, 250);
      }),
    [canListen, startListening],
  );

  // a request sent with openBit('…') or send('…') (the robot, a page, the mini avatar) runs once the texts are here
  useEffect(() => {
    if (!content || !queued) return;
    const timer = window.setTimeout(() => {
      const q = useBitStore.getState().takeQueued();
      if (q) send(q);
    });
    return () => window.clearTimeout(timer);
  }, [content, queued, send]);

  useEffect(() => {
    if (hidden) return;
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' });
  }, [messages, guide, hidden]);

  useEffect(() => {
    if (!hidden) input.current?.focus();
  }, [hidden]);

  useEffect(
    () => () => {
      listener.current?.abort();
      recording.current?.cancel();
    },
    [],
  );

  // desktop: the page makes room for the docked panel
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      if (!hidden && window.innerWidth >= DOCK_MIN_WIDTH) root.dataset.bitDock = side;
      else delete root.dataset.bitDock;
    };
    apply();
    window.addEventListener('resize', apply);
    return () => {
      window.removeEventListener('resize', apply);
      delete root.dataset.bitDock;
    };
  }, [hidden, side]);

  // working in a 3D scene: Bit steps aside (keeps talking, folded to its avatar)
  useEffect(() => {
    if (hidden) return;
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element | null)?.tagName === 'CANVAS' && !listener.current && !recording.current) useBitStore.getState().minimize();
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [hidden]);

  const close = () => {
    stopAll();
    listener.current?.abort();
    recording.current?.cancel();
    useBitStore.getState().close();
  };
  const minimize = () => useBitStore.getState().minimize();

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
  const mood: BitMood = listening ? 'listening' : speaking ? 'speaking' : pending || transcribing ? 'thinking' : 'idle';
  const status = model === 'checking' ? t('bit.checking') : model === 'online' ? t('bit.online') : t('bit.offline');

  return (
    <section
      className={styles.panel}
      data-side={side}
      hidden={hidden}
      role="dialog"
      aria-modal="false"
      aria-labelledby="bit-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') minimize();
      }}
    >
      <header className={styles.head}>
        <span className={styles.avatar} data-mood={mood}>
          <BitFace size={46} live={speaking} mood={mood} />
        </span>
        <div className={styles.who}>
          <h2 id="bit-title">{t('bit.name')}</h2>
          <span className={styles.status} data-model={model}>
            {listening ? t('bit.listening') : transcribing ? t('bit.understanding') : pending ? t('bit.thinking') : status}
          </span>
          {caps.tts && <span className={styles.voiceBadge}>{t('bit.geminiVoice')}</span>}
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
          <button type="button" className={styles.tool} onClick={minimize} title={t('bit.minimize')} aria-label={t('bit.minimize')}>
            <Minus size={18} />
          </button>
          <button type="button" className={styles.tool} onClick={close} title={t('bit.close')} aria-label={t('bit.close')}>
            <X size={18} />
          </button>
        </div>
      </header>

      <div className={styles.messages} ref={list} aria-live="polite">
        {content && messages.length === 0 && (
          <div className={styles.welcome}>
            <div className={styles.row} data-role="bit">
              <p className={styles.bubble} data-role="bit">
                {content.say.greet.replace('{brand}', BRAND.name)}
              </p>
            </div>
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
          <button
            type="button"
            className={styles.mic}
            data-on={listening || undefined}
            data-busy={transcribing || undefined}
            onClick={listening ? stopListening : startListening}
            title={listening ? t('bit.stopListening') : t('bit.listen')}
            aria-label={listening ? t('bit.stopListening') : t('bit.listen')}
          >
            <span ref={micLevel} className={styles.micLevel} aria-hidden="true" />
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
