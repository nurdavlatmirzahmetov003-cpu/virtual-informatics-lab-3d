import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import { useLabText } from '@/hooks/useLabText';
import { useSettingsStore } from '@/store/settingsStore';
import { bestResults, useProgressStore } from '@/store/progressStore';
import { Link } from 'react-router-dom';
import styles from './Progress.module.css';

export default function ProgressPage() {
  const t = useT();
  const l = useLabText();
  const lang = useSettingsStore(s=>s.language);
  const attempts=useProgressStore(s=>s.attempts);
  const best=bestResults(attempts);
  const passed=best.filter(a=>a.score>=70);
  const points=best.reduce((n,a)=>n+a.score,0);
  const achievements=[{name:l('first'),ok:passed.length>=1},{name:l('five'),ok:passed.length>=5},{name:l('engineer'),ok:best.some(a=>a.exercise==='assembly'&&a.score===100)}];
  const title=(id:string)=>id==='assembly'?l('assemblyTitle'):id.startsWith('anatomy:')?`${t('labs.modules.hardware.title')} · ${t(`anatomy.items.${id.slice(8)}.name` as Parameters<typeof t>[0])}`:id;
  return (
    <PageLayout title={l('resultsTitle')} subtitle={l('resultsIntro')}>
      <div className={styles.metrics}>{[{label:l('completed'),value:passed.length},{label:l('points'),value:points},{label:l('average'),value:best.length?`${Math.round(points/best.length)}%`:'—'}].map(v=><div key={v.label}><span>{v.label}</span><strong>{v.value}</strong></div>)}</div>
      <h2>{l('achievements')}</h2><div className={styles.badges}>{achievements.map(a=><span key={a.name} data-earned={a.ok}>{a.ok?'✦':'◇'} {a.name}</span>)}</div>
      <h2>{l('recent')}</h2>{attempts.length===0?<p>{l('noResults')}</p>:<ol className={styles.history}>{[...attempts].reverse().slice(0,20).map((a,i)=><li key={`${a.completedAt}${i}`}><div><strong>{title(a.exercise)}</strong><small>{new Date(a.completedAt).toLocaleString(lang==='kk'?'kk-KZ':lang==='ru'?'ru-RU':'en-GB')} · {a.seconds}s</small></div><span data-pass={a.score>=70}>{a.score}/100 · {l(a.score>=70?'pass':'practice')}</span></li>)}</ol>}
      <Link to="/labs">{l('backLabs')} →</Link>
    </PageLayout>
  );
}
