import { useMemo } from 'react';
import type { AnatomyItem } from '@/data/hardware/anatomy';
import { anatomyExercise } from '@/data/hardware/anatomyQuiz';
import { ChoiceQuiz } from '@/components/quiz/ChoiceQuiz';

/** Three-question check for one device. Mount with `key={item.id}` to reset per device. */
export function AnatomyQuiz({ item }: { item: AnatomyItem }) {
  const exercise = useMemo(() => anatomyExercise(item), [item]);
  return <ChoiceQuiz answers={item.answers} keyBase={`anatomy.items.${item.id}.quiz`} exercise={exercise} />;
}
