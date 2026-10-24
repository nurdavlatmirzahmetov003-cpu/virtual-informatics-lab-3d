import { create } from 'zustand';

/**
 * The robot teacher's lesson on the classroom whiteboard (0.37): the topic and
 * the sentence being spoken. TeacherPanel starts a lesson, the whiteboard
 * (scenes/LabSpace/classroom/Decor.tsx) draws it as a slide.
 */
interface LessonBoard {
  active: boolean;
  title: string;
  lines: readonly string[];
  index: number;
}

export const useLessonBoard = create<LessonBoard>(() => ({ active: false, title: '', lines: [], index: 0 }));
