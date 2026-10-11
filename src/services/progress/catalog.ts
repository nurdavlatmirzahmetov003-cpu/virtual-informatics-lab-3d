/**
 * Catalogue of every graded task, grouped by laboratory.
 *
 * Deliberately plain data (ids, routes, locale keys) with no lab logic, so
 * the progress store, achievements and the toaster can use it from any page
 * without pulling network/logic/algorithm code into the main bundle.
 * scripts/progress.test.mjs checks it against the real `Exercise` objects
 * (ids, types, maxScore, instruction keys), so the two cannot drift apart.
 */

export const LAB_IDS = ['hardware', 'assembly', 'network', 'algorithms', 'logic', 'experiments'] as const;
export type LabId = (typeof LAB_IDS)[number];

export const ANATOMY_TASKS = [
  'monitor', 'keyboard', 'mouse', 'headset', 'microphone', 'webcam', 'speaker', 'printer',
  'motherboard', 'cpu', 'ram', 'gpu', 'ssd', 'hdd', 'psu', 'cooler', 'fans', 'nic',
] as const;
/** Lab devices with their own test (V2-4a/b); the others share an Anatomy test. Checked against data/devices. */
export const DEVICE_TASKS = [
  'cooler_liquid', 'case', 'thermal_paste', 'internal_cables', 'cmos_battery',
  'hdd_25', 'ssd_sata', 'usb_flash', 'sd_card', 'external_drive', 'optical_disc', 'optical_drive',
  'graphics_tablet', 'gamepad',
  'printer_laser', 'scanner', 'projector', 'printer_3d', 'interactive_panel',
  // V2-4b
  'router', 'switch', 'modem', 'wifi_adapter', 'nic', 'ethernet_cable', 'access_point', 'nas', 'server_rack',
  'ups', 'docking_station', 'usb_hub', 'card_reader', 'hdmi_cable', 'displayport_cable', 'usb_c_cable', 'usb_a_cable', 'audio_cable',
  'laptop', 'all_in_one', 'smartphone', 'tablet', 'smartwatch', 'sbc',
] as const;
export const NETWORK_TASKS = ['connect3', 'routerLan', 'addressing', 'repair'] as const;
export const ALGORITHM_TASKS = ['nextSwap', 'binarySteps', 'bubblePass'] as const;
export const LOGIC_TASKS = ['and', 'notOr', 'xorBasic', 'table'] as const;
export const EXPERIMENT_TASKS = ['cpuTemp', 'memory', 'storage', 'latency', 'binaryData', 'cpuCycle', 'rgb', 'resolution', 'refresh'] as const;

export interface TaskInfo {
  /** Exercise id, the key of all progress data. */
  id: string;
  lab: LabId;
  /** Lab-local task id. */
  task: string;
  /** Exercise type as in `Exercise.type`. */
  type: string;
  path: string;
  /** Locale keys. */
  title: string;
  summary: string;
  instructions: string;
  expected: string;
  maxScore: number;
  /** Position in the suggested learning order. */
  order: number;
}

type Draft = Omit<TaskInfo, 'order'>;

const anatomy = ANATOMY_TASKS.map(
  (task): Draft => ({
    id: `anatomy:${task}`,
    lab: 'hardware',
    task,
    type: 'anatomy',
    path: `/explorer?device=${task}`,
    title: `anatomy.items.${task}.name`,
    summary: 'tasks.anatomySummary',
    instructions: 'tasks.anatomyInstructions',
    expected: 'tasks.quizExpected',
    maxScore: 10,
  }),
);

const devices = DEVICE_TASKS.map(
  (task): Draft => ({
    id: `device:${task}`,
    lab: 'hardware',
    task,
    type: 'device',
    path: `/lab?device=${task}`,
    title: `devices.${task}.name`,
    summary: 'tasks.deviceSummary',
    instructions: 'tasks.deviceInstructions',
    expected: 'tasks.quizExpected',
    maxScore: 10,
  }),
);

const assembly: Draft = {
  id: 'assembly',
  lab: 'assembly',
  task: 'assembly',
  type: 'assembly',
  path: '/labs/assembly',
  title: 'tasks.assemblyTitle',
  summary: 'pcLab.task.instructions',
  instructions: 'pcLab.task.instructions',
  expected: 'pcLab.task.expected',
  maxScore: 10,
};

const network = NETWORK_TASKS.map(
  (task): Draft => ({
    id: `network:${task}`,
    lab: 'network',
    task,
    type: 'network',
    path: `/labs/network?task=${task}`,
    title: `network.tasks.${task}.title`,
    summary: `network.tasks.${task}.instructions`,
    instructions: `network.tasks.${task}.instructions`,
    expected: `network.tasks.${task}.expected`,
    maxScore: 10,
  }),
);

const algorithms = ALGORITHM_TASKS.map(
  (task): Draft => ({
    id: `algorithm:${task}`,
    lab: 'algorithms',
    task,
    type: 'algorithm',
    path: `/labs/algorithms?quiz=${task}#quiz`,
    title: `algorithms.quiz.${task}.title`,
    summary: `algorithms.quiz.${task}.expected`,
    instructions: `algorithms.quiz.${task}.question`,
    expected: `algorithms.quiz.${task}.expected`,
    maxScore: 10,
  }),
);

const logic = LOGIC_TASKS.map(
  (task): Draft => ({
    id: `logic:${task}`,
    lab: 'logic',
    task,
    type: 'logic',
    path: `/labs/logic?task=${task}`,
    title: `logic.tasks.${task}.title`,
    summary: `logic.tasks.${task}.instructions`,
    instructions: `logic.tasks.${task}.instructions`,
    expected: `logic.tasks.${task}.expected`,
    maxScore: 10,
  }),
);

const experiments = EXPERIMENT_TASKS.map(
  (task): Draft => ({
    id: `experiment:${task}`,
    lab: 'experiments',
    task,
    type: 'experiment',
    path: `/labs/experiments?exp=${task}`,
    title: `experiments.${task}.title`,
    summary: `experiments.${task}.intro`,
    instructions: `experiments.${task}.short`,
    expected: 'experiments.ui.quizExpected',
    maxScore: 10,
  }),
);

/** All tasks in the suggested learning order: explore → build → network → algorithms → logic → experiments. */
export const TASKS: readonly TaskInfo[] = [...anatomy, ...devices, assembly, ...network, ...algorithms, ...logic, ...experiments].map((t, order) => ({ ...t, order }));

const BY_ID = new Map(TASKS.map((t) => [t.id, t]));
export const taskById = (id: string): TaskInfo | undefined => BY_ID.get(id);
export const tasksOf = (lab: LabId): TaskInfo[] => TASKS.filter((t) => t.lab === lab);
export const isLabId = (v: unknown): v is LabId => LAB_IDS.includes(v as LabId);

/** Lab of any exercise id, including retired ones (`network:lan`) and prototype imports (`legacy:network`). */
export function labOf(exerciseId: string): LabId | undefined {
  const known = BY_ID.get(exerciseId)?.lab;
  if (known) return known;
  const [prefix, rest] = exerciseId.split(':');
  const map: Record<string, LabId> = { anatomy: 'hardware', device: 'hardware', assembly: 'assembly', network: 'network', algorithm: 'algorithms', logic: 'logic', experiment: 'experiments' };
  if (prefix === 'legacy') return isLabId(rest) ? rest : undefined;
  return map[prefix];
}
