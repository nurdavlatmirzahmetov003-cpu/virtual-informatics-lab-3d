/**
 * Tiny synthesized UI sounds (no audio files). Silent unless the student
 * turned sound on; the AudioContext is created on the first sound, which
 * always follows a user gesture.
 */
import { useSettingsStore } from '@/store/settingsStore';

export type Sfx = 'pick' | 'snap' | 'error' | 'boot';

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(ac: AudioContext, out: AudioNode, freq: number, start: number, length: number, type: OscillatorType = 'sine', to?: number) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, start + length);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(1, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(out);
  osc.start(start);
  osc.stop(start + length + 0.02);
}

export function playSfx(kind: Sfx) {
  const { soundEnabled, soundVolume } = useSettingsStore.getState();
  if (!soundEnabled) return;
  const ac = context();
  if (!ac) return;
  const out = ac.createGain();
  out.gain.value = Math.max(0, Math.min(1, soundVolume)) * 0.35;
  out.connect(ac.destination);
  const t = ac.currentTime;
  if (kind === 'pick') tone(ac, out, 520, t, 0.06, 'triangle');
  if (kind === 'snap') {
    tone(ac, out, 180, t, 0.05, 'square', 90); // the click
    tone(ac, out, 880, t + 0.04, 0.16);
    tone(ac, out, 1320, t + 0.1, 0.22);
  }
  if (kind === 'error') tone(ac, out, 240, t, 0.22, 'triangle', 170);
  if (kind === 'boot') {
    tone(ac, out, 60, t, 1.4, 'sawtooth', 140); // fans spinning up
    [523, 659, 784, 1047].forEach((f, i) => tone(ac, out, f, t + 0.35 + i * 0.12, 0.35));
  }
}
