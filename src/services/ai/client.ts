/**
 * Browser entry point of the AI assistant. Tries the server-side LLM
 * endpoint (the API key lives only on the server) and falls back to the
 * local engine whenever it is disabled, missing, slow or answers with
 * anything that does not validate. Both paths end in the same catalog-only,
 * compatibility-checked suggestSetup().
 */
import type { Build } from '@/lib/studio/build';
import { diffBuilds, isValidBuild, suggestSetup } from './engine';
import { parseRequest } from './parse';
import type { AssistantReply, AssistantRequest } from './types';
import { mergeAnswer, sanitizeLlmAnswer } from './validate';

export const AI_ENDPOINT = '/api/ai/recommend';
const TIMEOUT_MS = 9000;
/** After a failed call, stay local for a while instead of waiting on every message. */
const RETRY_AFTER_MS = 60_000;
let serverDownUntil = 0;

export interface AssistantContext {
  /** Request the conversation has built so far (or the studio's purpose/budget/style). */
  previous: AssistantRequest;
  /** Improve mode: the build to compare against. */
  current?: Build;
}

interface AskOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** Skip the server (tests, or the user chose local mode). */
  localOnly?: boolean;
}

function serverEnabled() {
  // VITE_AI_SERVER=off builds a purely local assistant (no network call at all).
  const env = (import.meta as { env?: Record<string, string | undefined> }).env;
  return env?.VITE_AI_SERVER !== 'off';
}

function reply(request: AssistantRequest, extra: Partial<AssistantReply> & Pick<AssistantReply, 'source'>, current?: Build): AssistantReply {
  const suggestion = suggestSetup(request);
  return { ...suggestion, ...extra, changes: current ? diffBuilds(current, suggestion.build) : undefined };
}

export async function askAssistant(message: string, context: AssistantContext, options: AskOptions = {}): Promise<AssistantReply> {
  const local = parseRequest(message, context.previous);
  const fallback = (reason: AssistantReply['fallbackReason']) => reply(local, { source: 'local', fallbackReason: reason }, context.current);

  if (options.localOnly || !serverEnabled()) return fallback('disabled');
  if (Date.now() < serverDownUntil) return fallback('unavailable');

  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? TIMEOUT_MS);
  try {
    const res = await fetchImpl(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message.slice(0, 1000), context: { request: context.previous, current: context.current } }),
      signal: controller.signal,
    });
    if (!res.ok) {
      serverDownUntil = Date.now() + RETRY_AFTER_MS;
      return fallback('unavailable');
    }
    const body: unknown = await res.json();
    const answer = sanitizeLlmAnswer((body as { answer?: unknown } | null)?.answer);
    if (!answer) return fallback('invalid');
    const request = mergeAnswer(local, answer);
    const result = reply(request, { source: 'llm', note: answer.note }, context.current);
    return isValidBuild(result.build) ? result : fallback('invalid');
  } catch {
    serverDownUntil = Date.now() + RETRY_AFTER_MS;
    return fallback('unavailable');
  } finally {
    clearTimeout(timer);
  }
}

/** Test hook: forget a previous server failure. */
export function resetAssistantServerState() {
  serverDownUntil = 0;
}
