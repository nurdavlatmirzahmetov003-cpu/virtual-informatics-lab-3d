/**
 * Bit's ears and voice: the browser's Web Speech API, no download, no key.
 * Recognition listens in the site language (kk-KZ / ru-RU / en-US) — Chrome
 * and Edge support it; elsewhere the microphone button is simply not shown.
 * Synthesis speaks sentence by sentence as the answer streams in. Voices
 * come from the device: Edge ships Kazakh voices (Aigul, Daulet); where no
 * Kazakh voice exists, Kazakh text is read by a Russian one (the answer
 * itself stays Kazakh) and the panel says so.
 */
import type { Language } from '@/lib/i18n';

export const SPEECH_LANG: Record<Language, string> = { kk: 'kk-KZ', ru: 'ru-RU', en: 'en-US' };

/* ── recognition ─────────────────────────────────────────── */

interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const sttSupported = () => recognitionCtor() !== null;

export interface Listener {
  stop(): void;
  abort(): void;
}

/**
 * Listens for one phrase: interim text while the student speaks, then the
 * final text (or an error code: 'not-allowed', 'no-speech', 'network', …).
 */
export function listen(language: Language, handlers: { onInterim?: (t: string) => void; onFinal: (t: string) => void; onError?: (code: string) => void; onEnd?: () => void }): Listener | null {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = SPEECH_LANG[language];
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  let final = '';
  rec.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) final += r[0].transcript;
      else interim += r[0].transcript;
    }
    handlers.onInterim?.((final + interim).trim());
  };
  rec.onerror = (e) => handlers.onError?.(e.error);
  rec.onend = () => {
    if (final.trim()) handlers.onFinal(final.trim());
    handlers.onEnd?.();
  };
  try {
    rec.start();
  } catch {
    handlers.onError?.('start');
    return null;
  }
  return { stop: () => rec.stop(), abort: () => rec.abort() };
}

/* ── synthesis ───────────────────────────────────────────── */

export const ttsSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

export interface VoiceChoice {
  voice: SpeechSynthesisVoice | null;
  /** BCP-47 tag the utterance is spoken with. */
  lang: string;
  /** No voice for the language on this device: a related one reads it. */
  approximate: boolean;
}

/** Best voice for the language among `voices` (exported for tests): natural/online voices first. */
export function chooseVoice(language: Language, voices: readonly Pick<SpeechSynthesisVoice, 'lang' | 'name' | 'localService'>[]): { index: number; approximate: boolean } | null {
  const score = (v: Pick<SpeechSynthesisVoice, 'name' | 'localService'>) => (/natural|neural|online|google/i.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1);
  const best = (prefix: string) => {
    let pick = -1;
    voices.forEach((v, i) => {
      if (v.lang.toLowerCase().replace('_', '-').startsWith(prefix) && (pick < 0 || score(v) > score(voices[pick]))) pick = i;
    });
    return pick;
  };
  const exact = best(SPEECH_LANG[language].slice(0, 2).toLowerCase());
  if (exact >= 0) return { index: exact, approximate: false };
  // Kazakh without a Kazakh voice: Russian reads Cyrillic closest
  if (language === 'kk') {
    const ru = best('ru');
    if (ru >= 0) return { index: ru, approximate: true };
  }
  return null;
}

let voicesCache: SpeechSynthesisVoice[] = [];

function voices(): SpeechSynthesisVoice[] {
  if (!ttsSupported()) return [];
  const list = window.speechSynthesis.getVoices();
  if (list.length) voicesCache = list;
  return voicesCache;
}

/** Voices load asynchronously in Chrome: resolves when the list is known (or after 1.5 s). */
export function voicesReady(): Promise<void> {
  if (!ttsSupported() || voices().length) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      voices();
      window.speechSynthesis.removeEventListener('voiceschanged', done);
      resolve();
    };
    window.speechSynthesis.addEventListener('voiceschanged', done);
    setTimeout(done, 1500);
  });
}

export function voiceFor(language: Language): VoiceChoice | null {
  const list = voices();
  const pick = chooseVoice(language, list);
  if (!pick) return list.length ? null : { voice: null, lang: SPEECH_LANG[language], approximate: false };
  const voice = list[pick.index];
  return { voice, lang: voice.lang, approximate: pick.approximate };
}

/** What the synthesiser should not read: tags, URLs, symbols it spells out. */
export function speakable(text: string): string {
  return text
    .replace(/\[\[[^\]]*\]\]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*_#`>|]/g, '')
    .replace(/\s+—\s+/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A queue of sentences spoken one after another (short utterances also dodge
 * Chrome's cut-off of long ones). `onIdle` fires when the queue runs dry.
 */
export class Speaker {
  private queue: string[] = [];
  private speaking = false;
  private generation = 0;
  language: Language;
  rate = 1;
  onIdle: (() => void) | null = null;

  constructor(language: Language) {
    this.language = language;
  }

  get busy() {
    return this.speaking || this.queue.length > 0;
  }

  say(text: string) {
    const s = speakable(text);
    if (!s || !ttsSupported()) return;
    this.queue.push(s);
    if (!this.speaking) this.next();
  }

  private next() {
    const text = this.queue.shift();
    if (text === undefined) {
      this.speaking = false;
      this.onIdle?.();
      return;
    }
    const choice = voiceFor(this.language);
    if (!choice) {
      // no voice at all for this language: stay silent rather than read it in another language
      this.queue = [];
      this.speaking = false;
      this.onIdle?.();
      return;
    }
    this.speaking = true;
    const gen = this.generation;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = choice.lang;
    if (choice.voice) u.voice = choice.voice;
    u.rate = this.rate;
    const after = () => {
      if (gen === this.generation) this.next();
    };
    u.onend = after;
    u.onerror = after;
    window.speechSynthesis.speak(u);
  }

  stop() {
    this.generation++;
    this.queue = [];
    this.speaking = false;
    if (ttsSupported()) window.speechSynthesis.cancel();
  }
}
