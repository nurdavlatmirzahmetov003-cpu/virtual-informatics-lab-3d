/**
 * Resolution and pixel density. The same physical patch of screen holds more
 * pixels when the panel has more pixels per inch:
 *   PPI = √(width² + height²) / diagonal
 * and a pixel's size (pitch) is 25.4 mm / PPI.
 */
import { fmt, makeQuizExercise, text, type Question } from './quiz';

export const RESOLUTIONS = [
  { id: 'hd', w: 1280, h: 720 },
  { id: 'fhd', w: 1920, h: 1080 },
  { id: 'qhd', w: 2560, h: 1440 },
  { id: 'uhd', w: 3840, h: 2160 },
] as const;
export type ResolutionId = (typeof RESOLUTIONS)[number]['id'];
export const resolutionById = (id: ResolutionId) => RESOLUTIONS.find((r) => r.id === id)!;

export const ppi = (w: number, h: number, diagonalInch: number) => Math.hypot(w, h) / diagonalInch;
export const pitchMm = (ppiValue: number) => 25.4 / ppiValue;
export const megapixels = (w: number, h: number) => (w * h) / 1_000_000;

/** Pixels across a 5 mm × 5 mm patch of the panel (what the zoom view draws). */
export const PATCH_MM = 5;
export const pixelsInPatch = (ppiValue: number) => Math.max(2, Math.round(PATCH_MM / pitchMm(ppiValue)));

/**
 * Rasterises the letter "A" into an n × n grid by sampling each cell centre
 * against three thick strokes — coarse grids look jagged, fine grids smooth.
 */
export function rasterA(n: number): boolean[][] {
  const strokes: Array<[number, number, number, number]> = [
    [0.18, 0.92, 0.5, 0.08],
    [0.5, 0.08, 0.82, 0.92],
    [0.31, 0.6, 0.69, 0.6],
  ];
  const width = 0.085;
  const dist = (px: number, py: number, [x1, y1, x2, y2]: [number, number, number, number]) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  };
  return Array.from({ length: n }, (_, row) =>
    Array.from({ length: n }, (_, col) => {
      const x = (col + 0.5) / n;
      const y = (row + 0.5) / n;
      return strokes.some((s) => dist(x, y, s) < width);
    }),
  );
}

export function conclusion(id: ResolutionId, diagonal: number) {
  const r = resolutionById(id);
  const p = ppi(r.w, r.h, diagonal);
  const level = p >= 140 ? 'sharp' : p >= 100 ? 'good' : 'coarse';
  return { key: `experiments.resolution.result.${level}`, params: { ppi: fmt(p, 0), pitch: fmt(pitchMm(p), 2), mp: fmt(megapixels(r.w, r.h), 1) } };
}

export const questions = (): Question[] => {
  const fhd = resolutionById('fhd');
  const uhd = resolutionById('uhd');
  const qhd = resolutionById('qhd');
  const fhdPixels = (fhd.w * fhd.h).toLocaleString('en-US').replace(/,/g, ' ');
  const ratio = (uhd.w * uhd.h) / (fhd.w * fhd.h);
  const q27 = ppi(qhd.w, qhd.h, 27);
  return [
    {
      id: 'q1',
      prompt: { key: 'experiments.resolution.q1.prompt' },
      options: [text('3 000'), text('1 920 000'), text(fhdPixels), text('8 294 400')],
      correct: 2,
      why: { key: 'experiments.resolution.q1.why', params: { pixels: fhdPixels } },
    },
    {
      id: 'q2',
      prompt: { key: 'experiments.resolution.q2.prompt' },
      options: [text('2×'), text(`${ratio}×`), text('8×')],
      correct: 1,
      why: { key: 'experiments.resolution.q2.why', params: { ratio } },
    },
    {
      id: 'q3',
      prompt: { key: 'experiments.resolution.q3.prompt' },
      options: [text('≈ 55'), text(`≈ ${fmt(q27, 0)}`), text('≈ 300')],
      correct: 1,
      why: { key: 'experiments.resolution.q3.why', params: { ppi: fmt(q27, 0) } },
    },
  ];
};

export const exercise = () => makeQuizExercise('resolution', questions());
