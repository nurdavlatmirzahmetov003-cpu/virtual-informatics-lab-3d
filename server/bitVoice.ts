/**
 * Bit's voice on the server (0.37): speech synthesis and recognition through
 * Gemini, so Kazakh sounds and is understood like Kazakh on every device
 * (browsers rarely ship a Kazakh voice, and their Kazakh recognition is weak).
 *
 *   POST /api/ai/bit/tts   { text, lang, voice?, style?, emotion? }
 *                          → audio/L16 (PCM 16-bit, 24 kHz, mono), streamed
 *   (V4 §10: the student's voice and speaking style; services/bit/voicePrefs.ts)
 *
 * V4 §12.1: with BIT_PROVIDER=openai and an OpenAI key, OpenAI speaks and
 * listens first (providers/openai.ts; its recordings are cached apart) and
 * Gemini takes over whenever it fails.
 *   POST /api/ai/bit/stt?lang=kk   <audio body>  → { text }
 *
 * The browser asks for one sentence at a time and plays it while the next
 * one is synthesised. Synthesised sentences are cached in memory: the
 * built-in answers, tours and lessons repeat, so after the first time they
 * start instantly and cost nothing. The key is read here only.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFile } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync, gzip } from 'node:zlib';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fallbackModelsFromEnv, isBitLang, type BitLang } from './bit';
import { isBitVoice, isVoiceStyle, type BitVoiceId, type VoiceStyle } from '@/services/bit/voicePrefs';
import type { ProviderChoice } from './providers';
import { openAiSpeech, openAiTranscribe } from './providers/openai';

export { BIT_VOICES, VOICE_STYLES } from '@/services/bit/voicePrefs';

export interface BitVoiceOptions {
  apiKey?: string;
  /**
   * Speech models, tried in order: when one has used up its quota (the free
   * tier allows about 10 requests a day per model) the next one speaks.
   */
  ttsModels?: readonly string[];
  voice?: string;
  /** Voices a request may ask for (default: Bit's voices, services/bit/voicePrefs.ts); the audition passes its candidates. */
  voices?: readonly string[];
  /** Recognition model (default: the chat model). */
  sttModel?: string;
  /** Recognition models tried in turn when it is out of quota (default: Bit's fallbacks). */
  sttFallbacks?: readonly string[];
  fetchImpl?: typeof fetch;
  allowedOrigins?: readonly string[];
  now?: () => number;
  /** Cache size in bytes of PCM (default 64 MB). */
  cacheBytes?: number;
  /** Folder for synthesised sentences kept across restarts (null: memory only). */
  cacheDir?: string | null;
  /** Who speaks and listens first (V4 §12.1, providers/index.ts); default: Gemini only. */
  provider?: ProviderChoice;
}

/** Native-sounding Kazakh first (gemini-3.8-flash-tts was rated best in our listening check). */
export const DEFAULT_TTS_MODELS = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts', 'gemini-3.1-flash-tts-preview'] as const;
export const DEFAULT_TTS_VOICE = 'Kore';
export const TTS_RATE = 24_000;
const MAX_TEXT = 500;
const MAX_AUDIO = 4 * 1024 * 1024;

const LANG_NAME: Record<BitLang, string> = { kk: 'Kazakh', ru: 'Russian', en: 'English' };

/** Instruction for the recogniser: the site language, the assistant's name, nothing but the words. */
export function sttPrompt(lang: BitLang) {
  return [
    `Transcribe exactly what the speaker says. The expected language is ${LANG_NAME[lang]}; the speaker may mix in ${lang === 'kk' ? 'Russian or English' : lang === 'ru' ? 'Kazakh or English' : 'Kazakh or Russian'} words — write each word in its own language.`,
    lang === 'kk' ? 'Write Kazakh in Kazakh Cyrillic with the letters ә ғ қ ң ө ұ ү һ і.' : '',
    'The speaker is a school student talking to a voice assistant called «Бит» (Bit) in an informatics lab. Write numbers as digits (500 000, not five hundred thousand).',
    'Output only the transcript, with no quotes, labels or comments. If there is no speech, output nothing.',
  ]
    .filter(Boolean)
    .join(' ');
}

/** How Bit sounds saying a sentence: praise, help after a mistake, a fun fact, or an explanation. */
export type VoiceMood = 'joyful' | 'supportive' | 'curious' | 'calm';

const MOOD_WORDS: Record<Exclude<VoiceMood, 'calm'>, RegExp> = {
  supportive: /(қателес|қате емес|қорықпа|уайымдама|ештеңе етпейді|қайта көр|не бойся|не страшно|ошиб|попробуй ещё|don'?t worry|mistake|try again|it'?s okay)/i,
  joyful: /(жарайсың|керемет|тамаша|құттықта|сенемін|сәттілік|молодец|отлично|поздравля|верю в тебя|удачи|well done|great job|congrat|believe in you|good luck|you are doing great)/i,
  curious: /(қызық|білесің бе|таңғаларлық|елестетші|интересно|знаешь ли|представь|удивительно|did you know|fun fact|imagine|amazing)/i,
};

/** The mood of a sentence (the first match: a mistake first, then praise, then a fun fact). */
export function voiceMood(text: string): VoiceMood {
  for (const mood of ['supportive', 'joyful', 'curious'] as const) if (MOOD_WORDS[mood].test(text)) return mood;
  return 'calm';
}

export interface VoiceDelivery {
  style?: VoiceStyle;
  /** The mood of each sentence (praise, help after a mistake, a fun fact) changes the delivery. */
  emotion?: boolean;
}

/** Who is speaking, per style: the default (teacher) is the 0.37 wording, so its recordings stay valid. */
const STYLE_WHO: Record<VoiceStyle, string> = {
  teacher: 'like a kind teacher',
  friend: 'like a cheerful school friend',
  energetic: 'like an energetic, enthusiastic presenter',
};

/** The director's note before the words (Gemini TTS reads only what follows the colon). */
function moodStyle(mood: VoiceMood, style: VoiceStyle) {
  const who = STYLE_WHO[style];
  switch (mood) {
    case 'joyful':
      return `in a joyful, excited and warm voice, ${who} proudly praising a student`;
    case 'supportive':
      return `in a gentle, warm and encouraging voice, ${who} helping after a mistake`;
    case 'curious':
      return style === 'teacher' ? 'in a curious, lively voice full of wonder, like sharing an amazing fact' : `in a curious, lively voice full of wonder, ${who} sharing an amazing fact`;
    default:
      return style === 'teacher'
        ? 'in a calm, clear and friendly voice, like a kind teacher explaining'
        : style === 'friend'
          ? `in a cheerful, relaxed and friendly voice, ${who} explaining`
          : `in a bright, energetic and upbeat voice, ${who} explaining`;
  }
}

/** The mood a sentence is said in: its own with emotion on, the style's calm one with it off. */
const moodOf = (text: string, d: VoiceDelivery) => (d.emotion === false ? 'calm' : voiceMood(text));

export const ttsPrompt = (lang: BitLang, text: string, d: VoiceDelivery = {}) => `Say ${moodStyle(moodOf(text, d), d.style ?? 'teacher')}, clearly in ${LANG_NAME[lang]}: ${text}`;

/**
 * Cache key of a synthesised text (the same in the warm-up script). Each
 * voice, style and mood is its own recording; the default style with emotion
 * on keeps the 0.37 key, so sentences recorded before stay in the cache.
 */
export function ttsKey(voice: string, lang: string, text: string, d: VoiceDelivery = {}) {
  const mood = moodOf(text, d);
  const style = d.style && d.style !== 'teacher' ? `${d.style}|` : '';
  return createHash('sha1').update(`${voice}|${lang}|${style}${mood === 'calm' ? '' : `${mood}|`}${text}`).digest('hex');
}

/** Raw request body up to `limit` bytes. */
function readRaw(req: IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('too large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

/** A small byte-bounded LRU of synthesised sentences. */
class PcmCache {
  private map = new Map<string, Buffer>();
  private bytes = 0;
  private readonly limit: number;
  constructor(limit: number) {
    this.limit = limit;
  }
  get(key: string) {
    const v = this.map.get(key);
    if (v) {
      this.map.delete(key);
      this.map.set(key, v);
    }
    return v;
  }
  set(key: string, v: Buffer) {
    if (v.length > this.limit / 4) return;
    this.map.set(key, v);
    this.bytes += v.length;
    for (const [k, old] of this.map) {
      if (this.bytes <= this.limit) break;
      this.map.delete(k);
      this.bytes -= old.length;
    }
  }
  get size() {
    return this.map.size;
  }
}

/** Audio chunks of one Gemini SSE event (base64 PCM), and a WAV header to skip if the model sends one. */
export function audioOfEvent(line: string): Buffer[] {
  if (!line.startsWith('data:')) return [];
  try {
    const d = JSON.parse(line.slice(5)) as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string } }> } }> };
    return (d.candidates?.[0]?.content?.parts ?? []).flatMap((p) => (p.inlineData?.data ? [Buffer.from(p.inlineData.data, 'base64')] : []));
  } catch {
    return [];
  }
}

/**
 * How long a model stays off after a 429: Google's RetryInfo when it sends
 * one (a used-up daily quota says hours), else a minute.
 */
export function quotaPause(body: string): number {
  try {
    const details = (JSON.parse(body) as { error?: { details?: Array<{ '@type'?: string; retryDelay?: string }> } }).error?.details ?? [];
    const delay = details.find((d) => d['@type']?.includes('RetryInfo'))?.retryDelay;
    const s = delay ? parseFloat(delay) : NaN;
    if (Number.isFinite(s) && s > 0) return Math.min(s * 1000, 24 * 3_600_000);
  } catch {
    /* not JSON */
  }
  return 60_000;
}

const stripWav = (b: Buffer) => (b.length > 44 && b.toString('latin1', 0, 4) === 'RIFF' ? b.subarray(44) : b);

export function createBitVoice(options: BitVoiceOptions = {}) {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY?.trim() ?? '';
  const ttsModels: readonly string[] = options.ttsModels ?? (process.env.GEMINI_TTS_MODEL?.trim() ? process.env.GEMINI_TTS_MODEL.split(',').map((m) => m.trim()).filter(Boolean) : DEFAULT_TTS_MODELS);
  const ttsModel = ttsModels[0];
  /** Models resting after a 429, until this time. */
  const resting = new Map<string, number>();
  const cacheDir = options.cacheDir === undefined ? (process.env.BIT_VOICE_CACHE_DIR?.trim() || join(process.cwd(), 'data', 'voice-cache')) : options.cacheDir;
  if (cacheDir && !existsSync(cacheDir)) {
    try {
      mkdirSync(cacheDir, { recursive: true });
    } catch {
      /* read-only disk: memory cache only */
    }
  }
  const fromDisk = (key: string): Buffer | null => {
    if (!cacheDir) return null;
    const file = join(cacheDir, `${key}.pcm.gz`);
    try {
      return existsSync(file) ? gunzipSync(readFileSync(file)) : null;
    } catch {
      return null;
    }
  };
  const toDisk = (key: string, pcm: Buffer) => {
    if (!cacheDir) return;
    gzip(pcm, (err, z) => {
      if (!err) writeFile(join(cacheDir, `${key}.pcm.gz`), z, () => undefined);
    });
  };
  const voice = options.voice ?? (process.env.GEMINI_TTS_VOICE?.trim() || DEFAULT_TTS_VOICE);
  const sttModel = options.sttModel ?? (process.env.GEMINI_STT_MODEL?.trim() || process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash');
  const sttModels = [...new Set([sttModel, ...(options.sttFallbacks ?? fallbackModelsFromEnv())])];
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const origins = options.allowedOrigins ?? [];
  const now = options.now ?? Date.now;
  const cache = new PcmCache(options.cacheBytes ?? 64 * 1024 * 1024);
  const openai = options.provider?.primary === 'openai' ? options.provider.openai : null;
  const configured = apiKey.length > 0 || !!openai;
  const hits = new Map<string, number[]>();
  const limited = (key: string, max: number) => {
    const t = now();
    const recent = (hits.get(key) ?? []).filter((x) => t - x < 60_000);
    recent.push(t);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear();
    return recent.length > max;
  };
  const refuse = (req: IncomingMessage, res: ServerResponse, kind: string, max: number) => {
    const origin = req.headers.origin;
    if (origin && origins.length && !origins.includes(origin)) return sendJson(res, 403, { error: 'origin' }), true;
    if (!configured) return sendJson(res, 503, { error: 'no-key' }), true;
    if (limited(`${kind}:${req.socket.remoteAddress ?? '?'}`, max)) return sendJson(res, 429, { error: 'rate-limited' }), true;
    return false;
  };
  const gemini = (model: string, method: string, body: unknown, signal: AbortSignal) =>
    fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:${method}`, {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
    });

  async function tts(req: IncomingMessage, res: ServerResponse, parsed?: { text: string; lang: BitLang; voice?: unknown; style?: unknown; emotion?: unknown; geminiOnly?: boolean }) {
    // a few sentences at a time: a long answer is several requests
    if (!parsed && refuse(req, res, 'tts', 150)) return;
    let body: { text?: unknown; lang?: unknown; voice?: unknown; style?: unknown; emotion?: unknown };
    try {
      body = parsed ?? JSON.parse((await readRaw(req, 8 * 1024)).toString('utf8'));
    } catch {
      return sendJson(res, 400, { error: 'bad-request' });
    }
    const text = typeof body.text === 'string' ? body.text.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT) : '';
    if (!text) return sendJson(res, 400, { error: 'empty-text' });
    if (!isBitLang(body.lang)) return sendJson(res, 400, { error: 'bad-lang' });
    // the student's choice (V4 §10) when it is one of Bit's voices, else the server's
    const who = typeof body.voice === 'string' && (options.voices ? options.voices.includes(body.voice) : isBitVoice(body.voice)) ? body.voice : voice;
    const delivery: VoiceDelivery = { style: isVoiceStyle(body.style) ? body.style : 'teacher', emotion: body.emotion !== false };
    // any of the models may have said it: the cache key is the voice, style, mood, language and words
    const key = ttsKey(who, body.lang, text, delivery);
    // OpenAI's voices sound different: their recordings have keys of their own
    const openKey = openai ? ttsKey(`openai:${who}`, body.lang, text, delivery) : null;
    const headers = { 'content-type': `audio/L16; rate=${TTS_RATE}; channels=1`, 'cache-control': 'no-store', 'x-accel-buffering': 'no' };
    for (const k of openKey ? [openKey, key] : [key]) {
      const hit = cache.get(k) ?? fromDisk(k);
      if (hit) {
        cache.set(k, hit);
        res.writeHead(200, { ...headers, 'x-bit-cache': 'hit' });
        return res.end(hit);
      }
    }
    if (openai && openKey && !parsed?.geminiOnly) {
      const done = await speakOpenAi(res, headers, openKey, text, body.lang, who as BitVoiceId, delivery.style ?? 'teacher');
      if (done) return;
      // OpenAI could not: Gemini says it (or, with no Gemini key, the browser does)
      if (!apiKey) return sendJson(res, 503, { error: 'quota' });
    }
    const model = ttsModels.find((m) => (resting.get(m) ?? 0) <= now());
    // every model's quota is used up: the browser reads it with its own voice
    if (!model) return sendJson(res, 503, { error: 'quota' });
    const again = { text, lang: body.lang, voice: who, style: delivery.style, emotion: delivery.emotion, geminiOnly: true };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    res.on('close', () => controller.abort());
    let started = false;
    try {
      const upstream = await gemini(
        model,
        'streamGenerateContent?alt=sse',
        { contents: [{ parts: [{ text: ttsPrompt(body.lang, text, delivery) }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: who } } } } },
        controller.signal,
      );
      if (upstream.status === 429) {
        const pause = quotaPause(await upstream.text().catch(() => ''));
        resting.set(model, now() + pause);
        console.warn(`[bit-voice] ${model}: quota used up, resting ${Math.round(pause / 60_000)} min`);
        clearTimeout(timer);
        // the next model may still have quota: try again with it
        return tts(req, res, again);
      }
      if (!upstream.ok || !upstream.body) {
        console.warn('[bit-voice] tts answered', upstream.status);
        return sendJson(res, 502, { error: 'upstream' });
      }
      res.writeHead(200, { ...headers, 'x-bit-model': model });
      started = true;
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      const all: Buffer[] = [];
      let buffer = '';
      let first = true;
      const flush = (line: string) => {
        for (let chunk of audioOfEvent(line.trim())) {
          if (first) chunk = stripWav(chunk);
          first = false;
          all.push(chunk);
          res.write(chunk);
        }
      };
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) >= 0) {
          flush(buffer.slice(0, nl));
          buffer = buffer.slice(nl + 1);
        }
      }
      if (buffer) flush(buffer);
      const pcm = Buffer.concat(all);
      if (pcm.length) {
        cache.set(key, pcm);
        toDisk(key, pcm);
      }
      res.end();
    } catch (error) {
      if (!controller.signal.aborted) console.warn('[bit-voice] tts failed:', (error as Error).message);
      if (!started) return sendJson(res, 502, { error: controller.signal.aborted ? 'timeout' : 'upstream' });
      res.end();
    } finally {
      clearTimeout(timer);
    }
  }

  /** OpenAI's speech (raw PCM, the same format as Gemini's), streamed and cached; false when it could not speak. */
  async function speakOpenAi(res: ServerResponse, headers: Record<string, string>, key: string, text: string, lang: BitLang, who: BitVoiceId, style: VoiceStyle): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    res.on('close', () => controller.abort());
    try {
      const r = await openAiSpeech(openai!, text, who, style, LANG_NAME[lang], controller.signal);
      if (!r.ok || !r.body) {
        console.warn('[bit-voice] openai tts answered', r.status);
        return false;
      }
      res.writeHead(200, { ...headers, 'x-bit-model': `openai:${openai!.ttsModel}` });
      const reader = r.body.getReader();
      const all: Buffer[] = [];
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = Buffer.from(value);
        all.push(chunk);
        res.write(chunk);
      }
      const pcm = Buffer.concat(all);
      if (pcm.length) {
        cache.set(key, pcm);
        toDisk(key, pcm);
      }
      res.end();
      return true;
    } catch (error) {
      if (!controller.signal.aborted) console.warn('[bit-voice] openai tts failed:', (error as Error).message);
      if (res.headersSent) {
        res.end();
        return true;
      }
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  async function stt(req: IncomingMessage, res: ServerResponse, lang: string | null) {
    if (refuse(req, res, 'stt', 40)) return;
    if (!isBitLang(lang)) return sendJson(res, 400, { error: 'bad-lang' });
    const mime = String(req.headers['content-type'] ?? '').split(';')[0].trim();
    if (!/^audio\/(webm|ogg|wav|x-wav|mp4|mpeg|aac|mp3)$/.test(mime)) return sendJson(res, 415, { error: 'bad-audio' });
    let audio: Buffer;
    try {
      audio = await readRaw(req, MAX_AUDIO);
    } catch {
      return sendJson(res, 413, { error: 'too-large' });
    }
    if (audio.length < 1000) return sendJson(res, 200, { text: '' });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      // V4 §12.1: OpenAI listens first when it is the chosen provider
      if (openai) {
        const heard = await openAiTranscribe(openai, audio, mime === 'audio/x-wav' ? 'audio/wav' : mime, lang, sttPrompt(lang), controller.signal).catch(() => ({ ok: false as const, status: 0 }));
        if (heard.ok) return sendJson(res, 200, { text: heard.text.replace(/^["«]|["»]$/g, '').slice(0, 600) });
        console.warn('[bit-voice] openai stt answered', heard.status);
        if (!apiKey) return sendJson(res, 502, { error: heard.status === 429 ? 'quota' : 'upstream' });
      }
      // a model out of quota rests (as for speech) and the next one listens
      let upstream: Response | null = null;
      for (const model of sttModels.filter((m) => (resting.get(m) ?? 0) <= now())) {
        upstream = await gemini(
          model,
          'generateContent',
          {
            contents: [{ parts: [{ inlineData: { mimeType: mime === 'audio/x-wav' ? 'audio/wav' : mime, data: audio.toString('base64') } }, { text: sttPrompt(lang) }] }],
            generationConfig: { temperature: 0, maxOutputTokens: 300, thinkingConfig: { thinkingLevel: /3\.[89]|pro/.test(model) ? 'low' : 'minimal' } },
          },
          controller.signal,
        );
        if (upstream.status !== 429) break;
        resting.set(model, now() + quotaPause(await upstream.text()));
      }
      if (!upstream) return sendJson(res, 502, { error: 'quota' });
      if (!upstream.ok) {
        console.warn('[bit-voice] stt answered', upstream.status);
        return sendJson(res, 502, { error: upstream.status === 429 ? 'quota' : 'upstream' });
      }
      const data = (await upstream.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }> };
      const text = (data.candidates?.[0]?.content?.parts ?? [])
        .filter((p) => !p.thought)
        .map((p) => p.text ?? '')
        .join('')
        .replace(/^["«]|["»]$/g, '')
        .trim()
        .slice(0, 600);
      sendJson(res, 200, { text });
    } catch (error) {
      if (!controller.signal.aborted) console.warn('[bit-voice] stt failed:', (error as Error).message);
      sendJson(res, 502, { error: controller.signal.aborted ? 'timeout' : 'upstream' });
    } finally {
      clearTimeout(timer);
    }
  }

  /** Handles /api/ai/bit/tts and /stt; false for any other path. */
  async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const url = new URL(req.url ?? '/', 'http://local');
    if (req.method !== 'POST') return false;
    if (url.pathname === '/api/ai/bit/tts') await tts(req, res);
    else if (url.pathname === '/api/ai/bit/stt') await stt(req, res, url.searchParams.get('lang'));
    else return false;
    return true;
  }

  /** Quota left for speech right now: false when every model is resting (cached sentences still play). */
  const ttsAvailable = () => ttsModels.some((m) => (resting.get(m) ?? 0) <= now());
  return Object.assign(handle, { configured, provider: openai ? ('openai' as const) : ('gemini' as const), ttsModel, ttsModels, voice, sttModel, ttsAvailable, cacheSize: () => cache.size });
}
