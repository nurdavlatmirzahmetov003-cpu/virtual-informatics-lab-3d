import { useEffect, useMemo, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { fmt } from '@/labs/Experiments/quiz';
import { LINKS, PLACES, conclusion, exercise, ping, questions, type Link, type PlaceId } from '@/labs/Experiments/latency';
import { ExperimentFrame, Segmented, Stat } from '../parts';
import styles from '../ExperimentLab.module.css';

const W = 600;
const H = 170;
const A = { x: 60, y: 130 };
const B = { x: 540, y: 130 };
const SAT = { x: 300, y: 22 };

/** Position along the request + reply path at progress p (0…1). */
function packetAt(p: number, satellite: boolean) {
  const leg = p < 0.5 ? p * 2 : (1 - p) * 2; // there, then back
  if (!satellite) return { x: A.x + (B.x - A.x) * leg, y: A.y - Math.sin(leg * Math.PI) * 26 };
  // up to the satellite and down again
  if (leg < 0.5) return { x: A.x + (SAT.x - A.x) * leg * 2, y: A.y + (SAT.y - A.y) * leg * 2 };
  return { x: SAT.x + (B.x - SAT.x) * (leg - 0.5) * 2, y: SAT.y + (B.y - SAT.y) * (leg - 0.5) * 2 };
}

export default function Latency() {
  const t = useT();
  const reduced = useReducedMotion();
  const [place, setPlace] = useState<PlaceId>('astana');
  const [link, setLink] = useState<Link>('fiber');
  const [p, setP] = useState<number | null>(null);
  const frame = useRef(0);
  const km = PLACES.find((x) => x.id === place)!.km;
  const r = ping(km, link);
  const qs = useMemo(() => questions(), []);
  const ex = useMemo(() => exercise(), []);
  const satellite = link === 'satellite';

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const send = () => {
    cancelAnimationFrame(frame.current);
    if (reduced) return setP(1);
    // slowed down so it can be followed; longer pings still take visibly longer
    const duration = Math.min(4500, Math.max(700, r.rttMs * 8));
    const t0 = performance.now();
    const tick = (now: number) => {
      const v = Math.min(1, (now - t0) / duration);
      setP(v);
      if (v < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  const dot = p === null ? null : packetAt(p, satellite);
  const parts = [
    { id: 'prop', ms: r.propagationMs },
    { id: 'routers', ms: r.routersMs },
    { id: 'access', ms: r.accessMs },
  ] as const;

  return (
    <ExperimentFrame id="latency" conclusion={conclusion(km, link)} questions={qs} exercise={ex}>
      <div className={styles.controls}>
        <Segmented label={t('experiments.latency.to')} value={place} onChange={(v) => { setPlace(v); setP(null); }} options={PLACES.map((x) => ({ id: x.id, label: t(`experiments.latency.places.${x.id}`) }))} />
        <Segmented label={t('experiments.latency.link')} value={link} onChange={(v) => { setLink(v); setP(null); }} options={LINKS.map((l) => ({ id: l, label: t(`experiments.latency.links.${l}`) }))} />
        <button type="button" className={styles.primary} onClick={send}>
          <Send size={15} aria-hidden="true" /> {t('experiments.latency.send')}
        </button>
      </div>

      <svg className={styles.route} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('experiments.latency.diagram')}>
        {satellite ? (
          <path d={`M ${A.x} ${A.y} L ${SAT.x} ${SAT.y} L ${B.x} ${B.y}`} className={styles.routeLine} data-sat />
        ) : (
          <path d={`M ${A.x} ${A.y} Q ${(A.x + B.x) / 2} ${A.y - 52} ${B.x} ${B.y}`} className={styles.routeLine} />
        )}
        {satellite && (
          <g transform={`translate(${SAT.x},${SAT.y})`}>
            <rect x={-12} y={-6} width={24} height={12} rx={3} className={styles.node} />
            <path d="M -26 0 H -12 M 12 0 H 26" className={styles.routeLine} />
          </g>
        )}
        {[A, B].map((n, i) => (
          <g key={i} transform={`translate(${n.x},${n.y})`}>
            <circle r={9} className={styles.node} />
            <text y={30} textAnchor="middle" className={styles.nodeText}>
              {i === 0 ? t('experiments.latency.places.almaty') : t(`experiments.latency.places.${place}`)}
            </text>
          </g>
        ))}
        {dot && <circle cx={dot.x} cy={dot.y} r={7} className={styles.packet} data-done={p === 1} />}
        <text x={W / 2} y={H - 6} textAnchor="middle" className={styles.nodeText}>
          {km.toLocaleString('en-US').replace(/,/g, ' ')} km
        </text>
      </svg>

      <div className={styles.stats}>
        <Stat label={t('experiments.latency.rtt')} value={fmt(r.rttMs, 0)} unit="ms" tone={r.rttMs < 30 ? 'ok' : r.rttMs < 100 ? 'warn' : 'bad'} />
        <Stat label={t('experiments.latency.hops')} value={r.hops} />
      </div>
      <div className={styles.stack} aria-label={t('experiments.latency.breakdown')}>
        {parts.map((x) => (
          <span key={x.id} data-part={x.id} style={{ flexGrow: Math.max(x.ms, 0.4) }}>
            {t(`experiments.latency.parts.${x.id}`)} · {fmt(x.ms, 1)} ms
          </span>
        ))}
      </div>
    </ExperimentFrame>
  );
}
