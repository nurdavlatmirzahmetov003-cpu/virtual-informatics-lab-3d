import { QUIZ_IDS } from '@/labs/AlgorithmLab/quizzes';
import { LOGIC_TASK_IDS } from '@/labs/LogicLab/tasks';
import { NETWORK_TASK_IDS } from '@/labs/NetworkLab/tasks';
import { EXPERIMENT_IDS } from '@/labs/Experiments';
import { ANATOMY_ITEMS } from '@/data/hardware/anatomy';

export const EXERCISES=[
  {id:'assembly',module:'assembly',task:'assembly',path:'/labs/assembly'},
  ...QUIZ_IDS.map(task=>({id:`algorithm:${task}`,module:'algorithms',task,path:`/labs/algorithms?quiz=${task}#quiz`})),
  ...NETWORK_TASK_IDS.map(task=>({id:`network:${task}`,module:'network',task,path:`/labs/network?task=${task}`})),
  ...LOGIC_TASK_IDS.map(task=>({id:`logic:${task}`,module:'logic',task,path:`/labs/logic?task=${task}`})),
  ...EXPERIMENT_IDS.map(task=>({id:`experiment:${task}`,module:'experiments',task,path:`/labs/experiments?exp=${task}`})),
  ...ANATOMY_ITEMS.map(item=>({id:`anatomy:${item.id}`,module:'hardware',task:item.id,path:`/explorer?device=${item.id}`})),
];
