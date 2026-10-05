/**
 * Text → numbers → bits. ASCII letters fit in one byte; Kazakh and Russian
 * letters are encoded in UTF-8 with two bytes, so the same word costs more
 * bits — something students can see for themselves.
 */
import { makeQuizExercise, text, type Question } from './quiz';

export const MAX_CHARS = 16;
/** Line speeds in bits per second: old modem, microcontroller UART, home internet. */
export const SPEEDS = [9600, 115_200, 100_000_000] as const;

export interface EncodedChar {
  char: string;
  codePoint: number;
  bytes: number[];
  /** Each byte as 8 binary digits. */
  bits: string[];
  ascii: boolean;
}

export function encode(input: string): EncodedChar[] {
  const encoder = new TextEncoder();
  return Array.from(input.slice(0, MAX_CHARS * 2))
    .slice(0, MAX_CHARS)
    .map((char) => {
      const bytes = [...encoder.encode(char)];
      return { char, codePoint: char.codePointAt(0)!, bytes, bits: bytes.map((b) => b.toString(2).padStart(8, '0')), ascii: bytes.length === 1 };
    });
}

export const bitCount = (chars: readonly EncodedChar[]) => chars.reduce((n, c) => n + c.bytes.length * 8, 0);

/** Seconds to send the bits at `bps` (no protocol overhead). */
export const sendSeconds = (bits: number, bps: number) => bits / bps;

export function conclusion(input: string) {
  const chars = encode(input);
  const wide = chars.filter((c) => !c.ascii).length;
  const params = { chars: chars.length, bytes: bitCount(chars) / 8, bits: bitCount(chars), wide };
  return { key: wide ? 'experiments.binaryData.result.utf8' : 'experiments.binaryData.result.ascii', params };
}

export const questions = (): Question[] => {
  const salem = bitCount(encode('Сәлем'));
  return [
    {
      id: 'q1',
      prompt: { key: 'experiments.binaryData.q1.prompt' },
      options: [text('1'), text('41'), text(String(encode('A')[0].codePoint)), text('97')],
      correct: 2,
      why: { key: 'experiments.binaryData.q1.why', params: { code: encode('A')[0].codePoint, bits: encode('A')[0].bits[0] } },
    },
    {
      id: 'q2',
      prompt: { key: 'experiments.binaryData.q2.prompt' },
      options: [text('5'), text('40'), text(String(salem)), text('160')],
      correct: 2,
      why: { key: 'experiments.binaryData.q2.why', params: { bits: salem, bytes: salem / 8 } },
    },
    {
      id: 'q3',
      prompt: { key: 'experiments.binaryData.q3.prompt' },
      options: [text('01001000'), text('01101000'), text('10010000'), text('00010010')],
      correct: 0,
      why: { key: 'experiments.binaryData.q3.why', params: { code: encode('H')[0].codePoint, bits: encode('H')[0].bits[0] } },
    },
  ];
};

export const exercise = () => makeQuizExercise('binaryData', questions());
