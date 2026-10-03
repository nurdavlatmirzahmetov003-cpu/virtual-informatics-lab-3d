import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Cpu, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { resolveBuild } from '@/lib/studio/build';
import { formatKZT } from '@/lib/studio/pricing';
import { askAssistant, defaultRequest, isValidBuild, type AssistantReply, type AssistantRequest } from '@/services/ai';
import { CATALOG_BY_ID } from '@/data/hardware/catalog';
import { CATEGORIES } from '@/data/studio/options';
import { useAssistantStore } from '@/store/assistantStore';
import { useStudioStore } from '@/store/studioStore';
import { categoryName, sk } from './studioText';
import styles from './SetupAssistant.module.css';

interface Message {
  id: number;
  text: string;
  reply?: AssistantReply;
  applied?: boolean;
}

const tk = (key: string) => key as TranslationKey;
const productName = (id: string | null) => {
  const p = id ? CATALOG_BY_ID.get(id) : undefined;
  return p ? `${p.brand} ${p.model}` : '';
};

function Reply({ reply, applied, onApply }: { reply: AssistantReply; applied: boolean; onApply: () => void }) {
  const t = useT();
  const products = resolveBuild(reply.build);
  const valid = isValidBuild(reply.build);
  const purposes = reply.request.purposes.map((p) => t(sk(`purpose.${p}`))).join(' + ');
  return (
    <article className={styles.response}>
      <span className={styles.badge} data-source={reply.source}>
        {reply.source === 'llm' ? <Sparkles size={12} aria-hidden="true" /> : <Cpu size={12} aria-hidden="true" />}
        {t(reply.source === 'llm' ? 'assistant.sourceLlm' : 'assistant.sourceLocal')}
      </span>
      {reply.fallbackReason === 'invalid' && <p className={styles.fallback}>{t(tk(`assistant.fallback.${reply.fallbackReason}`))}</p>}
      <strong>{t('assistant.result', { purpose: purposes, budget: formatKZT(reply.request.budget) })}</strong>
      {reply.note && <p className={styles.noteBox}>{reply.note}</p>}

      {reply.changes && (
        <section className={styles.changes}>
          <h3>{t('assistant.improve.changes')}</h3>
          {reply.changes.length === 0 ? (
            <p>{t('assistant.improve.none')}</p>
          ) : (
            <ul>
              {reply.changes.map((c) => (
                <li key={c.category}>
                  <span>{categoryName(t, c.category)}</span>
                  {c.from && <em>{productName(c.from)}</em>}
                  <b>{c.to ? productName(c.to) : t('assistant.improve.removed')}</b>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className={styles.why}>
        <h3>{t('assistant.whyTitle')}</h3>
        <ol>
          {reply.explanations.map((e) => (
            <li key={e.key}>{t(tk(`assistant.why.${e.key}`), e.params)}</li>
          ))}
        </ol>
      </section>

      <details className={styles.parts}>
        <summary>{t('assistant.allParts')}</summary>
        <ul>
          {CATEGORIES.map((c) =>
            products[c] ? (
              <li key={c}>
                <span>{categoryName(t, c)}</span>
                <b>
                  {products[c]!.brand} {products[c]!.model}
                </b>
              </li>
            ) : null,
          )}
        </ul>
      </details>

      <div className={styles.total}>
        <strong>{formatKZT(reply.total)}</strong>
        <span>{t('studio.demoPrice')}</span>
      </div>
      {reply.overBudget > 0 && <p className={styles.warning}>{t('assistant.overBudget', { amount: formatKZT(reply.overBudget) })}</p>}
      {reply.unavailable.length > 0 && <p className={styles.warning}>{t('assistant.unavailable', { items: reply.unavailable.join(', ') })}</p>}
      {!valid && <p className={styles.warning}>{t('assistant.invalid')}</p>}
      <button type="button" className={styles.apply} onClick={onApply} disabled={!valid}>
        {applied ? <Check size={15} aria-hidden="true" /> : <ArrowRight size={15} aria-hidden="true" />} {t(applied ? 'assistant.loaded' : 'assistant.load')}
      </button>
    </article>
  );
}

/**
 * "AI Көмекші" chat. Messages go through services/ai (server LLM when
 * configured, local engine otherwise); a suggestion loads straight into
 * Setup Studio and its 3D scene, where the user can keep editing it.
 */
export function SetupAssistant({ launcher = true }: { launcher?: boolean }) {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const open = useAssistantStore((s) => s.open);
  const { openChat, close } = useAssistantStore.getState();
  const apply = useStudioStore((s) => s.applySuggestion);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const body = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const lastRequest = useRef<AssistantRequest | null>(null);

  useEffect(() => {
    if (open) field.current?.focus();
  }, [open]);
  useEffect(() => {
    if (body.current) body.current.scrollTop = body.current.scrollHeight;
  }, [messages, open]);

  const send = useCallback(async (text: string, improve = false) => {
    if (!text.trim() || busy) return;
    const studio = useStudioStore.getState();
    const previous = improve || !lastRequest.current ? defaultRequest(studio.budget, studio.purpose, studio.style) : lastRequest.current;
    const id = Date.now();
    setMessages((m) => [...m.slice(-9), { id, text: text.trim() }]);
    setInput('');
    setBusy(true);
    try {
      const reply = await askAssistant(text, { previous, current: improve ? studio.build : undefined });
      lastRequest.current = reply.request;
      setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, reply } : msg)));
    } finally {
      setBusy(false);
    }
  }, [busy]);

  // "AI-мен жақсарту" opens the panel with a prepared request about the current build
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });
  useEffect(() => {
    const run = () => {
      const s = useAssistantStore.getState();
      if (!s.open || s.mode !== 'improve' || !s.pending) return;
      const prompt = s.consumePending();
      if (prompt) void sendRef.current(prompt, true);
    };
    run();
    return useAssistantStore.subscribe(run);
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void send(input);
  };
  const load = (m: Message) => {
    if (!m.reply) return;
    const { build, request } = m.reply;
    apply({ build, purpose: request.purpose, budget: request.budget, style: request.style });
    setMessages((ms) => ms.map((msg) => ({ ...msg, applied: msg.id === m.id })));
    if (location.pathname !== '/studio') {
      close();
      navigate('/studio');
    }
  };

  return (
    <>
      {launcher && (
        <button type="button" className={styles.launch} onClick={openChat} aria-expanded={open}>
          <MessageCircle size={14} aria-hidden="true" />
          {t('assistant.title')}
          <ArrowRight size={13} aria-hidden="true" />
        </button>
      )}
      {open &&
        createPortal(
          <section className={styles.panel} role="dialog" aria-labelledby="assistant-title" onKeyDown={(e) => e.key === 'Escape' && close()}>
            <header>
              <div>
                <h2 id="assistant-title">
                  <Sparkles size={16} aria-hidden="true" />
                  {t('assistant.title')}
                </h2>
              </div>
              <button type="button" onClick={close} aria-label={t('anatomy.close')}>
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <div className={styles.messages} ref={body} role="log" aria-live="polite">
              <p className={styles.welcome}>{t('assistant.welcome')}</p>
              {messages.length === 0 && (
                <div className={styles.examples}>
                  {(['exampleBudget', 'exampleWhite', 'exampleDevices'] as const).map((key) => (
                    <button key={key} type="button" onClick={() => void send(t(`assistant.${key}`))}>
                      {t(`assistant.${key}`)}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id}>
                  <p className={styles.user}>{m.text}</p>
                  {m.reply ? <Reply reply={m.reply} applied={Boolean(m.applied)} onApply={() => load(m)} /> : <p className={styles.thinking}>{t('assistant.thinking')}</p>}
                </div>
              ))}
            </div>
            <form onSubmit={submit}>
              <label htmlFor="assistant-message" className={styles.label}>
                {t('assistant.input')}
              </label>
              <div className={styles.entry}>
                <textarea
                  ref={field}
                  id="assistant-message"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={1000}
                  rows={2}
                  placeholder={t('assistant.placeholder')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void send(input);
                    }
                  }}
                />
                <button type="submit" disabled={!input.trim() || busy} aria-label={t('assistant.send')}>
                  <Send size={17} aria-hidden="true" />
                </button>
              </div>
              <small>{t('assistant.privacy')}</small>
            </form>
          </section>,
          document.body,
        )}
    </>
  );
}
