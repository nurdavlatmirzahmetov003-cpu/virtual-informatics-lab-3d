import { Link } from 'react-router-dom';
import type { Assessment } from '@/lib/labs/assessment';
import { useLabText } from '@/hooks/useLabText';
import styles from './Exercise.module.css';

export function ExerciseResult({result}: {result: Assessment}) {
  const l=useLabText();
  return <section className={styles.result} aria-label={l('result')}>
    <h2>{l('result')}</h2><strong className={styles.score}>{result.score}<small>/100</small></strong>
    <dl className={styles.stats}>
      <div><dt>{l('time')}</dt><dd>{Math.floor(result.seconds/60)}:{String(result.seconds%60).padStart(2,'0')}</dd></div>
      <div><dt>{l('errors')}</dt><dd>{result.errors}</dd></div>
      <div><dt>{l('hints')}</dt><dd>{result.hints}</dd></div>
    </dl><p>{l('saved')}</p><Link to="/progress">{l('resultsTitle')} →</Link>
  </section>;
}
