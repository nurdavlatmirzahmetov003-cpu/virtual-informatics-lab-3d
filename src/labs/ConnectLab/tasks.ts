/**
 * The three graded Connection Lab tasks. Rules read what is actually
 * plugged in (or joined), never how it looks on screen.
 */
import type { Exercise, Feedback, RuleResult } from '@/services/grading';
import { ETHERNET_SCENARIO, PC_SCENARIO, portById } from './scenarios';
import type { PlugState } from './types';
import { SCHOOL_SSID, isSecure, networkBySsid } from './wifi';

export const CONNECT_TASK_IDS = ['pc', 'ethernet', 'wifi'] as const;
export type ConnectTaskId = (typeof CONNECT_TASK_IDS)[number];

export interface WifiWork {
  /** Network the laptop ended up on, or null. */
  joined: string | null;
  /** Ever joined an open (unencrypted) network during the task. */
  joinedOpen: boolean;
  wrongKeys: number;
}

const fb = (key: string, params?: Feedback['params']): Feedback => ({ key: `connect.feedback.${key}`, params });
const pass = (ok: boolean, why: string, params?: Feedback['params']): RuleResult => (ok ? { passed: true } : { passed: false, feedback: [fb(why, params)] });
/** Fewer mistakes, more of the "care" points: 0 mistakes full, `limit` or more none. */
const care = (mistakes: number, limit: number): RuleResult => ({
  passed: mistakes === 0,
  partial: Math.max(0, 1 - mistakes / limit),
  feedback: mistakes ? [fb('mistakes', { n: mistakes })] : [],
});

const base = (id: ConnectTaskId) => ({
  id: `connect:${id}`,
  type: 'connect',
  instructions: { key: `connect.tasks.${id}.instructions` },
  expectedResult: { key: `connect.tasks.${id}.expected` },
  maxScore: 10,
  hints: [{ key: `connect.tasks.${id}.hint` }],
});

const pcPort = (state: PlugState, end: string) => (state.plugged[end] ? portById(PC_SCENARIO, state.plugged[end]) : undefined);

export const PC_EXERCISE: Exercise<PlugState> = {
  ...base('pc'),
  gradingRules: [
    { id: 'monitor', points: 3, label: fb('rule.monitor'), evaluate: (s) => pass(pcPort(s, 'monitor')?.owner === 'gpu', 'monitorMissing') },
    {
      id: 'input',
      points: 2,
      label: fb('rule.input'),
      evaluate: (s) => {
        const ok = ['keyboard', 'mouse'].filter((e) => pcPort(s, e)?.kind === 'usb_a').length;
        return { passed: ok === 2, partial: ok / 2, feedback: ok === 2 ? [] : [fb('inputMissing')] };
      },
    },
    { id: 'audio', points: 1, label: fb('rule.audio'), evaluate: (s) => pass(pcPort(s, 'speakers')?.kind === 'audio_3_5', 'audioMissing') },
    { id: 'power', points: 2, label: fb('rule.power'), evaluate: (s) => pass(pcPort(s, 'power')?.owner === 'psu', 'powerMissing') },
    { id: 'care', points: 2, label: fb('rule.care'), evaluate: (s) => care(s.mistakes.length, 5) },
  ],
  // a fully connected PC counts as done even after mistakes (they cost "care" points)
  isComplete: (_w, outcomes) => outcomes.filter((o) => o.id !== 'care').every((o) => o.passed),
};

export const ETHERNET_EXERCISE: Exercise<PlugState> = {
  ...base('ethernet'),
  gradingRules: [
    {
      id: 'laptop',
      points: 4,
      label: fb('rule.laptopPort'),
      evaluate: (s) => pass(Object.values(s.plugged).some((p) => portById(ETHERNET_SCENARIO, p)?.owner === 'laptop'), 'laptopMissing'),
    },
    {
      id: 'lan',
      points: 4,
      label: fb('rule.routerLan'),
      evaluate: (s) => pass(Object.values(s.plugged).some((p) => portById(ETHERNET_SCENARIO, p)?.role === 'lan'), 'lanMissing'),
    },
    { id: 'care', points: 2, label: fb('rule.care'), evaluate: (s) => care(s.mistakes.length, 4) },
  ],
  isComplete: (_w, outcomes) => outcomes.filter((o) => o.id !== 'care').every((o) => o.passed),
};

export const WIFI_EXERCISE: Exercise<WifiWork> = {
  ...base('wifi'),
  gradingRules: [
    {
      id: 'network',
      points: 4,
      label: fb('rule.schoolNetwork'),
      evaluate: (w) => {
        const n = w.joined ? networkBySsid(w.joined) : undefined;
        if (!n) return { passed: false, feedback: [fb('notJoined')] };
        if (!isSecure(n.security)) return { passed: false, feedback: [fb('insecureJoined', { ssid: n.ssid })] };
        return pass(n.ssid === SCHOOL_SSID, 'wrongNetwork', { ssid: n.ssid });
      },
    },
    { id: 'open', points: 3, label: fb('rule.noOpen'), evaluate: (w) => pass(!w.joinedOpen, 'joinedOpen') },
    {
      id: 'key',
      points: 3,
      label: fb('rule.key'),
      evaluate: (w) => ({ passed: w.joined === SCHOOL_SSID && w.wrongKeys === 0, partial: w.joined === SCHOOL_SSID ? Math.max(0, 1 - w.wrongKeys / 3) : 0, feedback: w.wrongKeys ? [fb('wrongKeys', { n: w.wrongKeys })] : [] }),
    },
  ],
  isComplete: (w) => w.joined === SCHOOL_SSID,
};

export const CONNECT_EXERCISES = { pc: PC_EXERCISE, ethernet: ETHERNET_EXERCISE, wifi: WIFI_EXERCISE } as const;
