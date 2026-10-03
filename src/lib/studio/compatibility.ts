import type { HardwareCategory } from '@/data/hardware/types';
import { REQUIRED_CATEGORIES } from '@/data/studio/options';
import type { ResolvedBuild } from './build';
import { estimatePower } from './power';

export type IssueCode =
  | 'missing'
  | 'socketMismatch'
  | 'memoryMismatch'
  | 'boardTooBig'
  | 'gpuTooLong'
  | 'noGraphics'
  | 'psuWeak'
  | 'coolerSocket'
  | 'coolerTooTall'
  | 'radiatorTooBig'
  | 'coolerWeak';

/** `error`: the PC cannot be built or will not work; `warning`: it works with a drawback. */
export type IssueSeverity = 'error' | 'warning';

export interface CompatIssue {
  code: IssueCode;
  severity: IssueSeverity;
  /** Categories involved — the UI highlights them. */
  categories: readonly HardwareCategory[];
  /** Interpolated into `studio.compat.<code>`. Product names are added by the UI. */
  params: Record<string, string | number>;
}

const name = (p: { brand: string; model: string }) => `${p.brand} ${p.model}`;

/**
 * Checks a build the way a technician would before ordering parts. Each rule
 * only runs when every part it needs is selected, so a half-finished build
 * reports what is missing instead of false conflicts.
 */
export function checkCompatibility(build: ResolvedBuild): CompatIssue[] {
  const issues: CompatIssue[] = [];
  const { cpu, motherboard: board, ram, gpu, psu, cooling, case: pcCase } = build;

  for (const category of REQUIRED_CATEGORIES) {
    if (!build[category]) issues.push({ code: 'missing', severity: 'warning', categories: [category], params: { category } });
  }

  if (cpu && board && cpu.compatibility.socket !== board.compatibility.socket) {
    issues.push({
      code: 'socketMismatch',
      severity: 'error',
      categories: ['cpu', 'motherboard'],
      params: { cpu: name(cpu), cpuSocket: cpu.compatibility.socket ?? '?', board: name(board), boardSocket: board.compatibility.socket ?? '?' },
    });
  }

  if (ram && board && ram.compatibility.memoryType !== board.compatibility.memoryType) {
    issues.push({
      code: 'memoryMismatch',
      severity: 'error',
      categories: ['ram', 'motherboard'],
      params: { ram: name(ram), ramType: ram.compatibility.memoryType ?? '?', board: name(board), boardType: board.compatibility.memoryType ?? '?' },
    });
  }

  if (board && pcCase) {
    const ff = board.compatibility.formFactor;
    if (ff && !pcCase.compatibility.supportsFormFactors?.includes(ff)) {
      issues.push({ code: 'boardTooBig', severity: 'error', categories: ['motherboard', 'case'], params: { board: name(board), formFactor: ff, case: name(pcCase) } });
    }
  }

  if (gpu && pcCase) {
    const length = gpu.compatibility.lengthMm ?? 0;
    const max = pcCase.compatibility.maxGpuLengthMm ?? Infinity;
    if (length > max) {
      issues.push({ code: 'gpuTooLong', severity: 'error', categories: ['gpu', 'case'], params: { gpu: name(gpu), length, case: name(pcCase), max } });
    }
  }

  if (cpu && !gpu && !cpu.compatibility.integratedGraphics) {
    issues.push({ code: 'noGraphics', severity: 'error', categories: ['cpu', 'gpu'], params: { cpu: name(cpu) } });
  }

  if (psu && cpu) {
    const { peakW, requiredW } = estimatePower(build);
    const watts = psu.compatibility.psuW ?? 0;
    if (watts < requiredW) {
      issues.push({ code: 'psuWeak', severity: 'error', categories: ['psu', 'gpu', 'cpu'], params: { psu: name(psu), watts, required: requiredW, peak: peakW } });
    }
  }

  if (cooling && cpu) {
    const socket = cpu.compatibility.socket;
    if (socket && !cooling.compatibility.sockets?.includes(socket)) {
      issues.push({ code: 'coolerSocket', severity: 'error', categories: ['cooling', 'cpu'], params: { cooler: name(cooling), socket } });
    }
    const capacity = cooling.compatibility.coolingCapacityW;
    const heat = cpu.compatibility.peakPowerW ?? cpu.compatibility.tdpW ?? 0;
    if (capacity && heat > capacity) {
      issues.push({ code: 'coolerWeak', severity: 'warning', categories: ['cooling', 'cpu'], params: { cooler: name(cooling), capacity, cpu: name(cpu), heat } });
    }
  }

  if (cooling && pcCase) {
    const height = cooling.compatibility.coolerHeightMm;
    const maxHeight = pcCase.compatibility.maxCoolerHeightMm;
    if (height && maxHeight && height > maxHeight) {
      issues.push({ code: 'coolerTooTall', severity: 'error', categories: ['cooling', 'case'], params: { cooler: name(cooling), height, case: name(pcCase), max: maxHeight } });
    }
    const radiator = cooling.compatibility.radiatorMm;
    const maxRadiator = pcCase.compatibility.maxRadiatorMm;
    if (radiator && maxRadiator && radiator > maxRadiator) {
      issues.push({ code: 'radiatorTooBig', severity: 'error', categories: ['cooling', 'case'], params: { cooler: name(cooling), radiator, case: name(pcCase), max: maxRadiator } });
    }
  }

  return issues;
}

export const hasErrors = (issues: readonly CompatIssue[]) => issues.some((i) => i.severity === 'error');
