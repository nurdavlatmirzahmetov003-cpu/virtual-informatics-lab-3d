import { useT } from '@/hooks/useT';
import type { Step } from '@/labs/AlgorithmLab';
import styles from './AlgorithmLab.module.css';

type Tone = 'found' | 'swap' | 'compare' | 'key' | 'min' | 'sorted' | 'outside' | 'idle';

/** One colour per position; the most important role wins. */
function toneOf(step: Step, i: number): Tone {
  const h = step.hl;
  if (h.found === i) return 'found';
  if (h.swap.includes(i)) return 'swap';
  if (h.compare.includes(i)) return 'compare';
  if (h.key === i) return 'key';
  if (h.min === i) return 'min';
  if (h.sorted.includes(i)) return 'sorted';
  // binary search: positions already ruled out (an empty range rules out all)
  if (h.range && (i < h.range[0] || i > h.range[1])) return 'outside';
  return 'idle';
}

/**
 * Bars keyed by the element's stable id: when a swap reorders the array the
 * same DOM node slides to its new slot (CSS transition on `left`).
 */
export function ArrayView({ step, moveMs }: { step: Step; moveMs: number }) {
  const t = useT();
  const n = step.items.length;
  const values = step.items.map((i) => i.value);
  const lo = Math.min(0, ...values);
  const hi = Math.max(1, ...values);
  const width = 100 / Math.max(1, n);
  const position = new Map(step.items.map((item, i) => [item.id, i]));
  const byIndex = new Map<number, string[]>();
  for (const p of step.pointers) byIndex.set(p.index, [...(byIndex.get(p.index) ?? []), p.name]);

  return (
    <div className={styles.arrayView} style={{ ['--move' as string]: `${moveMs}ms` }} role="img" aria-label={`${t('algorithms.ui.arrayLabel')}: ${values.join(', ')}`}>
      <div className={styles.pointers} aria-hidden="true">
        {[...byIndex].map(([index, names]) => (
          <span key={index} className={styles.pointer} style={{ left: `${(index + 0.5) * width}%` }}>
            {names.join(' · ')}
            <i />
          </span>
        ))}
      </div>
      <div className={styles.bars}>
        {[...step.items]
          .sort((a, b) => a.id - b.id)
          .map((item) => {
            const i = position.get(item.id)!;
            const ratio = (item.value - lo) / (hi - lo || 1);
            return (
              <div key={item.id} className={styles.slot} style={{ left: `${i * width}%`, width: `${width}%` }} data-tone={toneOf(step, i)} data-lifted={step.hl.key === i}>
                <div className={styles.bar} style={{ height: `${14 + ratio * 86}%` }}>
                  <span className={styles.value}>{item.value}</span>
                </div>
              </div>
            );
          })}
      </div>
      <div className={styles.indices} aria-hidden="true">
        {step.items.map((_, i) => (
          <span key={i} style={{ width: `${width}%` }}>
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}
