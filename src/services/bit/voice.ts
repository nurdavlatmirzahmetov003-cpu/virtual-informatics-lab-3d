/**
 * Bit's voice in the browser (0.37) — one for the whole site, so the chat,
 * the information panels and the 3D robot never talk over each other.
 *
 * With the lab server: every sentence is synthesised by Gemini
 * (/api/ai/bit/tts, native-sounding Kazakh), streamed as 24 kHz PCM and
 * scheduled gaplessly through Web Audio; the next sentence is fetched while
 * the current one plays. Without it (static demo, no key, quota used up):
 * the browser's own voice (speech.ts) reads the same sentence. An analyser
 * gives the loudness that moves Bit's mouth.
 *
 * V4 §10: the student's voice, style and emotion go with every request (each
 * is its own cached recording on the server); the speed is applied here, the
 * same recording played faster or slower with its pitch kept. When Gemini's
 * daily quota is used up the server still plays what it has recorded, the
 * rest is read by the browser voice, and `notice` says so kindly.
 *
 * One language only: Bit speaks the site's language (the KK / RU / EN switch,
 * setLanguage). Switching it stops Bit and drops what was queued; the
 * browser's voice is used only when it is a voice of that very language —
 * Kazakh is never read by an English or Russian voice. Whether the server
 * speaks is asked before the first sentence, so a panel read before Bit's
 * chat was ever opened is not given to the browser voice by mistake.
 */
import { create } from 'zustand';
import type { Language } from '@/lib/i18n';
import { SPEECH_LANG, chooseVoice, speakable, ttsSupported, voicesReady } from './speech';
import { speechChunks, splitSentences } from './text';
import { DEFAULT_VOICE_PREFS, type VoicePrefs } from './voicePrefs';

export const TTS_RATE = 24_000;

export interface VoiceState {
  speaking: boolean;
  /** The sentence being spoken (subtitles, karaoke). */
  sentence: string;
  /** Who is speaking it now. */
  source: 'gemini' | 'browser' | null;
  /** Which narration (an information panel) asked for it; null for the chat. */
  owner: string | null;
  /** Gemini's speech quota is used up for now: new sentences are read by the browser voice. */
  notice: 'quota' | null;
}

export const useVoiceStore = create<VoiceState>(() => ({ speaking: false, sentence: '', source: null, owner: null, notice: null }));

interface Item {
  text: string;
  /** The language it was queued in (the site's at that moment). */
  lang: Language;
  /** The voice it is said in (a preview may differ from the saved choice). */
  prefs: VoicePrefs;
  onStart?: () => void;
  /** PCM chunks as they arrive (server voice). */
  chunks: Float32Array<ArrayBuffer>[];
  done: boolean;
  failed: boolean;
  controller: AbortController | null;
  /** Wakes the player when a chunk arrives or the stream ends. */
  wake: (() => void) | null;
}

/** 16-bit little-endian PCM → floats; an odd trailing byte is carried over. */
export function pcmToFloat(bytes: Uint8Array, carry: number[] = []): { samples: Float32Array<ArrayBuffer>; carry: number[] } {
  const all = carry.length ? new Uint8Array([...carry, ...bytes]) : bytes;
  const n = Math.floor(all.length / 2);
  const view = new DataView(all.buffer, all.byteOffset, n * 2);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) samples[i] = view.getInt16(i * 2, true) / 32768;
  return { samples, carry: all.length % 2 ? [all[all.length - 1]] : [] };
}

/** Split a reply into sentences to speak one by one (a trailing fragment is a sentence too). */
export function sentencesOf(text: string): string[] {
  const { done, rest } = splitSentences(`${text} `);
  return [...done, rest.trim()].map(speakable).filter(Boolean);
}

/** Float PCM chunks → a 16-bit mono WAV (for the audio element at another speed). */
export function wavOf(chunks: readonly Float32Array[]): Blob {
  const n = chunks.reduce((a, c) => a + c.length, 0);
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const str = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + n * 2, true);
  str(8, 'WAVEfmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, TTS_RATE, true);
  v.setUint32(28, TTS_RATE * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, n * 2, true);
  let o = 44;
  for (const c of chunks)
    for (const x of c) {
      v.setInt16(o, Math.max(-1, Math.min(1, x)) * 0x7fff, true);
      o += 2;
    }
  return new Blob([buf], { type: 'audio/wav' });
}

/**
 * The browser voice to read `language` with: one of that very language, or
 * none (silence; the text stays on screen). Never a neighbour's voice.
 */
export function browserVoiceIndex(language: Language, voices: readonly Pick<SpeechSynthesisVoice, 'lang' | 'name' | 'localService'>[]): number | null {
  const pick = chooseVoice(language, voices);
  return pick && !pick.approximate ? pick.index : null;
}

class BitVoice {
  /** The site's language (setLanguage); Bit speaks nothing else. */
  language: Language = 'kk';
  private probe: Promise<void> | null = null;
  /** The student's voice (bitStore keeps it current). */
  prefs: VoicePrefs = DEFAULT_VOICE_PREFS;
  /** The server synthesises (health says so); switched off for a minute after a failure. */
  server = false;
  private serverDownUntil = 0;
  private queue: Item[] = [];
  private playing: Item | null = null;
  private generation = 0;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sources: AudioBufferSourceNode[] = [];
  private element: HTMLAudioElement | null = null;
  private levelData: Uint8Array<ArrayBuffer> | null = null;
  private fakeLevelUntil = 0;
  private idle = new Set<() => void>();

  /** Called when everything queued has been spoken (hands-free mode listens again). */
  onIdle(fn: () => void) {
    this.idle.add(fn);
    return () => void this.idle.delete(fn);
  }

  get busy() {
    return !!this.playing || this.queue.length > 0;
  }

  /** The site language changed: Bit stops and drops what was queued in the old one. */
  setLanguage(language: Language) {
    if (language === this.language) return;
    this.stop();
    this.language = language;
  }

  /** Asks the server once whether it speaks (Gemini), before the first sentence. */
  private ready(): Promise<void> {
    if (this.server || typeof window === 'undefined' || typeof fetch === 'undefined') return Promise.resolve();
    this.probe ??= fetch('/api/ai/bit/health')
      .then((r) => (r.ok ? (r.json() as Promise<{ tts?: boolean }>) : null))
      .then((b) => {
        if (b?.tts) this.server = true;
      })
      .catch(() => undefined);
    return this.probe;
  }

  /** Speaks the text (one or more sentences) in the site language. `onStart` runs when it starts. */
  say(text: string, onStart?: () => void, prefs: VoicePrefs = this.prefs) {
    const parts = speechChunks(sentencesOf(text));
    parts.forEach((p, i) => this.queue.push({ text: p, lang: this.language, prefs, onStart: i === 0 ? onStart : undefined, chunks: [], done: false, failed: false, controller: null, wake: null }));
    const gen = this.generation;
    void this.ready().then(() => {
      if (gen !== this.generation) return;
      this.prefetch();
      if (!this.playing) void this.next();
    });
  }

  /** What is queued, in order (tests). */
  get pending(): ReadonlyArray<{ text: string; lang: Language }> {
    return [this.playing, ...this.queue].filter((x): x is Item => !!x).map(({ text, lang }) => ({ text, lang }));
  }

  /** One sentence per call, each with its own start callback (karaoke). */
  sayEach(sentences: readonly string[], onSentence: (index: number) => void) {
    sentences.forEach((s, i) => this.say(s, () => onSentence(i)));
  }

  /** The settings' Preview: says `text` in a voice that is not saved yet, cutting off anything else. */
  preview(text: string, prefs: VoicePrefs) {
    this.stop();
    useVoiceStore.setState({ owner: 'voice-preview' });
    this.say(text, undefined, prefs);
  }

  stop() {
    this.generation++;
    for (const it of [this.playing, ...this.queue]) it?.controller?.abort();
    this.queue = [];
    this.playing = null;
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
    this.sources = [];
    this.element?.pause();
    this.element = null;
    if (ttsSupported()) window.speechSynthesis.cancel();
    useVoiceStore.setState({ speaking: false, sentence: '', source: null, owner: null });
  }

  /** Loudness 0…1 right now (mouth animation); a soft wobble for the browser voice. */
  level(): number {
    if (this.analyser && this.levelData && useVoiceStore.getState().source === 'gemini') {
      this.analyser.getByteTimeDomainData(this.levelData);
      let sum = 0;
      for (const v of this.levelData) sum += (v - 128) * (v - 128);
      return Math.min(1, Math.sqrt(sum / this.levelData.length) / 40);
    }
    if (performance.now() < this.fakeLevelUntil) return 0.35 + 0.3 * Math.abs(Math.sin(performance.now() / 90));
    return 0;
  }

  private useServer() {
    return this.server && Date.now() >= this.serverDownUntil;
  }

  private audio() {
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.levelData = new Uint8Array(new ArrayBuffer(this.analyser.fftSize));
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** Starts downloading the next two sentences' audio. */
  private prefetch() {
    if (!this.useServer()) return;
    for (const it of [this.playing, ...this.queue].slice(0, 3)) if (it && !it.controller && !it.done) void this.fetchAudio(it);
  }

  private async fetchAudio(it: Item) {
    it.controller = new AbortController();
    const wake = () => it.wake?.();
    try {
      const res = await fetch('/api/ai/bit/tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: it.text, lang: it.lang, voice: it.prefs.voice, style: it.prefs.style, emotion: it.prefs.emotion }),
        signal: it.controller.signal,
      });
      if (res.status === 503 && (await res.clone().json().catch(() => null))?.error === 'quota') {
        // the day's quota is used up: say so once, keep asking (recorded sentences still play)
        useVoiceStore.setState({ notice: 'quota' });
        throw new Error('quota');
      }
      if (!res.ok || !res.body) throw new Error(String(res.status));
      // a freshly synthesised sentence: the quota is back
      if (res.headers.get('x-bit-model') && useVoiceStore.getState().notice) useVoiceStore.setState({ notice: null });
      const reader = res.body.getReader();
      let carry: number[] = [];
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const r = pcmToFloat(value, carry);
        carry = r.carry;
        if (r.samples.length) it.chunks.push(r.samples);
        wake();
      }
      if (!it.chunks.length) throw new Error('empty');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        it.failed = true;
        // the server is away (not the quota): the browser voice takes over for a minute
        if ((e as Error).message !== 'quota') this.serverDownUntil = Date.now() + 60_000;
      }
    }
    it.done = true;
    wake();
  }

  private async next() {
    const gen = this.generation;
    let it = this.queue.shift();
    // queued in another language (the switch was pressed): never spoken
    while (it && it.lang !== this.language) it = this.queue.shift();
    this.playing = it ?? null;
    if (!it) {
      useVoiceStore.setState({ speaking: false, sentence: '', source: null, owner: null });
      this.idle.forEach((fn) => fn());
      return;
    }
    this.prefetch();
    if (it.controller && !it.failed) await (it.prefs.speed === 1 ? this.playServer(it, gen) : this.playStretched(it, gen));
    else await this.playBrowser(it, gen);
    if (gen === this.generation) void this.next();
  }

  /** Schedules the chunks back to back as they arrive; resolves when the last one has played. */
  private playServer(it: Item, gen: number): Promise<void> {
    return new Promise((resolve) => {
      const ctx = this.audio();
      let at = ctx.currentTime + 0.03;
      let scheduled = 0;
      let started = false;
      const tick = () => {
        if (gen !== this.generation) return resolve();
        if (it.failed && !scheduled) {
          // nothing came: read this sentence with the browser voice instead
          void this.playBrowser(it, gen).then(resolve);
          return;
        }
        while (scheduled < it.chunks.length) {
          const samples = it.chunks[scheduled++];
          const buf = ctx.createBuffer(1, samples.length, TTS_RATE);
          buf.copyToChannel(samples, 0);
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(this.analyser!);
          at = Math.max(at, ctx.currentTime + 0.01);
          src.start(at);
          at += buf.duration;
          this.sources.push(src);
          if (!started) {
            started = true;
            it.onStart?.();
            useVoiceStore.setState({ speaking: true, sentence: it.text, source: 'gemini' });
          }
        }
        if (it.done) {
          const left = Math.max(0, at - ctx.currentTime);
          window.setTimeout(() => {
            // this sentence's sources have finished: forget them
            if (gen === this.generation) this.sources = [];
            resolve();
          }, left * 1000 + 20);
        } else it.wake = tick;
      };
      it.wake = tick;
      tick();
    });
  }

  /**
   * Another speed: the whole sentence (cached ones arrive at once) played by an
   * audio element, which changes the tempo and keeps the pitch; the analyser
   * still hears it for the mouth.
   */
  private async playStretched(it: Item, gen: number): Promise<void> {
    await new Promise<void>((resolve) => {
      const check = () => {
        if (it.done || gen !== this.generation) resolve();
        else it.wake = check;
      };
      it.wake = check;
      check();
    });
    if (gen !== this.generation) return;
    if (it.failed || !it.chunks.length) return this.playBrowser(it, gen);
    const ctx = this.audio();
    const url = URL.createObjectURL(wavOf(it.chunks));
    const el = new Audio(url);
    el.preservesPitch = true;
    el.playbackRate = it.prefs.speed;
    this.element = el;
    try {
      ctx.createMediaElementSource(el).connect(this.analyser!);
    } catch {
      /* no Web Audio routing: it still plays, the mouth wobbles less */
    }
    await new Promise<void>((resolve) => {
      const end = () => {
        URL.revokeObjectURL(url);
        if (this.element === el) this.element = null;
        resolve();
      };
      el.onended = end;
      el.onerror = end;
      el.onplaying = () => {
        if (gen !== this.generation) return;
        it.onStart?.();
        useVoiceStore.setState({ speaking: true, sentence: it.text, source: 'gemini' });
      };
      el.play().catch(end);
    });
  }

  private async playBrowser(it: Item, gen: number): Promise<void> {
    if (!ttsSupported() || it.lang !== this.language) return;
    // the voice list arrives late in Chrome: without it the default (English) voice would read
    await voicesReady();
    if (gen !== this.generation) return;
    const voices = window.speechSynthesis.getVoices();
    const pick = browserVoiceIndex(it.lang, voices);
    // no voice of this language on this device: stay silent (the text is on screen), never another language
    if (pick === null) return;
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(it.text);
      u.rate = it.prefs.speed;
      u.voice = voices[pick];
      u.lang = voices[pick].lang || SPEECH_LANG[it.lang];
      const done = () => {
        this.fakeLevelUntil = 0;
        resolve();
      };
      u.onstart = () => {
        if (gen !== this.generation) return;
        it.onStart?.();
        this.fakeLevelUntil = performance.now() + 60_000;
        useVoiceStore.setState({ speaking: true, sentence: it.text, source: 'browser' });
      };
      u.onend = done;
      u.onerror = done;
      window.speechSynthesis.speak(u);
    });
  }
}

/** The one voice of Bit. */
export const bitVoice = new BitVoice();
