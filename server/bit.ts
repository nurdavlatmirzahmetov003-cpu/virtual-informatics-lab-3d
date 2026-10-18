/**
 * Bit, the voice assistant (0.36): a thin streaming proxy to Google Gemini.
 * The key (GEMINI_API_KEY) is read here only — it never reaches the browser.
 *
 *   GET  /api/ai/bit/health   → { configured, model }
 *   POST /api/ai/bit/ask      { message, lang, history?, page? }
 *                             → application/x-ndjson: {"d":"text"}… then {"done":true} or {"error":code}
 *
 * The answer language is the site language sent by the browser, never the
 * language of the question. Text is streamed as it is generated, so the
 * browser can start speaking the first sentence while the rest is written.
 * Bit's built-in answers, navigation, tours and lessons work without this.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { SECTIONS, isSectionId } from '@/services/bit/sections';

export type BitLang = 'kk' | 'ru' | 'en';
const LANGS: readonly BitLang[] = ['kk', 'ru', 'en'];

export interface BitTurn {
  role: 'user' | 'bit';
  text: string;
}

export interface BitOptions {
  apiKey?: string;
  model?: string;
  /** How much the model "thinks" before answering (see geminiThinking); null = the model's default. */
  thinking?: Record<string, unknown> | null;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** Requests per IP per minute. */
  ratePerMinute?: number;
  /** Server voice (bitVoice.ts) is on: the health check tells the browser to use it. */
  voice?: { tts: boolean; stt: boolean };
  /** Browsers on other sites may not spend the lab's quota (empty: no check, as in tests). */
  allowedOrigins?: readonly string[];
  now?: () => number;
}

const LANGUAGE_RULES: Record<BitLang, string> = {
  kk: [
    'Answer ONLY in Kazakh (қазақ тілі), written in Kazakh Cyrillic, even if the student writes in Russian or English.',
    'Write clean, literary, grammatical Kazakh (әдеби тіл): correct vowel harmony, case and possessive endings, natural Kazakh word order (verb at the end).',
    'Always use the Kazakh letters ә ғ қ ң ө ұ ү һ і where the word needs them; never replace them with Russian look-alikes.',
    'Use established Kazakh informatics terms: процессор, жедел жад, жинақтауыш, қатқыл диск, аналық плата, қуат блогы, видеокарта, бағдарлама, бағдарламалау, желі, маршрутизатор, коммутатор, алгоритм, деректер, файл, қалта, құпия сөз, пернетақта, тінтуір. Do not mix in Russian words or Russian grammar.',
    'Address the student as «сен», warmly, like a kind teacher.',
  ].join(' '),
  ru: 'Answer ONLY in Russian, even if the student writes in Kazakh or English. Use correct, natural literary Russian; address the student as «ты», warmly, like a kind teacher.',
  en: 'Answer ONLY in English, even if the student writes in Kazakh or Russian. Use clear, simple, correct English, warmly, like a kind teacher.',
};

/** The instructions Gemini gets for one answer (exported for tests). */
export function bitSystemPrompt(lang: BitLang, page: string | null): string {
  const sections = SECTIONS.map((s) => `${s.id} (${s.route})`).join(', ');
  return [
    'You are «Бит» (Bit), the friendly robot guide of BitLab, a 3D virtual informatics lab website for school students (grades 5–11) in Kazakhstan.',
    `LANGUAGE: ${LANGUAGE_RULES[lang]} Never switch language on your own, never translate your answer, never answer in two languages.`,
    'STYLE: your reply is read aloud by a speech synthesiser. Write 2–4 short spoken sentences, at most 80 words. No markdown, no lists, no headings, no emoji, no code blocks. Explain simply, with one concrete example when it helps.',
    'SCOPE: informatics, computers and their parts, networks, the internet, algorithms, programming, logic, digital safety, and how to use this website. If asked about something else, answer in one sentence and steer back to informatics. Never ask for personal data.',
    'FACTS: if you are not sure, say so. Do not invent prices or product models; for a computer build, suggest the student says: "Bit, build a PC for 400000 tenge" (in the answer language).',
    `WEBSITE SECTIONS (id and address): ${sections}.`,
    'ACTIONS: when the student asks to open or go to a part of the site, or a section clearly helps, put exactly one tag [[go:ID]] at the very end, with an id from the list. Otherwise add no tag.',
    page && isSectionId(page) ? `The student is now on the "${page}" section.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export const isBitLang = (v: unknown): v is BitLang => typeof v === 'string' && (LANGS as readonly string[]).includes(v);

/** History as Gemini contents: alternating user / model turns, newest last, bounded. */
export function toContents(history: unknown, message: string) {
  const turns: BitTurn[] = Array.isArray(history)
    ? history
        .filter((t): t is BitTurn => !!t && typeof t === 'object' && ((t as BitTurn).role === 'user' || (t as BitTurn).role === 'bit') && typeof (t as BitTurn).text === 'string')
        .slice(-8)
        .map((t) => ({ role: t.role, text: t.text.slice(0, 600) }))
    : [];
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  for (const t of turns) {
    const role = t.role === 'user' ? 'user' : 'model';
    const last = contents[contents.length - 1];
    // Gemini wants turns to alternate: merge two in a row
    if (last && last.role === role) last.parts[0].text += `\n${t.text}`;
    else contents.push({ role, parts: [{ text: t.text }] });
  }
  if (contents[0]?.role === 'model') contents.shift();
  const last = contents[contents.length - 1];
  if (last?.role === 'user') last.parts[0].text += `\n${message}`;
  else contents.push({ role: 'user', parts: [{ text: message }] });
  return contents;
}

/** Text pieces in one Gemini SSE event (`data: {...}`), and a block reason if the prompt was refused. */
export function parseGeminiEvent(line: string): { text: string; blocked?: string; finish?: string } | null {
  if (!line.startsWith('data:')) return null;
  try {
    const data = JSON.parse(line.slice(5).trim()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> }; finishReason?: string }>;
      promptFeedback?: { blockReason?: string };
    };
    const c = data.candidates?.[0];
    const text = (c?.content?.parts ?? []).filter((p) => !p.thought && typeof p.text === 'string').map((p) => p.text).join('');
    return { text, blocked: data.promptFeedback?.blockReason, finish: c?.finishReason };
  } catch {
    return null;
  }
}

const MAX_BODY = 16 * 1024;

function sendJson(res: ServerResponse, status: number, body: unknown) {
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

/** The default model: the fastest first word with clean Kazakh in our tests (2026-10; gemini-2.5-flash is retired for new keys). */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';

/**
 * Thinking makes the first spoken word late, so Bit thinks as little as the
 * model allows: Gemini 3 takes a level (3.8 Flash and Pro refuse "minimal"),
 * Gemini 2.x a token budget. GEMINI_THINKING overrides: a level or a number.
 */
export function geminiThinking(model: string, override = process.env.GEMINI_THINKING?.trim() ?? ''): Record<string, unknown> | null {
  if (override === 'default') return null;
  if (override) return /^\d+$/.test(override) ? { thinkingBudget: Number(override) } : { thinkingLevel: override };
  if (/^gemini-2\.\d+-flash/.test(model)) return { thinkingBudget: 0 };
  if (/^gemini-[3-9]/.test(model)) return { thinkingLevel: /pro|3\.[89]|[4-9]\./.test(model) ? 'low' : 'minimal' };
  return null;
}

export function createBit(options: BitOptions = {}) {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY?.trim() ?? '';
  const model = options.model ?? (process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL);
  const thinking = options.thinking !== undefined ? options.thinking : geminiThinking(model);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? Number(process.env.AI_TIMEOUT_MS ?? 20_000);
  const rate = options.ratePerMinute ?? 30;
  const now = options.now ?? Date.now;
  const hits = new Map<string, number[]>();
  const configured = apiKey.length > 0;

  const limited = (ip: string) => {
    const t = now();
    const recent = (hits.get(ip) ?? []).filter((x) => t - x < 60_000);
    recent.push(t);
    hits.set(ip, recent);
    if (hits.size > 5000) hits.clear();
    return recent.length > rate;
  };

  const origins = options.allowedOrigins ?? [];

  async function ask(req: IncomingMessage, res: ServerResponse) {
    const origin = req.headers.origin;
    if (origin && origins.length && !origins.includes(origin)) return sendJson(res, 403, { error: 'origin' });
    if (!configured) return sendJson(res, 503, { error: 'no-key' });
    if (limited(req.socket.remoteAddress ?? '?')) return sendJson(res, 429, { error: 'rate-limited' });
    let body: { message?: unknown; lang?: unknown; history?: unknown; page?: unknown };
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      return sendJson(res, 400, { error: 'bad-request' });
    }
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 600) : '';
    if (!message) return sendJson(res, 400, { error: 'empty-message' });
    if (!isBitLang(body.lang)) return sendJson(res, 400, { error: 'bad-lang' });
    const page = typeof body.page === 'string' ? body.page : null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    // the student closed the panel or asked something else: stop paying for this answer
    res.on('close', () => controller.abort());
    const generationConfig: Record<string, unknown> = { temperature: 0.5, topP: 0.9, maxOutputTokens: 512 };
    if (thinking) generationConfig.thinkingConfig = thinking;
    let started = false;
    try {
      const upstream = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
        method: 'POST',
        signal: controller.signal,
        // the key travels in a header, never in the URL (URLs end up in logs)
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: bitSystemPrompt(body.lang, page) }] },
          contents: toContents(body.history, message),
          generationConfig,
        }),
      });
      if (!upstream.ok || !upstream.body) {
        console.warn('[bit] gemini answered', upstream.status);
        return sendJson(res, 502, { error: upstream.status === 429 ? 'busy' : 'upstream' });
      }
      res.writeHead(200, { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' });
      started = true;
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let blocked = '';
      const handle = (line: string) => {
        const ev = parseGeminiEvent(line.trim());
        if (!ev) return;
        if (ev.blocked) blocked = ev.blocked;
        if (ev.text) res.write(`${JSON.stringify({ d: ev.text })}\n`);
      };
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) >= 0) {
          handle(buffer.slice(0, nl));
          buffer = buffer.slice(nl + 1);
        }
      }
      if (buffer) handle(buffer);
      res.end(`${JSON.stringify(blocked ? { error: 'blocked' } : { done: true })}\n`);
    } catch (error) {
      // never log the question or the key
      if (!controller.signal.aborted) console.warn('[bit] upstream failed:', (error as Error).message);
      if (!started) return sendJson(res, 502, { error: controller.signal.aborted ? 'timeout' : 'upstream' });
      res.end(`${JSON.stringify({ error: 'interrupted' })}\n`);
    } finally {
      clearTimeout(timer);
    }
  }

  /** Handles /api/ai/bit/*; false for any other path. */
  async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const path = new URL(req.url ?? '/', 'http://local').pathname;
    if (!path.startsWith('/api/ai/bit/')) return false;
    if (path === '/api/ai/bit/health' && req.method === 'GET') sendJson(res, 200, { configured, model: configured ? model : null, tts: !!options.voice?.tts, stt: !!options.voice?.stt });
    else if (path === '/api/ai/bit/ask' && req.method === 'POST') await ask(req, res);
    else sendJson(res, 404, { error: 'not-found' });
    return true;
  }

  return Object.assign(handle, { configured, model });
}
