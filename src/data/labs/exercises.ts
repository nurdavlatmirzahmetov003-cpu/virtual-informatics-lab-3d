import { ALGORITHMS } from '@/lib/labs/algorithms';
import { LOGIC_TASKS } from '@/lib/labs/logic';
import { NETWORK_TASKS } from '@/lib/labs/network';
import { EXPERIMENTS } from '@/lib/labs/experiments';
import { ANATOMY_ITEMS } from '@/data/hardware/anatomy';

export const EXERCISES=[
  {id:'assembly',module:'assembly',task:'assembly',path:'/labs/assembly'},
  ...ALGORITHMS.map(task=>({id:`algorithm:${task}`,module:'algorithms',task,path:`/labs/algorithms?task=${task}`})),
  ...NETWORK_TASKS.map(task=>({id:`network:${task}`,module:'network',task,path:`/labs/network?task=${task}`})),
  ...LOGIC_TASKS.map(task=>({id:`logic:${task}`,module:'logic',task,path:`/labs/logic?task=${task}`})),
  ...EXPERIMENTS.map(task=>({id:`experiment:${task}`,module:'experiments',task,path:`/labs/experiments?task=${task}`})),
  ...ANATOMY_ITEMS.map(item=>({id:`anatomy:${item.id}`,module:'hardware',task:item.id,path:`/explorer?device=${item.id}`})),
];
