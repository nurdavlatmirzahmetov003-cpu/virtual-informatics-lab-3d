/**
 * How Bit sounds (V4 §10), shared by the browser and the server: the voices
 * a student can choose, the speaking styles and speeds, the saved choice and
 * the sentences the Preview buttons say. No dependencies, used in tests.
 *
 * The voices are Gemini TTS voices that read Kazakh cleanly: each one said
 * the Kazakh preview and the recogniser wrote it back
 * (scripts/bit-voice-audition.mjs, results in docs/v4-section10/audition.json);
 * the ones whose words came back wrong are not offered.
 */

export const BIT_VOICES = [
  { id: 'Kore', kind: 'female' },
  { id: 'Leda', kind: 'female' },
  { id: 'Sulafat', kind: 'female' },
  { id: 'Charon', kind: 'male' },
  { id: 'Puck', kind: 'male' },
  // median pitch 160 Hz, between the men (~110 Hz) and the women (~190 Hz)
  { id: 'Orus', kind: 'neutral' },
] as const;
export type BitVoiceId = (typeof BIT_VOICES)[number]['id'];
export type VoiceKind = (typeof BIT_VOICES)[number]['kind'];
export const isBitVoice = (v: unknown): v is BitVoiceId => BIT_VOICES.some((x) => x.id === v);

/** How Bit speaks in general; the mood of each sentence colours it when emotion is on. */
export const VOICE_STYLES = ['teacher', 'friend', 'energetic'] as const;
export type VoiceStyle = (typeof VOICE_STYLES)[number];
export const isVoiceStyle = (v: unknown): v is VoiceStyle => VOICE_STYLES.includes(v as VoiceStyle);

/**
 * Playback speeds. The recording is the same at every speed (no extra quota):
 * the browser plays it faster or slower and keeps the pitch.
 */
export const VOICE_SPEEDS = [0.85, 1, 1.15] as const;
export type VoiceSpeed = (typeof VOICE_SPEEDS)[number];

export interface VoicePrefs {
  voice: BitVoiceId;
  style: VoiceStyle;
  speed: VoiceSpeed;
  /** Praise, help after a mistake and fun facts each sound their own way. */
  emotion: boolean;
}

export const DEFAULT_VOICE_PREFS: VoicePrefs = { voice: 'Kore', style: 'teacher', speed: 1, emotion: true };

/** A saved or sent choice, with anything unknown replaced by the default. */
export function normalizeVoicePrefs(raw: unknown): VoicePrefs {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof VoicePrefs, unknown>>;
  return {
    voice: isBitVoice(r.voice) ? r.voice : DEFAULT_VOICE_PREFS.voice,
    style: isVoiceStyle(r.style) ? r.style : DEFAULT_VOICE_PREFS.style,
    speed: VOICE_SPEEDS.find((s) => s === r.speed) ?? DEFAULT_VOICE_PREFS.speed,
    emotion: r.emotion !== false,
  };
}

/**
 * What the Preview buttons say: one sentence each, so a preview is one
 * request (and one cache entry) per voice and style.
 */
export const VOICE_PREVIEW = {
  kk: {
    hello: 'Сәлем, мен Битпін, бүгін компьютердің ішінде не бар екенін бірге көреміз.',
    joy: 'Жарайсың, тапсырманы өте жақсы орындадың!',
  },
  ru: {
    hello: 'Привет, я Бит, сегодня мы вместе посмотрим, что находится внутри компьютера.',
    joy: 'Молодец, ты отлично справился с заданием!',
  },
  en: {
    hello: "Hi, I'm Bit, and today we will look inside a computer together.",
    joy: 'Well done, you did a great job on this task!',
  },
} as const;
