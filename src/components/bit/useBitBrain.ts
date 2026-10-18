/**
 * Bit's behaviour in the browser: turns a request (typed or spoken) into an
 * intent (services/bit/intent — local and instant), acts on it — opens a
 * section, walks the tour or a lesson, builds a PC in Setup Studio, answers
 * from the built-in set — and only for open questions streams an answer
 * from Gemini through the lab server. Replies are always in the site
 * language; Bit never changes the language itself.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BRAND } from '@/config/brand';
import { translate, type Language, type TranslationKey } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settingsStore';
import { useBitStore, type BitSource } from '@/store/bitStore';
import { loadBitContent, type BitContent } from '@/services/bit/content';
import { understand, type Intent } from '@/services/bit/intent';
import { LESSON_IDS, TOUR_STOPS, type LessonId } from '@/services/bit/lessons';
import { sectionById, sectionOfPath, type SectionId } from '@/services/bit/sections';
import { askBit, bitCapabilities, resetBitHealth, type BitCapabilities, type Turn } from '@/services/bit/client';
import { splitSentences } from '@/services/bit/text';
import { ttsSupported, voiceFor, voicesReady } from '@/services/bit/speech';
import { bitVoice } from '@/services/bit/voice';

const fill = (text: string, vars: Record<string, string | number> = {}) => {
  const all: Record<string, string | number> = { brand: BRAND.name, ...vars };
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in all ? String(all[k]) : m));
};

/** Words that ask for the whole desk setup, not just the computer. */
const SETUP_WORDS = /сетап|setup|толық|полн|full|монитор|monitor|пернетақта|клавиатур|keyboard|тінтуір|тышқан|мыш|mouse|перифер|peripher/i;

const money = (n: number, lang: Language) => Math.round(n).toLocaleString(lang === 'en' ? 'en-US' : 'ru-RU').replace(/[\u00a0\u202f]/g, ' ');

export type ModelState = 'checking' | 'online' | 'offline';

export function useBitBrain() {
  const language = useSettingsStore((s) => s.language);
  const navigate = useNavigate();
  const location = useLocation();
  const [content, setContent] = useState<BitContent | null>(null);
  const [model, setModel] = useState<ModelState>('checking');
  const [browserVoice, setBrowserVoice] = useState<'ok' | 'approx' | 'none'>('ok');
  const [caps, setCaps] = useState<BitCapabilities>({ model: false, tts: false, stt: false });
  const stream = useRef<AbortController | null>(null);
  const page = useRef<SectionId>('home');
  // react-router paths are already relative to the base (GitHub Pages)
  const pageId = sectionOfPath(location.pathname);
  useEffect(() => {
    page.current = pageId;
  }, [pageId]);

  // the language's texts and the model's availability
  useEffect(() => {
    let alive = true;
    void loadBitContent(language).then((c) => alive && setContent(c));
    return () => {
      alive = false;
    };
  }, [language]);
  useEffect(() => {
    let alive = true;
    void bitCapabilities().then((c) => {
      if (!alive) return;
      setCaps(c);
      setModel(c.model ? 'online' : 'offline');
      // Gemini's voice when the server has it; the browser's own otherwise
      bitVoice.server = c.tts;
    });
    return () => {
      alive = false;
    };
  }, []);

  // one voice for the site: a language switch silences it and changes the browser fallback voice
  useEffect(() => {
    bitVoice.stop();
    bitVoice.language = language;
    let alive = true;
    void voicesReady().then(() => {
      if (!alive) return;
      if (!ttsSupported()) return setBrowserVoice('none');
      const v = voiceFor(language);
      setBrowserVoice(!v ? 'none' : v.approximate ? 'approx' : 'ok');
    });
    return () => {
      alive = false;
      stream.current?.abort();
    };
  }, [language]);
  /** Only worth telling when Gemini's voice is not there to replace the browser's. */
  const voiceNote = caps.tts || browserVoice === 'ok' ? null : browserVoice;

  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(language, key as TranslationKey, vars), [language]);

  /** Shows a reply and, with the voice on, reads it aloud. */
  const say = useCallback(
    (text: string, source: BitSource = 'local') => {
      const { push, voice } = useBitStore.getState();
      push({ role: 'bit', text, source });
      if (voice) bitVoice.say(text);
    },
    [],
  );

  const sectionName = useCallback((id: SectionId) => t(sectionById(id)!.nameKey), [t]);

  const go = useCallback(
    (id: SectionId) => {
      const route = sectionById(id)!.route;
      if (page.current !== id || route === '/') navigate(route);
    },
    [navigate],
  );

  const tourStop = useCallback(
    (c: BitContent, index: number) => {
      const stop = TOUR_STOPS[index];
      go(stop);
      say(c.tour[stop]);
      useBitStore.getState().setGuide(index + 1 < TOUR_STOPS.length ? { kind: 'tour', index } : null);
    },
    [go, say],
  );

  const lessonStep = useCallback(
    (c: BitContent, lesson: LessonId, index: number) => {
      const steps = c.lessons[lesson];
      if (index >= steps.length) {
        useBitStore.getState().setGuide(null);
        say(c.say.lessonDone);
        return;
      }
      useBitStore.getState().setGuide({ kind: 'lesson', lesson, index });
      say(steps[index]);
    },
    [say],
  );

  const next = useCallback(() => {
    const c = content;
    const guide = useBitStore.getState().guide;
    if (!c) return;
    bitVoice.stop();
    if (!guide) return say(c.say.nothingToContinue);
    if (guide.kind === 'tour') {
      if (guide.index + 1 < TOUR_STOPS.length) tourStop(c, guide.index + 1);
      else {
        useBitStore.getState().setGuide(null);
        say(c.say.tourDone);
      }
    } else lessonStep(c, guide.lesson, guide.index + 1);
  }, [content, lessonStep, say, tourStop]);

  const stopAll = useCallback(() => {
    bitVoice.stop();
    stream.current?.abort();
  }, []);

  /** A PC for the budget: the Setup Studio engine (catalogue only, compatibility-checked), then the studio opens. */
  const build = useCallback(
    async (c: BitContent, message: string) => {
      // "400,000" / "400 000" → 400000, so the budget parser reads one number
      const clean = message.replace(/(\d)[,\s.](?=\d{3}(?:\D|$))/g, '$1');
      const [{ askAssistant }, { defaultRequest, parseRequest }, { useStudioStore }, { CATALOG_BY_ID }] = await Promise.all([
        import('@/services/ai/client'),
        import('@/services/ai/parse'),
        import('@/store/studioStore'),
        import('@/data/hardware/catalog'),
      ]);
      const studio = useStudioStore.getState();
      const base = defaultRequest(studio.budget, studio.purpose, studio.style);
      // "a PC" is the system unit; the monitor, keyboard and mouse only when the student asks for a setup
      const previous: typeof base = SETUP_WORDS.test(clean) ? base : { ...base, exclude: ['monitor', 'keyboard', 'mouse'] };
      const parsed = parseRequest(clean, previous);
      const budget = parsed.budget;
      say(fill(c.say.buildWorking, { budget: money(budget, language) }));
      try {
        // games, 3D and streaming want a real graphics card; if it does not fit, fall back to built-in graphics and say what it would cost
        const heavy = parsed.purpose === 'gaming' || parsed.purpose === 'design3d' || parsed.purpose === 'streaming';
        let reply = await askAssistant(clean, { previous: heavy ? { ...previous, include: ['gpu'] } : previous });
        let gpuTotal = 0;
        if (heavy && reply.overBudget > 0) {
          gpuTotal = reply.total;
          reply = await askAssistant(clean, { previous });
        }
        const { build: parts, total, request } = reply;
        if (!parts.cpu) throw new Error('no build');
        studio.applySuggestion({ build: parts, purpose: request.purpose, budget: request.budget, style: request.style });
        navigate('/studio');
        const name = (id: string | null | undefined) => {
          const item = id ? CATALOG_BY_ID.get(id) : undefined;
          return item ? `${item.brand} ${item.model}` : (id ?? '');
        };
        const vars = {
          budget: money(request.budget, language),
          total: money(total, language),
          purpose: c.say.purposes[request.purpose],
          cpu: name(parts.cpu),
          gpu: name(parts.gpu),
        };
        const hint = gpuTotal && !parts.gpu ? ` ${fill(c.say.buildGpuHint, { total: money(gpuTotal, language) })}` : '';
        say(fill(reply.overBudget > 0 ? c.say.buildOver : parts.gpu ? c.say.buildDone : c.say.buildNoGpu, vars) + hint);
      } catch {
        say(c.say.buildFail);
      }
    },
    [language, navigate, say],
  );

  /** An open question for Gemini: streamed, each finished sentence spoken at once. */
  const ask = useCallback(
    async (c: BitContent, message: string, history: Turn[]) => {
      const store = useBitStore.getState();
      const id = store.push({ role: 'bit', text: '', source: 'ai', pending: true });
      stream.current?.abort();
      const controller = new AbortController();
      stream.current = controller;
      // characters of the answer already handed to the speaker
      let spoken = 0;
      const speakNew = (visible: string, final: boolean) => {
        if (!useBitStore.getState().voice || visible.length <= spoken) return;
        const { done, rest } = splitSentences(visible.slice(spoken));
        done.forEach((sentence) => bitVoice.say(sentence));
        if (final && rest.trim()) bitVoice.say(rest);
        spoken = final ? visible.length : visible.length - rest.length;
      };
      try {
        const answer = await askBit({
          message,
          lang: language,
          history,
          page: page.current,
          signal: controller.signal,
          onText: (visible) => {
            useBitStore.getState().update(id, { text: visible });
            speakNew(visible, false);
          },
        });
        useBitStore.getState().update(id, { text: answer.text, pending: false });
        speakNew(answer.text, true);
        if (answer.go) go(answer.go);
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code === 'aborted') return useBitStore.getState().update(id, { pending: false });
        useBitStore.getState().update(id, { text: c.say.error, pending: false, error: true, source: 'local' });
        if (code === 'no-key' || code === 'offline' || code === 'ai-disabled') {
          resetBitHealth();
          setModel('offline');
        }
      }
    },
    [go, language],
  );

  const act = useCallback(
    (c: BitContent, intent: Intent, history: Turn[]) => {
      switch (intent.kind) {
        case 'empty':
          return;
        case 'stop':
          stopAll();
          useBitStore.getState().setGuide(null);
          return useBitStore.getState().push({ role: 'bit', text: c.say.stopped, source: 'local' });
        case 'next':
          return next();
        case 'greet':
          return say(fill(c.say.greet));
        case 'tour':
          say(c.tourIntro);
          return tourStop(c, 0);
        case 'lesson':
          // the first step introduces the lesson itself; the bar under the chat names it
          go(intent.lesson);
          return lessonStep(c, intent.lesson, 0);
        case 'navigate':
          go(intent.section);
          return say(fill(c.say.navigate, { name: sectionName(intent.section) }));
        case 'build':
          return void build(c, intent.message);
        case 'faq':
          return say(fill(c.faq[intent.id].a), 'faq');
        case 'ask':
          if (model !== 'online') return say(c.say.unknown);
          return void ask(c, intent.message, history);
      }
    },
    [ask, build, go, lessonStep, model, next, say, sectionName, stopAll, tourStop],
  );

  /** One request from the student (typed or spoken). */
  const handle = useCallback(
    (text: string) => {
      const c = content;
      const trimmed = text.trim();
      if (!c || !trimmed) return;
      const store = useBitStore.getState();
      // a question whose answer failed is not sent again: the model would answer it too
      const history: Turn[] = store.messages
        .filter((m, i, all) => !m.pending && !m.error && m.text && !(m.role === 'user' && all[i + 1]?.error))
        .map((m) => ({ role: m.role, text: m.text }));
      store.push({ role: 'user', text: trimmed });
      bitVoice.stop();
      act(c, understand(trimmed, { modelAvailable: model === 'online' }), history);
    },
    [act, content, model],
  );

  return { content, model, caps, voiceNote, handle, next, stopAll, language, isLesson: (id: string): id is LessonId => (LESSON_IDS as readonly string[]).includes(id) };
}
