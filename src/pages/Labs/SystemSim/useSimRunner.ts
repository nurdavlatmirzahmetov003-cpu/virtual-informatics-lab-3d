/**
 * Plays the simulation in time: power on → POST (with its beep code) → the
 * outcome or the OS boot (time scaled down) → the desktop; then a workload
 * whose temperature / power samples are replayed fast until it ends or the
 * computer switches off. The physics comes from labs/SystemSim.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { post, runLoad, type Build, type LoadRun, type PostResult, type Workload } from '@/labs/SystemSim';
import { playAlarm, playBeepCode, playSfx } from '@/lib/audio/sfx';
import { useReducedMotion } from '@/hooks/useMediaQuery';

export type Phase = 'off' | 'post' | 'result' | 'booting' | 'desktop' | 'load' | 'shutdown';

/** Real milliseconds of the POST screen; real seconds per simulated boot second; simulated seconds per real second under load. */
const POST_MS = 1800;
const BOOT_SCALE = 0.25;
const LOAD_SPEED = 5;

export interface SimView {
  phase: Phase;
  post: PostResult | null;
  /** 0…1 while Windows starts. */
  boot: number;
  workload: Workload;
  run: LoadRun | null;
  /** Samples of `run` shown so far. */
  shown: number;
  /** Idle temperature at the desktop. */
  idleC: number | null;
}

const OFF: SimView = { phase: 'off', post: null, boot: 0, workload: 'game', run: null, shown: 0, idleC: null };

export function useSimRunner(build: Build) {
  const reduced = useReducedMotion();
  const [view, setView] = useState<SimView>(OFF);
  const timers = useRef<number[]>([]);
  const alarmed = useRef(false);

  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const powerOff = useCallback(() => {
    clear();
    setView((v) => ({ ...OFF, workload: v.workload }));
  }, []);

  useEffect(() => () => clear(), []);

  const powerOn = useCallback(() => {
    clear();
    alarmed.current = false;
    const p = post(build);
    playBeepCode(p.beep);
    if (p.outcome === 'desktop') playSfx('boot');
    setView((v) => ({ ...OFF, workload: v.workload, phase: 'post', post: p }));
    later(() => {
      if (p.outcome !== 'desktop') {
        setView((v) => ({ ...v, phase: 'result' }));
        return;
      }
      const total = reduced ? 0 : p.bootSeconds * BOOT_SCALE * 1000;
      const start = performance.now();
      const tick = () => {
        const k = total ? Math.min(1, (performance.now() - start) / total) : 1;
        if (k < 1) {
          setView((v) => ({ ...v, phase: 'booting', boot: k }));
          later(tick, 80);
        } else {
          const idle = runLoad(build, 'idle', 60, 1);
          setView((v) => ({ ...v, phase: 'desktop', boot: 1, idleC: idle.samples.at(-1)!.tempC }));
        }
      };
      tick();
    }, reduced ? 300 : POST_MS);
  }, [build, reduced]);

  const setWorkload = useCallback((workload: Workload) => setView((v) => ({ ...v, workload })), []);

  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const startLoad = useCallback(() => {
    const v = viewRef.current;
    if (v.phase !== 'desktop' && v.phase !== 'load') return;
    clear();
    alarmed.current = false;
    const run = runLoad(build, v.workload, 60, 0.5, v.idleC ?? undefined);
    const n = run.samples.length;
    const step = 500 / LOAD_SPEED;
    const show = (i: number) => {
      const s = run.samples[Math.min(i, n) - 1];
      if (s && (s.throttling || s.watts > build.psu) && !alarmed.current) {
        alarmed.current = true;
        playAlarm();
      }
      if (i >= n) {
        if (run.shutdown) playSfx('error');
        setView((x) => ({ ...x, shown: n, phase: run.shutdown ? 'shutdown' : 'load' }));
        return;
      }
      setView((x) => ({ ...x, shown: i }));
      later(() => show(i + 1), step);
    };
    setView({ ...v, phase: 'load', run, shown: 0 });
    later(() => show(reduced ? n : 1), 0);
  }, [build, reduced]);

  return { view, powerOn, powerOff, startLoad, setWorkload };
}
