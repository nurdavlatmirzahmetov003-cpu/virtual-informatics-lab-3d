import type { GateType } from '@/labs/LogicLab';
import { GATE_TIP } from './geometry';
import styles from './LogicLab.module.css';

/**
 * ANSI / IEEE 91 distinctive-shape symbols, drawn around (0, 0) in a
 * 80 × 56 box: AND has a flat back and round front, OR a curved back and a
 * pointed front, XOR an extra back curve, and a bubble means "inverted".
 */
const AND_BODY = 'M -40 -28 H 0 A 28 28 0 0 1 0 28 H -40 Z';
const OR_BODY = 'M -40 -28 C -10 -28 16 -20 34 0 C 16 20 -10 28 -40 28 Q -26 0 -40 -28 Z';
const XOR_BACK = 'M -49 -28 Q -35 0 -49 28';
const NOT_BODY = 'M -30 -24 L 22 0 L -30 24 Z';

const BUBBLE: Partial<Record<GateType, number>> = { NOT: 28, NAND: 34, NOR: 40 };

export function GateShape({ gate }: { gate: GateType }) {
  const body = gate === 'AND' || gate === 'NAND' ? AND_BODY : gate === 'NOT' ? NOT_BODY : OR_BODY;
  const bubble = BUBBLE[gate];
  return (
    <g className={styles.gateShape}>
      <path d={body} className={styles.gateBody} />
      {gate === 'XOR' && <path d={XOR_BACK} className={styles.gateLine} />}
      {bubble !== undefined && <circle cx={bubble} cy={0} r={6} className={styles.gateBody} />}
    </g>
  );
}

/** Same symbol for the palette, in its own small SVG. */
export function GateIcon({ gate, size = 46 }: { gate: GateType; size?: number }) {
  return (
    <svg viewBox="-62 -34 124 68" width={size} height={(size * 68) / 124} aria-hidden="true" focusable="false">
      <path d={gate === 'NOT' ? 'M -60 0 H -30' : 'M -60 -14 H -36 M -60 14 H -36'} className={styles.lead} />
      <path d={`M ${GATE_TIP[gate]} 0 H 60`} className={styles.lead} />
      <GateShape gate={gate} />
    </svg>
  );
}
