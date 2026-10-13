/** Lab task select for assignments: every graded task, grouped by laboratory. */
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { LAB_IDS, tasksOf } from '@/services/progress/catalog';

const tk = (k: string) => k as TranslationKey;

export function ExercisePicker({ id, value, onChange }: { id: string; value: string; onChange: (exerciseId: string) => void }) {
  const t = useT();
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{t('classroom.assignments.written')}</option>
      {LAB_IDS.map((lab) => (
        <optgroup key={lab} label={t(`labs.modules.${lab}.title`)}>
          {tasksOf(lab).map((task) => (
            <option key={task.id} value={task.id}>
              {t(tk(task.title))}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
