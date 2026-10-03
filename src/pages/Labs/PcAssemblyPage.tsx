import { lazy, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Circle, Lightbulb, Play, RotateCcw } from 'lucide-react';
import { SceneCanvas } from '@/components/3d/SceneCanvas';
import { useLabText } from '@/hooks/useLabText';
import { useT } from '@/hooks/useT';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { TranslationKey } from '@/lib/i18n';
import { CATALOG } from '@/data/hardware/catalog';
import { resolveBuild } from '@/lib/studio/build';
import { checkCompatibility } from '@/lib/studio/compatibility';
import { LAB_PARTS, assemblyCoverage, missingBefore, type InstallId } from '@/lib/labs/pcAssembly';
import { usePcLabStore } from '@/store/pcLabStore';
import { ExerciseResult } from './ExerciseResult';
import styles from './Exercise.module.css';
const PcLabScene=lazy(()=>import('@/scenes/PcAssemblyLab/PcLabScene'));

export default function PcAssemblyPage() {
  const l=useLabText(),t=useT(),s=usePcLabStore();
  useDocumentTitle(l('assemblyTitle'));
  const [now,setNow]=useState(Date.now);
  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id);},[]);
  const build=useMemo(()=>resolveBuild(s.build),[s.build]);
  const issues=useMemo(()=>checkCompatibility(build).filter(i=>i.severity==='error'),[build]);
  const name=(id:InstallId)=>id==='cables'?l('cables'):t(`pc.parts.${id}.name` as TranslationKey);
  const prerequisite=s.selected?missingBefore(s.selected,s.installed):[];
  const feedback=s.feedback==='hint'&&s.selected?l(`${s.selected}Hint`):l(s.feedback==='hint'?'selectHint':s.feedback);
  return <div className={styles.stage}>
    <div className={styles.scene}><SceneCanvas initialCamera="EXPLODED" label={l('assemblyTitle')}><PcLabScene /></SceneCanvas></div>
    <header className={styles.head}><Link to="/labs">← {l('backLabs')}</Link><h1>{l('assemblyTitle')}</h1><p>{l('assemblyIntro')}</p></header>
    <aside className={styles.panel} aria-label={l('choose')}>
      <h2>{l('choose')}</h2><div className={styles.meta}><span>{l('progress')}</span><strong>{Math.round(assemblyCoverage(s.installed)*100)}%</strong></div><progress value={assemblyCoverage(s.installed)} max={1} aria-label={l('progress')}/>
      <div className={styles.parts}>{[...LAB_PARTS,'cables' as const].map(id=><button key={id} disabled={s.installed.includes(id)||Boolean(s.result)} aria-pressed={s.selected===id} onClick={()=>s.select(id)}>{s.installed.includes(id)?<Check size={12}/>:<Circle size={12}/>}<span>{name(id)}</span></button>)}</div>
      <p className={styles.feedback} role="status">{feedback}{s.feedback==='prerequisite'&&prerequisite.length>0&&` ${prerequisite.map(name).join(', ')}`}</p>
      <div className={styles.actions}><button className={styles.primary} disabled={!s.selected||Boolean(s.result)} onClick={()=>s.selected&&s.install(s.selected)}>{l('install')}</button><button disabled={!s.selected||Boolean(s.result)} onClick={s.help}><Lightbulb size={13}/> {l('hint')}</button><button onClick={s.reset}><RotateCcw size={13}/> {l('reset')}</button></div>
      <p className={styles.note}>{l('dragHint')}</p>
      <div className={styles.meta}><span>{l('time')}: {s.result?.seconds??Math.floor((now-s.started)/1000)} s</span><span>{l('errors')}: {s.errors} · {l('hints')}: {s.hints}</span></div>
      <button className={styles.primary} disabled={Boolean(s.result)} onClick={s.boot}><Play size={13}/> {l('boot')}</button>
      {s.result&&<ExerciseResult result={s.result}/>}
      <h3>{l('products')}</h3>{(['motherboard','cpu','ram','gpu','psu','cooling'] as const).map(category=><label className={styles.pick} key={category}>{t(`studio.categories.${category}` as TranslationKey)}<select aria-label={t(`studio.categories.${category}` as TranslationKey)} value={s.build[category]??''} disabled={s.installed.includes(category==='cooling'?'cooler':category)||Boolean(s.result)} onChange={e=>s.choose(category,e.target.value)}>{CATALOG.filter(p=>p.category===category).map(p=><option key={p.id} value={p.id}>{p.brand} {p.model}</option>)}</select></label>)}
      {issues.map((i,n)=><p className={styles.issue} key={`${i.code}${n}`}>{t(`studio.compat.${i.code}` as TranslationKey,i.params)}</p>)}
      <p className={styles.note}>{l('modelNote')}</p>
    </aside>
  </div>;
}
