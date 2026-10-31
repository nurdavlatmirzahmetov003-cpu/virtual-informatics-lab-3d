/**
 * Bit through OpenAI (V4 §12.1): the same three jobs as Gemini — a streamed
 * answer, speech and recognition — behind the provider slot. Inactive until
 * the owner sets BIT_PROVIDER=openai and OPENAI_API_KEY in .env; Gemini
 * stays the fallback for anything this adapter cannot do at the moment.
 *
 *   chat   POST /v1/chat/completions (stream)         → text deltas (SSE)
 *   speech POST /v1/audio/speech (response_format pcm) → 24 kHz 16-bit mono PCM, as Gemini's
 *   ears   POST /v1/audio/transcriptions (multipart)   → { text }
 *
 * The key goes in the Authorization header only, never in a URL or a log.
 */
import type { BitVoiceId, VoiceKind, VoiceStyle } from '@/services/bit/voicePrefs';
import { BIT_VOICES } from '@/services/bit/voicePrefs';

export const OPENAI_BASE = 'https://api.openai.com/v1';

export interface OpenAiConfig {
  apiKey: string;
  chatModel: string;
  ttsModel: string;
  sttModel: string;
  fetchImpl: typeof fetch;
}

export function openAiConfig(env: NodeJS.ProcessEnv = process.env, fetchImpl: typeof fetch = globalThis.fetch): OpenAiConfig {
  return {
    apiKey: env.OPENAI_API_KEY?.trim() ?? '',
    // OPENAI_MODEL is the name the setup assistant already reads (server/ai.ts)
    chatModel: env.OPENAI_BIT_MODEL?.trim() || env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
    ttsModel: env.OPENAI_TTS_MODEL?.trim() || 'gpt-4o-mini-tts',
    sttModel: env.OPENAI_STT_MODEL?.trim() || 'gpt-4o-mini-transcribe',
    fetchImpl,
  };
}

/** Bit's turns (Gemini's shape: role user/model, parts of text) → OpenAI messages. */
export function toOpenAiMessages(system: string, contents: ReadonlyArray<{ role: string; parts: ReadonlyArray<{ text?: string }> }>) {
  return [
    { role: 'system', content: system },
    ...contents.map((c) => ({ role: c.role === 'model' ? 'assistant' : 'user', content: c.parts.map((p) => p.text ?? '').join('') })),
  ];
}

/** One SSE line of a streamed chat answer: its text, and why it stopped (content_filter = blocked). */
export function parseOpenAiEvent(line: string): { text: string; blocked?: string; finish?: string } | null {
  if (!line.startsWith('data:')) return null;
  const data = line.slice(5).trim();
  if (data === '[DONE]') return { text: '', finish: 'STOP' };
  try {
    const d = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string | null; refusal?: string | null }; finish_reason?: string | null }> };
    const c = d.choices?.[0];
    if (!c) return null;
    const finish = c.finish_reason === 'content_filter' ? 'SAFETY' : c.finish_reason ? c.finish_reason.toUpperCase() : undefined;
    return { text: c.delta?.content ?? '', ...(c.delta?.refusal ? { blocked: 'REFUSAL' } : {}), ...(finish ? { finish } : {}) };
  } catch {
    return null;
  }
}

export function openAiChat(cfg: OpenAiConfig, messages: unknown[], signal: AbortSignal) {
  return cfg.fetchImpl(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ model: cfg.chatModel, messages, stream: true, temperature: 0.5, max_tokens: 512 }),
  });
}

/** OpenAI's voice for each of Bit's (by how they sound: women's, men's, in between). */
const VOICE_OF: Record<VoiceKind, readonly string[]> = { female: ['nova', 'shimmer', 'coral'], male: ['onyx', 'echo'], neutral: ['alloy'] };
export function openAiVoice(voice: BitVoiceId): string {
  const kind = BIT_VOICES.find((v) => v.id === voice)?.kind ?? 'female';
  const same = BIT_VOICES.filter((v) => v.kind === kind).map((v) => v.id as string);
  const list = VOICE_OF[kind];
  return list[Math.max(0, same.indexOf(voice)) % list.length];
}

const STYLE_NOTE: Record<VoiceStyle, string> = {
  teacher: 'Speak like a calm, kind teacher explaining to a school student.',
  friend: 'Speak like a cheerful school friend.',
  energetic: 'Speak like an energetic, enthusiastic presenter.',
};

/** Speech as raw PCM (24 kHz, 16-bit, mono): the body streams straight to the browser. */
export function openAiSpeech(cfg: OpenAiConfig, text: string, voice: BitVoiceId, style: VoiceStyle, language: string, signal: AbortSignal) {
  return cfg.fetchImpl(`${OPENAI_BASE}/audio/speech`, {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ model: cfg.ttsModel, input: text, voice: openAiVoice(voice), response_format: 'pcm', instructions: `${STYLE_NOTE[style]} The text is in ${language}; pronounce it as a native speaker.` }),
  });
}

/** The recognised words of a recording (empty when nothing was said). */
export async function openAiTranscribe(cfg: OpenAiConfig, audio: Buffer, mime: string, lang: string, prompt: string, signal: AbortSignal): Promise<{ ok: true; text: string } | { ok: false; status: number }> {
  const ext = mime.split('/')[1]?.replace('x-', '').replace('mpeg', 'mp3') ?? 'webm';
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(audio)], { type: mime }), `speech.${ext}`);
  form.append('model', cfg.sttModel);
  form.append('language', lang);
  form.append('prompt', prompt);
  const r = await cfg.fetchImpl(`${OPENAI_BASE}/audio/transcriptions`, { method: 'POST', signal, headers: { authorization: `Bearer ${cfg.apiKey}` }, body: form });
  if (!r.ok) return { ok: false, status: r.status };
  const j = (await r.json()) as { text?: string };
  return { ok: true, text: (j.text ?? '').trim() };
}
