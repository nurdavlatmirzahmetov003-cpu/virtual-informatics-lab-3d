import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NETWORK_TASKS, addDevice, connect, connectDevices, connectToDevice, disconnect, emptyNetwork, moveDevice, ping, removeDevice,
  renameDevice, updateHostConfig, updateInterface,
  type ConnectError, type DeviceType, type Endpoint, type HostConfig, type InterfaceConfig, type Network, type NetworkTaskId, type PingResult,
} from '@/labs/NetworkLab';
import { grade, startAttempt, takeHint, type Attempt, type GradeReport } from '@/services/grading';
import { useProgressStore } from '@/store/progressStore';

export type Selection = { kind: 'device'; id: string } | { kind: 'link'; id: string } | null;

export interface PingRun {
  id: number;
  from: string;
  to: string;
  result: PingResult;
}

interface LabState {
  network: Network;
  selection: Selection;
  notice: ConnectError | null;
  ping: PingRun | null;
  attempt: Attempt | null;
  report: GradeReport | null;
}

function initial(task: NetworkTaskId | null): LabState {
  return {
    network: task ? NETWORK_TASKS[task].start() : emptyNetwork(),
    selection: null,
    notice: null,
    ping: null,
    attempt: task ? startAttempt(NETWORK_TASKS[task].id) : null,
    report: null,
  };
}

/**
 * Network Lab session state. All rules live in `labs/NetworkLab` and
 * `services/grading`; this hook only wires them to React state.
 */
export function useNetworkLab(task: NetworkTaskId | null) {
  const [state, setState] = useState(() => initial(task));
  const exercise = task ? NETWORK_TASKS[task] : null;
  // grading saves progress — a side effect, so it reads the latest state here instead of inside an updater
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  });

  /** Any topology/config change makes the last PING stale. */
  const edit = useCallback((fn: (n: Network) => Network) => {
    setState((s) => {
      const network = fn(s.network);
      return network === s.network ? s : { ...s, network, ping: null, notice: null };
    });
  }, []);

  const linkResult = useCallback((fn: (n: Network) => { network: Network; error: ConnectError | null }) => {
    setState((s) => {
      const r = fn(s.network);
      return r.error ? { ...s, notice: r.error } : { ...s, network: r.network, ping: null, notice: null };
    });
  }, []);

  const actions = useMemo(
    () => ({
      add: (type: DeviceType, x: number, y: number) =>
        setState((s) => {
          const network = addDevice(s.network, type, x, y);
          if (network === s.network) return s;
          return { ...s, network, ping: null, selection: { kind: 'device', id: network.devices.at(-1)!.id } };
        }),
      move: (id: string, x: number, y: number) => setState((s) => ({ ...s, network: moveDevice(s.network, id, x, y) })),
      remove: (id: string) => setState((s) => ({ ...s, network: removeDevice(s.network, id), selection: null, ping: null })),
      rename: (id: string, name: string) => edit((n) => renameDevice(n, id, name)),
      setHost: (id: string, patch: Partial<HostConfig>) => edit((n) => updateHostConfig(n, id, patch)),
      setInterface: (id: string, port: string, patch: Partial<InterfaceConfig>) => edit((n) => updateInterface(n, id, port, patch)),
      connectPorts: (a: Endpoint, b: Endpoint) => linkResult((n) => connect(n, a, b)),
      connectToDevice: (from: Endpoint, target: string) => linkResult((n) => connectToDevice(n, from, target)),
      connectDevices: (from: string, target: string) => linkResult((n) => connectDevices(n, from, target)),
      unplug: (linkId: string) => setState((s) => ({ ...s, network: disconnect(s.network, linkId), selection: null, ping: null })),
      select: (selection: Selection) => setState((s) => ({ ...s, selection, notice: null })),
      dismissNotice: () => setState((s) => ({ ...s, notice: null })),
      ping: (from: string, to: string) => setState((s) => ({ ...s, ping: { id: Date.now(), from, to, result: ping(s.network, from, to) } })),
      clearPing: () => setState((s) => ({ ...s, ping: null })),
      hint: () => setState((s) => (s.attempt && exercise ? { ...s, attempt: takeHint(s.attempt, exercise) } : s)),
      check: () => {
        const s = latest.current;
        if (!s.attempt || !exercise) return;
        const { report, attempt } = grade(exercise, s.network, s.attempt);
        useProgressStore.getState().record(report);
        setState((current) => ({ ...current, attempt, report }));
      },
      restart: () => setState(initial(task)),
    }),
    [edit, linkResult, exercise, task],
  );

  return { ...state, exercise, actions };
}

export type NetworkLabActions = ReturnType<typeof useNetworkLab>['actions'];
