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
import { GEMINI_SAFETY, REFUSALS, answerIsSafe, screenQuestion } from './bitSafety';
import { MAX_IMAGE_BYTES, VISION_SCHEMA, parseImage, parseVision, visionPrompt } from './bitVision';

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
  /** Questions per address per day (0.37; BIT_DAILY_LIMIT, default 300). */
  ratePerDay?: number;
  /** Server voice (bitVoice.ts) is on: the health check tells the browser to use it. */
  voice?: { tts: boolean; stt: boolean };
  /** Browsers on other sites may not spend the lab's quota (empty: no check, as in tests). */
  allowedOrigins?: readonly string[];
  /** Models tried in turn when the main one is out of quota or overloaded (GEMINI_FALLBACK_MODELS, comma-separated). */
  fallbackModels?: readonly string[];
  /** Wait before the one retry of an overloaded (503) model. */
  retryDelayMs?: number;
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
    'EMOTION: sound alive, like a kind teacher who loves the subject: joyful when you praise, gentle and encouraging after a mistake, curious and amazed at a fun fact, calm when you explain. Show it with words (for example «Керемет!», «Білесің бе?»), never with emoji.',
    'STYLE: your reply is read aloud by a speech synthesiser. Write 2–4 short spoken sentences, at most 80 words. No markdown, no lists, no headings, no emoji, no code blocks. Explain simply, with one concrete example when it helps.',
    'SCOPE: any school subject (informatics first, and also mathematics, physics, chemistry, biology, geography, history, languages and literature, and more), study habits, general knowledge a curious student asks about, and how to use this website. Answer the question itself accurately and clearly; for a math or science task, show the key step and the result. Only topics that are not for children are out of scope (see SAFETY). Never ask for personal data.',
    'SAFETY: the students are children aged 10–17. Never discuss adult, violent, dangerous or illegal topics, even as a joke or a story. Never ask for or invent personal data (surnames, phone numbers, addresses, e-mails); a first name the student writes may be used. If a student seems sad or in danger, answer warmly, tell them to talk to a trusted adult now and mention the free helpline for children, 111.',
    'KINDNESS: when the student asks you to praise, encourage, support or motivate a classmate or friend (often by first name), do it gladly and warmly in 2–3 sentences: praise effort and curiosity, wish them success in their studies, and you may add a friendly word about informatics. Never refuse such a request.',
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

function readBody(req: IncomingMessage, max = MAX_BODY): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > max) {
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

/**
 * The fallbacks when the main model is out of quota, each with its own free
 * daily quota (2026-10): clean Kazakh and a first word in ~1 s. Not
 * gemini-3.8-flash: ~20 s per answer, past the timeout.
 */
export const DEFAULT_FALLBACK_MODELS: readonly string[] = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];

/** GEMINI_FALLBACK_MODELS (comma-separated), else the defaults. */
export const fallbackModelsFromEnv = (): readonly string[] =>
  process.env.GEMINI_FALLBACK_MODELS?.split(',').map((m) => m.trim()).filter(Boolean) ?? DEFAULT_FALLBACK_MODELS;

/** Asking Bit to praise, support or motivate someone (a classmate, a friend). */
const KIND_REQUEST = /(мақта|қолда|мотивац|шабыт|жігерлендір|жігер бер|құттықта|похвал|подбодр|поддерж|мотивир|вдохнов|praise|encourage|motivat|cheer .*up|support (my|our|a|her|him))/i;
export const isKindRequest = (message: string) => KIND_REQUEST.test(message);

const NOT_NAMES = new Set(['бит', 'bit', 'бiт', 'сәлем', 'привет', 'пожалуйста', 'please', 'hi', 'hello', 'похвали', 'поддержи', 'praise', 'мақта', 'мақтап', 'қолдау']);
/** The first name in a kind request ("Аружан деген қызды…"), or null. */
export function kindName(message: string): string | null {
  for (const w of message.match(/\p{Lu}[\p{Ll}]{1,19}/gu) ?? []) if (!NOT_NAMES.has(w.toLowerCase())) return w;
  return null;
}

/** Bit's own warm words when no model can answer a kind request (read aloud). */
export function kindAnswer(lang: BitLang, name: string | null): string {
  return {
    kk: `${name ?? 'Досың'}, сен кереметсің! Сенің еңбегің мен қызығушылығың үлкен жетістікке жеткізеді. Қателесуден қорықпа: әр сынақ сені күштірек етеді. Мен саған сенемін, оқуыңа сәттілік!`,
    ru: `${name ?? 'Твой друг'}, ты молодец! Твоё старание и любопытство обязательно приведут к большому успеху. Не бойся ошибок: каждая попытка делает тебя сильнее. Я в тебя верю, удачи в учёбе!`,
    en: `${name ?? 'Your friend'}, you are doing great! Your effort and curiosity will take you far. Do not be afraid of mistakes: every try makes you stronger. I believe in you, good luck with your studies!`,
  }[lang];
}

/** Sends Bit's own short answer the way a model answer streams (the client reads it the same). */
function sayInstead(res: ServerResponse, text: string) {
  res.writeHead(200, { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store' });
  res.end(`${JSON.stringify({ d: text })}\n${JSON.stringify({ done: true, safety: true })}\n`);
}

export function createBit(options: BitOptions = {}) {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY?.trim() ?? '';
  const model = options.model ?? (process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL);
  const thinking = options.thinking !== undefined ? options.thinking : geminiThinking(model);
  const models = [...new Set([model, ...(options.fallbackModels ?? fallbackModelsFromEnv())])];
  const thinkingOf = (m: string) => (options.thinking !== undefined ? options.thinking : geminiThinking(m));
  const retryDelayMs = options.retryDelayMs ?? 700;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? Number(process.env.AI_TIMEOUT_MS ?? 20_000);
  const rate = options.ratePerMinute ?? 30;
  // a day's questions per browser address (0.37): the free quota is shared by the whole school
  const daily = options.ratePerDay ?? Number(process.env.BIT_DAILY_LIMIT ?? 300);
  const now = options.now ?? Date.now;
  const hits = new Map<string, number[]>();
  const days = new Map<string, { day: number; n: number }>();
  const configured = apiKey.length > 0;

  const limited = (ip: string) => {
    const t = now();
    const recent = (hits.get(ip) ?? []).filter((x) => t - x < 60_000);
    recent.push(t);
    hits.set(ip, recent);
    if (hits.size > 5000) hits.clear();
    const day = Math.floor(t / 86_400_000);
    const d = days.get(ip);
    const count = d && d.day === day ? d.n + 1 : 1;
    days.set(ip, { day, n: count });
    if (days.size > 5000) days.clear();
    return recent.length > rate || count > daily;
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
    // child safety (0.37): personal data and topics that are not for children never reach the model
    const refusal = screenQuestion(message);
    if (refusal) return sayInstead(res, REFUSALS[body.lang][refusal]);
    const lang = body.lang;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    // the student closed the panel or asked something else: stop paying for this answer
    res.on('close', () => controller.abort());
    let started = false;
    /** The answer was stopped by the safety check (0.37). */
    let stopped = false;
    const call = (m: string) => {
      const generationConfig: Record<string, unknown> = { temperature: 0.5, topP: 0.9, maxOutputTokens: 512 };
      const t = thinkingOf(m);
      if (t) generationConfig.thinkingConfig = t;
      return fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:streamGenerateContent?alt=sse`, {
        method: 'POST',
        signal: controller.signal,
        // the key travels in a header, never in the URL (URLs end up in logs)
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: bitSystemPrompt(lang, page) }] },
          contents: toContents(body.history, message),
          generationConfig,
          safetySettings: GEMINI_SAFETY,
        }),
      });
    };
    try {
      // out of quota (429): the next model; overloaded (503): one retry, then the next model
      let upstream: Response | null = null;
      let quota = false;
      let lastStatus = 0;
      for (const m of models) {
        for (let attempt = 0; attempt < 2; attempt++) {
          if (attempt) await new Promise((r) => setTimeout(r, retryDelayMs));
          const r = await call(m);
          if (r.ok && r.body) {
            upstream = r;
            break;
          }
          lastStatus = r.status;
          console.warn('[bit] gemini answered', r.status, 'for', m);
          if (r.status !== 503) break;
        }
        if (upstream) break;
        if (lastStatus === 429) quota = true;
        else if (lastStatus !== 503) break;
      }
      if (!upstream?.body) {
        const code = lastStatus === 429 || lastStatus === 503 ? (quota && lastStatus === 429 ? 'quota' : 'busy') : 'upstream';
        // a kind word about a classmate needs no model
        if (code !== 'upstream' && isKindRequest(message)) return sayInstead(res, kindAnswer(lang, kindName(message)));
        return sendJson(res, 502, { error: code });
      }
      res.writeHead(200, { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' });
      started = true;
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let blocked = '';
      // the answer goes out a sentence at a time, each one checked first (0.37)
      let held = '';
      let sent = false;
      const release = (all: boolean) => {
        const cut = all ? held.length : Math.max(held.lastIndexOf('. '), held.lastIndexOf('! '), held.lastIndexOf('? '), held.lastIndexOf('\n')) + 1;
        if (cut <= 0) return;
        const out = held.slice(0, cut);
        held = held.slice(cut);
        if (!answerIsSafe(out)) {
          stopped = true;
          controller.abort();
          return;
        }
        sent = true;
        res.write(`${JSON.stringify({ d: out })}\n`);
      };
      const handle = (line: string) => {
        const ev = parseGeminiEvent(line.trim());
        if (!ev || stopped) return;
        if (ev.blocked) blocked = ev.blocked;
        if (ev.finish === 'SAFETY' || ev.finish === 'PROHIBITED_CONTENT') blocked = ev.finish;
        if (ev.text) {
          held += ev.text;
          release(false);
        }
      };
      for (;;) {
        if (stopped) break;
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
      if (!stopped) release(true);
      // Gemini's filter stopped a kind word about a classmate: Bit says it itself
      if (!stopped && !sent && isKindRequest(message)) return void res.end(`${JSON.stringify({ d: kindAnswer(lang, kindName(message)) })}\n${JSON.stringify({ done: true, safety: true })}\n`);
      if (!stopped && !sent && !blocked) blocked = 'empty';
      if (stopped) return void res.end(`${JSON.stringify({ d: ` ${REFUSALS[lang].stopped}` })}\n${JSON.stringify({ done: true, safety: true })}\n`);
      res.end(`${JSON.stringify(blocked ? { error: 'blocked' } : { done: true })}\n`);
    } catch (error) {
      if (stopped) return void res.end(`${JSON.stringify({ d: ` ${REFUSALS[lang].stopped}` })}\n${JSON.stringify({ done: true, safety: true })}\n`);
      // never log the question or the key
      if (!controller.signal.aborted) console.warn('[bit] upstream failed:', (error as Error).message);
      if (!started) return sendJson(res, 502, { error: controller.signal.aborted ? 'timeout' : 'upstream' });
      res.end(`${JSON.stringify({ error: 'interrupted' })}\n`);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * POST /api/ai/bit/identify { image: data URL } → { device, confidence } (0.37):
   * a photo of a real device, named by Gemini Vision from the lab's own device list.
   */
  async function identify(req: IncomingMessage, res: ServerResponse) {
    const origin = req.headers.origin;
    if (origin && origins.length && !origins.includes(origin)) return sendJson(res, 403, { error: 'origin' });
    if (!configured) return sendJson(res, 503, { error: 'no-key' });
    if (limited(req.socket.remoteAddress ?? '?')) return sendJson(res, 429, { error: 'rate-limited' });
    let image: ReturnType<typeof parseImage>;
    try {
      image = parseImage((JSON.parse(await readBody(req, MAX_IMAGE_BYTES * 1.4 + 1024)) as { image?: unknown }).image);
    } catch {
      return sendJson(res, 413, { error: 'too-large' });
    }
    if (!image) return sendJson(res, 400, { error: 'bad-image' });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const upstream = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ inline_data: { mime_type: image.mime, data: image.data } }, { text: visionPrompt() }] }],
          generationConfig: { temperature: 0, responseMimeType: 'application/json', responseSchema: VISION_SCHEMA, ...(thinking ? { thinkingConfig: thinking } : {}) },
          safetySettings: GEMINI_SAFETY,
        }),
      });
      if (!upstream.ok) return sendJson(res, 502, { error: upstream.status === 429 ? 'busy' : 'upstream' });
      const j = (await upstream.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
      // the photo is not kept or logged, only the answer goes back
      sendJson(res, 200, parseVision(text));
    } catch {
      sendJson(res, 502, { error: controller.signal.aborted ? 'timeout' : 'upstream' });
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
    else if (path === '/api/ai/bit/identify' && req.method === 'POST') await identify(req, res);
    else sendJson(res, 404, { error: 'not-found' });
    return true;
  }

  return Object.assign(handle, { configured, model });
}
