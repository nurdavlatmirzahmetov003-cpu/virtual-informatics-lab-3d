/**
 * Guided start for every lab task (V4 §5.3).
 *
 * - When a task opens, Bit greets the student inline above the workspace and
 *   says what the task is about (the speaker button reads it aloud).
 * - "Show me how" (the first task of each lab): a ghost cursor glides to each
 *   control, a ring highlights it, Bit narrates, and the step is done through
 *   the lab's own actions. The page is blocked meanwhile (Esc or "Stop" ends
 *   it), and at the end the task is reset so the student does it themselves.
 * - Afterwards a slim bar keeps "Show me again" at hand.
 * Reduced motion: the cursor jumps instead of gliding, nothing bounces.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MousePointer2, Play, Square, Volume2, X } from 'lucide-react';
import { BitFace } from '@/components/bit/BitFace';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { useT } from '@/hooks/useT';
import { bitVoice } from '@/services/bit/voice';
import { useBitStore } from '@/store/bitStore';
import styles from './TaskGuide.module.css';

export interface DemoStep {
  /** What the cursor points at (null: it stays where it is). */
  target?: () => Element | null;
  /** Bit's line for this step, already translated. */
  say: string;
  /** Done once the cursor has arrived (the lab's own actions). */
  run?: () => void;
  /** How long the step stays after `run`, ms. */
  hold?: number;
}

interface TaskGuideProps {
  /** Lab and task, e.g. "network:connect3": the welcome is shown once per session for it. */
  id: string;
  title: string;
  text: string;
  /** The step-by-step solution (the first task of a lab). */
  demo?: () => DemoStep[];
  /** Puts the task back to its start after the demo, so the student does it. */
  onDemoEnd?: () => void;
}

const SEEN = 'vil3d:guide-seen';

function seen(id: string) {
  try {
    return (JSON.parse(sessionStorage.getItem(SEEN) ?? '[]') as string[]).includes(id);
  } catch {
    return false;
  }
}

function markSeen(id: string) {
  try {
    const all = new Set(JSON.parse(sessionStorage.getItem(SEEN) ?? '[]') as string[]);
    all.add(id);
    sessionStorage.setItem(SEEN, JSON.stringify([...all]));
  } catch {
    /* blocked storage: Bit just greets again */
  }
}

const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

interface DemoView {
  index: number;
  total: number;
  say: string;
  cursor: { x: number; y: number } | null;
  ring: DOMRect | null;
  done: boolean;
}

export function TaskGuide({ id, title, text, demo, onDemoEnd }: TaskGuideProps) {
  const t = useT();
  const reduced = useReducedMotion();
  const voice = useBitStore((s) => s.voice);
  const [open, setOpen] = useState(() => !seen(id));
  const [view, setView] = useState<DemoView | null>(null);
  const run = useRef(0);

  const close = () => {
    markSeen(id);
    setOpen(false);
  };

  const stop = useCallback(() => {
    run.current++;
    bitVoice.stop();
    setView(null);
  }, []);

  const play = useCallback(async () => {
    if (!demo) return;
    markSeen(id);
    setOpen(false);
    const me = ++run.current;
    const steps = demo();
    let cursor: { x: number; y: number } | null = null;
    for (let i = 0; i < steps.length; i++) {
      if (run.current !== me) return;
      const step = steps[i];
      const el = step.target?.() ?? null;
      if (el) {
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
        await sleep(reduced ? 50 : 450);
        const r = el.getBoundingClientRect();
        cursor = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        setView({ index: i, total: steps.length, say: step.say, cursor, ring: r, done: false });
      } else {
        setView({ index: i, total: steps.length, say: step.say, cursor, ring: null, done: false });
      }
      if (voice) bitVoice.say(step.say);
      // the cursor glides there (CSS), then the step happens
      await sleep(reduced ? 300 : 1100);
      if (run.current !== me) return;
      step.run?.();
      await sleep(step.hold ?? 1600);
    }
    if (run.current !== me) return;
    const end = t('labGuide.yourTurn');
    setView({ index: steps.length - 1, total: steps.length, say: end, cursor: null, ring: null, done: true });
    if (voice) bitVoice.say(end);
    await sleep(2600);
    if (run.current !== me) return;
    onDemoEnd?.();
    setView(null);
  }, [demo, id, onDemoEnd, reduced, t, voice]);

  // Esc stops the demo
  useEffect(() => {
    if (!view) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && stop();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, stop]);
  useEffect(() => () => void run.current++, []);

  return (
    <>
      {open ? (
        <section className={styles.welcome} data-motion={!reduced || undefined} aria-label={t('labGuide.label')}>
          <span className={styles.face}>
            <BitFace size={46} mood="idle" />
          </span>
          <div className={styles.body}>
            <p className={styles.hello}>{t('labGuide.hello')}</p>
            <h2>{title}</h2>
            <p>{text}</p>
            <div className={styles.actions}>
              {demo && (
                <button type="button" className={styles.primary} onClick={() => void play()}>
                  <Play size={15} aria-hidden="true" /> {t('labGuide.showMe')}
                </button>
              )}
              <button type="button" className={demo ? styles.ghost : styles.primary} onClick={close}>
                {t('labGuide.start')}
              </button>
              <button type="button" className={styles.icon} onClick={() => bitVoice.say(`${title}. ${text}`)} title={t('labGuide.listen')} aria-label={t('labGuide.listen')}>
                <Volume2 size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
          <button type="button" className={styles.close} onClick={close} aria-label={t('labGuide.close')}>
            <X size={16} aria-hidden="true" />
          </button>
        </section>
      ) : (
        <div className={styles.bar}>
          <BitFace size={24} />
          <span>{t('labGuide.barHint')}</span>
          <button type="button" onClick={() => (demo ? void play() : setOpen(true))}>
            <MousePointer2 size={14} aria-hidden="true" /> {demo ? t('labGuide.again') : t('labGuide.whatToDo')}
          </button>
        </div>
      )}

      {view &&
        createPortal(
          // data-chrome: the lab-overlap check treats the demo layer like the site's own floating parts
          <div className={styles.layer} data-chrome="demo" data-motion={!reduced || undefined} role="dialog" aria-modal="true" aria-label={t('labGuide.demoLabel')}>
            {view.ring && <div className={styles.ring} style={{ left: view.ring.left - 6, top: view.ring.top - 6, width: view.ring.width + 12, height: view.ring.height + 12 }} aria-hidden="true" />}
            {view.cursor && (
              <svg className={styles.cursor} style={{ transform: `translate(${view.cursor.x}px, ${view.cursor.y}px)` }} width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 2 L4 19 L8.5 14.8 L11.6 21.5 L14.4 20.3 L11.3 13.7 L17.5 13.7 Z" />
              </svg>
            )}
            <div className={styles.narration} aria-live="polite">
              <BitFace size={40} live mood={view.done ? 'idle' : 'speaking'} />
              <div>
                <small>{view.done ? t('labGuide.yourTurnTitle') : t('labGuide.step', { n: view.index + 1, total: view.total })}</small>
                <p>{view.say}</p>
              </div>
              <button type="button" onClick={stop}>
                <Square size={13} aria-hidden="true" /> {t('labGuide.stop')}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
