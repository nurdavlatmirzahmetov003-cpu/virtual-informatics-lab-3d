import { useEffect, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '@/hooks/useT';
import { MAX_GATES, gatesOf, type Circuit, type GateType } from '@/labs/LogicLab';
import { GateIcon } from './GateShape';
import { VIEW, clampToView, clientToView, NODE_BOX } from './geometry';
import type { LogicLabActions } from './useLogicLab';
import styles from './LogicLab.module.css';

interface Ghost {
  gate: GateType;
  x: number;
  y: number;
  startX: number;
  startY: number;
  pointerId: number;
}

/** Click-to-add: a free spot in the middle columns of the board. */
function freeSpot(c: Circuit) {
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      const x = 300 + col * 150;
      const y = 100 + row * 120;
      if (c.nodes.every((n) => Math.abs(n.x - x) > NODE_BOX.gate.w * 2 + 10 || Math.abs(n.y - y) > NODE_BOX.gate.h * 2 + 20)) return clampToView({ kind: 'gate' }, x, y);
    }
  }
  return clampToView({ kind: 'gate' }, VIEW.width / 2, VIEW.height / 2);
}

export function Palette({ circuit, allowed, actions, svgRef }: { circuit: Circuit; allowed: readonly GateType[]; actions: LogicLabActions; svgRef: RefObject<SVGSVGElement | null> }) {
  const t = useT();
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const full = gatesOf(circuit).length >= MAX_GATES;

  useEffect(() => {
    if (!ghost) return;
    const move = (e: PointerEvent) => e.pointerId === ghost.pointerId && setGhost((g) => (g ? { ...g, x: e.clientX, y: e.clientY } : g));
    const up = (e: PointerEvent) => {
      if (e.pointerId !== ghost.pointerId) return;
      const moved = Math.hypot(e.clientX - ghost.startX, e.clientY - ghost.startY) > 6;
      const drop = moved ? clientToView(svgRef.current, e.clientX, e.clientY, true) : null;
      if (drop) {
        const p = clampToView({ kind: 'gate' }, drop.x, drop.y);
        actions.addGate(ghost.gate, p.x, p.y);
      } else if (!moved) {
        const p = freeSpot(circuit);
        actions.addGate(ghost.gate, p.x, p.y);
      }
      setGhost(null);
    };
    const cancel = () => setGhost(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
    };
  }, [ghost, actions, circuit, svgRef]);

  const dragging = ghost && Math.hypot(ghost.x - ghost.startX, ghost.y - ghost.startY) > 6;

  return (
    <aside className={styles.palette} aria-label={t('logic.ui.palette')}>
      <header>
        <h2>{t('logic.ui.palette')}</h2>
        <p>{full ? t('logic.ui.paletteFull', { max: MAX_GATES }) : t('logic.ui.paletteHint')}</p>
      </header>
      <ul>
        {allowed.map((gate) => (
          <li key={gate}>
            <button
              type="button"
              className={styles.paletteItem}
              disabled={full}
              onPointerDown={(e: ReactPointerEvent) => {
                if (e.button !== 0 || full) return;
                e.preventDefault();
                setGhost({ gate, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, pointerId: e.pointerId });
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                e.preventDefault();
                const p = freeSpot(circuit);
                actions.addGate(gate, p.x, p.y);
              }}
            >
              <GateIcon gate={gate} />
              <span>
                <b>{gate}</b>
                <small>{t(`logic.gates.${gate}`)}</small>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {dragging &&
        createPortal(
          <div className={styles.ghost} style={{ left: ghost.x, top: ghost.y }} aria-hidden="true">
            <GateIcon gate={ghost.gate} size={70} />
          </div>,
          document.body,
        )}
    </aside>
  );
}
