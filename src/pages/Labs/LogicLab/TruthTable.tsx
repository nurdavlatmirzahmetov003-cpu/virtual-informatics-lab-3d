import { useT } from '@/hooks/useT';
import { truthTable, type Bit, type Circuit, type LogicTask } from '@/labs/LogicLab';
import styles from './LogicLab.module.css';

/** Generated from the circuit itself; the row matching the switches is highlighted. */
export function TruthTable({ circuit, labels, bits, task, onPick }: { circuit: Circuit; labels: readonly string[]; bits: Record<string, Bit>; task: LogicTask | null; onPick: (bits: Record<string, Bit>) => void }) {
  const t = useT();
  const rows = truthTable(circuit, labels);
  const given = task?.givenTable ? task : null;
  return (
    <section className={styles.table} aria-labelledby="truth-title">
      <header>
        <h3 id="truth-title">{t('logic.ui.table')}</h3>
        <p>{t('logic.ui.tableHint')}</p>
      </header>
      <table>
        <thead>
          <tr>
            {labels.map((l) => (
              <th key={l}>{l}</th>
            ))}
            <th>{t('logic.ui.yours')}</th>
            {given && <th>{t('logic.ui.expected')}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const current = labels.every((l) => r.inputs[l] === (bits[l] ?? 0));
            const expected = given?.target(r.inputs);
            const mismatch = given ? r.y !== expected : false;
            return (
              <tr
                key={i}
                data-current={current}
                data-mismatch={mismatch}
                tabIndex={0}
                onClick={() => onPick(r.inputs)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return;
                  e.preventDefault();
                  onPick(r.inputs);
                }}
                aria-current={current ? 'true' : undefined}
              >
                {labels.map((l) => (
                  <td key={l} data-bit={r.inputs[l]}>
                    {r.inputs[l]}
                  </td>
                ))}
                <td className={styles.yCell} data-bit={r.y ?? 'x'}>
                  {r.y ?? '?'}
                </td>
                {given && (
                  <td className={styles.yCell} data-bit={expected}>
                    {expected}
                    {mismatch && <span className={styles.visuallyHidden}> · {t('logic.ui.mismatch')}</span>}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
