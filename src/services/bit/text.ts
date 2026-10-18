/** Text helpers for Bit's local understanding: no dependencies, used in tests. */

/** Lower case, ё → е, punctuation to spaces, one space between words. Letters of every script stay. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Drops "Бит," / "Bit" / "Hey Bit" from the start: it is how students address the assistant. */
export function stripWakeWord(text: string): string {
  return text.replace(/^\s*(?:эй|hey|ok|окей|ей)?[\s,]*(?:бит|bit|биттт?|bitt)(?![\p{L}])[\s,!.:—-]*/iu, '').trim();
}

export const words = (normalized: string): string[] => (normalized ? normalized.split(' ') : []);

/**
 * True when `stem` occurs in the text: a one-word stem must start a word
 * ("желі" → "желілер"), a stem with spaces must start a word and may run on.
 * A trailing "$" means the phrase ends the text: "what is a computer$" is not
 * "what is a computer virus".
 */
export function hasStem(normalized: string, stem: string): boolean {
  const exact = stem.endsWith('$');
  const s = normalize(exact ? stem.slice(0, -1) : stem);
  if (!s) return false;
  if (exact) return ` ${normalized}`.endsWith(` ${s}`);
  if (!s.includes(' ')) return words(normalized).some((w) => w.startsWith(s));
  return ` ${normalized}`.includes(` ${s}`);
}

export const countStems = (normalized: string, stems: readonly string[]) => stems.reduce((n, s) => n + (hasStem(normalized, s) ? 1 : 0), 0);

/**
 * Complete sentences of a reply that is still streaming in, so each can be
 * spoken as soon as it ends; `rest` waits for more text (or the end of the
 * stream). A dot only ends a sentence before a space: "192.168" and a dot
 * at the very end of a chunk ("192." + "168…") never split.
 */
export function splitSentences(text: string): { done: string[]; rest: string } {
  const done: string[] = [];
  let start = 0;
  const re = /[.!?…]+(?=\s)|\n+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const end = m.index + m[0].length;
    const s = text.slice(start, end).trim();
    if (s) done.push(s);
    start = end;
  }
  return { done, rest: text.slice(start) };
}
