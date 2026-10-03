import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import { useEducationText } from '@/hooks/useEducationText';
import { ALGORITHMS,CODE,algorithmAnswer,algorithmSteps,parseArray,type Algorithm } from '@/lib/labs/algorithms';
import { assess,type Assessment } from '@/lib/labs/assessment';
import { useProgressStore } from '@/store/progressStore';
import { ExerciseResult } from './ExerciseResult';
import styles from './Learning.module.css';

function AlgorithmWorkspace({kind}:{kind:Algorithm}){
  const l=useEducationText();
  const [raw,setRaw]=useState('8, 3, 6, 1, 9, 2, 5'),[values,setValues]=useState([8,3,6,1,9,2,5]),[target,setTarget]=useState(6);
  const [index,setIndex]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(650),[error,setError]=useState(false);
  const [answer,setAnswer]=useState(''),[result,setResult]=useState<Assessment|null>(null),[started,setStarted]=useState(Date.now);
  const steps=useMemo(()=>algorithmSteps(kind,values,target),[kind,values,target]);
  const current=steps[Math.min(index,steps.length-1)];
  useEffect(()=>{if(!playing)return;const id=setTimeout(()=>{if(index>=steps.length-1)setPlaying(false);else setIndex(index+1);},speed);return()=>clearTimeout(id);},[playing,speed,steps.length,index]);
  const reset=()=>{setIndex(0);setPlaying(false);setResult(null);setAnswer('');setStarted(Date.now());};
  const apply=()=>{const parsed=parseArray(raw);if(!parsed){setError(true);return;}setError(false);setValues(parsed);reset();};
  const grade=()=>{const expected=algorithmAnswer(kind,values,target);const clean=(s:string)=>s.replace(/[\s;]+/g,'').split(',').join(',');const ok=clean(answer)===clean(expected);const a={...assess(`algorithm:${kind}`,ok?1:0,(Date.now()-started)/1000),errors:ok?0:1};setResult(a);useProgressStore.getState().record(a);};
  return <div className={styles.grid}><section className={styles.surface}>
    <div className={styles.controls}><label className={styles.field}>{l('array')}<input value={raw} onChange={e=>setRaw(e.target.value)}/></label><button onClick={apply}>{l('apply')}</button>{(kind==='linear'||kind==='binary')&&<label className={styles.field}>{l('target')}<input type="number" min={-100} max={100} value={target} onChange={e=>{setTarget(Number(e.target.value));reset();}}/></label>}</div>
    {error&&<p role="alert">{l('invalidArray')}</p>}{kind==='binary'&&<p>{l('binaryNote')}</p>}
    <div className={styles.array} aria-label={l('array')}>{current.values.map((v,i)=><div className={styles.bar} key={`${v}:${current.values.slice(0,i).filter(n=>n===v).length}`} data-active={current.active.includes(i)} data-done={current.done.includes(i)} style={{left:`${i*100/current.values.length}%`,width:`calc(${100/current.values.length}% - 5px)`,height:`${Math.max(18,25+Math.abs(v)/Math.max(1,...values.map(Math.abs))*165)}px`}}><strong>{v}</strong><small>{i}</small></div>)}</div>
    <div className={styles.controls}><button onClick={()=>setPlaying(p=>!p)}>{l(playing?'pause':'play')}</button><button disabled={index===0} onClick={()=>{setPlaying(false);setIndex(i=>Math.max(0,i-1));}}>{l('previous')}</button><button disabled={index>=steps.length-1} onClick={()=>{setPlaying(false);setIndex(i=>Math.min(steps.length-1,i+1));}}>{l('next')}</button><button onClick={reset}>{l('retry')}</button><label className={styles.field}>{l('speed')}<input type="range" min={120} max={1400} value={1520-speed} onChange={e=>setSpeed(1520-Number(e.target.value))}/></label></div>
    <p role="status">{l('step')} {index+1}/{steps.length} · {l(current.event)}</p><div className={styles.vars}>{Object.entries(current.vars).map(([key,v])=><span key={key}>{key} = {v}</span>)}</div>
  </section><aside className={styles.surface}><h2>{l('code')}</h2><ol className={styles.code}>{CODE[kind].map((line,i)=><li key={i} data-active={current.line===i}>{line}</li>)}</ol><h3>{l('assignment')}</h3><p>{l(kind==='linear'||kind==='binary'?'searchTask':'sortTask')}</p><label className={styles.field}>{l('answer')}<input value={answer} onChange={e=>{setAnswer(e.target.value);setResult(null);}}/></label><button className={styles.button} disabled={!answer.trim()||Boolean(result)} onClick={grade}>{l('check')}</button>{result&&<><p role="status">{l(result.score===100?'correct':'tryAgain')}{result.score!==100&&` ${algorithmAnswer(kind,values,target)}`}</p><ExerciseResult result={result}/></>}</aside></div>;
}
export default function AlgorithmsPage(){const t=useT(),l=useEducationText();const [params,setParams]=useSearchParams();const raw=params.get('task');const kind=ALGORITHMS.includes(raw as Algorithm)?raw as Algorithm:'bubble';return <PageLayout title={t('labs.modules.algorithms.title')} subtitle={l('algorithmIntro')}><div className={styles.controls}>{ALGORITHMS.map(id=><button key={id} aria-pressed={kind===id} onClick={()=>setParams({task:id})}>{l(id)}</button>)}</div><AlgorithmWorkspace key={kind} kind={kind}/></PageLayout>;}
