import { create } from 'zustand';
import {
  CONNECT_EXERCISES, SCENARIOS, emptyPlugState, endById, join, networkBySsid, portById, tryPlug, unplug,
  type ConnectTaskId, type PlugReason, type PlugState, type ScenarioId, type WifiWork,
} from '@/labs/ConnectLab';
import { grade, startAttempt, type Attempt, type GradeReport } from '@/services/grading';
import { useProgressStore } from './progressStore';

/** Last thing that happened, for the message line (locale `connect.*` keys). */
export type ConnectMessage =
  | { kind: 'ok'; end: string; port: string }
  | { kind: 'error'; reason: PlugReason; end: string; port: string }
  | { kind: 'wifi'; key: 'wrongKey' | 'wep' | 'joined' | 'openJoined'; ssid: string };

interface TaskSession {
  attempt: Attempt;
  report: GradeReport | null;
  hinted: boolean;
}

interface ConnectState {
  task: ConnectTaskId;
  plugs: Record<ScenarioId, PlugState>;
  wifi: WifiWork;
  /** Free cable end in hand (dragged or picked by click), and whether it is being dragged. */
  carrying: string | null;
  dragging: boolean;
  message: ConnectMessage | null;
  sessions: Record<ConnectTaskId, TaskSession>;
  setTask: (task: ConnectTaskId) => void;
  pick: (end: string, drag: boolean) => void;
  drop: () => void;
  plug: (end: string, port: string) => void;
  unplugEnd: (end: string) => void;
  joinWifi: (ssid: string, key: string) => void;
  leaveWifi: () => void;
  hint: () => void;
  check: () => void;
  reset: () => void;
}

const scenarioOf = (task: ConnectTaskId): ScenarioId | null => (task === 'wifi' ? null : task);
const freshWifi = (): WifiWork => ({ joined: null, joinedOpen: false, wrongKeys: 0 });
const freshSession = (task: ConnectTaskId): TaskSession => ({ attempt: startAttempt(`connect:${task}`), report: null, hinted: false });

export const useConnectLabStore = create<ConnectState>()((set, get) => ({
  task: 'pc',
  plugs: { pc: emptyPlugState(), ethernet: emptyPlugState() },
  wifi: freshWifi(),
  carrying: null,
  dragging: false,
  message: null,
  sessions: { pc: freshSession('pc'), ethernet: freshSession('ethernet'), wifi: freshSession('wifi') },

  setTask: (task) => set({ task, carrying: null, dragging: false, message: null }),

  pick: (end, drag) => {
    const sid = scenarioOf(get().task);
    if (!sid || !endById(SCENARIOS[sid], end)) return;
    // picking up a plugged end pulls it out
    set((s) => ({ carrying: end, dragging: drag, plugs: { ...s.plugs, [sid]: unplug(s.plugs[sid], end) } }));
  },
  drop: () => set({ carrying: null, dragging: false }),

  plug: (end, port) => {
    const sid = scenarioOf(get().task);
    if (!sid) return;
    const r = tryPlug(SCENARIOS[sid], get().plugs[sid], end, port);
    set((s) => ({
      plugs: { ...s.plugs, [sid]: r.state },
      carrying: null,
      dragging: false,
      message: r.ok ? { kind: 'ok', end, port } : { kind: 'error', reason: r.reason, end, port },
    }));
  },
  unplugEnd: (end) => {
    const sid = scenarioOf(get().task);
    if (!sid) return;
    set((s) => ({ plugs: { ...s.plugs, [sid]: unplug(s.plugs[sid], end) }, message: null }));
  },

  joinWifi: (ssid, key) => {
    const r = join(ssid, key);
    const open = networkBySsid(ssid)?.security === 'open';
    set((s) => {
      if (r.joined) return { wifi: { ...s.wifi, joined: ssid, joinedOpen: s.wifi.joinedOpen || open }, message: { kind: 'wifi', key: open ? 'openJoined' : 'joined', ssid } };
      return { wifi: { ...s.wifi, wrongKeys: s.wifi.wrongKeys + (r.reason === 'wrongKey' ? 1 : 0) }, message: { kind: 'wifi', key: r.reason === 'wep' ? 'wep' : 'wrongKey', ssid } };
    });
  },
  leaveWifi: () => set((s) => ({ wifi: { ...s.wifi, joined: null }, message: null })),

  hint: () => {
    const { task, sessions } = get();
    const ses = sessions[task];
    if (ses.hinted) return;
    set({ sessions: { ...sessions, [task]: { ...ses, hinted: true, attempt: { ...ses.attempt, hintsUsed: ses.attempt.hintsUsed + 1 } } } });
  },

  check: () => {
    const { task, plugs, wifi, sessions } = get();
    const ses = sessions[task];
    const r =
      task === 'wifi'
        ? grade(CONNECT_EXERCISES.wifi, wifi, ses.attempt)
        : grade(CONNECT_EXERCISES[task], plugs[task], ses.attempt);
    useProgressStore.getState().record(r.report);
    set({ sessions: { ...sessions, [task]: { ...ses, attempt: r.attempt, report: r.report } } });
  },

  reset: () => {
    const { task, plugs, sessions } = get();
    const sid = scenarioOf(task);
    set({
      plugs: sid ? { ...plugs, [sid]: emptyPlugState() } : plugs,
      wifi: task === 'wifi' ? freshWifi() : get().wifi,
      carrying: null,
      dragging: false,
      message: null,
      sessions: { ...sessions, [task]: freshSession(task) },
    });
  },
}));

/** Readable port name parts for a port id of the current scenario. */
export function portInfo(task: ConnectTaskId, portId: string) {
  const sid = scenarioOf(task);
  return sid ? portById(SCENARIOS[sid], portId) : undefined;
}
