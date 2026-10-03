import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import { useEducationText,type EducationKey } from '@/hooks/useEducationText';
import { EXPERIMENTS,PARAMETERS,experimentDefaults,experimentModel,gradeNumeric,type Experiment } from '@/lib/labs/experiments';
import { finishAssessment,type Assessment } from '@/lib/labs/assessment';
import { useProgressStore } from '@/store/progressStore';
import { ExerciseResult } from './ExerciseResult';
import styles from './Learning.module.css';

function ExperimentWorkspace({kind}:{kind:Experiment}){
  const l=useEducationText(),[values,setValues]=useState(()=>experimentDefaults(kind)),[answer,setAnswer]=useState(''),[result,setResult]=useState<Assessment|null>(null),[started,setStarted]=useState(Date.now);
  const model=experimentModel(kind,values);
  const rgb=kind==='rgb'?`rgb(${values.join(',')})`:undefined;
  const unit=kind==='memory'?`GB ${l('free')}`:kind==='binaryData'?l('ones'):kind==='rgb'?l('channelMean'):kind==='refresh'?`ms/${l('frame')}`:model.unit;
  const grade=()=>{const fraction=gradeNumeric(answer,model.value,['binaryData','memory','latency'].includes(kind));const a={...finishAssessment(`experiment:${kind}`,fraction,started),errors:fraction?0:1};setResult(a);useProgressStore.getState().record(a);};
  const reset=()=>{setValues(experimentDefaults(kind));setAnswer('');setResult(null);setStarted(Date.now());};
  return <div className={styles.grid}><section className={styles.surface}><h2>{l(kind)}</h2><div className={styles.visual} style={{background:rgb}}>
    {kind==='binaryData'?<span className={styles.bit}>{values[0].toString(2).padStart(8,'0')}</span>:kind==='resolution'?<div className={styles.pixelGrid} style={{gridTemplateColumns:`repeat(${Math.round(values[0]/160)},1fr)`}}>{Array.from({length:Math.round(values[0]/160)*Math.round(values[1]/120)},(_,i)=><i key={i}/>)}</div>:kind==='refresh'||kind==='latency'?<span className={styles.motionDot} style={{animationDuration:kind==='latency'?`${Math.max(.5,values[0]/30)}s`:'2s',animationTimingFunction:kind==='refresh'?`steps(${values[0]})`:'linear'}}/>:kind!=='rgb'?<div className={styles.fill} style={{height:`${model.fill*100}%`}}/>:null}
    </div><div className={styles.readout} aria-live="polite">{Number(model.value.toFixed(3))}<small style={{fontSize:15}}> {unit}</small></div><div className={styles.formula}>{model.formula}</div>
    {PARAMETERS[kind].map((p,i)=><label key={p.key} className={styles.field}>{p.key==='R'||p.key==='G'||p.key==='B'?p.key:l(p.key as EducationKey)} · {values[i]} {p.unit}<input type="range" min={p.min} max={p.max} step={p.step} value={values[i]} onChange={e=>{setValues(v=>v.map((n,j)=>i===j?Number(e.target.value):n));setResult(null);}}/></label>)}
  </section><aside className={styles.surface}><h2>{l('assignment')}</h2><p>{l('experimentTask')}</p><p>{l('units')}</p><label className={styles.field}>{l('answer')}<input inputMode="decimal" value={answer} onChange={e=>{setAnswer(e.target.value);setResult(null);}}/></label><div className={styles.controls}><button className={styles.primary} disabled={!answer.trim()||Boolean(result)} onClick={grade}>{l('check')}</button><button onClick={reset}>{l('retry')}</button></div>{result&&<ExerciseResult result={result}/>}<p>{l('experimentsIntro')}</p></aside></div>;
}
export default function ExperimentsPage(){const t=useT(),l=useEducationText(),[params,setParams]=useSearchParams();const value=params.get('task');const kind=EXPERIMENTS.includes(value as Experiment)?value as Experiment:'cpuTemp';return <PageLayout title={t('labs.modules.experiments.title')} subtitle={l('experimentsIntro')}><div className={styles.controls}>{EXPERIMENTS.map(id=><button key={id} aria-pressed={kind===id} onClick={()=>setParams({task:id})}>{l(id)}</button>)}</div><ExperimentWorkspace key={kind} kind={kind}/></PageLayout>;}
