import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { useT } from '@/hooks/useT';
import { nodeById, pinCount, wireAt, type Bit, type Circuit, type Evaluation, type LogicNode } from '@/labs/LogicLab';
import { GateShape } from './GateShape';
import { GATE_TIP, PIN_X, VIEW, clampToView, clientToView, hitInPin, hitNode, inPin, outPin, wirePath, type Point } from './geometry';
import type { LogicLabActions, Selection } from './useLogicLab';
import styles from './LogicLab.module.css';

const sig = (v: Bit | null | undefined) => (v === 1 ? '1' : v === 0 ? '0' : 'x');

interface Draft {
  from: string;
  pointer: Point;
  origin: Point;
  mode: 'drag' | 'click';
}

interface Props {
  circuit: Circuit;
  evaluation: Evaluation;
  bits: Record<string, Bit>;
  selection: Selection;
  warned: Set<string>;
  actions: LogicLabActions;
  svgRef: RefObject<SVGSVGElement | null>;
}

export function Board({ circuit, evaluation, bits, selection, warned, actions, svgRef }: Props) {
  const t = useT();
  const drag = useRef<{ id: string; dx: number; dy: number; start: Point; moved: boolean } | null>(null);
  const [draft, setDraftState] = useState<Draft | null>(null);
  // pointer handlers read the ref: a quick click delivers pointerup before React re-renders
  const draftRef = useRef<Draft | null>(null);
  const setDraft = (d: Draft | null) => {
    draftRef.current = d;
    setDraftState(d);
  };

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      draftRef.current = null;
      setDraftState(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const point = (e: ReactPointerEvent) => clientToView(svgRef.current, e.clientX, e.clientY) ?? { x: 0, y: 0 };
  const capture = (e: ReactPointerEvent) => {
    try {
      svgRef.current?.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  };

  const finish = (from: string, p: Point) => {
    const pin = hitInPin(circuit.nodes, p);
    if (pin && pin.node.id !== from) return actions.connect(from, pin.node.id, pin.port);
    // dropping on its own gate is refused with an explanation (it would be a loop)
    const n = hitNode(circuit.nodes, p);
    if (n) actions.connectToNode(from, n.id);
  };

  const onOutDown = (e: ReactPointerEvent, n: LogicNode) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const origin = outPin(n);
    setDraft({ from: n.id, pointer: origin, origin, mode: 'drag' });
    capture(e);
  };

  /** Starting at an input pin: the wire is dropped on a source and runs backwards. */
  const onInDown = (e: ReactPointerEvent, n: LogicNode, port: number) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const d = draftRef.current;
    if (d?.mode === 'click') {
      if (d.from !== n.id) actions.connect(d.from, n.id, port);
      setDraft(null);
      return;
    }
    // an input pin that already has a wire: click selects that wire
    const w = wireAt(circuit, n.id, port);
    if (w) actions.select({ kind: 'wire', id: w.id });
  };

  const onNodeDown = (e: ReactPointerEvent, n: LogicNode) => {
    if (e.button !== 0) return;
    const d = draftRef.current;
    if (d?.mode === 'click') {
      if (d.from !== n.id) actions.connectToNode(d.from, n.id);
      setDraft(null);
      return;
    }
    const p = point(e);
    drag.current = { id: n.id, dx: p.x - n.x, dy: p.y - n.y, start: p, moved: false };
    actions.select({ kind: 'node', id: n.id });
    capture(e);
  };

  const onMove = (e: ReactPointerEvent) => {
    const p = point(e);
    const g = drag.current;
    if (g) {
      if (!g.moved && Math.hypot(p.x - g.start.x, p.y - g.start.y) < 4) return;
      g.moved = true;
      const n = nodeById(circuit, g.id);
      if (n) {
        const c = clampToView(n, p.x - g.dx, p.y - g.dy);
        if (c.x !== n.x || c.y !== n.y) actions.move(n.id, c.x, c.y);
      }
    } else if (draftRef.current) setDraft({ ...draftRef.current, pointer: p });
  };

  const onUp = (e: ReactPointerEvent) => {
    const g = drag.current;
    drag.current = null;
    // a click (no drag) on a switch flips it
    if (g && !g.moved) {
      const n = nodeById(circuit, g.id);
      if (n?.kind === 'input') actions.toggle(n.label);
    }
    const d = draftRef.current;
    if (!d || d.mode !== 'drag') return;
    const p = point(e);
    if (Math.hypot(p.x - d.origin.x, p.y - d.origin.y) < 8) return setDraft({ ...d, mode: 'click' });
    finish(d.from, p);
    setDraft(null);
  };

  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    if (selection?.kind === 'wire') actions.removeWire(selection.id);
    else if (selection?.kind === 'node') actions.removeGate(selection.id);
  };

  const onNodeKey = (e: KeyboardEvent<SVGGElement>, n: LogicNode) => {
    const step = e.shiftKey ? 40 : 10;
    const delta: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (delta[e.key]) {
      e.preventDefault();
      const c = clampToView(n, n.x + delta[e.key][0], n.y + delta[e.key][1]);
      actions.move(n.id, c.x, c.y);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (n.kind === 'input') actions.toggle(n.label);
      else actions.select({ kind: 'node', id: n.id });
    }
  };

  const source = draft && nodeById(circuit, draft.from);
  const selectedWire = selection?.kind === 'wire' ? circuit.wires.find((w) => w.id === selection.id) : undefined;
  const selectedNode = selection?.kind === 'node' ? nodeById(circuit, selection.id) : undefined;

  const wireEnds = (from: string, to: string, port: number) => {
    const a = nodeById(circuit, from);
    const b = nodeById(circuit, to);
    return a && b ? ([outPin(a), inPin(b, port)] as const) : null;
  };

  return (
    <div className={styles.board} data-wiring={Boolean(draft)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        className={styles.svg}
        role="application"
        aria-label={t('logic.ui.board')}
        tabIndex={0}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => {
          drag.current = null;
          setDraft(null);
        }}
        onKeyDown={onKey}
      >
        <defs>
          <pattern id="logic-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.9" className={styles.gridDot} />
          </pattern>
          {/* user-space region: a perfectly straight wire has a zero-height box and would vanish */}
          <filter id="logic-glow" filterUnits="userSpaceOnUse" x={0} y={0} width={VIEW.width} height={VIEW.height}>
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect
          width={VIEW.width}
          height={VIEW.height}
          fill="url(#logic-grid)"
          onPointerDown={() => {
            setDraft(null);
            actions.select(null);
          }}
        />

        {circuit.wires.map((w) => {
          const ends = wireEnds(w.from, w.to, w.port);
          if (!ends) return null;
          const d = wirePath(...ends);
          const value = evaluation.wires.get(w.id);
          return (
            <g key={w.id} className={styles.wire} data-signal={sig(value)} data-selected={selectedWire?.id === w.id}>
              <path d={d} className={styles.wireLine} filter={value === 1 ? 'url(#logic-glow)' : undefined} />
              <path
                d={d}
                className={styles.wireHit}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  actions.select({ kind: 'wire', id: w.id });
                }}
              >
                <title>{`${nodeById(circuit, w.from)?.label} → ${nodeById(circuit, w.to)?.label} · ${sig(value)}`}</title>
              </path>
            </g>
          );
        })}

        {draft && source && <path d={wirePath(outPin(source), draft.pointer)} className={styles.wireDraft} />}

        {circuit.nodes.map((n) => {
          const out = evaluation.nodes.get(n.id);
          const selected = selectedNode?.id === n.id;
          const common = {
            transform: `translate(${n.x},${n.y})`,
            tabIndex: 0,
            role: 'button' as const,
            onPointerDown: (e: ReactPointerEvent) => onNodeDown(e, n),
            onKeyDown: (e: KeyboardEvent<SVGGElement>) => onNodeKey(e, n),
          };
          const pins = Array.from({ length: pinCount(n) }, (_, port) => {
            const p = inPin({ ...n, x: 0, y: 0 }, port);
            const w = wireAt(circuit, n.id, port);
            const v = w ? evaluation.wires.get(w.id) : undefined;
            return (
              <g key={port} className={styles.pin} data-signal={w ? sig(v) : 'open'} onPointerDown={(e) => onInDown(e, n, port)}>
                <line x1={p.x} y1={p.y} x2={n.kind === 'output' ? -26 : -32} y2={p.y} className={styles.lead} data-signal={w ? sig(v) : 'open'} />
                <circle cx={p.x} cy={p.y} r={12} className={styles.pinHit} />
                <circle cx={p.x} cy={p.y} r={4.5} className={styles.pinDot} />
                <title>{t('logic.ui.pinTitle', { name: n.label, pin: port + 1 })}</title>
              </g>
            );
          });
          const outHandle = n.kind !== 'output' && (
            <g className={styles.pin} data-signal={sig(out)} data-out onPointerDown={(e) => onOutDown(e, n)}>
              <line x1={n.kind === 'input' ? 48 : GATE_TIP[n.gate!]} y1={0} x2={n.kind === 'input' ? PIN_X.inputOut : PIN_X.gateOut} y2={0} className={styles.lead} data-signal={sig(out)} />
              <circle cx={n.kind === 'input' ? PIN_X.inputOut : PIN_X.gateOut} cy={0} r={12} className={styles.pinHit} />
              <circle cx={n.kind === 'input' ? PIN_X.inputOut : PIN_X.gateOut} cy={0} r={5.5} className={styles.pinDot} />
              <title>{t('logic.ui.outTitle', { name: n.label })}</title>
            </g>
          );

          if (n.kind === 'input') {
            const on = bits[n.label] === 1;
            return (
              <g key={n.id} {...common} className={styles.switchNode} data-on={on} data-selected={selected} aria-pressed={on} aria-label={t('logic.ui.switch', { name: n.label, value: on ? 1 : 0 })}>
                {outHandle}
                <rect x={-48} y={-26} width={96} height={52} rx={14} className={styles.switchBody} />
                <text x={-30} y={7} className={styles.switchLabel}>
                  {n.label}
                </text>
                <rect x={-4} y={-13} width={44} height={26} rx={13} className={styles.toggleTrack} />
                <circle cx={on ? 27 : 9} cy={0} r={9} className={styles.toggleKnob} />
                <text x={on ? 9 : 27} y={4} className={styles.toggleText} textAnchor="middle">
                  {on ? 1 : 0}
                </text>
              </g>
            );
          }

          if (n.kind === 'output') {
            const v = evaluation.output;
            return (
              <g key={n.id} {...common} className={styles.ledNode} data-signal={sig(v)} data-selected={selected} aria-label={t(v === 1 ? 'logic.ui.ledOn' : v === 0 ? 'logic.ui.ledOff' : 'logic.ui.ledUnknown')}>
                {pins}
                <circle r={40} className={styles.ledHalo} />
                <circle r={24} className={styles.ledBulb} />
                <circle cx={-7} cy={-8} r={6} className={styles.ledShine} />
                <text y={-34} className={styles.ledLabel} textAnchor="middle">
                  {n.label} = {v === null ? '?' : v}
                </text>
              </g>
            );
          }

          return (
            <g key={n.id} {...common} className={styles.gateNode} data-selected={selected} data-warn={warned.has(n.id)} data-signal={sig(out)} aria-label={`${n.label} ${n.gate}`}>
              {pins}
              {outHandle}
              <GateShape gate={n.gate!} />
              <text x={-14} y={4} className={styles.gateName} textAnchor="middle">
                {n.gate}
              </text>
              <text x={-40} y={-36} className={styles.gateLabel}>
                {n.label}
              </text>
            </g>
          );
        })}

        {selectedWire && (() => {
          const ends = wireEnds(selectedWire.from, selectedWire.to, selectedWire.port);
          if (!ends) return null;
          return (
            <g
              transform={`translate(${(ends[0].x + ends[1].x) / 2},${(ends[0].y + ends[1].y) / 2})`}
              className={styles.remove}
              role="button"
              tabIndex={0}
              aria-label={t('logic.ui.removeWire')}
              onPointerDown={(e) => {
                e.stopPropagation();
                actions.removeWire(selectedWire.id);
              }}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && actions.removeWire(selectedWire.id)}
            >
              <circle r={12} />
              <path d="M -4 -4 L 4 4 M 4 -4 L -4 4" />
              <title>{t('logic.ui.removeWire')}</title>
            </g>
          );
        })()}
        {selectedNode?.kind === 'gate' && (
          <g
            transform={`translate(${selectedNode.x + 44},${selectedNode.y - 40})`}
            className={styles.remove}
            role="button"
            tabIndex={0}
            aria-label={t('logic.ui.removeGate')}
            onPointerDown={(e) => {
              e.stopPropagation();
              actions.removeGate(selectedNode.id);
            }}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && actions.removeGate(selectedNode.id)}
          >
            <circle r={12} />
            <path d="M -4 -4 L 4 4 M 4 -4 L -4 4" />
            <title>{t('logic.ui.removeGate')}</title>
          </g>
        )}
      </svg>
      {draft?.mode === 'click' && source && (
        <p className={styles.wireHint} role="status">
          {t('logic.ui.connecting', { name: source.label })}
        </p>
      )}
    </div>
  );
}
