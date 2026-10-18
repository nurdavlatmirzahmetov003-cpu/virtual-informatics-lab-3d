/**
 * AI assistant routes (MASTER_PROMPT §18), served by the lab server
 * (server/main.ts). The only place an LLM API key is read — from `.env` /
 * the environment, never from browser code.
 *
 *   POST /api/ai/recommend     { message, context } → { answer }
 *   GET  /api/ai/health        → { configured, provider }
 *
 * The model turns the message into a structured request and may pin catalog
 * ids; the answer is validated here (sanitizeLlmAnswer) and again in the
 * browser, where the deterministic engine builds the final setup. Without a
 * key every call returns 503 and the browser silently stays local.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { ANSWER_SCHEMA, catalogDigest } from '@/services/ai/catalogDigest';
import { sanitizeLlmAnswer } from '@/services/ai/validate';
import { loadEnv } from './env';

/* ── configuration ───────────────────────────────────────── */

loadEnv();

type Provider = 'gemini' | 'anthropic' | 'openai';
const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 20_000);
const provider: Provider | null = (() => {
  const wanted = process.env.AI_PROVIDER?.toLowerCase();
  if (wanted === 'gemini' && process.env.GEMINI_API_KEY) return 'gemini';
  if (wanted === 'openai' && process.env.OPENAI_API_KEY) return 'openai';
  if (wanted === 'anthropic' && process.env.ANTHROPIC_API_KEY) return 'anthropic';
  // Gemini first: one key then serves both Bit and the setup assistant
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return null;
})();
const MODEL =
  provider === 'gemini'
    ? (process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash')
    : provider === 'anthropic'
      ? (process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5-5')
      : (process.env.OPENAI_MODEL ?? 'gpt-4o-mini');

const SYSTEM = [
  'You are the setup assistant of an educational computer lab for school students in Kazakhstan.',
  'Read the user message (Kazakh, Russian or English) and answer with ONE JSON object only, no prose, matching this schema:',
  ANSWER_SCHEMA,
  'Rules:',
  '- Use ONLY product ids from the catalog below in "pins". Never invent models, specs or prices.',
  '- Pin a product only when the user asked for it or it clearly fits; the lab engine completes and checks the rest.',
  '- Gaming priorities: GPU > CPU > RAM > SSD. Study / programming: CPU + RAM + SSD before RGB accessories.',
  '- Keep the total near the budget; prices are demo values in KZT.',
  '- "note" is a short, friendly explanation in Kazakh.',
  'Catalog (id | category | product | price | tier | key specs):',
  catalogDigest(),
].join('\n');

/* ── LLM providers ───────────────────────────────────────── */

async function callModel(message: string, context: unknown, signal: AbortSignal): Promise<string> {
  const user = `Current request state: ${JSON.stringify(context ?? {})}\nUser message: ${message}`;
  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 800, system: SYSTEM, messages: [{ role: 'user', content: user }] }),
    });
    if (!res.ok) throw new Error(`anthropic ${res.status}`);
    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    return data.content?.find((c) => c.type === 'text')?.text ?? '';
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? '';
}

/** First balanced {...} block of the model's text. */
function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

/* ── HTTP ────────────────────────────────────────────────── */

const MAX_BODY = 8 * 1024;
const RATE = { windowMs: 60_000, max: 20 };
const hits = new Map<string, number[]>();

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('too large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE.max;
}

/** Handles /api/ai/*; returns false for any other path. */
export async function handleAi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  if (!req.url?.startsWith('/api/ai/')) return false;
  await aiRoute(req, res);
  return true;
}

async function aiRoute(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'GET' && req.url === '/api/ai/health') return json(res, 200, { configured: provider !== null, provider, model: provider ? MODEL : null });
  if (req.method !== 'POST' || req.url !== '/api/ai/recommend') return json(res, 404, { error: 'not-found' });
  if (!provider) return json(res, 503, { error: 'no-key' });
  if (limited(req.socket.remoteAddress ?? '?')) return json(res, 429, { error: 'rate-limited' });

  let payload: { message?: unknown; context?: unknown };
  try {
    payload = JSON.parse(await readBody(req));
  } catch {
    return json(res, 400, { error: 'bad-request' });
  }
  const message = typeof payload.message === 'string' ? payload.message.trim().slice(0, 1000) : '';
  if (!message) return json(res, 400, { error: 'empty-message' });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const answer = sanitizeLlmAnswer(extractJson(await callModel(message, payload.context, controller.signal)));
    if (!answer) return json(res, 502, { error: 'invalid-answer' });
    return json(res, 200, { answer, provider });
  } catch (error) {
    // never log the message or the key; status codes are enough to diagnose
    console.warn('[ai-server] upstream failed:', (error as Error).message);
    return json(res, 502, { error: 'upstream' });
  } finally {
    clearTimeout(timer);
  }
}

export const aiStatus = () => ({ provider, model: provider ? MODEL : null });
