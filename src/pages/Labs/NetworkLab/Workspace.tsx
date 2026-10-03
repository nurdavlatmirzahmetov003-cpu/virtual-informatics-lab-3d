import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import {
  DEVICE_SPECS, addressProblem, deviceById, hostIssues, isHost, isRouter, linksAt, linksOf, portSpec, portsOf, routerIssues,
  type Device, type Endpoint, type Network,
} from '@/labs/NetworkLab';
import { DEVICE_ICONS, DEVICE_TONE } from './deviceIcons';
import { VIEW, cablePath, clampToView, clientToView, linkEnds, packetRoute, pointAt, portPoint, portSide, routeLength, type Point } from './geometry';
import type { NetworkLabActions, PingRun, Selection } from './useNetworkLab';
import styles from './NetworkLab.module.css';

const tk = (key: string) => key as TranslationKey;

function hitDevice(net: Network, p: Point): Device | undefined {
  return [...net.devices].reverse().find((d) => {
    const { width, height } = DEVICE_SPECS[d.type];
    return Math.abs(p.x - d.x) <= width / 2 + 6 && Math.abs(p.y - d.y) <= height / 2 + 14;
  });
}

function hitPort(net: Network, p: Point): Endpoint | null {
  for (const d of net.devices) {
    for (const port of portsOf(d.type)) {
      const q = portPoint(d, port.id);
      if (Math.hypot(q.x - p.x, q.y - p.y) <= 13) return { device: d.id, port: port.id };
    }
  }
  return null;
}

/** One line under the device name: IP, router summary or "L2". */
function useCaption() {
  const t = useT();
  return (d: Device) => {
    if (isHost(d)) return d.config?.ip.trim() || t('network.config.ip') + ' —';
    if (isRouter(d)) {
      const ips = portsOf(d.type).map((p) => d.interfaces?.[p.id]?.ip.trim()).filter(Boolean);
      return ips[0] ? `${ips[0]}${ips.length > 1 ? ` +${ips.length - 1}` : ''}` : t('network.config.ip') + ' —';
    }
    return 'L2';
  };
}

function deviceState(net: Network, d: Device): 'ok' | 'warn' | 'idle' {
  if (isHost(d)) {
    if (addressProblem(d.config?.ip, d.config?.mask) === 'noIp' && !linksOf(net, d.id).length) return 'idle';
    return hostIssues(net, d).length ? 'warn' : 'ok';
  }
  if (isRouter(d)) return routerIssues(net, d).length ? 'warn' : 'ok';
  return 'ok';
}

// ---------------------------------------------------------------------------

function PacketLayer({ network, run, onDone }: { network: Network; run: PingRun; onDone: (id: number) => void }) {
  const [progress, setProgress] = useState(0);
  const route = packetRoute(network, run.result.hops);
  const lengths = routeLength(route);
  const total = lengths.at(-1) ?? 0;

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 0 : Math.min(5200, 500 + total * 2.1);
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const p = duration ? Math.min(1, (now - start) / duration) : 1;
      setProgress(p);
      if (p < 1) frame = requestAnimationFrame(tick);
      else onDone(run.id);
    });
    // rAF pauses in background tabs; the result must still appear
    const fallback = window.setTimeout(() => {
      setProgress(1);
      onDone(run.id);
    }, duration + 250);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(fallback);
    };
    // a new run restarts the animation; route length is derived from the same run
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.id]);

  if (!route.length) return null;
  const ease = progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;
  const head = pointAt(route, lengths, ease * total);
  const tail = pointAt(route, lengths, Math.max(0, ease * total - 46));
  const ok = run.result.ok;
  const done = progress >= 1;
  const stop = run.result.stoppedAt ? deviceById(network, run.result.stoppedAt) : undefined;
  const target = deviceById(network, run.to);

  return (
    <g className={styles.packetLayer} data-ok={ok} aria-hidden="true">
      <line x1={tail.x} y1={tail.y} x2={head.x} y2={head.y} className={styles.packetTrail} />
      {!done && <circle cx={head.x} cy={head.y} r={8} className={styles.packet} />}
      {done && !ok && stop && (
        <g transform={`translate(${stop.x + DEVICE_SPECS[stop.type].width / 2 - 2},${stop.y - DEVICE_SPECS[stop.type].height / 2 - 2})`} className={styles.stopMark}>
          <circle r={14} />
          <path d="M -5 -5 L 5 5 M 5 -5 L -5 5" />
        </g>
      )}
      {done && ok && target && <circle cx={target.x} cy={target.y} r={DEVICE_SPECS[target.type].width / 2 + 8} className={styles.okRing} />}
    </g>
  );
}

// ---------------------------------------------------------------------------

interface WireDraft {
  from: Endpoint;
  pointer: Point;
  origin: Point;
  mode: 'drag' | 'click';
}

interface Props {
  network: Network;
  selection: Selection;
  run: PingRun | null;
  actions: NetworkLabActions;
  svgRef: RefObject<SVGSVGElement | null>;
  onPacketDone: (id: number) => void;
}

export function Workspace({ network, selection, run, actions, svgRef, onPacketDone }: Props) {
  const t = useT();
  const caption = useCaption();
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const [wire, setWireState] = useState<WireDraft | null>(null);
  // pointer handlers read the ref: a fast click delivers pointerup before React re-renders
  const wireRef = useRef<WireDraft | null>(null);
  const setWire = (w: WireDraft | null) => {
    wireRef.current = w;
    setWireState(w);
  };
  const hover = wire ? hitDevice(network, wire.pointer) : undefined;

  useEffect(() => {
    if (!wire) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      wireRef.current = null;
      setWireState(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [wire]);

  /** Keeps receiving moves outside the board; a pointer the browser no longer tracks is ignored. */
  const capture = (e: ReactPointerEvent) => {
    try {
      svgRef.current?.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  };

  const point = (e: ReactPointerEvent) => clientToView(svgRef.current, e.clientX, e.clientY) ?? { x: 0, y: 0 };

  const finishWire = (from: Endpoint, p: Point) => {
    const port = hitPort(network, p);
    if (port && port.device !== from.device) return actions.connectPorts(from, port);
    const device = hitDevice(network, p);
    if (device && device.id !== from.device) actions.connectToDevice(from, device.id);
  };

  const onPortDown = (e: ReactPointerEvent, end: Endpoint) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const wire = wireRef.current;
    if (wire?.mode === 'click') {
      if (wire.from.device !== end.device) actions.connectPorts(wire.from, end);
      setWire(null);
      return;
    }
    const d = deviceById(network, end.device)!;
    const origin = portPoint(d, end.port);
    setWire({ from: end, pointer: origin, origin, mode: 'drag' });
    actions.select({ kind: 'device', id: d.id });
    capture(e);
  };

  const onDeviceDown = (e: ReactPointerEvent, d: Device) => {
    if (e.button !== 0) return;
    const wire = wireRef.current;
    if (wire?.mode === 'click') {
      if (wire.from.device !== d.id) actions.connectToDevice(wire.from, d.id);
      setWire(null);
      return;
    }
    const p = point(e);
    drag.current = { id: d.id, dx: p.x - d.x, dy: p.y - d.y };
    actions.select({ kind: 'device', id: d.id });
    capture(e);
  };

  const onMove = (e: ReactPointerEvent) => {
    const p = point(e);
    const wire = wireRef.current;
    if (drag.current) {
      const d = deviceById(network, drag.current.id);
      if (d) {
        const c = clampToView(d, p.x - drag.current.dx, p.y - drag.current.dy);
        if (c.x !== d.x || c.y !== d.y) actions.move(d.id, c.x, c.y);
      }
    } else if (wire) setWire({ ...wire, pointer: p });
  };

  const onUp = (e: ReactPointerEvent) => {
    drag.current = null;
    const wire = wireRef.current;
    if (!wire || wire.mode !== 'drag') return;
    const p = point(e);
    if (Math.hypot(p.x - wire.origin.x, p.y - wire.origin.y) < 8) {
      setWire({ ...wire, mode: 'click' }); // a click on a port: pick the other end with the next click
      return;
    }
    finishWire(wire.from, p);
    setWire(null);
  };

  const onBoardKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    if (selection?.kind === 'link') actions.unplug(selection.id);
    else if (selection?.kind === 'device') actions.remove(selection.id);
  };

  const onDeviceKey = (e: KeyboardEvent<SVGGElement>, d: Device) => {
    const step = e.shiftKey ? 40 : 10;
    const delta: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (delta[e.key]) {
      e.preventDefault();
      const c = clampToView(d, d.x + delta[e.key][0], d.y + delta[e.key][1]);
      actions.move(d.id, c.x, c.y);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      actions.select({ kind: 'device', id: d.id });
    }
  };

  const fromDevice = wire && deviceById(network, wire.from.device);
  const selectedLink = selection?.kind === 'link' ? network.links.find((l) => l.id === selection.id) : undefined;
  const selectedEnds = selectedLink && linkEnds(network, selectedLink);

  return (
    <div className={styles.board} data-wiring={Boolean(wire)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        className={styles.svg}
        role="application"
        aria-label={t('network.workspace.label')}
        tabIndex={0}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => {
          drag.current = null;
          setWire(null);
        }}
        onKeyDown={onBoardKey}
      >
        <defs>
          <pattern id="net-grid" width="25" height="25" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" className={styles.gridDot} />
          </pattern>
          <radialGradient id="net-vignette" cx="50%" cy="40%" r="75%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.07" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect
          width={VIEW.width}
          height={VIEW.height}
          fill="url(#net-grid)"
          onPointerDown={() => {
            setWire(null);
            actions.select(null);
          }}
        />
        <rect width={VIEW.width} height={VIEW.height} fill="url(#net-vignette)" pointerEvents="none" />

        {network.devices.length === 0 && (
          <text x={VIEW.width / 2} y={VIEW.height / 2} className={styles.emptyText} textAnchor="middle">
            {t('network.workspace.empty')}
          </text>
        )}

        {network.links.map((link) => {
          const ends = linkEnds(network, link);
          if (!ends) return null;
          const a = deviceById(network, link.a.device)!;
          const b = deviceById(network, link.b.device)!;
          const d = cablePath(...ends);
          const label = t('network.workspace.cableTitle', { a: a.name, b: b.name });
          return (
            <g key={link.id} className={styles.cable} data-medium={link.medium} data-selected={selection?.kind === 'link' && selection.id === link.id}>
              <path d={d} className={styles.cableLine} />
              <path
                d={d}
                className={styles.cableHit}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  actions.select({ kind: 'link', id: link.id });
                }}
              >
                <title>{label}</title>
              </path>
            </g>
          );
        })}

        {wire && fromDevice && (
          <path d={cablePath(portPoint(fromDevice, wire.from.port), wire.pointer, portSide(fromDevice.type, wire.from.port), 'top')} className={styles.wireDraft} data-medium={portSpec(fromDevice.type, wire.from.port)?.kind} />
        )}

        {network.devices.map((d) => {
          const spec = DEVICE_SPECS[d.type];
          const Icon = DEVICE_ICONS[d.type];
          const selected = selection?.kind === 'device' && selection.id === d.id;
          const state = deviceState(network, d);
          return (
            <g
              key={d.id}
              transform={`translate(${d.x},${d.y})`}
              className={styles.device}
              style={{ ['--tone' as string]: DEVICE_TONE[d.type] }}
              data-selected={selected}
              data-target={hover?.id === d.id && wire?.from.device !== d.id}
              tabIndex={0}
              role="button"
              aria-label={`${d.name}, ${t(tk(`network.devices.${d.type}`))}`}
              aria-pressed={selected}
              onPointerDown={(e) => onDeviceDown(e, d)}
              onKeyDown={(e) => onDeviceKey(e, d)}
            >
              <rect x={-spec.width / 2} y={-spec.height / 2} width={spec.width} height={spec.height} rx={14} className={styles.tile} />
              <rect x={-spec.width / 2 + 9} y={-spec.height / 2 + 9} width={34} height={34} rx={10} className={styles.iconPlate} />
              <Icon x={-spec.width / 2 + 16} y={-spec.height / 2 + 16} width={20} height={20} strokeWidth={1.7} className={styles.icon} aria-hidden="true" />
              <text x={-spec.width / 2 + 52} y={-spec.height / 2 + 25} className={styles.name} style={d.name.length > 5 ? { fontSize: d.name.length > 7 ? 11 : 12.5 } : undefined}>
                {d.name}
              </text>
              <text x={-spec.width / 2 + 52} y={-spec.height / 2 + 41} className={styles.kind}>
                {t(tk(`network.devices.${d.type}`))}
              </text>
              <text x={-spec.width / 2 + 12} y={spec.height / 2 - 15} className={styles.ip}>
                {caption(d)}
              </text>
              {d.type !== 'switch' && d.type !== 'accessPoint' && <circle cx={spec.width / 2 - 11} cy={-spec.height / 2 + 11} r={4} className={styles.state} data-state={state} />}
              {portsOf(d.type).map((p) => {
                const o = portPoint({ ...d, x: 0, y: 0 }, p.id);
                const used = linksAt(network, { device: d.id, port: p.id }).length;
                const title = t('network.workspace.portTitle', { name: d.name, port: p.label, state: t(used ? 'network.workspace.portUsed' : 'network.workspace.portFree') });
                return (
                  <g key={p.id} className={styles.port} data-kind={p.kind} data-used={used > 0} data-active={wire?.from.device === d.id && wire.from.port === p.id} onPointerDown={(e) => onPortDown(e, { device: d.id, port: p.id })}>
                    <circle cx={o.x} cy={o.y} r={14} className={styles.portHit} />
                    <circle cx={o.x} cy={o.y} r={p.kind === 'wifi' ? 6.5 : 5.5} className={styles.portDot} />
                    <title>{title}</title>
                  </g>
                );
              })}
            </g>
          );
        })}

        {run && <PacketLayer key={run.id} network={network} run={run} onDone={onPacketDone} />}

        {selectedLink && selectedEnds && (
          <g
            transform={`translate(${(selectedEnds[0].x + selectedEnds[1].x) / 2},${(selectedEnds[0].y + selectedEnds[1].y) / 2})`}
            className={styles.unplug}
            role="button"
            tabIndex={0}
            aria-label={t('network.workspace.removeCable')}
            onPointerDown={(e) => {
              e.stopPropagation();
              actions.unplug(selectedLink.id);
            }}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && actions.unplug(selectedLink.id)}
          >
            <circle r={13} />
            <path d="M -4.5 -4.5 L 4.5 4.5 M 4.5 -4.5 L -4.5 4.5" />
            <title>{t('network.workspace.removeCable')}</title>
          </g>
        )}
      </svg>
      {wire?.mode === 'click' && fromDevice && (
        <p className={styles.wireHint} role="status">
          {t('network.workspace.connecting', { name: fromDevice.name, port: portSpec(fromDevice.type, wire.from.port)?.label ?? '' })}
        </p>
      )}
    </div>
  );
}
