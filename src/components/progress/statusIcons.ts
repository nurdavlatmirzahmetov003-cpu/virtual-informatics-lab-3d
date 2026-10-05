import { CircleCheck, CircleDashed, CircleDot, type LucideIcon } from 'lucide-react';
import type { TaskStatus } from '@/services/progress';

export const STATUS_ICON: Record<TaskStatus, LucideIcon> = { notStarted: CircleDashed, inProgress: CircleDot, completed: CircleCheck };
