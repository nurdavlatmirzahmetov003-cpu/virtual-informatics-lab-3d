import { QUIZ_IDS } from '@/labs/AlgorithmLab/quizzes';
import { LOGIC_TASKS } from '@/lib/labs/logic';
import { NETWORK_TASK_IDS } from '@/labs/NetworkLab/tasks';
import { EXPERIMENTS } from '@/lib/labs/experiments';
import { ANATOMY_ITEMS } from '@/data/hardware/anatomy';

export const EXERCISES=[
  {id:'assembly',module:'assembly',task:'assembly',path:'/labs/assembly'},
  ...QUIZ_IDS.map(task=>({id:`algorithm:${task}`,module:'algorithms',task,path:`/labs/algorithms?quiz=${task}#quiz`})),
  ...NETWORK_TASK_IDS.map(task=>({id:`network:${task}`,module:'network',task,path:`/labs/network?task=${task}`})),
  ...LOGIC_TASKS.map(task=>({id:`logic:${task}`,module:'logic',task,path:`/labs/logic?task=${task}`})),
  ...EXPERIMENTS.map(task=>({id:`experiment:${task}`,module:'experiments',task,path:`/labs/experiments?task=${task}`})),
  ...ANATOMY_ITEMS.map(item=>({id:`anatomy:${item.id}`,module:'hardware',task:item.id,path:`/explorer?device=${item.id}`})),
];
