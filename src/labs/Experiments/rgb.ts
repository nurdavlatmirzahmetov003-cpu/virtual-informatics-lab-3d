/**
 * Additive RGB: each screen pixel is three sub-pixels (red, green, blue)
 * whose brightness 0–255 is set independently; the eye mixes them.
 * 8 bits per channel → 256³ = 16 777 216 colours.
 */
import { key, makeQuizExercise, text, type Question } from './quiz';

export const clampChannel = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

export const toHex = (r: number, g: number, b: number) => `#${[r, g, b].map((c) => clampChannel(c).toString(16).padStart(2, '0')).join('').toUpperCase()}`;

/** Relative luminance (sRGB, WCAG) — decides whether text on the swatch should be dark or light. */
export function luminance(r: number, g: number, b: number) {
  const lin = (c: number) => {
    const s = clampChannel(c) / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export type ColourKind = 'black' | 'white' | 'grey' | 'red' | 'green' | 'blue' | 'yellow' | 'cyan' | 'magenta' | 'mixed';

/** A simple name for what the mix looks like, to explain additive mixing. */
export function describe(r: number, g: number, b: number): ColourKind {
  const [R, G, B] = [r, g, b].map(clampChannel);
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  if (max < 30) return 'black';
  if (min > 225) return 'white';
  if (max - min < 25) return 'grey';
  const on = (c: number) => c > max * 0.6;
  const k = `${on(R) ? 'r' : ''}${on(G) ? 'g' : ''}${on(B) ? 'b' : ''}`;
  return ({ r: 'red', g: 'green', b: 'blue', rg: 'yellow', gb: 'cyan', rb: 'magenta' } as Record<string, ColourKind>)[k] ?? 'mixed';
}

export const TOTAL_COLOURS = 256 ** 3;

export function conclusion(r: number, g: number, b: number) {
  return { key: `experiments.rgb.result.${describe(r, g, b)}`, params: { hex: toHex(r, g, b), r: clampChannel(r), g: clampChannel(g), b: clampChannel(b) } };
}

export const questions = (): Question[] => [
  {
    id: 'q1',
    prompt: { key: 'experiments.rgb.q1.prompt' },
    options: [text('#A5FF00'), text(toHex(255, 165, 0)), text('#FF0165'), text('#00A5FF')],
    correct: 1,
    why: { key: 'experiments.rgb.q1.why', params: { hex: toHex(255, 165, 0) } },
  },
  {
    id: 'q2',
    prompt: { key: 'experiments.rgb.q2.prompt' },
    options: [key('experiments.rgb.colour.yellow'), key('experiments.rgb.colour.white'), key('experiments.rgb.colour.cyan'), key('experiments.rgb.colour.black')],
    correct: 0,
    why: { key: 'experiments.rgb.q2.why' },
  },
  {
    id: 'q3',
    prompt: { key: 'experiments.rgb.q3.prompt' },
    options: [text('765'), text('65 536'), text(TOTAL_COLOURS.toLocaleString('en-US').replace(/,/g, ' ')), text('4 294 967 296')],
    correct: 2,
    why: { key: 'experiments.rgb.q3.why', params: { total: TOTAL_COLOURS.toLocaleString('en-US').replace(/,/g, ' ') } },
  },
];

export const exercise = () => makeQuizExercise('rgb', questions());
