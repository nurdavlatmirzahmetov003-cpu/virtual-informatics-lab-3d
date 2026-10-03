import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import { useLabText } from '@/hooks/useLabText';
import { useSettingsStore } from '@/store/settingsStore';
import { useProgressStore } from '@/store/progressStore';
import { Link } from 'react-router-dom';
import styles from './Progress.module.css';
import { EXERCISES } from '@/data/labs/exercises';
import { useEducationText,type EducationKey } from '@/hooks/useEducationText';

export default function ProgressPage() {
  const t = useT();
  const l = useLabText();
  const education = useEducationText();
  const lang = useSettingsStore(s=>s.language);
  const attempts=useProgressStore(s=>s.attempts);
  const best=useProgressStore(s=>s.best);
  const registered = new Set(EXERCISES.map(e=>e.id));
  const passed=best.filter(a=>a.score>=70&&registered.has(a.exercise));
  const points=best.reduce((n,a)=>n+a.score,0);
  const achievements=[{name:l('first'),ok:passed.length>=1},{name:l('five'),ok:passed.length>=5},{name:l('engineer'),ok:best.some(a=>a.exercise==='assembly'&&a.score===100)}];
  const title=(id:string)=>{
    const exercise=EXERCISES.find(e=>e.id===id);
    if(!exercise)return id;
    if(exercise.module==='assembly')return l('assemblyTitle');
    if(exercise.module==='hardware')return `${t('labs.modules.hardware.title')} · ${t(`anatomy.items.${exercise.task}.name` as Parameters<typeof t>[0])}`;
    return `${t(`labs.modules.${exercise.module}.title` as Parameters<typeof t>[0])} · ${education(exercise.task==='router'?'routerTask':exercise.task as EducationKey)}`;
  };
  return (
    <PageLayout title={l('resultsTitle')} subtitle={l('resultsIntro')}>
      <div className={styles.metrics}>{[{label:l('completed'),value:passed.length},{label:l('points'),value:points},{label:l('average'),value:best.length?`${Math.round(points/best.length)}%`:'—'}].map(v=><div key={v.label}><span>{v.label}</span><strong>{v.value}</strong></div>)}</div>
      <p>{l('progress')}: {passed.length}/{EXERCISES.length} · {Math.round(passed.length/EXERCISES.length*100)}%</p><progress max={EXERCISES.length} value={passed.length} aria-label={l('progress')} style={{width:'100%',height:6,accentColor:'var(--accent)',marginBottom:24}}/>
      <h2>{l('achievements')}</h2><div className={styles.badges}>{achievements.map(a=><span key={a.name} data-earned={a.ok}>{a.ok?'✦':'◇'} {a.name}</span>)}</div>
      <h2>{l('recent')}</h2>{attempts.length===0?<p>{l('noResults')}</p>:<ol className={styles.history}>{[...attempts].reverse().slice(0,20).map((a,i)=><li key={`${a.completedAt}${i}`}><div><strong>{title(a.exercise)}</strong><small>{new Date(a.completedAt).toLocaleString(lang==='kk'?'kk-KZ':lang==='ru'?'ru-RU':'en-GB')} · {a.seconds}s</small></div><span data-pass={a.score>=70}>{a.score}/100 · {l(a.score>=70?'pass':'practice')}</span></li>)}</ol>}
      <Link to="/labs">{l('backLabs')} →</Link>
    </PageLayout>
  );
}
