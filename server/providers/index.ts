/**
 * Bit's AI provider slot (V4 §12.1). BIT_PROVIDER=gemini|openai in .env says
 * who answers, speaks and listens first; Gemini is the default and always
 * the fallback. OpenAI takes part only when its key is set too, so adding
 * BIT_PROVIDER=openai alone changes nothing.
 *
 *   selectProvider(env) → { primary, fallback, reason }
 */
import { openAiConfig, type OpenAiConfig } from './openai';

export type ProviderName = 'gemini' | 'openai';

export interface ProviderChoice {
  /** Who is asked first. */
  primary: ProviderName;
  /** Who is asked when the first one fails (always Gemini, when it has a key). */
  fallback: ProviderName | null;
  /** Why this choice (health check, logs; never a key). */
  reason: 'default' | 'chosen' | 'openai-without-key' | 'unknown-provider';
  openai: OpenAiConfig | null;
}

export function selectProvider(env: NodeJS.ProcessEnv = process.env, fetchImpl: typeof fetch = globalThis.fetch): ProviderChoice {
  const wanted = (env.BIT_PROVIDER ?? '').trim().toLowerCase();
  const gemini = !!env.GEMINI_API_KEY?.trim();
  const cfg = openAiConfig(env, fetchImpl);
  if (wanted === 'openai') {
    if (!cfg.apiKey) return { primary: 'gemini', fallback: null, reason: 'openai-without-key', openai: null };
    return { primary: 'openai', fallback: gemini ? 'gemini' : null, reason: 'chosen', openai: cfg };
  }
  return { primary: 'gemini', fallback: null, reason: wanted && wanted !== 'gemini' ? 'unknown-provider' : wanted ? 'chosen' : 'default', openai: null };
}

/** One line for the server log at start: who answers, never a key. */
export function describeProvider(p: ProviderChoice): string {
  if (p.primary === 'openai') return `Bit's AI: OpenAI (${p.openai?.chatModel}), Gemini ${p.fallback ? 'as fallback' : 'not configured'}`;
  if (p.reason === 'openai-without-key') return "Bit's AI: Gemini (BIT_PROVIDER=openai, but OPENAI_API_KEY is empty)";
  if (p.reason === 'unknown-provider') return "Bit's AI: Gemini (BIT_PROVIDER is neither gemini nor openai)";
  return "Bit's AI: Gemini";
}
