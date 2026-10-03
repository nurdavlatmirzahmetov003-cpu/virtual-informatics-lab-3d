import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import { useEducationText,type EducationKey } from '@/hooks/useEducationText';
import { useLabText } from '@/hooks/useLabText';
import { EXERCISES } from '@/data/labs/exercises';
import { useProgressStore } from '@/store/progressStore';
import type { TranslationKey } from '@/lib/i18n';
import styles from './Learning.module.css';
export default function AssignmentsPage(){const t=useT(),l=useEducationText(),lt=useLabText(),best=useProgressStore(s=>s.best);return <PageLayout title={t('labs.modules.assignments.title')} subtitle={l('assignmentsIntro')}><div className={styles.list}>{EXERCISES.map(e=>{const score=best.find(a=>a.exercise===e.id)?.score;const name=e.module==='assembly'?lt('assemblyTitle'):e.module==='hardware'?t(`anatomy.items.${e.task}.name` as TranslationKey):e.module==='network'?t(`network.tasks.${e.task}.title` as TranslationKey):l(e.task==='router'?'routerTask':e.task as EducationKey);return <Link key={e.id} to={e.path}><span>{t(`labs.modules.${e.module}.title` as TranslationKey)} · {name}</span><strong>{score===undefined?'→':`${score}/100`}</strong></Link>;})}</div></PageLayout>;}
