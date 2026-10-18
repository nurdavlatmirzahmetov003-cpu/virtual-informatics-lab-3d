/**
 * Browser side of Bit's language model: streams the answer from the lab
 * server (/api/ai/bit/ask → Gemini), hands each piece of text over as it
 * arrives and pulls out the optional `[[go:section]]` action. The key never
 * leaves the server; without one (or offline) `bitHealth()` says so and
 * Bit keeps to its built-in answers.
 */
import type { Language } from '@/lib/i18n';
import { isSectionId, type SectionId } from './sections';

export interface Turn {
  role: 'user' | 'bit';
  text: string;
}

const TAG = /\[\[\s*go\s*:\s*([a-z]+)\s*\]\]/gi;

/** Removes action tags; returns the visible text and the first valid section named. */
export function extractAction(text: string): { text: string; go: SectionId | null } {
  let go: SectionId | null = null;
  const clean = text.replace(TAG, (_, id: string) => {
    if (!go && isSectionId(id)) go = id;
    return '';
  });
  return { text: clean.replace(/[ \t]+\n/g, '\n').trim(), go };
}

/** Text safe to show or speak while streaming: everything before an unfinished "[[" tag. */
export function visiblePart(text: string): string {
  const cleaned = text.replace(TAG, '');
  const open = cleaned.search(/\[\[?[^\]]*$/);
  return open >= 0 ? cleaned.slice(0, open) : cleaned;
}

export interface BitCapabilities {
  /** Gemini answers open questions. */
  model: boolean;
  /** The server speaks with Gemini's voice. */
  tts: boolean;
  /** The server recognises speech. */
  stt: boolean;
}

const NONE: BitCapabilities = { model: false, tts: false, stt: false };
let health: Promise<BitCapabilities> | null = null;
let healthAt = 0;

/** What the lab server offers Bit (nothing on the static demo or without a key). Cached for a minute. */
export function bitCapabilities(fetchImpl: typeof fetch = globalThis.fetch): Promise<BitCapabilities> {
  if (health && Date.now() - healthAt < 60_000) return health;
  healthAt = Date.now();
  health = fetchImpl('/api/ai/bit/health', { headers: { accept: 'application/json' } })
    .then((r) => (r.ok ? r.json() : {}))
    .then((b: { configured?: boolean; tts?: boolean; stt?: boolean }) => ({ model: b.configured === true, tts: b.tts === true, stt: b.stt === true }))
    .catch(() => NONE);
  return health;
}

/** Is the model reachable (server up, key set, not switched off by the admin)? */
export const bitHealth = (fetchImpl: typeof fetch = globalThis.fetch) => bitCapabilities(fetchImpl).then((c) => c.model);

/** Forget the cached health (after a failed answer, the next one checks again). */
export const resetBitHealth = () => {
  health = null;
};

export interface AskInput {
  message: string;
  lang: Language;
  history: readonly Turn[];
  page: SectionId;
  signal?: AbortSignal;
  /** Called with the whole visible answer so far (tags removed) after every piece. */
  onText?: (visible: string) => void;
  fetchImpl?: typeof fetch;
}

export class BitError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

/** Streams one answer; resolves with the final text and action. Throws BitError on failure. */
export async function askBit({ message, lang, history, page, signal, onText, fetchImpl = globalThis.fetch }: AskInput): Promise<{ text: string; go: SectionId | null }> {
  const res = await fetchImpl('/api/ai/bit/ask', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message, lang, page, history: history.slice(-8) }),
    signal,
  }).catch((e: unknown) => {
    throw new BitError((e as Error)?.name === 'AbortError' ? 'aborted' : 'offline');
  });
  if (!res.ok || !res.body) {
    const code = await res
      .json()
      .then((b: { error?: string }) => b.error ?? `http-${res.status}`)
      .catch(() => `http-${res.status}`);
    throw new BitError(code);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let raw = '';
  let error: string | null = null;
  const line = (l: string) => {
    if (!l.trim()) return;
    try {
      const msg = JSON.parse(l) as { d?: string; error?: string; done?: boolean };
      if (typeof msg.d === 'string') {
        raw += msg.d;
        onText?.(visiblePart(raw));
      }
      if (msg.error) error = msg.error;
    } catch {
      /* a broken line: ignore it */
    }
  };
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        line(buffer.slice(0, nl));
        buffer = buffer.slice(nl + 1);
      }
    }
    line(buffer);
  } catch (e) {
    throw new BitError((e as Error)?.name === 'AbortError' ? 'aborted' : 'interrupted');
  }
  const result = extractAction(raw);
  if (error && !result.text) throw new BitError(error);
  return result;
}
