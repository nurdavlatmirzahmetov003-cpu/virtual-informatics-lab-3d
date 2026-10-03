import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Check, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { resolveBuild } from '@/lib/studio/build';
import { isValidSuggestion, parseSetupRequest, suggestSetup, type SetupSuggestion } from '@/lib/studio/assistant';
import { formatKZT } from '@/lib/studio/pricing';
import { useStudioStore } from '@/store/studioStore';
import { sk } from './studioText';
import styles from './SetupAssistant.module.css';

interface Message { id: number; text: string; suggestion: SetupSuggestion; applied: boolean; }

export function SetupAssistant() {
  const t = useT();
  const [open,setOpen] = useState(false);
  const [input,setInput] = useState('');
  const [messages,setMessages] = useState<Message[]>([]);
  const body = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const apply = useStudioStore(s=>s.applySuggestion);
  useEffect(()=>{ if(open) field.current?.focus(); },[open]);
  useEffect(()=>{ if (body.current) body.current.scrollTop=body.current.scrollHeight; },[messages,open]);
  const send = (text: string) => {
    if (!text.trim()) return;
    const {budget,purpose,style} = useStudioStore.getState();
    const previous = messages.at(-1)?.suggestion.request;
    const request = parseSetupRequest(text,previous ?? {budget,purpose,style});
    setMessages(m=>[...m.slice(-9),{id:Date.now(),text:text.trim(),suggestion:suggestSetup(request),applied:false}]);
    setInput('');
  };
  const submit = (event: FormEvent) => { event.preventDefault(); send(input); };
  const applyBuild = (m: Message) => {
    apply({...m.suggestion.request,build:m.suggestion.build});
    setMessages(ms=>ms.map(msg=>({...msg,applied:msg.id===m.id})));
  };
  return <>
    <button className={styles.launch} onClick={()=>setOpen(true)} aria-expanded={open}><MessageCircle size={14} />{t('assistant.title')}<ArrowRight size={13} /></button>
    {open && createPortal(<section className={styles.panel} role="dialog" aria-labelledby="assistant-title" onKeyDown={e=>{if(e.key==='Escape')setOpen(false);}}>
      <header><div><h2 id="assistant-title"><Sparkles size={16} />{t('assistant.title')}</h2><span>{t('assistant.local')}</span></div><button onClick={()=>setOpen(false)} aria-label={t('anatomy.close')}><X size={18} /></button></header>
      <div className={styles.messages} ref={body} role="log" aria-live="polite">
        <p className={styles.welcome}>{t('assistant.welcome')}</p>
        {messages.length===0 && <div className={styles.examples}>{(['exampleBudget','exampleWhite','exampleDevices'] as const).map(key=><button key={key} onClick={()=>send(t(`assistant.${key}`))}>{t(`assistant.${key}`)}</button>)}</div>}
        {messages.map(m=>{
          const products=resolveBuild(m.suggestion.build);
          const valid=isValidSuggestion(m.suggestion);
          return <div key={m.id} className={styles.exchange}>
            <p className={styles.user}>{m.text}</p>
            <article className={styles.response}>
              <strong>{t('assistant.result',{purpose:t(sk(`purpose.${m.suggestion.request.purpose}`)),budget:formatKZT(m.suggestion.request.budget)})}</strong>
              <p>{t(`assistant.reasons.${m.suggestion.request.purpose}`)}</p>
              <ul>{(['cpu','gpu','ram','monitor','mouse'] as const).map(c=>products[c] && <li key={c}><span>{t(sk(`categories.${c}`))}</span><b>{products[c]!.brand} {products[c]!.model}</b></li>)}</ul>
              <div className={styles.total}><strong>{formatKZT(m.suggestion.total)}</strong><span>{t('studio.demoPrice')}</span></div>
              {m.suggestion.overBudget>0 && <p className={styles.warning}>{t('assistant.overBudget',{amount:formatKZT(m.suggestion.overBudget)})}</p>}
              {m.suggestion.unavailable.length>0 && <p className={styles.warning}>{t('assistant.unavailable',{items:m.suggestion.unavailable.join(', ')})}</p>}
              <p>{valid?t('studio.summary.ok'):t('assistant.invalid')}</p>
              <button className={styles.apply} onClick={()=>applyBuild(m)} disabled={!valid}>{m.applied?<Check size={15}/>:<ArrowRight size={15}/>} {t(m.applied?'assistant.applied':'assistant.apply')}</button>
            </article>
          </div>;
        })}
      </div>
      <form onSubmit={submit}>
        <label htmlFor="assistant-message" className={styles.label}>{t('assistant.input')}</label>
        <div className={styles.entry}><textarea ref={field} id="assistant-message" value={input} onChange={e=>setInput(e.target.value)} maxLength={1000} rows={2} placeholder={t('assistant.placeholder')} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(input);}}}/><button type="submit" disabled={!input.trim()} aria-label={t('assistant.send')}><Send size={17}/></button></div>
        <small>{t('assistant.privacy')}</small>
      </form>
    </section>,document.body)}
  </>;
}
