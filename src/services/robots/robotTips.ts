/**
 * V4 §4.5: a robot says a tip — in Bit's voice (Gemini TTS, or the
 * browser's voice) with the subtitle on screen, rate-limited
 * (tipPicker.ts). Heard tips are remembered: each earns coins once.
 */
import { create } from 'zustand';
import type { RobotId } from '@/data/robots/roster';
import type { Language } from '@/lib/i18n';
import { bitVoice, useVoiceStore } from '@/services/bit/voice';
import { useRobotsStore } from '@/store/robotsStore';
import { createTipLimiter, pickTip } from './tipPicker';

interface TipCaption {
  robot: RobotId | null;
  text: string;
  /** Hidden after this time (ms) unless the voice is still reading it. */
  until: number;
}

export const useRobotTip = create<TipCaption>(() => ({ robot: null, text: '', until: 0 }));

const limiter = createTipLimiter();
const OWNER = 'robot-tip';

/** Says a tip of `robot`; false when it is too soon (or, for proximity, Bit is busy talking). */
export function sayRobotTip(robot: RobotId, kind: 'click' | 'near', language: Language, voice = true): boolean {
  const v = useVoiceStore.getState();
  // coming close never interrupts Bit; a click does
  if (kind === 'near' && v.speaking && v.owner !== OWNER) return false;
  if (!limiter.allow(robot, kind, Date.now())) return false;
  const tip = pickTip(robot, new Set(useRobotsStore.getState().save.tips));
  const text = tip[language];
  // about 70 ms a character, at least five seconds on screen
  useRobotTip.setState({ robot, text, until: Date.now() + Math.max(5000, text.length * 70) });
  if (voice) {
    bitVoice.stop();
    useVoiceStore.setState({ owner: OWNER });
    bitVoice.say(text);
  }
  useRobotsStore.getState().heardTip(tip.id);
  return true;
}

export const closeRobotTip = () => {
  if (useVoiceStore.getState().owner === OWNER) bitVoice.stop();
  useRobotTip.setState({ robot: null, text: '', until: 0 });
};
