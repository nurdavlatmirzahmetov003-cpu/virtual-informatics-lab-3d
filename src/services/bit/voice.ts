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
 */
import { create } from 'zustand';
import type { Language } from '@/lib/i18n';
import { chooseVoice, speakable, ttsSupported } from './speech';
import { speechChunks, splitSentences } from './text';

export const TTS_RATE = 24_000;

export interface VoiceState {
  speaking: boolean;
  /** The sentence being spoken (subtitles, karaoke). */
  sentence: string;
  /** Who is speaking it now. */
  source: 'gemini' | 'browser' | null;
  /** Which narration (an information panel) asked for it; null for the chat. */
  owner: string | null;
}

export const useVoiceStore = create<VoiceState>(() => ({ speaking: false, sentence: '', source: null, owner: null }));

interface Item {
  text: string;
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

class BitVoice {
  language: Language = 'kk';
  /** The server synthesises (health says so); switched off for a minute after a failure. */
  server = false;
  private serverDownUntil = 0;
  private queue: Item[] = [];
  private playing: Item | null = null;
  private generation = 0;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sources: AudioBufferSourceNode[] = [];
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

  /** Speaks the text (one or more sentences). `onStart` runs when it starts. */
  say(text: string, onStart?: () => void) {
    const parts = speechChunks(sentencesOf(text));
    parts.forEach((p, i) => this.queue.push({ text: p, onStart: i === 0 ? onStart : undefined, chunks: [], done: false, failed: false, controller: null, wake: null }));
    this.prefetch();
    if (!this.playing) void this.next();
  }

  /** One sentence per call, each with its own start callback (karaoke). */
  sayEach(sentences: readonly string[], onSentence: (index: number) => void) {
    sentences.forEach((s, i) => this.say(s, () => onSentence(i)));
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
        body: JSON.stringify({ text: it.text, lang: this.language }),
        signal: it.controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(String(res.status));
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
        // the quota (503) or the server: the browser voice takes over for a while
        this.serverDownUntil = Date.now() + ((e as Error).message === '503' ? 10 * 60_000 : 60_000);
      }
    }
    it.done = true;
    wake();
  }

  private async next() {
    const gen = this.generation;
    const it = this.queue.shift();
    this.playing = it ?? null;
    if (!it) {
      useVoiceStore.setState({ speaking: false, sentence: '', source: null, owner: null });
      this.idle.forEach((fn) => fn());
      return;
    }
    this.prefetch();
    if (it.controller && !it.failed) await this.playServer(it, gen);
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

  private playBrowser(it: Item, gen: number): Promise<void> {
    return new Promise((resolve) => {
      if (!ttsSupported()) return resolve();
      const voices = window.speechSynthesis.getVoices();
      const pick = chooseVoice(this.language, voices);
      if (!pick && voices.length) return resolve(); // no voice for this language: stay silent, never another language
      const u = new SpeechSynthesisUtterance(it.text);
      if (pick) {
        u.voice = voices[pick.index];
        u.lang = voices[pick.index].lang;
      }
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
