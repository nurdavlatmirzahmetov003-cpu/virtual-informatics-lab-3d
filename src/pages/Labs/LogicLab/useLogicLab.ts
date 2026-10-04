import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FREE_INPUTS, LOGIC_TASKS, addGate, baseCircuit, connect, connectToNode, moveNode, removeGate, removeWire,
  type Bit, type Circuit, type ConnectError, type GateType, type LogicTaskId,
} from '@/labs/LogicLab';
import { grade, startAttempt, takeHint, toAssessment, type Attempt, type GradeReport } from '@/services/grading';
import { useProgressStore } from '@/store/progressStore';

export type Selection = { kind: 'node'; id: string } | { kind: 'wire'; id: string } | null;

interface LabState {
  circuit: Circuit;
  bits: Record<string, Bit>;
  selection: Selection;
  notice: ConnectError | null;
  attempt: Attempt | null;
  report: GradeReport | null;
}

function initial(task: LogicTaskId | null): LabState {
  const labels = task ? LOGIC_TASKS[task].inputs : FREE_INPUTS;
  return {
    circuit: task ? LOGIC_TASKS[task].start() : baseCircuit(labels),
    bits: Object.fromEntries(labels.map((l) => [l, 0 as Bit])),
    selection: null,
    notice: null,
    attempt: task ? startAttempt(LOGIC_TASKS[task].id) : null,
    report: null,
  };
}

/** Logic Lab session state; every rule lives in `labs/LogicLab` and `services/grading`. */
export function useLogicLab(task: LogicTaskId | null) {
  const [state, setState] = useState(() => initial(task));
  const exercise = task ? LOGIC_TASKS[task] : null;
  // grading writes progress (a side effect), so it reads the latest state here
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  });

  const actions = useMemo(() => {
    const wire = (fn: (c: Circuit) => { circuit: Circuit; error: ConnectError | null }) =>
      setState((s) => {
        const r = fn(s.circuit);
        return r.error ? { ...s, notice: r.error } : { ...s, circuit: r.circuit, notice: null };
      });
    return {
      addGate: (gate: GateType, x: number, y: number) =>
        setState((s) => {
          const circuit = addGate(s.circuit, gate, x, y);
          return circuit === s.circuit ? s : { ...s, circuit, selection: { kind: 'node', id: circuit.nodes.at(-1)!.id } };
        }),
      move: (id: string, x: number, y: number) => setState((s) => ({ ...s, circuit: moveNode(s.circuit, id, x, y) })),
      removeGate: (id: string) => setState((s) => ({ ...s, circuit: removeGate(s.circuit, id), selection: null })),
      removeWire: (id: string) => setState((s) => ({ ...s, circuit: removeWire(s.circuit, id), selection: null })),
      connect: (from: string, to: string, port: number) => wire((c) => connect(c, from, to, port)),
      connectToNode: (from: string, to: string) => wire((c) => connectToNode(c, from, to)),
      toggle: (label: string) => setState((s) => ({ ...s, bits: { ...s.bits, [label]: (1 - (s.bits[label] ?? 0)) as Bit } })),
      setBits: (bits: Record<string, Bit>) => setState((s) => ({ ...s, bits })),
      select: (selection: Selection) => setState((s) => ({ ...s, selection })),
      dismissNotice: () => setState((s) => ({ ...s, notice: null })),
      hint: () => setState((s) => (s.attempt && exercise ? { ...s, attempt: takeHint(s.attempt, exercise) } : s)),
      check: () => {
        const s = latest.current;
        if (!s.attempt || !exercise) return;
        const { report, attempt } = grade(exercise, s.circuit, s.attempt);
        useProgressStore.getState().record(toAssessment(report));
        setState((cur) => ({ ...cur, attempt, report }));
      },
      restart: () => setState(initial(task)),
    };
  }, [exercise, task]);

  return { ...state, exercise, actions };
}

export type LogicLabActions = ReturnType<typeof useLogicLab>['actions'];
