/**
 * Bit on every page (AppShell): a small talking avatar on a screen edge.
 * Drag it anywhere along either edge (remembered); a click opens the panel.
 * Folded away ("mini"), the conversation goes on: Bit keeps talking with
 * subtitles under its face, and a tour / lesson can step on from here.
 * The panel, its texts and the speech code load on the first open.
 */
import { lazy, Suspense, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ChevronRight, Maximize2, Square } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { useBitStore, type BitDock } from '@/store/bitStore';
import { bitVoice, useVoiceStore } from '@/services/bit/voice';
import { BitFace } from './BitFace';
import styles from './Bit.module.css';

const loadPanel = () => import('./BitPanel');
const BitPanel = lazy(loadPanel);

const SIZE = 56;
/** Moves under this many pixels are a click, not a drag. */
const DRAG_SLOP = 6;

/** Where the avatar sits for a dock, in px from the top of the window. */
function dockTop(dock: BitDock, viewport: number, top: number) {
  const min = top + 12;
  const max = viewport - SIZE - 16;
  return Math.round(min + (max - min) * dock.y);
}

export function BitLauncher() {
  const t = useT();
  const open = useBitStore((s) => s.open);
  const mini = useBitStore((s) => s.mini);
  const dock = useBitStore((s) => s.dock);
  const guide = useBitStore((s) => s.guide);
  const openBit = useBitStore((s) => s.openBit);
  const close = useBitStore((s) => s.close);
  const speaking = useVoiceStore((s) => s.speaking);
  const sentence = useVoiceStore((s) => s.sentence);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const start = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [vh, setVh] = useState(() => (typeof window === 'undefined' ? 800 : window.innerHeight));

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Alt+B toggles Bit from anywhere (keyboard users, and "Jarvis, …" without the mouse)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyB') {
        e.preventDefault();
        if (useBitStore.getState().open) useBitStore.getState().minimize();
        else openBit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openBit]);

  const topbar = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 64;

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const s = start.current;
    if (!s) return;
    if (!s.moved && Math.hypot(e.clientX - s.x, e.clientY - s.y) < DRAG_SLOP) return;
    s.moved = true;
    setDrag({ x: e.clientX - SIZE / 2, y: e.clientY - SIZE / 2 });
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    if (!s.moved) {
      void loadPanel();
      openBit();
      return;
    }
    const top = topbar();
    const min = top + 12;
    const max = window.innerHeight - SIZE - 16;
    useBitStore.getState().setDock({ side: e.clientX < window.innerWidth / 2 ? 'left' : 'right', y: (e.clientY - SIZE / 2 - min) / Math.max(1, max - min) });
    setDrag(null);
  };

  const top = drag ? drag.y : dockTop(dock, vh, typeof document === 'undefined' ? 64 : topbar());
  const showCaption = mini && (speaking || !!guide);

  return (
    <>
      {!open && (
        <div
          className={styles.dock}
          data-side={dock.side}
          data-low={dock.y > 0.5 || undefined}
          data-dragging={drag ? true : undefined}
          style={drag ? { left: drag.x, top: drag.y, right: 'auto' } : dock.y > 0.5 ? { bottom: vh - top - SIZE } : { top }}
        >
          <button
            type="button"
            className={styles.avatarBtn}
            data-speaking={speaking || undefined}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerEnter={() => void loadPanel()}
            onFocus={() => void loadPanel()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openBit();
              }
            }}
            aria-label={t('bit.open')}
            title={`${t('bit.open')} (Alt+B) · ${t('bit.dragHint')}`}
          >
            <BitFace size={42} live={speaking} mood={speaking ? 'speaking' : 'idle'} />
          </button>
          {showCaption && (
            <div className={styles.caption} role="status" aria-live="polite">
              {speaking && <p>{sentence}</p>}
              <div className={styles.captionTools}>
                <button type="button" onClick={() => openBit()} title={t('bit.expand')} aria-label={t('bit.expand')}>
                  <Maximize2 size={14} aria-hidden="true" />
                </button>
                {speaking && (
                  <button type="button" onClick={() => bitVoice.stop()} title={t('bit.stopSpeaking')} aria-label={t('bit.stopSpeaking')}>
                    <Square size={13} aria-hidden="true" />
                  </button>
                )}
                {guide && (
                  <button type="button" className={styles.captionNext} onClick={() => useBitStore.getState().send(t('bit.actions.next'))}>
                    {t('bit.next')} <ChevronRight size={14} aria-hidden="true" />
                  </button>
                )}
                <button type="button" onClick={() => (bitVoice.stop(), close())} title={t('bit.close')} aria-label={t('bit.close')}>
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* folded away the panel stays mounted (hidden): the conversation, the voice and the tour go on */}
      {(open || mini) && (
        <Suspense fallback={null}>
          <BitPanel hidden={!open} />
        </Suspense>
      )}
    </>
  );
}
