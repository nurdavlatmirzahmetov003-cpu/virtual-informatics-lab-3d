/**
 * The instruction cycle on a tiny accumulator machine. Memory holds the
 * program and the data; every instruction goes through fetch → decode →
 * execute, and the step list is computed up front so the UI can go back.
 */
import { key, makeQuizExercise, text, type Question } from './quiz';

export type Opcode = 'LOAD' | 'ADD' | 'SUB' | 'STORE' | 'HALT';
export type Stage = 'fetch' | 'decode' | 'execute' | 'halt';
export type Unit = 'pc' | 'ir' | 'acc' | 'alu' | 'mem' | 'cu';

export interface Instruction {
  op: Opcode;
  addr?: number;
}

export interface CycleStep {
  stage: Stage;
  pc: number;
  ir: Instruction | null;
  acc: number;
  memory: Array<number | Instruction>;
  /** Units lit in this step. */
  active: Unit[];
  /** Memory cell being read or written. */
  cell: number | null;
  /** Data moving on the bus this step (shown on the arrow). */
  bus: string | null;
  note: { key: string; params?: Record<string, string | number> };
}

export const DATA_ADDR = { a: 5, b: 6, out: 7 } as const;

/** out = a + b (or a − b) */
export function program(a: number, b: number, op: 'ADD' | 'SUB' = 'ADD'): Array<number | Instruction> {
  return [{ op: 'LOAD', addr: DATA_ADDR.a }, { op, addr: DATA_ADDR.b }, { op: 'STORE', addr: DATA_ADDR.out }, { op: 'HALT' }, 0, a, b, 0];
}

export const formatInstruction = (i: Instruction) => (i.addr === undefined ? i.op : `${i.op} [${i.addr}]`);

export function runCycle(a: number, b: number, op: 'ADD' | 'SUB' = 'ADD'): CycleStep[] {
  const memory = program(a, b, op);
  const steps: CycleStep[] = [];
  let pc = 0;
  let acc = 0;
  let ir: Instruction | null = null;
  const push = (stage: Stage, active: Unit[], note: CycleStep['note'], cell: number | null = null, bus: string | null = null) =>
    steps.push({ stage, pc, ir: ir && { ...ir }, acc, memory: memory.map((m) => (typeof m === 'number' ? m : { ...m })), active, cell, bus, note });

  for (let guard = 0; guard < 20; guard++) {
    const instr = memory[pc] as Instruction;
    ir = { ...instr };
    const addr = pc;
    pc += 1;
    push('fetch', ['pc', 'mem', 'ir'], { key: 'experiments.cpuCycle.note.fetch', params: { addr, instr: formatInstruction(instr), pc } }, addr, formatInstruction(instr));
    if (instr.op === 'HALT') {
      push('halt', ['cu'], { key: 'experiments.cpuCycle.note.halt', params: { acc, out: memory[DATA_ADDR.out] as number } });
      break;
    }
    push('decode', ['cu', 'ir'], { key: `experiments.cpuCycle.note.decode${instr.op}`, params: { addr: instr.addr ?? '' } });
    const value = memory[instr.addr!] as number;
    if (instr.op === 'LOAD') {
      acc = value;
      push('execute', ['mem', 'acc'], { key: 'experiments.cpuCycle.note.execLOAD', params: { addr: instr.addr!, value } }, instr.addr!, String(value));
    } else if (instr.op === 'ADD' || instr.op === 'SUB') {
      const before = acc;
      acc = instr.op === 'ADD' ? acc + value : acc - value;
      push('execute', ['mem', 'alu', 'acc'], { key: `experiments.cpuCycle.note.exec${instr.op}`, params: { before, value, acc } }, instr.addr!, String(value));
    } else if (instr.op === 'STORE') {
      memory[instr.addr!] = acc;
      push('execute', ['acc', 'mem'], { key: 'experiments.cpuCycle.note.execSTORE', params: { addr: instr.addr!, acc } }, instr.addr!, String(acc));
    }
  }
  return steps;
}

export const questions = (): Question[] => {
  const steps = runCycle(5, 3);
  const result = steps.at(-1)!.acc;
  const pcAfterSecondFetch = steps.filter((s) => s.stage === 'fetch')[1].pc;
  return [
    {
      id: 'q1',
      prompt: { key: 'experiments.cpuCycle.q1.prompt' },
      options: [key('experiments.cpuCycle.q1.o1'), key('experiments.cpuCycle.q1.o2'), key('experiments.cpuCycle.q1.o3')],
      correct: 0,
      why: { key: 'experiments.cpuCycle.q1.why' },
    },
    {
      id: 'q2',
      prompt: { key: 'experiments.cpuCycle.q2.prompt' },
      options: [text('3'), text('5'), text(String(result)), text('53')],
      correct: 2,
      why: { key: 'experiments.cpuCycle.q2.why', params: { result } },
    },
    {
      id: 'q3',
      prompt: { key: 'experiments.cpuCycle.q3.prompt' },
      options: [text('1'), text(String(pcAfterSecondFetch)), text('6')],
      correct: 1,
      why: { key: 'experiments.cpuCycle.q3.why', params: { pc: pcAfterSecondFetch } },
    },
  ];
};

export const exercise = () => makeQuizExercise('cpuCycle', questions());
